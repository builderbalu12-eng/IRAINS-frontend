import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';

@Injectable({
  providedIn: 'root'
})
export class BlockService {
  private baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) {}

  fetchData(data:any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchBlockData`;
    return this.http.post<any>(url, data);
  }

  fetchDataFtp(data:any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchBlockData`;
    console.log('called fetchDataFtp');
    return this.http.post<any>(url, data);
  }
  
  fetchDatablockaws(data:any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchLatestAwsExcelData`;
    return this.http.post<any>(url, data);
  }
  fetchBlockRainfallAnalysis(data:any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchBlockRainfallAnalysis`;
    return this.http.post<any>(url, data);
  }
  fetchTopNBlocks(data:any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchTopNBlocks`;
    return this.http.post<any>(url, data);
  }
  fetchBlockRangeStatistics(data:any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchBlockRangeStatistics`;
    return this.http.post<any>(url, data);
  }
}
