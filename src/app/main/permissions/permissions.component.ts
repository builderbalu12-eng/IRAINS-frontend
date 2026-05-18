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
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.css']
})
export class PermissionsComponent implements OnInit, OnDestroy {
  isPinned = true;
  isHovered = false;
  currentRoute = '';

  get isExpanded(): boolean { return this.isPinned || this.isHovered; }

  menuGroups: MenuItem[] = [
    {
      label: 'Access Control',
      icon: 'bi bi-shield-lock-fill',
      expanded: true,
      children: [
        { label: 'RBAC',             icon: 'bi bi-table',              route: '/permissions/rbac' },
        { label: 'Role Management',  icon: 'bi bi-person-badge-fill',  route: '/permissions/role-management' },
        { label: 'Route Management', icon: 'bi bi-signpost-2-fill',    route: '/permissions/route-management' },
      ]
    },
    {
      label: 'Users',
      icon: 'bi bi-people-fill',
      expanded: true,
      children: [
        { label: 'New Register', icon: 'bi bi-person-plus-fill', route: '/permissions/new-register' },
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
