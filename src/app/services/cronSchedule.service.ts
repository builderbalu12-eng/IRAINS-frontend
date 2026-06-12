import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';

export interface CronJobSchedule {
  id?: number;
  job_key: string;
  job_group: string;
  job_name: string;
  description?: string | null;
  schedule_type: 'daily_time' | 'interval';
  run_time?: string | null;
  window_start_time?: string | null;
  window_end_time?: string | null;
  interval_minutes?: number | null;
  timezone?: string;
  is_active?: boolean;
  last_run_at?: string | null;
  next_run_at?: string | null;
  last_status?: string | null;
  last_error?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CronScheduleService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  getAll(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/cron-schedules`);
  }

  create(data: CronJobSchedule): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/cron-schedules`, data);
  }

  update(jobKey: string, data: CronJobSchedule): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/api/v1/cron-schedules/${jobKey}`, data);
  }

  toggleActive(jobKey: string, is_active: boolean): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/api/v1/cron-schedules/${jobKey}/toggle`, { is_active });
  }

  delete(jobKey: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/api/v1/cron-schedules/${jobKey}`);
  }
}
