import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  expanded?: boolean;
}

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

  menuGroups: MenuItem[] = [
    {
      label: 'Calculation',
      icon: 'bi bi-calculator-fill',
      expanded: true,
      children: [
        { label: 'Calculation Exclusion', icon: 'bi bi-slash-circle',  route: '/data-management/calculation-exclusion' },
        { label: 'Display Order',         icon: 'bi bi-list-ol',        route: '/data-management/display-order' },
        { label: 'Calculation Mode',      icon: 'bi bi-toggle-on',      route: '/data-management/calculation-mode' },
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
      label: 'Permissions',
      icon: 'bi bi-shield-lock-fill',
      expanded: true,
      children: [
        { label: 'RBAC',             icon: 'bi bi-table',              route: '/data-management/rbac' },
        { label: 'Role Management',  icon: 'bi bi-person-badge-fill',  route: '/data-management/role-management' },
        { label: 'Route Management', icon: 'bi bi-signpost-2-fill',    route: '/data-management/route-management' },
        { label: 'New Register',     icon: 'bi bi-person-plus-fill',   route: '/data-management/new-register' },
      ]
    },
  ];

  private routerSub: any;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.currentRoute = this.router.url;
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => { this.currentRoute = e.urlAfterRedirects; this.autoExpand(); });
    this.autoExpand();
  }

  ngOnDestroy(): void { this.routerSub?.unsubscribe(); }

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
