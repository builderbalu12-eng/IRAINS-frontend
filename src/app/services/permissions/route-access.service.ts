import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ManagedAppRoute {
  id: number;
  path: string;
  label: string;
  allowedRoles: string[];
  active: boolean;
}

const STORAGE_KEY = 'irains_route_access_v1';

@Injectable({ providedIn: 'root' })
export class RouteAccessService {
  private readonly routesSubject = new BehaviorSubject<ManagedAppRoute[]>(this.load());
  readonly routes$: Observable<ManagedAppRoute[]> = this.routesSubject.asObservable();

  /** Default catalog — same set as Route Management UI seed data. */
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

  getRoutes(): ManagedAppRoute[] {
    return this.routesSnapshot.map(r => ({
      ...r,
      allowedRoles: [...r.allowedRoles],
    }));
  }

  saveRoutes(routes: ManagedAppRoute[]): void {
    const normalized = routes.map(r => ({
      ...r,
      path: this.normalizePath(r.path),
      allowedRoles: (r.allowedRoles || []).map(x => String(x).toLowerCase().trim()).filter(Boolean),
      active: !!r.active,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    this.routesSubject.next(normalized);
  }

  resetToDefaults(): void {
    this.saveRoutes(RouteAccessService.defaultRoutes());
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
    return match.allowedRoles.map(r => r.toLowerCase()).includes(userRole);
  }

  getAllowedPathsForRole(role: string): string[] {
    const userRole = String(role || '').toLowerCase().trim();
    return this.routesSnapshot
      .filter(r => r.active && r.allowedRoles.map(x => x.toLowerCase()).includes(userRole))
      .map(r => r.path);
  }

  private findManagedRoute(path: string): ManagedAppRoute | null {
    const target = this.normalizePath(path);
    if (!target || target === '/') return null;

    const routes = this.routesSnapshot;
    const exact = routes.find(r => this.normalizePath(r.path) === target);
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

  private load(): ManagedAppRoute[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return RouteAccessService.defaultRoutes();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.length) {
        return RouteAccessService.defaultRoutes();
      }
      return parsed.map((r: any, i: number) => ({
        id: Number(r.id) || i + 1,
        path: this.normalizePath(r.path || ''),
        label: String(r.label || r.path || 'Route'),
        allowedRoles: Array.isArray(r.allowedRoles)
          ? r.allowedRoles.map((x: any) => String(x).toLowerCase())
          : [],
        active: r.active !== false,
      }));
    } catch {
      return RouteAccessService.defaultRoutes();
    }
  }
}
