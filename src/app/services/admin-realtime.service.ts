import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environment/environment';
import {
  AdminActivityUser,
  AdminActivityLogService,
} from './admin-activity-log.service';
import {
  backendRoutePath,
  isRealtimeAdminPage,
  normalizeAngularPath,
} from '../config/admin-realtime.config';

export interface PresenceUser {
  login_id?: number | null;
  emp_name: string;
  emp_designation: string;
  emp_phone_number: string | number;
  emp_email?: string | null;
  joined_at: number;
  last_seen_at: number;
}

export interface AdminActivity {
  id: number;
  login_id?: number | null;
  emp_name: string;
  emp_designation: string;
  module_name?: string;
  page_name?: string;
  route_path: string;
  action_type: string;
  changed_field?: string;
  old_value?: string;
  new_value?: string;
  entity_type?: string;
  entity_name?: string;
  entity_data?: unknown;
  remark?: string;
  status?: string;
  action_date?: string;
  action_time?: string;
}

export interface PageStateChangedEvent {
  route_path: string;
  state_type: string;
  data: Record<string, unknown>;
}

const HEARTBEAT_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class AdminRealtimeService implements OnDestroy {
  private socket: Socket | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private joinedRoutePath: string | null = null;
  private currentAngularPath: string | null = null;
  /** Bumped on leave / new join so stale socket acks are ignored. */
  private joinGeneration = 0;

  private readonly liveUsersSubject = new BehaviorSubject<PresenceUser[]>([]);
  readonly liveUsers$ = this.liveUsersSubject.asObservable();

  private readonly activitySubject = new Subject<AdminActivity>();
  readonly activityLogged$ = this.activitySubject.asObservable();

  private readonly pageStateSubject = new Subject<PageStateChangedEvent>();
  readonly pageStateChanged$ = this.pageStateSubject.asObservable();

  private readonly connectedSubject = new BehaviorSubject<boolean>(false);
  readonly connected$ = this.connectedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private activityLog: AdminActivityLogService,
  ) {}

  ngOnDestroy(): void {
    this.teardown();
  }

  /** Connect once when entering the data-management shell. */
  connect(): void {
    if (this.socket) {
      if (!this.socket.connected) {
        this.socket.connect();
      }
      return;
    }

    this.socket = io(environment.baseUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    this.socket.on('connect', () => this.connectedSubject.next(true));
    this.socket.on('disconnect', () => this.connectedSubject.next(false));
    this.socket.on('presence_update', (payload: { route_path: string; presence: PresenceUser[] }) => {
      if (payload.route_path === this.joinedRoutePath) {
        this.liveUsersSubject.next(payload.presence ?? []);
      }
    });
    this.socket.on('activity_logged', (payload: { route_path: string; activity: AdminActivity }) => {
      if (payload.route_path === this.joinedRoutePath) {
        this.activitySubject.next(payload.activity);
      }
    });
    this.socket.on('page_state_changed', (payload: PageStateChangedEvent) => {
      this.pageStateSubject.next(payload);
    });

    this.startHeartbeat();
  }

  /** Leave room, stop heartbeat, disconnect socket. */
  teardown(): void {
    this.leavePage();
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectedSubject.next(false);
    this.liveUsersSubject.next([]);
    this.currentAngularPath = null;
  }

  /**
   * Called on every admin child route change from the data-management shell.
   * Joins the socket room when a stored officer exists for the page.
   */
  onRouteChange(angularUrl: string): void {
    this.currentAngularPath = normalizeAngularPath(angularUrl);

    if (!isRealtimeAdminPage(this.currentAngularPath)) {
      this.leavePage();
      return;
    }

    const officer = this.activityLog.getStoredUser(this.currentAngularPath);
    if (officer?.emp_name) {
      this.joinPage(this.currentAngularPath, officer);
    } else {
      this.leavePage();
    }
  }

  /** Called after officer identification modal succeeds on any admin page. */
  onOfficerIdentified(angularPath: string, officer: AdminActivityUser): void {
    const path = normalizeAngularPath(angularPath);
    this.currentAngularPath = path;
    this.joinPage(path, officer);
  }

  joinPage(angularPath: string, officer: AdminActivityUser): void {
    if (!officer?.emp_name) return;

    this.connect();

    const routePath = backendRoutePath(angularPath);
    if (!routePath || !this.socket) return;

    if (this.joinedRoutePath === routePath) return;

    this.leavePage();

    const generation = ++this.joinGeneration;
    const userPayload = {
      login_id: officer.login_id ?? undefined,
      emp_name: officer.emp_name,
      emp_designation: officer.emp_designation,
      emp_phone_number: officer.emp_phone_number,
      emp_email: officer.emp_email ?? undefined,
    };

    this.socket.emit(
      'join_page',
      { route_path: routePath, user: userPayload },
      (ack: { ok?: boolean; presence?: PresenceUser[] }) => {
        if (generation !== this.joinGeneration) return;
        if (!ack?.ok) return;
        this.joinedRoutePath = routePath;
        this.liveUsersSubject.next(ack.presence ?? []);
      },
    );
  }

  leavePage(): void {
    this.joinGeneration++;
    if (this.socket?.connected) {
      this.socket.emit('leave_page');
    }
    this.joinedRoutePath = null;
    this.liveUsersSubject.next([]);
  }

  fetchRealtimeConfig(): Observable<unknown> {
    return this.http.get(`${environment.baseUrl}/api/v1/admin/realtime-config`);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('heartbeat');
      }
    }, HEARTBEAT_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}
