import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "src/environment/environment";

/** one ticked product: `scope` + `key` is the identity, the two flags are the boxes */
export interface DefaultSelectionItem {
  scope: "DRMS" | "REGIONAL" | "BRMS" | "STATE" | "MC";
  key: string;
  map: boolean;
  doc: boolean;
}

/**
 * ALL STATISTICS — which products the console opens with ticked.
 * Backed by all_statistics_default_selection (one row per product per user).
 */
@Injectable({ providedIn: "root" })
export class AllStatisticsService {
  private baseUrl: string = environment.baseUrl;
  private endpoint = `${this.baseUrl}/api/v1/all-statistics/default-selection`;

  constructor(private http: HttpClient) {}

  /** the logged-in username, which is what the table keys on */
  currentUsername(): string {
    try {
      const user = JSON.parse(localStorage.getItem("isAuthorised") || "{}");
      return user?.data?.[0]?.username || "";
    } catch {
      return "";
    }
  }

  getDefaultSelection(username: string): Observable<any> {
    return this.http.get<any>(
      `${this.endpoint}?username=${encodeURIComponent(username)}`
    );
  }

  /** Save Selection — replaces this user's whole set */
  saveDefaultSelection(
    username: string,
    items: DefaultSelectionItem[]
  ): Observable<any> {
    return this.http.post<any>(this.endpoint, { username, items });
  }

  /** persist a single checkbox, for save-on-click */
  toggleDefaultSelection(
    username: string,
    item: DefaultSelectionItem
  ): Observable<any> {
    return this.http.post<any>(`${this.endpoint}/toggle`, {
      username,
      ...item,
    });
  }

  clearDefaultSelection(username: string): Observable<any> {
    return this.http.delete<any>(
      `${this.endpoint}?username=${encodeURIComponent(username)}`
    );
  }
}
