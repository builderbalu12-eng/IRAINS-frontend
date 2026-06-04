import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) {}

  fetchData(data:any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchStateData`;
    return this.http.post<any>(url, data);
  }

  fetchDataWithAWS(data:any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchStateDataWithAWS`;
    return this.http.post<any>(url, data);
  }

  fetchDataFtp(data:any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchStateDataFtp`;
    return this.http.post<any>(url, data);
  }
  fetchTopNStates(data:any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchTopNStates`;
    return this.http.post<any>(url, data);
  }
  fetchStateRangeStatistics(data:any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchStateRangeStatistics`;
    return this.http.post<any>(url, data);
  }

  fetchMetWiseStates(): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchMetWiseStates`;
    return this.http.get<any>(url);
  }

  fetchAreaPercentages(): Observable<any> {
    const url = `${this.baseUrl}/api/v1/getStateAreaPercentages`;
    return this.http.get<any>(url);
  }

  fetchStateDistrictCount(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/fetchStateDistrictCount`, data);
  }

  fetchDisplayOrder(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/getStateDisplayOrder`);
  }

  // ── State Normals Management ──────────────────────────────────────────────
  getStateNormalList(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/getStateNormalList`);
  }

  getStateNormals(state_code: number, year: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/getStateNormals/${state_code}?year=${year}`);
  }

  downloadStateNormalTemplate(state_code: number): string {
    return `${this.baseUrl}/api/v1/downloadStateNormalTemplate/${state_code}`;
  }

  replaceStateNormals(state_code: number, formData: FormData, year: number): Observable<any> {
    formData.append('year', year.toString());
    return this.http.put<any>(`${this.baseUrl}/api/v1/replaceStateNormals/${state_code}`, formData);
  }

  addStateYearNormals(state_code: number, formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/addStateYearNormals/${state_code}`, formData);
  }

  bulkReplaceStateNormals(formData: FormData, year: number): Observable<any> {
    formData.append('year', year.toString());
    return this.http.put<any>(`${this.baseUrl}/api/v1/bulkReplaceStateNormals`, formData);
  }

  bulkAddStateYearNormals(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/bulkAddStateYearNormals`, formData);
  }
}
