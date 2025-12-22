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
}