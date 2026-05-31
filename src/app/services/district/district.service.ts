import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';

@Injectable({
  providedIn: 'root'
})
export class DistrictService {
  private baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) {}

  fetchData(data:any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchDistrictData`;
    return this.http.post<any>(url, data);
  }

  fetchDataWithAWS(data:any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchDistrictDataWithAWS`;
    return this.http.post<any>(url, data);
  }

  fetchDataFtp(data:any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchDistrictDataFtp`;
    console.log('called fetchDataFtp');
    return this.http.post<any>(url, data);
  }

  fetchTopNDistricts(data:any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchTopNDistricts`;
    return this.http.post<any>(url, data);
  }
  
  fetchDistrictRangeStatistics(data:any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchDistrictRangeStatistics`;
    return this.http.post<any>(url, data);
  }

  fetchDistrictStationCount(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/fetchDistrictStationCount`, data);
  }

  fetchDistrictDisplayOrder(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/getDistrictDisplayOrder`);
  }

  getAllDistricts(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/getAllDistrict`);
  }

  getNormalDistrictDetails(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/getNormalDistrictDetails`);
  }

  insertNewDistrictAndNormalValues(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/inserNewDistrictAndNormalValues`, formData);
  }

  updateDistrictDetails(data: { district_code: number; district_name: string }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/api/v1/addNewDistrictDetails`, data);
  }

  getDistrictNormals(district_code: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/getDistrictNormals/${district_code}`);
  }

  downloadDistrictNormalTemplate(): string {
    return `${this.baseUrl}/api/v1/downloadDistrictNormalTemplate`;
  }

  updateDistrictNormals(district_code: number, formData: FormData): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/api/v1/updateDistrictNormals/${district_code}`, formData);
  }
}
