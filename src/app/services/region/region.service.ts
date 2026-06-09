import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';

@Injectable({
  providedIn: 'root'
})
export class RegionService {
  private baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) {}

  fetchData(data:any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchRegionData`;
    return this.http.post<any>(url, data);
  }

  fetchDataWithAWS(data:any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchRegionDataWithAWS`;
    return this.http.post<any>(url, data);
  }

  fetchDataFtp(data:any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchRegionDataFtp`;
    return this.http.post<any>(url, data);
  }

  fetchCummulativeDataFtp(data : any) : Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchCummulativeRegionDataFtp`;
    return this.http.post<any>(url, data);
  }
  fetchCummulativeData(data : any) : Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchCummulativeRegionData`;
    return this.http.post<any>(url, data);
  }
  fetchTopNRegions(data : any) : Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchTopNRegions`;
    return this.http.post<any>(url, data);
  }
  fetchRegionRangeStatistics(data : any) : Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchRegionRangeStatistics`;
    return this.http.post<any>(url, data);
  }

  fetchRegionCoverageCount(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/fetchRegionCoverageCount`, data);
  }

  // ── Region Normals Management ──────────────────────────────────────────────
  getRegionNormalList(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/getRegionNormalList`);
  }

  getRegionNormals(region_id: number, year: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/getRegionNormals/${region_id}?year=${year}`);
  }

  downloadRegionNormalTemplate(region_id: number): string {
    return `${this.baseUrl}/api/v1/downloadRegionNormalTemplate/${region_id}`;
  }

  replaceRegionNormals(region_id: number, formData: FormData, year: number): Observable<any> {
    formData.append('year', year.toString());
    return this.http.put<any>(`${this.baseUrl}/api/v1/replaceRegionNormals/${region_id}`, formData);
  }

  addRegionYearNormals(region_id: number, formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/addRegionYearNormals/${region_id}`, formData);
  }

  bulkReplaceRegionNormals(formData: FormData, year: number): Observable<any> {
    formData.append('year', year.toString());
    return this.http.put<any>(`${this.baseUrl}/api/v1/bulkReplaceRegionNormals`, formData);
  }

  bulkAddRegionYearNormals(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/bulkAddRegionYearNormals`, formData);
  }

  getMissingRegionNormals(year: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/getMissingRegionNormals?year=${year}`);
  }
}
