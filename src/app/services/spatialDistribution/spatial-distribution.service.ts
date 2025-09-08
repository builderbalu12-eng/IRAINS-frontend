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

  getSpatialDistribution(date?: string): Observable<any> {
    let url = `${this.baseUrl}/api/v1/getSpatialDistributionData`;
    if (date) {
      url += `?date=${date}`;
    }
    return this.http.get(url);
  }

  getSpatialDistributionPeriod(
    startDate: string,
    endDate: string
  ): Observable<any> {
    let url = `${this.baseUrl}/api/v1/getSpatialDistributionData?startDate=${startDate}&endDate=${endDate}`;
    return this.http.get<any>(url);
  }
}
