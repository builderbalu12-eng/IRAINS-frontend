import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';

@Injectable({ providedIn: 'root' })
export class DisplayOrderService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  // ── Districts ──────────────────────────────────────────────────
  getDistrictDisplayOrder(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/v1/getDistrictDisplayOrder`);
  }

  updateDistrictDisplayOrders(orders: { old_display_order: number; new_display_order: number }[]): Observable<any> {
    return this.http.put(`${this.baseUrl}/api/v1/updateDistrictDisplayOrders`, { orders });
  }

  addDistrictDisplayOrderEntry(entry: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/v1/addDistrictDisplayOrderEntry`, entry);
  }

  deleteDistrictDisplayOrderEntry(display_order: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/v1/deleteDistrictDisplayOrderEntry/${display_order}`);
  }

  // ── States ─────────────────────────────────────────────────────
  getStateDisplayOrder(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/v1/getStateDisplayOrder`);
  }

  updateStateDisplayOrders(orders: { old_display_order: number; new_display_order: number }[]): Observable<any> {
    return this.http.put(`${this.baseUrl}/api/v1/updateStateDisplayOrders`, { orders });
  }

  // ── Subdivisions ───────────────────────────────────────────────
  getSubdivisionDisplayOrder(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/v1/getSubdivisionDisplayOrder`);
  }

  updateSubdivisionDisplayOrders(orders: { old_display_order: number; new_display_order: number }[]): Observable<any> {
    return this.http.put(`${this.baseUrl}/api/v1/updateSubdivisionDisplayOrders`, { orders });
  }

  addSubdivisionDisplayOrderEntry(entry: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/v1/addSubdivisionDisplayOrderEntry`, entry);
  }

  deleteSubdivisionDisplayOrderEntry(display_order: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/v1/deleteSubdivisionDisplayOrderEntry/${display_order}`);
  }

  // ── States add/delete ──────────────────────────────────────────
  addStateDisplayOrderEntry(entry: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/v1/addStateDisplayOrderEntry`, entry);
  }

  deleteStateDisplayOrderEntry(display_order: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/v1/deleteStateDisplayOrderEntry/${display_order}`);
  }

  // ── Normal district details (read-only, used only for search dropdowns) ──
  getNormalDistrictDetails(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/v1/getNormalDistrictDetails`);
  }
}
