import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';

@Injectable({ providedIn: 'root' })
export class StationDashboardService {
  private base = `${environment.baseUrl}/api/v1/station-dashboard`;

  constructor(private http: HttpClient) {}

  getMetrics(): Observable<any> {
    return this.http.get(`${this.base}/metrics`);
  }

  getDistribution(level: string): Observable<any> {
    return this.http.get(`${this.base}/distribution?level=${level}`);
  }

  getRecentChanges(days = 7): Observable<any> {
    return this.http.get(`${this.base}/recent-changes?days=${days}`);
  }

  getHistory(page = 1, limit = 25): Observable<any> {
    return this.http.get(`${this.base}/history?page=${page}&limit=${limit}`);
  }

  getTimeline(name: string): Observable<any> {
    return this.http.get(`${this.base}/timeline?name=${encodeURIComponent(name)}`);
  }

  getGeography(): Observable<any> {
    return this.http.get(`${this.base}/geography`);
  }

  getBlocks(district_code: string | number): Observable<any> {
    return this.http.get(`${this.base}/blocks?district_code=${district_code}`);
  }

  getRmcMcOptions(): Observable<any> {
    return this.http.get(`${this.base}/rmc-mc-options`);
  }

  getStationByCode(station_code: string | number): Observable<any> {
    return this.http.get(`${this.base}/station?station_code=${station_code}`);
  }

  listActiveStations(q = '', page = 1, limit = 50): Observable<any> {
    return this.http.get(`${this.base}/stations?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`);
  }

  generateCode(block_code: string | number): Observable<any> {
    return this.http.post(`${this.base}/generate-code`, { block_code });
  }

  moveStation(payload: {
    station_code: string | number;
    new_block_code: string | number;
    new_block_name: string;
    new_district_code: string | number;
  }): Observable<any> {
    return this.http.post(`${this.base}/move-station`, payload);
  }

  permanentDelete(station_codes: (string | number)[]): Observable<any> {
    return this.http.delete(`${this.base}/permanent-delete`, { body: { station_codes } });
  }

  addNewStation(payload: any): Observable<any> {
    const baseUrl = this.base.replace('/station-dashboard', '');
    return this.http.post(`${baseUrl}/addNewStation`, payload);
  }

  editStation(payload: any): Observable<any> {
    const baseUrl = this.base.replace('/station-dashboard', '');
    return this.http.post(`${baseUrl}/editStation`, payload);
  }

  deleteStation(station_id: string | number): Observable<any> {
    const baseUrl = this.base.replace('/station-dashboard', '');
    return this.http.post(`${baseUrl}/deleteStation`, { station_id });
  }

  searchStations(params: {
    q?: string; mode?: string; case_sensitive?: boolean;
    status?: string; station_type?: string; region?: string; state?: string;
    page?: number; limit?: number;
  }): Observable<any> {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') p.set(k, String(v)); });
    return this.http.post(`${this.base}/search?${p.toString()}`, {});
  }
}
