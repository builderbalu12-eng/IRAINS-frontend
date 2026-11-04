import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AdminRealtimeService } from 'src/app/services/admin-realtime.service';
import {
  ADMIN_ACTIVITY_PAGES,
  backendRoutePath,
  isRealtimeAdminPage,
  normalizeAngularPath,
} from 'src/app/config/admin-realtime.config';
import { RouteAccessService } from 'src/app/services/permissions/route-access.service';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  expanded?: boolean;
}

const SUBSECTION_ICONS: Record<string, string> = {
  Calculation: 'bi bi-calculator-fill',
  'Shape file/Map Boundaries': 'bi bi-map-fill',
  Normals: 'bi bi-cloud-rain-fill',
  'Activity Log': 'bi bi-journal-text',
  'Master File': 'bi bi-folder-fill',
  Infographics: 'bi bi-info-circle-fill',
  Stations: 'bi bi-geo-alt-fill',
  Automation: 'bi bi-clock-history',
  Permissions: 'bi bi-shield-lock-fill',
};

const PAGE_ICONS: Record<string, string> = {
  '/data-management/calculation-exclusion': 'bi bi-slash-circle',
  '/data-management/display-order': 'bi bi-list-ol',
  '/data-management/calculation-mode': 'bi bi-toggle-on',
  '/data-management/review-and-publish': 'bi bi-lock-fill',
  '/data-management/data-entry-investigation': 'bi bi-search',
  '/data-management/geojson': 'bi bi-layers-fill',
  '/data-management/country-management': 'bi bi-globe2',
  '/data-management/region-management': 'bi bi-globe-americas',
  '/data-management/state-management': 'bi bi-flag-fill',
  '/data-management/subdivision-management': 'bi bi-diagram-3-fill',
  '/data-management/district-management': 'bi bi-pin-map-fill',
  '/data-management/block-management': 'bi bi-grid-3x3-gap-fill',
  '/data-management/activity-log': 'bi bi-list-check',
  '/data-management/db-info': 'bi bi-database-fill',
  '/data-management/station-management': 'bi bi-geo-alt-fill',
  '/data-management/scheduler-management': 'bi bi-clock-history',
  '/data-management/role-management': 'bi bi-person-badge-fill',
  '/data-management/new-register': 'bi bi-people-fill',
  '/data-management/route-management': 'bi bi-signpost-2-fill',
  '/data-management/rbac': 'bi bi-shield-lock-fill',
  '/data-management/permissions-activity-log': 'bi bi-journal-text',
  '/data-management/officer-pass-keys': 'bi bi-key-fill',
};

const BASE_SUBSECTION_ORDER = [
  'Calculation',
  'Shape file/Map Boundaries',
  'Normals',
  'Activity Log',
  'Master File',
  'Infographics',
  'Stations',
  'Automation',
  'Permissions',
];

@Component({
  selector: 'app-data-management',
  templateUrl: './data-management.component.html',
  styleUrls: ['./data-management.component.css']
})
export class DataManagementComponent implements OnInit, OnDestroy {
  isPinned = true;
  isHovered = false;
  currentRoute = '';

  get isExpanded(): boolean { return this.isPinned || this.isHovered; }

  menuGroups: MenuItem[] = [];

  private readonly baseMenuGroups: MenuItem[] = [
    {
      label: 'Calculation',
      icon: 'bi bi-calculator-fill',
      expanded: true,
      children: [
        { label: 'Calculation Exclusion', icon: 'bi bi-slash-circle',  route: '/data-management/calculation-exclusion' },
        { label: 'Display Order',         icon: 'bi bi-list-ol',        route: '/data-management/display-order' },
        { label: 'Calculation Mode',      icon: 'bi bi-toggle-on',      route: '/data-management/calculation-mode' },
        { label: 'Review and Publish',    icon: 'bi bi-lock-fill',      route: '/data-management/review-and-publish' },
        { label: 'Data Entry Investigation', icon: 'bi bi-search',      route: '/data-management/data-entry-investigation' },
      ]
    },
    {
      label: 'Shape file/Map Boundaries',
      icon: 'bi bi-map-fill',
      expanded: true,
      children: [
        { label: 'GeoJSON', icon: 'bi bi-layers-fill', route: '/data-management/geojson' },
      ]
    },
    {
      label: 'Normals',
      icon: 'bi bi-cloud-rain-fill',
      expanded: true,
      children: [
        { label: 'Country',     icon: 'bi bi-globe2',              route: '/data-management/country-management' },
        { label: 'Region',      icon: 'bi bi-globe-americas',      route: '/data-management/region-management' },
        { label: 'State',       icon: 'bi bi-flag-fill',           route: '/data-management/state-management' },
        { label: 'Subdivision', icon: 'bi bi-diagram-3-fill',      route: '/data-management/subdivision-management' },
        { label: 'District',    icon: 'bi bi-pin-map-fill',        route: '/data-management/district-management' },
        { label: 'Block',       icon: 'bi bi-grid-3x3-gap-fill',   route: '/data-management/block-management' },
      ]
    },
    {
      label: 'Activity Log',
      icon: 'bi bi-journal-text',
      expanded: false,
      children: [
        { label: 'Admin Activity Log', icon: 'bi bi-list-check', route: '/data-management/activity-log' },
      ]
    },
    {
      label: 'Master File',
      icon: 'bi bi-folder-fill',
      expanded: true,
      children: []
    },
    {
      label: 'Infographics',
      icon: 'bi bi-info-circle-fill',
      expanded: true,
      children: [
        { label: 'Database Info', icon: 'bi bi-database-fill', route: '/data-management/db-info' },
      ]
    },
    {
      label: 'Stations',
      icon: 'bi bi-geo-alt-fill',
      expanded: true,
      children: [
        { label: 'Station Management', icon: 'bi bi-geo-alt-fill', route: '/data-management/station-management' },
      ]
    },
    {
      label: 'Automation',
      icon: 'bi bi-clock-history',
      expanded: true,
      children: [
        { label: 'Schedulers', icon: 'bi bi-clock-history', route: '/data-management/scheduler-management' },
      ]
    },
    {
      label: 'Permissions',
      icon: 'bi bi-shield-lock-fill',
      expanded: true,
      children: [
        { label: 'Roles',            icon: 'bi bi-person-badge-fill',  route: '/data-management/role-management' },
        { label: 'Users',            icon: 'bi bi-people-fill',        route: '/data-management/new-register' },
        { label: 'Routes',           icon: 'bi bi-signpost-2-fill',    route: '/data-management/route-management' },
        { label: 'Role Permissions', icon: 'bi bi-shield-lock-fill',   route: '/data-management/rbac' },
        { label: 'Activity Log',     icon: 'bi bi-journal-text',       route: '/data-management/permissions-activity-log' },
        { label: 'Officer Pass Keys', icon: 'bi bi-key-fill',          route: '/data-management/officer-pass-keys' },
      ]
    },
  ];

