import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "src/environment/environment";

@Injectable({
  providedIn: "root",
})
export class SpatialDistributionService {
  private baseUrl: string = environment.baseUrl;
  constructor(private http: HttpClient) {}

  getSpatialDistribution(date?: string, mode?: string): Observable<any> {
    let url = `${this.baseUrl}/api/v1/getSpatialDistributionData`;

    // Build query params dynamically
    const params: any = {};
    if (date) params.date = date;
    if (mode) params.mode = mode;

    return this.http.get(url, { params });
  }

  getSpatialDistributionPeriod(
    startDate: string,
    endDate: string,
    mode?: string
  ): Observable<any> {
    let url = `${this.baseUrl}/api/v1/getSpatialDistributionData`;

    const params: any = { startDate, endDate };
    if (mode) params.mode = mode;

    return this.http.get<any>(url, { params });
  }

  // 🔹 State APIs
  getSpatialDistributionState(date?: string, mode?: string): Observable<any> {
    let url = `${this.baseUrl}/api/v1/getSpatialDistributionDataState`;

    const params: any = {};
    if (date) params.date = date;
    if (mode) params.mode = mode;

    return this.http.get(url, { params });
  }

  getSpatialDistributionStatePeriod(
    startDate: string,
    endDate: string,
    mode?: string
  ): Observable<any> {
    let url = `${this.baseUrl}/api/v1/getSpatialDistributionDataState`;

    const params: any = { startDate, endDate };
    if (mode) params.mode = mode;

    return this.http.get<any>(url, { params });
  }
}
