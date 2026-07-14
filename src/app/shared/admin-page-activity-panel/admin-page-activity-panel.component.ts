import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import {
  ActivityLogRecord,
  AdminActivityLogService,
  AdminActivityUser,
} from 'src/app/services/admin-activity-log.service';
import { AdminRealtimeService } from 'src/app/services/admin-realtime.service';
import { normalizeAngularPath } from 'src/app/config/admin-realtime.config';

@Component({
  selector: 'app-admin-page-activity-panel',
  templateUrl: './admin-page-activity-panel.component.html',
  styleUrls: ['./admin-page-activity-panel.component.css'],
})
export class AdminPageActivityPanelComponent implements OnInit, OnChanges, OnDestroy {
  @Input() backendRoutePath = '';
  @Input() angularPath = '';
  @Input() pageTitle = 'This page';

  open = false;
  logs: ActivityLogRecord[] = [];
  currentOfficer: AdminActivityUser | null = null;
  loading = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private activityLog: AdminActivityLogService,
    private realtime: AdminRealtimeService,
  ) {}

  ngOnInit(): void {
    this.activityLog.officerIdentified$
      .pipe(
        filter(
          (event) =>
            normalizeAngularPath(event.routePath) === normalizeAngularPath(this.angularPath),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((event) => {
        this.currentOfficer = event.user;
      });

    this.realtime.activityLogged$
      .pipe(
        filter((event) => event.route_path === this.backendRoutePath),
        takeUntil(this.destroy$),
      )
      .subscribe((event) => {
        const record = this.toRecord(event);
        if (this.logs.some((row) => row.id === record.id)) return;
        this.logs = [record, ...this.logs].slice(0, 40);
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['angularPath'] || changes['backendRoutePath']) {
      this.refreshOfficer();
      if (this.backendRoutePath) {
        this.loadLogs();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggle(): void {
    this.open = !this.open;
    if (this.open && !this.logs.length && !this.loading) {
      this.loadLogs();
    }
  }

  refresh(): void {
    this.refreshOfficer();
    this.loadLogs();
  }

  get recentCount(): number {
    return this.logs.length;
  }

  private refreshOfficer(): void {
    const path = normalizeAngularPath(this.angularPath);
    this.currentOfficer = path ? this.activityLog.getStoredUser(path) : null;
  }

  private loadLogs(): void {
    if (!this.backendRoutePath) return;
    this.loading = true;
    this.activityLog
      .getActivityLogs({
        route_path: this.backendRoutePath,
        limit: 30,
        offset: 0,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.logs = res.data ?? [];
          this.loading = false;
        },
        error: () => {
          this.logs = [];
          this.loading = false;
        },
      });
  }

  private toRecord(event: {
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
  }): ActivityLogRecord {
    return {
      id: event.id,
      login_id: event.login_id ?? null,
      emp_name: event.emp_name,
      emp_designation: event.emp_designation ?? null,
      emp_phone_number: null,
      emp_email: null,
      mcorhq_type: null,
      module_name: event.module_name ?? '',
      category_name: null,
      page_name: event.page_name ?? this.pageTitle,
      route_path: event.route_path,
      action_type: event.action_type,
      changed_field: event.changed_field ?? null,
      old_value: event.old_value ?? null,
      new_value: event.new_value ?? null,
      entity_type: event.entity_type ?? null,
      entity_name: event.entity_name ?? null,
      entity_data: event.entity_data != null ? String(event.entity_data) : null,
      remark: event.remark ?? null,
      status: event.status ?? 'updated',
      action_date: event.action_date ?? '',
      action_time: event.action_time ?? '',
      created_at: '',
    };
  }
}
