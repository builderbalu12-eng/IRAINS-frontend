import { Component, OnInit, OnDestroy } from '@angular/core';
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
  isPinned = true;
  isHovered = false;
  currentRoute = '';

  get isExpanded(): boolean { return this.isPinned || this.isHovered; }

  menuItems: MenuItem[] = [
    { label: 'Dashboard',          icon: 'bi bi-speedometer2',       route: '/irains-dashboard' },
    { label: 'Station Management', icon: 'bi bi-geo-alt-fill',       route: '/admin-panel/station-management' },
    { label: 'Data Management',    icon: 'bi bi-database-fill-gear', route: '/data-management' },
    { label: 'Permissions',        icon: 'bi bi-shield-lock-fill',   route: '/permissions' },
    { label: 'System Health',      icon: 'bi bi-heart-pulse-fill',   route: '/spatial-table' },
  ];

  private routerSub: any;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.currentRoute = this.router.url;
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => { this.currentRoute = e.urlAfterRedirects; });
  }

  ngOnDestroy(): void { this.routerSub?.unsubscribe(); }

  onMouseEnter(): void { this.isHovered = true; }
  onMouseLeave(): void { this.isHovered = false; }
  togglePin(): void    { this.isPinned = !this.isPinned; }

  toggleSubmenu(item: MenuItem): void {
    if (item.children) item.expanded = !item.expanded;
  }
}
