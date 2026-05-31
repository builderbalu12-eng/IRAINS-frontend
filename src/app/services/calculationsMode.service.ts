import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from 'src/environment/environment';

@Injectable({ providedIn: 'root' })
export class CalculationsModeService {
  private baseUrl = environment.baseUrl;

  // 1 = IMD + AWS, 0 = IMD only
  // Default to 1 (AWS enabled) until loaded from backend
  private _useAws$ = new BehaviorSubject<number>(1);

  /** Observable — subscribe to get live updates when mode changes */
  useAws$ = this._useAws$.asObservable();

  constructor(private http: HttpClient) {}

  /** Call once on app startup to load the mode from the DB */
  loadMode(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/calculations-mode`).pipe(
      tap(res => {
        if (res.success) this._useAws$.next(res.use_aws);
      })
    );
  }

  /** Current value (synchronous read) */
  get useAws(): number {
    return this._useAws$.getValue();
  }

  /** Returns true if AWS calculations are enabled */
  get isAwsEnabled(): boolean {
    return this._useAws$.getValue() === 1;
  }

  /** Set mode: 1 = IMD+AWS, 0 = IMD only */
  setMode(use_aws: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/calculations-mode`, { use_aws }).pipe(
      tap(res => {
        if (res.success) this._useAws$.next(use_aws);
      })
    );
  }
}
