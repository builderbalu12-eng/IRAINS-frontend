import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';

@Injectable({
  providedIn: 'root'
})
export class CountryService {
  private baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) {}

  fetchData(data:any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchCountryData`;
    return this.http.post<any>(url, data);
  }

  fetchDataWithAWS(data:any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchCountryDataWithAWS`;
    return this.http.post<any>(url, data);
  }

  fetchDataFtp(data:any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchCountryDataFtp`;
    return this.http.post<any>(url, data);
  }

  fetchDataCummulativeFtp(data:any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchCummulativeCountryDataFtp`;
    return this.http.post<any>(url, data);
  }

  fetchDataCummulative(data:any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchCummulativeCountryData`;
    return this.http.post<any>(url, data);
  }

  fetchTopNCountries(data:any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchTopNCountries`;
    return this.http.post<any>(url, data);
  }
  fetchCountryRangeStatistics(data:any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchCountryRangeStatistics`;
    return this.http.post<any>(url, data);
  }

  // ── Country Normals Management ─────────────────────────────────────────────
  getCountryNormalList(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/getCountryNormalList`);
  }

  getCountryNormals(country_name: string, year: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/getCountryNormals/${encodeURIComponent(country_name)}?year=${year}`);
  }

  downloadCountryNormalTemplate(country_name: string): string {
    return `${this.baseUrl}/api/v1/downloadCountryNormalTemplate/${encodeURIComponent(country_name)}`;
  }

  replaceCountryNormals(country_name: string, formData: FormData, year: number): Observable<any> {
    formData.append('year', year.toString());
    return this.http.put<any>(`${this.baseUrl}/api/v1/replaceCountryNormals/${encodeURIComponent(country_name)}`, formData);
  }

  addCountryYearNormals(country_name: string, formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/addCountryYearNormals/${encodeURIComponent(country_name)}`, formData);
  }

  bulkReplaceCountryNormals(formData: FormData, year: number): Observable<any> {
    formData.append('year', year.toString());
    return this.http.put<any>(`${this.baseUrl}/api/v1/bulkReplaceCountryNormals`, formData);
  }

  bulkAddCountryYearNormals(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/bulkAddCountryYearNormals`, formData);
  }

  getMissingCountryNormals(year: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/getMissingCountryNormals?year=${year}`);
  }
}