  private routerSub: any;
  private routesSub = new Subscription();

  showLiveUsersBar = false;
  activityRoutePath: string | null = null;
  currentAngularPath = '';
  activityPageTitle = 'This page';

  constructor(
    private router: Router,
    private adminRealtime: AdminRealtimeService,
    private routeAccess: RouteAccessService,
  ) {
    this.menuGroups = this.cloneBaseMenu();
  }

  ngOnInit(): void {
    this.adminRealtime.connect();
    this.currentRoute = this.router.url;
    this.syncRealtime(this.currentRoute);
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => {
        this.currentRoute = e.urlAfterRedirects;
        this.syncRealtime(this.currentRoute);
        this.autoExpand();
      });
    void this.routeAccess.ensureLoaded().catch(() => undefined);
    this.routesSub.add(
      this.routeAccess.routes$.subscribe(() => {
        this.mergeDbPagesIntoMenu();
        this.autoExpand();
      })
    );
    this.autoExpand();
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.routesSub.unsubscribe();
    this.adminRealtime.teardown();
  }

  private syncRealtime(url: string): void {
    const path = normalizeAngularPath(url);
    this.currentAngularPath = path;
    this.showLiveUsersBar = isRealtimeAdminPage(path);
    this.activityRoutePath = backendRoutePath(path);
    this.activityPageTitle =
      ADMIN_ACTIVITY_PAGES.find((page) => page.route_path === this.activityRoutePath)?.page_name ??
      'This page';
    this.adminRealtime.onRouteChange(path);
  }

  private cloneBaseMenu(): MenuItem[] {
    return this.baseMenuGroups.map((g) => ({
      ...g,
      children: (g.children || []).map((c) => ({ ...c })),
    }));
  }

  /** Merge pages registered in Routes (section=Data Management) into sidebar subsections. */
  private mergeDbPagesIntoMenu(): void {
    const expandedState = new Map(
      this.menuGroups.map((g) => [g.label, !!g.expanded])
    );
    const groups = this.cloneBaseMenu();
    const bySub = this.routeAccess.getDataManagementPagesBySubsection();

    for (const [subsection, pages] of bySub.entries()) {
      let group = groups.find((g) => g.label === subsection);
      if (!group) {
        group = {
          label: subsection,
          icon: SUBSECTION_ICONS[subsection] || 'bi bi-folder2-open',
          expanded: true,
          children: [],
        };
        groups.push(group);
      }
      if (!group.children) group.children = [];

      for (const page of pages) {
        const path = this.routeAccess.normalizePath(page.path);
        const existing = group.children.find(
          (c) => c.route && this.routeAccess.normalizePath(c.route) === path
        );
        if (existing) {
          existing.label = page.label || existing.label;
          continue;
        }
        group.children.push({
          label: page.label,
          icon: PAGE_ICONS[path] || 'bi bi-file-earmark',
          route: path,
        });
      }
    }

    groups.sort((a, b) => {
      const ai = BASE_SUBSECTION_ORDER.indexOf(a.label);
      const bi = BASE_SUBSECTION_ORDER.indexOf(b.label);
      const ao = ai === -1 ? 1000 : ai;
      const bo = bi === -1 ? 1000 : bi;
      if (ao !== bo) return ao - bo;
      return a.label.localeCompare(b.label);
    });

    for (const g of groups) {
      if (expandedState.has(g.label)) g.expanded = expandedState.get(g.label);
    }

    this.menuGroups = groups;
  }

  autoExpand(): void {
    for (const g of this.menuGroups) {
      if (g.children?.some(c => c.route && this.currentRoute.startsWith(c.route))) {
        g.expanded = true;
      }
    }
  }

  onMouseEnter(): void { this.isHovered = true; }
  onMouseLeave(): void { this.isHovered = false; }
  togglePin(): void    { this.isPinned = !this.isPinned; }
  toggleGroup(g: MenuItem): void { if (g.children) g.expanded = !g.expanded; }
}
