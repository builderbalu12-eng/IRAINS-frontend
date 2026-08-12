import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from 'src/environment/environment';
import {
  ADMIN_ACTIVITY_PAGES,
  AdminActivityPageMeta,
  CALCULATION_PAGE_KEYS,
  CalculationPage,
  DISPLAY_ORDER_PAGE_KEY,
  DisplayOrderEntityType,
  NORMALS_PAGE_KEYS,
  NormalsPage,
  REVIEW_PUBLISH_PAGE_KEY,
  SPATIAL_PAGE_KEYS,
  SPATIAL_ROUTE_TO_PAGE,
  SpatialPage,
} from '../config/admin-realtime.config';

export type {
  AdminActivityPageMeta,
  CalculationPage,
  DisplayOrderEntityType,
  NormalsPage,
  SpatialPage,
} from '../config/admin-realtime.config';

export {
  ADMIN_ACTIVITY_PAGES,
  CALCULATION_PAGE_KEYS,
  DISPLAY_ORDER_PAGE_KEY,
  REVIEW_PUBLISH_PAGE_KEY,
  NORMALS_PAGE_KEYS,
  NORMALS_ROUTE_TO_PAGE,
  SPATIAL_PAGE_KEYS,
  SPATIAL_ROUTE_TO_PAGE,
} from '../config/admin-realtime.config';

export interface AdminActivityUser {
  emp_name: string;
  emp_designation: string;
  emp_phone_number: string;
  remark?: string;
  login_id?: number | null;
  emp_email?: string | null;
  mcorhq_type?: string | null;
}

export interface ActivityLogRecord {
  id: number;
  login_id: number | null;
  emp_name: string;
  emp_designation: string | null;
  emp_phone_number: string | number | null;
  emp_email: string | null;
  mcorhq_type: string | null;
  module_name: string;
  category_name: string | null;
  page_name: string;
  route_path: string;
  action_type: string;
  changed_field: string | null;
  old_value: string | null;
  new_value: string | null;
  entity_type: string | null;
  entity_name: string | null;
  entity_data: string | null;
  remark: string | null;
  status: string;
  action_date: string;
  action_time: string;
  created_at: string;
}

/** @deprecated Use ActivityLogRecord */
export type ActivityLogEntry = ActivityLogRecord;

export interface ActivityLogsResponse {
  success: boolean;
  total: number;
  limit: number;
  offset: number;
  data: ActivityLogRecord[];
}

export interface RealtimeConfigResponse {
  success: boolean;
  pages: AdminActivityPageMeta[];
}

export interface ActivityLogPayload extends Partial<AdminActivityUser> {
  page_key: string;
  action_type: string;
  [key: string]: unknown;
}

export interface ActivityLogQuery {
  route_path?: string;
  module_name?: string;
  category_name?: string;
  page_name?: string;
  action_type?: string;
  entity_type?: string;
  login_id?: number | string;
  /** Login role snapshot: hq | mc | sp | public */
  mcorhq_type?: string;
  /** Partial officer name match (ILIKE on backend) */
  emp_name?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminActivityLogService {
  private readonly baseUrl = environment.baseUrl;
  private readonly storageKeyPrefix = 'adminActivityUser';
  /** Set only after the officer clicks Continue — used to skip the popup on revisit. */
  private readonly confirmedKey = 'adminOfficerIdentifiedConfirmed';
  private readonly activityLogUrl = `${this.baseUrl}/api/v1/admin/activity-log`;
  private readonly officerIdentifiedSubject = new Subject<{
    routePath: string;
    user: AdminActivityUser;
  }>();
  readonly officerIdentified$ = this.officerIdentifiedSubject.asObservable();

  constructor(private http: HttpClient) {}

  formatDateForApi(value: string | Date | null | undefined): string | undefined {
    if (!value) return undefined;
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value).slice(0, 10);
  }

  getStorageKey(routePath: string): string {
    return `${this.storageKeyPrefix}:${routePath}`;
  }

