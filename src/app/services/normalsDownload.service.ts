import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';

export type NormalsLevel = 'country' | 'region' | 'state' | 'subdivision' | 'district' | 'block';
export type NormalsView = 'daily' | 'weekly' | 'monthly';

@Injectable({ providedIn: 'root' })
export class NormalsDownloadService {
  private base = `${environment.baseUrl}/api/v1/normals`;

  constructor(private http: HttpClient) {}

  getYears(level: NormalsLevel): Observable<{ success: boolean; data: number[] }> {
    return this.http.get<{ success: boolean; data: number[] }>(`${this.base}/years/${level}`);
  }

  download(level: NormalsLevel, year: number, view: NormalsView): Observable<Blob> {
    const params = new HttpParams().set('level', level).set('year', year).set('view', view);
    return this.http.get(`${this.base}/download`, { params, responseType: 'blob' });
  }
}
