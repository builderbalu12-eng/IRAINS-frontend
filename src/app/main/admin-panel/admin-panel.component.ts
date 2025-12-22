// src/app/main/admin-panel/admin-panel.component.ts
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  expanded?: boolean;
}

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  sidebarHeight = 600;
  currentRoute = '';

  menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'bi bi-speedometer2', route: '/irains-dashboard' },
    { label: 'Station Management', icon: 'bi bi-geo-alt-fill', route: '/admin-panel/station-management' },
    { label: 'Master Data', icon: 'bi bi-building', expanded: false, children: [
      { label: 'Location Master', icon: 'bi bi-map', route: '/admin/location-master' },
      { label: 'Block Codes', icon: 'bi bi-grid-3x3-gap', route: '/admin/blocks' }
    ]},
    { label: 'Reports', icon: 'bi bi-file-earmark-bar-graph', route: '/admin/reports' },
    { label: 'System Health', icon: 'bi bi-heart-pulse-fill', route: '/spatial-table' },
    { label: 'User Management', icon: 'bi bi-people-fill', route: '/admin/users' },
    { label: 'Settings', icon: 'bi bi-gear-fill', route: '/admin/settings' }
  ];

  private routerEvents$!: any;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.updateSidebarHeight();
    this.routerEvents$ = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        this.currentRoute = e.urlAfterRedirects;
      });
    this.currentRoute = this.router.url;
  }

  ngOnDestroy(): void {
    this.routerEvents$?.unsubscribe();
  }

  @HostListener('window:resize')
  updateSidebarHeight() {
    this.sidebarHeight = window.innerHeight - 80; // 80px = your header height
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  toggleSubmenu(item: MenuItem) {
    if (item.children) {
      item.expanded = !item.expanded;
    }
  }

  isActive(route: string): boolean {
    return this.currentRoute.startsWith(route);
  }

  hasActiveChild(item: MenuItem): boolean {
    return item.children?.some(child => child.route && this.isActive(child.route)) || false;
  }
}