  getStoredUser(routePath?: string): AdminActivityUser | null {
    if (routePath) {
      const routeUser = this.readStoredUser(this.getStorageKey(routePath));
      if (routeUser) return routeUser;
    }
    return this.readStoredUser(this.storageKeyPrefix);
  }

  storeUser(user: AdminActivityUser, routePath?: string): void {
    sessionStorage.setItem(this.storageKeyPrefix, JSON.stringify(user));
    if (routePath) {
      sessionStorage.setItem(this.getStorageKey(routePath), JSON.stringify(user));
      this.officerIdentifiedSubject.next({ routePath, user });
    }
  }

  /**
   * Persist officer details and mark this browser session as identified
   * so the popup is not asked again until the tab/session ends.
   */
  markIdentified(user: AdminActivityUser, routePath?: string): void {
    this.storeUser(user, routePath);
    sessionStorage.setItem(this.confirmedKey, '1');
  }

  /** True only after the officer has successfully submitted the ID form once this session. */
  hasConfirmedIdentification(routePath?: string): boolean {
    if (sessionStorage.getItem(this.confirmedKey) !== '1') return false;
    return this.isCompleteUser(this.getStoredUser(routePath));
  }

  /** @deprecated Prefer hasConfirmedIdentification() */
  hasIdentifiedUser(routePath?: string): boolean {
    return this.hasConfirmedIdentification(routePath);
  }

  isCompleteUser(user: AdminActivityUser | null | undefined): boolean {
    if (!user) return false;
    return Boolean(
      user.emp_name?.trim() &&
        user.emp_designation?.trim() &&
        String(user.emp_phone_number || '').trim()
    );
  }

  buildUserFromForm(form: {
    emp_name: string;
    emp_designation: string;
    emp_phone_number: string;
    remark: string;
  }): AdminActivityUser {
    const auth = this.getAuthUser();
    return {
      emp_name: form.emp_name.trim(),
      emp_designation: form.emp_designation.trim(),
      emp_phone_number: form.emp_phone_number.trim(),
      remark: form.remark.trim(),
      login_id: auth?.userid ?? null,
      emp_email: auth?.username ?? null,
      mcorhq_type: auth?.mcorhq ?? null,
    };
  }

  /** Payload fields expected by admin activity-log APIs */
  toApiPayload(user: AdminActivityUser | null | undefined): Partial<AdminActivityUser> {
    if (!user) return {};
    return {
      emp_name: user.emp_name,
      emp_designation: user.emp_designation,
      emp_phone_number: user.emp_phone_number,
      remark: user.remark ?? '',
      login_id: user.login_id ?? null,
      emp_email: user.emp_email ?? null,
      mcorhq_type: user.mcorhq_type ?? null,
    };
  }

  pageKeyForRoute(routePath: string): string | null {
    const page = SPATIAL_ROUTE_TO_PAGE[routePath];
    return page ? SPATIAL_PAGE_KEYS[page] : null;
  }

  /** Fire-and-forget action log; HTTP errors are swallowed so UI flow is not blocked. */
  logActivity(payload: ActivityLogPayload): Observable<any> {
    return this.postActivity(payload, { swallowErrors: true });
  }

  logSpatialActivity(
    page: SpatialPage,
    actionType: string,
    user: AdminActivityUser | null | undefined,
    extra: Record<string, unknown> = {},
  ): Observable<any> {
    return this.logPageAction(SPATIAL_PAGE_KEYS[page], actionType, user, extra);
  }

  recordPageAccess(
    page: SpatialPage,
    user: AdminActivityUser,
    routePath?: string,
  ): Observable<any> {
    return this.recordPageAccessByKey(SPATIAL_PAGE_KEYS[page], user, routePath);
  }

  logNormalsActivity(
    page: NormalsPage,
    actionType: string,
    user: AdminActivityUser | null | undefined,
    extra: Record<string, unknown> = {},
  ): Observable<any> {
    return this.logPageAction(NORMALS_PAGE_KEYS[page], actionType, user, extra);
  }

  recordNormalsPageAccess(
    page: NormalsPage,
    user: AdminActivityUser,
    routePath?: string,
  ): Observable<any> {
    return this.recordPageAccessByKey(NORMALS_PAGE_KEYS[page], user, routePath);
  }

