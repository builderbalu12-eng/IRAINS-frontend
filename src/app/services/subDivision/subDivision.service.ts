import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';

@Injectable({
  providedIn: 'root'
})
export class SubdivisionService {
  private baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) {}

  fetchData(data:any) {
    const url = `${this.baseUrl}/api/v1/fetchSubDivisionData`;
    return this.http.post<any>(url, data);
  }

  fetchDataWithAWS(data:any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchSubDivisionDataWithAWS`;
    return this.http.post<any>(url, data);
  }

  fetchDataFtp(data:any) {
    const url = `${this.baseUrl}/api/v1/fetchSubDivisionDataFtp`;
    return this.http.post<any>(url, data);
  }


  fetchSubDivisionOfBunchDate(data : any){
    const url = `${this.baseUrl}/api/v1/fetchSubDivisionOfBunchDate`;
    return this.http.post<any>(url, data);
  }


  fetchTopNSubdivisions(data : any){
    const url = `${this.baseUrl}/api/v1/fetchTopNSubdivisions`;
    return this.http.post<any>(url, data);
  }
  fetchSubdivisionRangeStatistics(data : any){
    const url = `${this.baseUrl}/api/v1/fetchSubdivisionRangeStatistics`;
    return this.http.post<any>(url, data);
  }

  fetchmetWiseSubDivisions(){
    const url = `${this.baseUrl}/api/v1/metWiseSubDivisions`;
    return this.http.get<any>(url);
  }


  fetchMonsoonActivitySubDivisions(data:any){
    const url = `${this.baseUrl}/api/v1/monsoon-activity`;
    return this.http.post<any>(url, data);
  }

  fetchMonsoonActivityDistrict(data: any) {
    return this.http.post<any>(`${this.baseUrl}/api/v1/monsoon-activity-district`, data);
  }

  fetchMonsoonActivitySubdivLast7(data: any) {
    return this.http.post<any>(`${this.baseUrl}/api/v1/monsoon-activity-subdiv-last7`, data);
  }

  fetchMonsoonActivitySubdivLast30(data: any) {
    return this.http.post<any>(`${this.baseUrl}/api/v1/monsoon-activity-subdiv-last30`, data);
  }

  fetchMonsoonActivityDistrictLast7(data: any) {
    return this.http.post<any>(`${this.baseUrl}/api/v1/monsoon-activity-district-last7`, data);
  }

  fetchMonsoonActivityDistrictLast30(data: any) {
    return this.http.post<any>(`${this.baseUrl}/api/v1/monsoon-activity-district-last30`, data);
  }

  fetchAreaPercentages() {
    const url = `${this.baseUrl}/api/v1/getSubdivisionAreaPercentages`;
    return this.http.get<any>(url);
  }

  fetchDisplayOrder() {
    const url = `${this.baseUrl}/api/v1/getSubdivisionDisplayOrder`;
    return this.http.get<any>(url);
  }

  fetchSubDivisionDistrictCount(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/fetchSubDivisionDistrictCount`, data);
  }

  // ── Subdivision Normals Management ──────────────────────────────────────────
  getSubdivisionNormalList(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/getSubdivisionNormalList`);
  }

  getSubdivisionNormals(sub_division_code: number, year: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/getSubdivisionNormals/${sub_division_code}?year=${year}`);
  }

  downloadSubdivisionNormalTemplate(sub_division_code: number): string {
    return `${this.baseUrl}/api/v1/downloadSubdivisionNormalTemplate/${sub_division_code}`;
  }

  replaceSubdivisionNormals(sub_division_code: number, formData: FormData, year: number): Observable<any> {
    formData.append('year', year.toString());
    return this.http.put<any>(`${this.baseUrl}/api/v1/replaceSubdivisionNormals/${sub_division_code}`, formData);
  }

  addSubdivisionYearNormals(sub_division_code: number, formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/addSubdivisionYearNormals/${sub_division_code}`, formData);
  }

  bulkReplaceSubdivisionNormals(formData: FormData, year: number): Observable<any> {
    formData.append('year', year.toString());
    return this.http.put<any>(`${this.baseUrl}/api/v1/bulkReplaceSubdivisionNormals`, formData);
  }

  bulkAddSubdivisionYearNormals(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/bulkAddSubdivisionYearNormals`, formData);
  }

  getMissingSubdivisionNormals(year: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/getMissingSubdivisionNormals?year=${year}`);
  }
}