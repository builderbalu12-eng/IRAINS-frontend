import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';
import { AdminActivityUser } from '../admin-activity-log.service';

@Injectable({
  providedIn: 'root'
})
export class CalculationExclusionService {
  private baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /** Backend logs admin activity when officer fields are included in write bodies. */
  private withOfficer<T extends Record<string, unknown>>(
    data: T,
    user?: AdminActivityUser | null,
    remark?: string,
  ): T & Partial<AdminActivityUser> & { remark: string } {
    return {
      ...data,
      remark: remark ?? user?.remark ?? '',
      ...(user
        ? {
            emp_name: user.emp_name,
            emp_designation: user.emp_designation,
            emp_phone_number: user.emp_phone_number,
            login_id: user.login_id ?? null,
            emp_email: user.emp_email ?? null,
            mcorhq_type: user.mcorhq_type ?? null,
          }
        : {}),
    };
  }

  // ── Entity List APIs (from your existing route files) ───────
  getAllRegions(): Observable<any> {
    const url = `${this.baseUrl}/api/v1/getAllRegions`;
    return this.http.get<any>(url);
  }

  getAllSubDivisions(): Observable<any> {
    const url = `${this.baseUrl}/api/v1/getAllSubDivisions`;
    return this.http.get<any>(url);
  }

  getAllStates(): Observable<any> {
    const url = `${this.baseUrl}/api/v1/getAllStates`;
    return this.http.get<any>(url);
  }

  getAllDistricts(): Observable<any> {
    const url = `${this.baseUrl}/api/v1/getAllDistrict`;
    return this.http.get<any>(url);
  }

  getAllBlocks(): Observable<any> {
    const url = `${this.baseUrl}/api/v1/getAllBlocks`;
    return this.http.get<any>(url);
  }

  getAllStations(): Observable<any> {
    const url = `${this.baseUrl}/api/v1/getStationsForExclusion`;
    return this.http.get<any>(url);
  }

  getAllAwsStations(): Observable<any> {
    const url = `${this.baseUrl}/api/v1/getAwsStationsForExclusion`;
    return this.http.get<any>(url);
  }

  // ── Exclusion APIs ──────────────────────────────────────────
  getExclusions(data: { from_date: string; to_date: string }): Observable<any> {
    const url = `${this.baseUrl}/api/v1/calculation-exclusion/get-exclusions`;
    return this.http.post<any>(url, data);
  }

  toggleExclusion(
    data: {
      entity_type: string;
      entity_code: number;
      entity_name: string;
      from_date: string;
      to_date: string;
    },
    user?: AdminActivityUser | null,
    remark?: string,
  ): Observable<any> {
    const url = `${this.baseUrl}/api/v1/calculation-exclusion/toggle`;
    return this.http.post<any>(url, this.withOfficer(data, user, remark));
  }

  excludeEntity(
    data: {
      entity_type: string;
      entity_code: number;
      entity_name: string;
      from_date: string;
      to_date: string;
    },
    user?: AdminActivityUser | null,
    remark?: string,
  ): Observable<any> {
    const url = `${this.baseUrl}/api/v1/calculation-exclusion/exclude`;
    return this.http.post<any>(url, this.withOfficer(data, user, remark));
  }

  includeEntity(
    data: {
      entity_type: string;
      entity_code: number;
      from_date: string;
      to_date: string;
    },
    user?: AdminActivityUser | null,
    remark?: string,
  ): Observable<any> {
    const url = `${this.baseUrl}/api/v1/calculation-exclusion/include`;
    return this.http.post<any>(url, this.withOfficer(data, user, remark));
  }

  checkStatus(data: {
    entity_type: string;
    entity_code: number;
    from_date: string;
    to_date: string;
  }): Observable<any> {
    const url = `${this.baseUrl}/api/v1/calculation-exclusion/check-status`;
    return this.http.post<any>(url, data);
  }

  bulkToggle(
    data: {
      action: 'exclude' | 'include';
      from_date: string;
      to_date: string;
      entities: { entity_type: string; entity_code: number; entity_name: string }[];
    },
    user?: AdminActivityUser | null,
    remark?: string,
  ): Observable<any> {
    const url = `${this.baseUrl}/api/v1/calculation-exclusion/bulk-toggle`;
    return this.http.post<any>(url, this.withOfficer(data, user, remark));
  }

  triggerDailyStationData(): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/v1/AddDailyStationData`, {});
  }


}