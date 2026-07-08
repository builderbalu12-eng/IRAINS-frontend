import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environment/environment';

@Injectable({ providedIn: 'root' })
export class MapDataScheduleService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /** Fetch restrict_days/publish for a role (hq|mc|sp|public) */
  getSchedule(role: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/map-data-schedule/${role}`);
  }

  /** Update restrict_days/publish for a role */
  setSchedule(role: string, restrict_days: number | null, publish: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/map-data-schedule`, {
      mcorhq_type: role,
      restrict_days,
      publish
    });
  }

  /**
   * Latest date maps/products should show for a role: today if that role's
   * data is published, otherwise yesterday (today's data held back for review).
   */
  getEffectiveLatestDate(role: string): Observable<Date> {
    return this.getSchedule(role).pipe(
      map((res) => {
        const latest = new Date();
        if (res?.publish !== 1) {
          latest.setDate(latest.getDate() - 1);
        }
        return latest;
      })
    );
  }
}
