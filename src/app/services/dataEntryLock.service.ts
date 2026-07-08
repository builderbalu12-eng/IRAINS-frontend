import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from 'src/environment/environment';

@Injectable({ providedIn: 'root' })
export class DataEntryLockService {
  private baseUrl = environment.baseUrl;

  // 1 = locked, 0 = unlocked
  // Default to 0 (unlocked) until loaded from backend
  private _isLocked$ = new BehaviorSubject<number>(0);

  /** Observable — subscribe to get live updates when lock status changes */
  isLocked$ = this._isLocked$.asObservable();

  constructor(private http: HttpClient) {}

  /** Call on data-entry page load to check the lock status from the DB */
  loadLock(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/data-entry-lock`).pipe(
      tap(res => {
        if (res.success) this._isLocked$.next(res.is_locked);
      })
    );
  }

  /** Current value (synchronous read) */
  get isLocked(): boolean {
    return this._isLocked$.getValue() === 1;
  }

  /** Set lock: 1 = locked, 0 = unlocked */
  setLock(is_locked: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/data-entry-lock`, { is_locked }).pipe(
      tap(res => {
        if (res.success) this._isLocked$.next(is_locked);
      })
    );
  }
}
