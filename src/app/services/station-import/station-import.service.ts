import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from 'src/environment/environment';
import {
  ApplyRequest,
  ApplyResult,
  NetworkOverview,
  PreviewResponse,
  seedDayCount,
} from './station-import.models';
import { SAMPLE_OVERVIEW, SAMPLE_PREVIEW } from './station-import.sample';

/**
 * The backend for this page is not built yet. While this is true the service
 * serves the sample data and sends nothing over the network. Flip it once
 * these routes exist:
 *
 *   GET  /api/v1/station-import/overview
 *   POST /api/v1/station-import/preview   multipart: file, activationDate
 *   POST /api/v1/station-import/apply     multipart: file, selection (JSON ApplyRequest)
 */
const USE_SAMPLE_DATA = true;

@Injectable({ providedIn: 'root' })
export class StationImportService {
  private base = `${environment.baseUrl}/api/v1/station-import`;

  constructor(private http: HttpClient) {}

  get usingSampleData(): boolean {
    return USE_SAMPLE_DATA;
  }

  getOverview(): Observable<NetworkOverview> {
    if (USE_SAMPLE_DATA) return of(SAMPLE_OVERVIEW).pipe(delay(300));
    return this.http.get<NetworkOverview>(`${this.base}/overview`);
  }

  /** Writes nothing to the database: parse, validate and compare only. */
  preview(file: File, activationDate: string): Observable<PreviewResponse> {
    if (USE_SAMPLE_DATA) return of(SAMPLE_PREVIEW).pipe(delay(700));
    const body = new FormData();
    body.append('file', file);
    body.append('activationDate', activationDate);
    return this.http.post<PreviewResponse>(`${this.base}/preview`, body);
  }

  /**
   * The file goes again with the selection: the server re-checks every ticked
   * row inside the transaction instead of trusting what the preview said.
   */
  apply(file: File, request: ApplyRequest): Observable<ApplyResult> {
    if (USE_SAMPLE_DATA) return of(this.sampleApply(request)).pipe(delay(1100));
    const body = new FormData();
    body.append('file', file);
    body.append('selection', JSON.stringify(request));
    return this.http.post<ApplyResult>(`${this.base}/apply`, body);
  }

  /** What the real endpoint would report for this selection against the sample preview. */
  private sampleApply(request: ApplyRequest): ApplyResult {
    const chosen = SAMPLE_PREVIEW.newStations.filter((s) => request.newStationCodes.includes(s.stationCode));
    const plain = chosen.filter((s) => s.table === 'station_details').length;
    const aws = chosen.length - plain;
    const touched = new Set<string>([
      ...request.newStationCodes,
      ...request.fieldChanges.map((c) => c.stationCode),
      ...request.flagChangeCodes,
    ]);
    return {
      isSample: true,
      appliedAt: new Date().toISOString(),
      inserted: {
        stationDetails: plain,
        awsStationDetails: aws,
        awsMappingId: aws,
        dailyRows: plain * seedDayCount(request.activationDate, SAMPLE_PREVIEW.seedHorizon),
      },
      updatedFields: request.fieldChanges.length,
      flagsChanged: request.flagChangeCodes.length,
      stationLogs: touched.size,
      skipped: SAMPLE_PREVIEW.issues.filter((i) => i.severity === 'error'),
    };
  }
}
