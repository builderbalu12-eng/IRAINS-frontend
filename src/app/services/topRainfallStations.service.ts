import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';

@Injectable({ providedIn: 'root' })
export class TopRainfallStationsService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  /** Top `topN` stations by rainfall for each of the last `days` days. */
  getTopRainfallStations(days: number, topN: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/api/v1/top-rainfall-stations?days=${days}&topN=${topN}`
    );
  }
}
