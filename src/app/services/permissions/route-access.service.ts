import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { environment } from 'src/environment/environment';

export interface ManagedAppRoute {
  id: number;
  path: string;
  label: string;
  allowedRoles: string[];
  active: boolean;
}

interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class RouteAccessService {
  private readonly baseUrl = `${environment.baseUrl}/api/v1/rbac`;
  private readonly routesSubject = new BehaviorSubject<ManagedAppRoute[]>([]);
  private loadPromise: Promise<void> | null = null;

  readonly routes$: Observable<ManagedAppRoute[]> = this.routesSubject.asObservable();

  constructor(private http: HttpClient) {
    void this.ensureLoaded();
  }

  /** Default catalog — same set as backend seed / Route Management UI. */
  static defaultRoutes(): ManagedAppRoute[] {
    return [
      { id: 1,  path: '/irains-dashboard',        label: 'Dashboard',           allowedRoles: ['hq', 'mc', 'public', 'sp'], active: true },
      { id: 2,  path: '/data-entry',              label: 'Data Entry',          allowedRoles: ['hq', 'mc'],              active: true },
      { id: 3,  path: '/newverification',         label: 'Verification',        allowedRoles: ['hq', 'mc'],              active: true },
      { id: 4,  path: '/admin-panel',             label: 'Admin Panel',         allowedRoles: ['hq'],                   active: true },
      { id: 5,  path: '/data-management',         label: 'Data Management',     allowedRoles: ['hq'],                   active: true },
      { id: 6,  path: '/permissions',             label: 'Permissions',         allowedRoles: ['hq'],                   active: true },
      { id: 7,  path: '/new-email-dissemination', label: 'Email Dissemination', allowedRoles: ['hq', 'mc', 'sp'],        active: true },
      { id: 8,  path: '/station-statistics',      label: 'Station Statistics',  allowedRoles: ['hq', 'mc', 'sp'],        active: true },
      { id: 9,  path: '/spatial-table',           label: 'Spatial Table',       allowedRoles: ['hq', 'mc', 'public', 'sp'], active: true },
      { id: 10, path: '/monsoon-activity',        label: 'Monsoon Activity',    allowedRoles: ['hq', 'mc', 'public', 'sp'], active: true },
      { id: 11, path: '/all-maps',                label: 'All Maps',            allowedRoles: ['hq', 'mc', 'public', 'sp'], active: true },
      { id: 12, path: '/yearlystationstatistics', label: 'Yearly Station Stats', allowedRoles: ['hq', 'mc', 'sp'],       active: true },
      { id: 13, path: '/rainfalldatacm',          label: 'Rainfall Data CM',    allowedRoles: ['hq', 'mc', 'sp'],        active: true },
    ];
  }

  get routesSnapshot(): ManagedAppRoute[] {
    return this.routesSubject.value;
  }

  ensureLoaded(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = this.refreshRoutes()
        .then(() => undefined)
        .catch((err) => {
          this.loadPromise = null;
          // Keep static defaults so AuthGuard/navbar still work offline
          if (!this.routesSubject.value.length) {
            this.routesSubject.next(RouteAccessService.defaultRoutes());
          }
          throw err;
        });
    }
    return this.loadPromise;
  }

  async refreshRoutes(): Promise<ManagedAppRoute[]> {
    const res = await firstValueFrom(
      this.http.get<ApiListResponse<ManagedAppRoute>>(`${this.baseUrl}/routes`)
    );
    const routes = (res?.data || []).map((r, i) => this.mapRoute(r, i));
    this.routesSubject.next(routes.length ? routes : RouteAccessService.defaultRoutes());
    return this.routesSnapshot;
  }

  getRoutes(): ManagedAppRoute[] {
    return this.routesSnapshot.map((r) => ({
      ...r,
      allowedRoles: [...r.allowedRoles],
    }));
  }

  async saveRoutes(routes: ManagedAppRoute[]): Promise<ManagedAppRoute[]> {
    const normalized = routes.map((r) => ({
      ...r,
      path: this.normalizePath(r.path),
      allowedRoles: (r.allowedRoles || []).map((x) => String(x).toLowerCase().trim()).filter(Boolean),
      active: !!r.active,
    }));
    const res = await firstValueFrom(
      this.http.put<ApiListResponse<ManagedAppRoute>>(`${this.baseUrl}/routes`, {
        routes: normalized,
      })
    );
    const saved = (res?.data || []).map((r, i) => this.mapRoute(r, i));
    this.routesSubject.next(saved);
    return this.getRoutes();
  }

  async resetToDefaults(): Promise<ManagedAppRoute[]> {
    const res = await firstValueFrom(
      this.http.post<ApiListResponse<ManagedAppRoute>>(`${this.baseUrl}/routes/reset`, {})
    );
    const routes = (res?.data || []).map((r, i) => this.mapRoute(r, i));
    this.routesSubject.next(routes.length ? routes : RouteAccessService.defaultRoutes());
    return this.getRoutes();
  }

  /**
   * Returns true/false when the path is governed by the managed catalog.
   * Returns null when the path is not managed — caller should fall back to
   * static route.data.allowedUsers (existing iRAINS behaviour).
   */
  evaluate(path: string, role: string): boolean | null {
    const match = this.findManagedRoute(path);
    if (!match) return null;
    if (!match.active) return false;
    const userRole = String(role || '').toLowerCase().trim();
    return match.allowedRoles.map((r) => r.toLowerCase()).includes(userRole);
  }

  getAllowedPathsForRole(role: string): string[] {
    const userRole = String(role || '').toLowerCase().trim();
    return this.routesSnapshot
      .filter((r) => r.active && r.allowedRoles.map((x) => x.toLowerCase()).includes(userRole))
      .map((r) => r.path);
  }

  private findManagedRoute(path: string): ManagedAppRoute | null {
    const target = this.normalizePath(path);
    if (!target || target === '/') return null;

    const routes = this.routesSnapshot;
    const exact = routes.find((r) => this.normalizePath(r.path) === target);
    if (exact) return exact;

    // Longest prefix: /data-management covers /data-management/rbac
    let best: ManagedAppRoute | null = null;
    let bestLen = -1;
    for (const r of routes) {
      const p = this.normalizePath(r.path);
      if (!p || p === '/') continue;
      const prefix = p.endsWith('/') ? p : p + '/';
      if ((target + '/').startsWith(prefix) && p.length > bestLen) {
        best = r;
        bestLen = p.length;
      }
    }
    return best;
  }

  normalizePath(path: string): string {
    if (!path) return '/';
    let p = String(path).trim();
    if (!p.startsWith('/')) p = '/' + p;
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    return p;
  }

  private mapRoute(r: any, i: number): ManagedAppRoute {
    return {
      id: Number(r.id) || i + 1,
      path: this.normalizePath(r.path || ''),
      label: String(r.label || r.path || 'Route'),
      allowedRoles: Array.isArray(r.allowedRoles)
        ? r.allowedRoles.map((x: any) => String(x).toLowerCase())
        : [],
      active: r.active !== false,
    };
  }
}