  logDisplayOrderActivity(
    entityType: DisplayOrderEntityType,
    actionType: string,
    user: AdminActivityUser | null | undefined,
    extra: Record<string, unknown> = {},
  ): Observable<any> {
    return this.logPageAction(DISPLAY_ORDER_PAGE_KEY, actionType, user, {
      entity_type: entityType,
      ...extra,
    });
  }

  recordDisplayOrderPageAccess(
    entityType: DisplayOrderEntityType,
    user: AdminActivityUser,
    routePath?: string,
  ): Observable<any> {
    return this.recordPageAccessByKey(DISPLAY_ORDER_PAGE_KEY, user, routePath, {
      entity_type: entityType,
      current_tab: entityType,
    });
  }

  recordReviewPublishPageAccess(
    user: AdminActivityUser,
    routePath?: string,
    date?: string,
  ): Observable<any> {
    const body = {
      ...this.toApiPayload(user),
      date: date ?? this.formatDateForApi(new Date()),
    };
    return this.http.post<any>(`${this.baseUrl}/api/v1/review-and-publish/officer-access`, body).pipe(
      tap(() => {
        if (routePath) this.markIdentified(user, routePath);
      }),
    );
  }

  logReviewPublishActivity(
    actionType: string,
    user: AdminActivityUser | null | undefined,
    extra: Record<string, unknown> = {},
  ): Observable<any> {
    return this.logPageAction(REVIEW_PUBLISH_PAGE_KEY, actionType, user, extra);
  }

  recordCalculationPageAccess(
    page: CalculationPage,
    user: AdminActivityUser,
    routePath?: string,
  ): Observable<any> {
    return this.recordPageAccessByKey(CALCULATION_PAGE_KEYS[page], user, routePath);
  }

  logCalculationActivity(
    page: CalculationPage,
    actionType: string,
    user: AdminActivityUser | null | undefined,
    extra: Record<string, unknown> = {},
  ): Observable<any> {
    return this.logPageAction(CALCULATION_PAGE_KEYS[page], actionType, user, extra);
  }

  getRealtimeConfig(): Observable<RealtimeConfigResponse> {
    return this.http.get<RealtimeConfigResponse>(`${this.baseUrl}/api/v1/admin/realtime-config`);
  }

  getActivityLogs(query: ActivityLogQuery = {}): Observable<ActivityLogsResponse> {
    let params = new HttpParams();
    const merged = { limit: 50, offset: 0, ...query };
    for (const [key, value] of Object.entries(merged)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<ActivityLogsResponse>(`${this.baseUrl}/api/v1/admin/activity-logs`, { params });
  }

  private logPageAction(
    pageKey: string,
    actionType: string,
    user: AdminActivityUser | null | undefined,
    extra: Record<string, unknown> = {},
  ): Observable<any> {
    if (!user) return of(null);
    return this.logActivity({
      page_key: pageKey,
      action_type: actionType,
      ...this.toApiPayload(user),
      ...extra,
    });
  }

  private recordPageAccessByKey(
    pageKey: string,
    user: AdminActivityUser,
    routePath?: string,
    extra: Record<string, unknown> = {},
  ): Observable<any> {
    return this.postActivity({
      page_key: pageKey,
      action_type: 'PAGE_ACCESS',
      ...this.toApiPayload(user),
      ...extra,
    }).pipe(
      tap(() => {
        if (routePath) this.markIdentified(user, routePath);
      }),
    );
  }

  private postActivity(
    payload: ActivityLogPayload,
    options: { swallowErrors?: boolean } = {},
  ): Observable<any> {
    const request$ = this.http.post<any>(this.activityLogUrl, payload);
    return options.swallowErrors ? request$.pipe(catchError(() => of(null))) : request$;
  }

  private getAuthUser(): any | null {
    const raw = localStorage.getItem('isAuthorised');
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed?.data?.[0] ?? null;
    } catch {
      return null;
    }
  }

  private readStoredUser(key: string): AdminActivityUser | null {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AdminActivityUser;
    } catch {
      return null;
    }
  }
}
