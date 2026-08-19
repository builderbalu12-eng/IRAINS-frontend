import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';

export type OfficerPassKeyApprovalStatus = 'pending' | 'approved' | 'rejected';
export type OfficerPassKeyRequestType = 'create' | 'reset';

export interface OfficerPassKey {
  id: number;
  pass_key?: string;
  emp_name: string;
  emp_designation: string;
  emp_phone_number: string | number;
  emp_email?: string | null;
  login_id?: number | null;
  mcorhq_type?: string | null;
  approval_status?: OfficerPassKeyApprovalStatus;
  pending_request_type?: OfficerPassKeyRequestType | null;
  is_active?: boolean;
  last_used_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OfficerPassKeyPayload {
  emp_name: string;
  emp_designation?: string;
  emp_phone_number?: string;
  emp_email?: string | null;
  login_id?: number | null;
  mcorhq_type?: string | null;
  remark?: string;
}

export interface OfficerPassKeyResponse {
  success: boolean;
  message?: string;
  code?: string;
  status?: OfficerPassKeyApprovalStatus;
  pass_key?: string;
  email_sent?: boolean;
  hq_email_sent?: boolean;
  officer?: OfficerPassKey;
  remark?: string;
}

export interface OfficerPassKeyListResponse {
  success: boolean;
  total: number;
  limit: number;
  offset: number;
  data: OfficerPassKey[];
}

export interface OfficerPassKeyListQuery {
  q?: string;
  is_active?: boolean | '';
  limit?: number;
  offset?: number;
}

@Injectable({ providedIn: 'root' })
export class OfficerPassKeyService {
  private readonly url = `${environment.baseUrl}/api/v1/officer-pass-keys`;

  constructor(private http: HttpClient) {}

  create(payload: OfficerPassKeyPayload): Observable<OfficerPassKeyResponse> {
    return this.http.post<OfficerPassKeyResponse>(this.url, payload);
  }

  verify(pass_key: string, remark: string): Observable<OfficerPassKeyResponse> {
    return this.http.post<OfficerPassKeyResponse>(`${this.url}/verify`, {
      pass_key: this.normalizePassKey(pass_key),
      remark: remark.trim(),
    });
  }

  forgot(payload: {
    emp_name: string;
    emp_phone_number?: string;
    emp_email?: string;
  }): Observable<OfficerPassKeyResponse> {
    return this.http.post<OfficerPassKeyResponse>(`${this.url}/forgot`, payload);
  }

  regenerateByIdentity(payload: {
    emp_name: string;
    emp_phone_number?: string;
    emp_email?: string;
  }): Observable<OfficerPassKeyResponse> {
    return this.http.post<OfficerPassKeyResponse>(`${this.url}/regenerate`, payload);
  }

  list(query: OfficerPassKeyListQuery = {}): Observable<OfficerPassKeyListResponse> {
    let params = new HttpParams();
    const merged = { limit: 50, offset: 0, ...query };
    for (const [key, value] of Object.entries(merged)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<OfficerPassKeyListResponse>(this.url, { params });
  }

  getById(id: number): Observable<OfficerPassKeyResponse> {
    return this.http.get<OfficerPassKeyResponse>(`${this.url}/${id}`);
  }

  update(id: number, payload: Partial<OfficerPassKeyPayload>): Observable<OfficerPassKeyResponse> {
    return this.http.put<OfficerPassKeyResponse>(`${this.url}/${id}`, payload);
  }

  deactivate(id: number): Observable<OfficerPassKeyResponse> {
    return this.http.delete<OfficerPassKeyResponse>(`${this.url}/${id}`);
  }

  hardDelete(id: number): Observable<OfficerPassKeyResponse> {
    return this.http.delete<OfficerPassKeyResponse>(`${this.url}/${id}`, {
      params: { hard: 'true' },
    });
  }

  activate(id: number): Observable<OfficerPassKeyResponse> {
    return this.http.post<OfficerPassKeyResponse>(`${this.url}/${id}/activate`, {});
  }

  regenerateById(id: number): Observable<OfficerPassKeyResponse> {
    return this.http.post<OfficerPassKeyResponse>(`${this.url}/${id}/regenerate`, {});
  }

  normalizePassKey(value: string | number | null | undefined): string {
    return String(value ?? '').replace(/\D/g, '').slice(0, 4);
  }

  errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
    const http = err as { error?: { message?: string }; message?: string };
    return http?.error?.message || http?.message || fallback;
  }
}
