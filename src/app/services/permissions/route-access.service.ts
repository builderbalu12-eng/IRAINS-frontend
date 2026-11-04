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
  section: string;
  subsection: string;
  menuPath: string;
  sortOrder: number;
  showInNav: boolean;
}

export interface NavNode {
  label: string;
  path?: string;
  sortOrder: number;
  children?: NavNode[];
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

  /** Fallback catalog when the API is unreachable. */
  static defaultRoutes(): ManagedAppRoute[] {
    return [
      { id: 1,  path: '/irains-dashboard',        label: 'IRAINS DASHBOARD', section: 'Main', subsection: '', menuPath: '', sortOrder: 0, showInNav: true, allowedRoles: ['hq', 'mc', 'public', 'sp'], active: true },
      { id: 2,  path: '/data-entry',              label: 'DATA ENTRY', section: 'Main', subsection: '', menuPath: '', sortOrder: 30, showInNav: true, allowedRoles: ['hq', 'mc'], active: true },
      { id: 3,  path: '/newverification',         label: 'Verification', section: 'Main', subsection: '', menuPath: '', sortOrder: 0, showInNav: false, allowedRoles: ['hq', 'mc'], active: true },
      { id: 4,  path: '/admin-panel',             label: 'Admin Panel', section: 'Main', subsection: '', menuPath: '', sortOrder: 0, showInNav: false, allowedRoles: ['hq'], active: true },
      { id: 5,  path: '/data-management',         label: 'Data Management', section: 'Data Management', subsection: '', menuPath: 'Data Management', sortOrder: 0, showInNav: false, allowedRoles: ['hq'], active: true },
      { id: 6,  path: '/permissions',             label: 'Permissions', section: 'Main', subsection: '', menuPath: '', sortOrder: 0, showInNav: false, allowedRoles: ['hq'], active: true },
      { id: 7,  path: '/new-email-dissemination', label: 'DISSEMINATION', section: 'Main', subsection: '', menuPath: '', sortOrder: 70, showInNav: true, allowedRoles: ['hq', 'mc', 'sp'], active: true },
      { id: 8,  path: '/station-statistics',      label: 'STATISTICS', section: 'STATION STATISTICS', subsection: '', menuPath: 'STATION STATISTICS', sortOrder: 0, showInNav: true, allowedRoles: ['hq', 'mc', 'sp'], active: true },
      { id: 9,  path: '/spatial-table',           label: 'SPATIAL DISTRIBUTION', section: 'Main', subsection: '', menuPath: '', sortOrder: 90, showInNav: true, allowedRoles: ['hq', 'mc', 'public', 'sp'], active: true },
      { id: 10, path: '/monsoon-activity',        label: 'MONSOON ACTIVITY', section: 'Main', subsection: '', menuPath: '', sortOrder: 100, showInNav: true, allowedRoles: ['hq', 'mc', 'public', 'sp'], active: true },
      { id: 11, path: '/all-maps',                label: 'All Maps', section: 'Main', subsection: '', menuPath: '', sortOrder: 0, showInNav: false, allowedRoles: ['hq', 'mc', 'public', 'sp'], active: true },
      { id: 12, path: '/yearlystationstatistics', label: 'YEARLY STATION STATISTICS', section: 'Main', subsection: '', menuPath: '', sortOrder: 80, showInNav: true, allowedRoles: ['hq', 'mc', 'sp'], active: true },
      { id: 13, path: '/rainfalldatacm',          label: 'SIGNIFICANT RAINFALL', section: 'Main', subsection: '', menuPath: '', sortOrder: 40, showInNav: true, allowedRoles: ['hq', 'mc', 'sp'], active: true },
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

  private actorPayload(): Record<string, unknown> {
    try {
      const raw = localStorage.getItem('isAuthorised');
      if (!raw) return { emp_name: 'Unknown', emp_designation: 'Officer' };
      const auth = JSON.parse(raw);
      const u = auth?.data?.[0] || {};
      const username = String(u.username || '');
      const role = String(u.mcorhq || '').toUpperCase();
      return {
        emp_name: String(u.name || username || 'Unknown'),
        emp_designation: role ? `${role} Officer` : 'Officer',
        mcorhq_type: u.mcorhq || null,
        login_id: u.userid ?? null,
        emp_email: username.includes('@') ? username : null,
      };
    } catch {
      return { emp_name: 'Unknown', emp_designation: 'Officer' };
    }
  }

  async saveRoutes(routes: ManagedAppRoute[]): Promise<ManagedAppRoute[]> {
    const normalized = routes.map((r) => {
      const section = String(r.section || '').trim();
      const subsection = String(r.subsection || '').trim();
      const menuPath =
        String(r.menuPath || '').trim() ||
        [section, subsection].filter(Boolean).join(' > ');
      return {
        ...r,
        path: this.normalizePath(r.path),
        allowedRoles: (r.allowedRoles || []).map((x) => String(x).toLowerCase().trim()).filter(Boolean),
        active: !!r.active,
        section,
        subsection,
        menuPath,
        sortOrder: Number(r.sortOrder) || 0,
        showInNav: r.showInNav !== false,
      };
    });
    const res = await firstValueFrom(
      this.http.put<ApiListResponse<ManagedAppRoute>>(`${this.baseUrl}/routes`, {
        routes: normalized,
        ...this.actorPayload(),
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
   * Fully DB-driven access check against rbac_routes / rbac_route_roles.
   * Unknown / inactive paths are denied (no hardcoded routing fallback).
   */
  evaluate(path: string, role: string): boolean {
    const match = this.findManagedRoute(path);
    if (!match || !match.active) return false;
    const userRole = String(role || '').toLowerCase().trim();
    return match.allowedRoles.map((r) => r.toLowerCase()).includes(userRole);
  }

  getAllowedPathsForRole(role: string): string[] {
    const userRole = String(role || '').toLowerCase().trim();
    return this.routesSnapshot
      .filter((r) => r.active && r.allowedRoles.map((x) => x.toLowerCase()).includes(userRole))
      .map((r) => r.path);
  }

  /** Nested menu for the navbar, filtered by role and showInNav. */
  getNavTreeForRole(role: string): NavNode[] {
    const userRole = String(role || '').toLowerCase().trim();
    const leaves = this.routesSnapshot
      .filter((r) =>
        r.active &&
        r.showInNav !== false &&
        r.allowedRoles.map((x) => x.toLowerCase()).includes(userRole)
      )
      .slice()
      .sort((a, b) => {
        const mp = (a.menuPath || '').localeCompare(b.menuPath || '');
        if (mp !== 0) return mp;
        const so = (a.sortOrder || 0) - (b.sortOrder || 0);
        if (so !== 0) return so;
        return a.label.localeCompare(b.label);
      });

    const root: NavNode[] = [];
    let rootSeq = 0;

    const findOrCreate = (siblings: NavNode[], label: string, sortOrder: number, atRoot: boolean): NavNode => {
      let node = siblings.find((n) => n.label === label && !n.path);
      if (!node) {
        // Preserve first-seen order for top-level groups (Rainfall Map, Statistics, …)
        const order = atRoot ? (rootSeq++) * 1000 : sortOrder;
        node = { label, sortOrder: order, children: [] };
        siblings.push(node);
      }
      return node;
    };

    for (const route of leaves) {
      const segments = String(route.menuPath || '')
        .split('>')
        .map((s) => s.trim())
        .filter(Boolean);
      let siblings = root;
      for (let i = 0; i < segments.length; i += 1) {
        const group = findOrCreate(siblings, segments[i], route.sortOrder || 0, i === 0);
        if (!group.children) group.children = [];
        siblings = group.children;
      }
      // Top-level leaves also keep discovery order among other root items
      const leafOrder = segments.length === 0 ? (rootSeq++) * 1000 + (route.sortOrder || 0) : (route.sortOrder || 0);
      siblings.push({
        label: route.label,
        path: route.path,
        sortOrder: leafOrder,
      });
    }

    const sortTree = (nodes: NavNode[]): NavNode[] => {
      nodes.sort((a, b) => {
        const so = (a.sortOrder || 0) - (b.sortOrder || 0);
        if (so !== 0) return so;
        return a.label.localeCompare(b.label);
      });
      for (const n of nodes) {
        if (n.children?.length) n.children = sortTree(n.children);
      }
      return nodes.filter((n) => n.path || (n.children && n.children.length > 0));
    };

    return sortTree(root);
  }

  private findManagedRoute(path: string): ManagedAppRoute | null {
    const target = this.normalizePath(path);
    if (!target || target === '/') return null;

    const routes = this.routesSnapshot;
    const exact = routes.find((r) => this.normalizePath(r.path) === target);
    if (exact) return exact;

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

  /** Active Data Management child pages grouped by subsection (for DM sidebar). */
  getDataManagementPagesBySubsection(): Map<string, ManagedAppRoute[]> {
    const map = new Map<string, ManagedAppRoute[]>();
    const pages = this.routesSnapshot
      .filter((r) =>
        r.active &&
        String(r.section || '').trim() === 'Data Management' &&
        this.normalizePath(r.path) !== '/data-management' &&
        this.normalizePath(r.path).startsWith('/data-management/')
      )
      .slice()
      .sort((a, b) => {
        const sub = (a.subsection || '').localeCompare(b.subsection || '');
        if (sub) return sub;
        return (a.sortOrder || 0) - (b.sortOrder || 0) || a.label.localeCompare(b.label);
      });

    for (const page of pages) {
      const key = String(page.subsection || '').trim() || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(page);
    }
    return map;
  }

  private mapRoute(r: any, i: number): ManagedAppRoute {
    const menuPath = String(r.menuPath ?? r.menu_path ?? '');
    let section = String(r.section ?? '').trim();
    let subsection = String(r.subsection ?? '').trim();
    if ((!section || !subsection) && menuPath) {
      const parts = menuPath.split('>').map((s: string) => s.trim()).filter(Boolean);
      if (!section && parts.length) section = parts[0];
      if (!subsection && parts.length > 1) subsection = parts.slice(1).join(' > ');
    }
    return {
      id: Number(r.id) || i + 1,
      path: this.normalizePath(r.path || ''),
      label: String(r.label || r.path || 'Route'),
      allowedRoles: Array.isArray(r.allowedRoles)
        ? r.allowedRoles.map((x: any) => String(x).toLowerCase())
        : [],
      active: r.active !== false,
      section,
      subsection,
      menuPath,
      sortOrder: Number(r.sortOrder ?? r.sort_order ?? 0) || 0,
      showInNav: r.showInNav != null ? r.showInNav !== false : (r.show_in_nav != null ? r.show_in_nav !== false : true),
    };
  }
}
