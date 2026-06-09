import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';

@Injectable({
  providedIn: 'root'
})
export class getBlockService {
  private baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) {}

  fetchData(): Observable<any> {
    const url = `${this.baseUrl}/api/v1/getAllBlocks`;
    return this.http.get<any>(url);
  }

  // ── Block Normals Management ──────────────────────────────────────────────
  getBlockNormalList(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/getBlockNormalList`);
  }

  getBlockNormals(block_id: number, year: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/getBlockNormals/${block_id}?year=${year}`);
  }

  downloadBlockNormalTemplate(block_id: number): string {
    return `${this.baseUrl}/api/v1/downloadBlockNormalTemplate/${block_id}`;
  }

  replaceBlockNormals(block_id: number, formData: FormData, year: number): Observable<any> {
    formData.append('year', year.toString());
    return this.http.put<any>(`${this.baseUrl}/api/v1/replaceBlockNormals/${block_id}`, formData);
  }

  addBlockYearNormals(block_id: number, formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/addBlockYearNormals/${block_id}`, formData);
  }

  bulkReplaceBlockNormals(formData: FormData, year: number): Observable<any> {
    formData.append('year', year.toString());
    return this.http.put<any>(`${this.baseUrl}/api/v1/bulkReplaceBlockNormals`, formData);
  }

  bulkAddBlockYearNormals(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/bulkAddBlockYearNormals`, formData);
  }

  getMissingBlockNormals(year: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/getMissingBlockNormals?year=${year}`);
  }
}