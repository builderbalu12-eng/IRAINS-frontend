import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from 'src/environment/environment';
import { AdminActivityUser } from './admin-activity-log.service';

export interface CalculationModeState {
  use_aws: number;
  use_aws_label?: string;
  updated_at: string | null;
  last_changed_by?: Partial<AdminActivityUser>;
  last_toggle?: unknown;
}

@Injectable({ providedIn: 'root' })
export class CalculationsModeService {
  private baseUrl = environment.baseUrl;

  // 1 = IMD + AWS, 0 = IMD only
  // Default to 1 (AWS enabled) until loaded from backend
  private _useAws$ = new BehaviorSubject<number>(1);
  private _modeState$ = new BehaviorSubject<CalculationModeState | null>(null);

  /** Observable — subscribe to get live updates when mode changes */
  useAws$ = this._useAws$.asObservable();
  modeState$ = this._modeState$.asObservable();

  constructor(private http: HttpClient) {}

  get updatedAt(): string | null {
    return this._modeState$.getValue()?.updated_at ?? null;
  }

  /** Call once on app startup to load the mode from the DB */
  loadMode(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/calculations-mode`).pipe(
      tap(res => {
        if (res.success ?? res.use_aws !== undefined) {
          this.applyModeState(res);
        }
      })
    );
  }

  applyModeState(res: CalculationModeState): void {
    this._useAws$.next(res.use_aws);
    this._modeState$.next({
      use_aws: res.use_aws,
      use_aws_label: res.use_aws_label,
      updated_at: res.updated_at ?? null,
      last_changed_by: res.last_changed_by,
      last_toggle: res.last_toggle,
    });
  }

  /** Current value (synchronous read) */
  get useAws(): number {
    return this._useAws$.getValue();
  }

  /** Returns true if AWS calculations are enabled */
  get isAwsEnabled(): boolean {
    return this._useAws$.getValue() === 1;
  }

  /** Officer Identification modal — logs PAGE_ACCESS in admin_activity_logs */
  recordOfficerAccess(userContext: Partial<AdminActivityUser>): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/calculations-mode/officer-access`, userContext);
  }

  /** Set mode: 1 = IMD+AWS, 0 = IMD only */
  setMode(
    use_aws: number,
    userContext?: Partial<AdminActivityUser>,
    remark?: string,
  ): Observable<any> {
    const body: Record<string, unknown> = {
      use_aws,
      expected_updated_at: this.updatedAt,
      remark: remark ?? userContext?.remark ?? '',
      ...userContext,
    };
    return this.http.post<any>(`${this.baseUrl}/api/v1/calculations-mode`, body).pipe(
      tap(res => {
        if (res.success ?? res.use_aws !== undefined) {
          this.applyModeState(res);
        }
      })
    );
  }
}
