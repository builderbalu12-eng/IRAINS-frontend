import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { RbacDirectoryService, RbacRole } from 'src/app/services/permissions/rbac-directory.service';
import { ManagedAppRoute, RouteAccessService } from 'src/app/services/permissions/route-access.service';

@Component({
  selector: 'app-rbac',
  templateUrl: './rbac.component.html',
  styleUrls: ['./rbac.component.css']
})
export class RbacComponent implements OnInit, OnDestroy {
  roles: RbacRole[] = [];
  routes: ManagedAppRoute[] = [];
  selected: RbacRole | null = null;
  roleQuery = '';
  assignedQuery = '';
  availableQuery = '';
  globalView = false;
  globalQuery = '';
  showAssign = false;
  assignQuery = '';
  pickedIds: number[] = [];

  private sub = new Subscription();

  constructor(
    private directory: RbacDirectoryService,
    private routeAccess: RouteAccessService
  ) {}

  ngOnInit(): void {
    this.sub.add(this.directory.roles$.subscribe(roles => {
      this.roles = roles;
      if (this.selected) {
        this.selected = roles.find(r => r.id === this.selected!.id) || null;
      }
    }));
    this.sub.add(this.routeAccess.routes$.subscribe(routes => {
      this.routes = [...routes]
        .map(r => ({ ...r, allowedRoles: [...r.allowedRoles] }))
        .sort((a, b) => a.id - b.id);
    }));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get visibleRoles(): RbacRole[] {
    const q = this.roleQuery.toLowerCase().trim();
    if (!q) return this.roles;
    return this.roles.filter(r =>
      r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
    );
  }

  get assigned(): ManagedAppRoute[] {
    if (!this.selected) return [];
    return this.filterRoutes(this.routes.filter(r => this.hasRole(r)), this.assignedQuery);
  }

  get available(): ManagedAppRoute[] {
    if (!this.selected) return [];
    return this.filterRoutes(this.routes.filter(r => !this.hasRole(r)), this.availableQuery);
  }

  get assignChoices(): ManagedAppRoute[] {
    if (!this.selected) return [];
    return this.filterRoutes(this.routes.filter(r => !this.hasRole(r)), this.assignQuery);
  }

  get mappings(): { roleName: string; routeName: string; path: string }[] {
    const q = this.globalQuery.toLowerCase().trim();
    const rows: { roleName: string; routeName: string; path: string }[] = [];
    for (const role of this.roles) {
      for (const route of this.routes) {
        if (!this.hasRole(route, role)) continue;
        const row = { roleName: role.name, routeName: route.label, path: route.path };
        const hay = `${row.roleName} ${row.routeName} ${row.path}`.toLowerCase();
        if (!q || hay.includes(q)) rows.push(row);
      }
    }
    return rows;
  }

  selectRole(role: RbacRole): void {
    this.selected = role;
    this.globalView = false;
    this.assignedQuery = '';
    this.availableQuery = '';
  }

  hasRole(route: ManagedAppRoute, role?: RbacRole | null): boolean {
    const target = role === undefined ? this.selected : role;
    if (!target) return false;
    return route.allowedRoles.map(c => c.toLowerCase()).includes(target.code);
  }

  formatDate(iso: string): string {
    return this.directory.formatDate(iso);
  }

  assign(route: ManagedAppRoute): void {
    this.assignIds([route.id]);
  }

  assignPicked(): void {
    this.assignIds(this.pickedIds);
    this.closeAssign();
  }

  remove(route: ManagedAppRoute): void {
    if (!this.selected) return;
    const code = this.selected.code;
    this.routeAccess.saveRoutes(this.routes.map(r => (
      r.id === route.id
        ? { ...r, allowedRoles: r.allowedRoles.filter(c => c !== code) }
        : r
    )));
  }

  removeAll(): void {
    if (!this.selected) return;
    if (!this.assigned.length) return;
    if (!confirm(`Remove all routes from "${this.selected.name}"?`)) return;
    const code = this.selected.code;
    this.routeAccess.saveRoutes(this.routes.map(r => ({
      ...r,
      allowedRoles: r.allowedRoles.filter(c => c !== code)
    })));
  }

  openAssign(): void {
    this.assignQuery = '';
    this.pickedIds = [];
    this.showAssign = true;
  }

  closeAssign(): void {
    this.showAssign = false;
    this.pickedIds = [];
  }

  isPicked(id: number): boolean {
    return this.pickedIds.includes(id);
  }

  togglePick(id: number): void {
    this.pickedIds = this.isPicked(id)
      ? this.pickedIds.filter(x => x !== id)
      : [...this.pickedIds, id];
  }

  selectAllVisible(): void {
    const ids = new Set(this.pickedIds);
    for (const route of this.assignChoices) ids.add(route.id);
    this.pickedIds = Array.from(ids);
  }

  deselectAll(): void {
    this.pickedIds = [];
  }

  private assignIds(ids: number[]): void {
    if (!this.selected || !ids.length) return;
    const code = this.selected.code;
    this.routeAccess.saveRoutes(this.routes.map(r => {
      if (!ids.includes(r.id) || r.allowedRoles.includes(code)) return r;
      return { ...r, allowedRoles: [...r.allowedRoles, code] };
    }));
  }

  private filterRoutes(list: ManagedAppRoute[], query: string): ManagedAppRoute[] {
    const q = query.toLowerCase().trim();
    if (!q) return list;
    return list.filter(r => `${r.label} ${r.path}`.toLowerCase().includes(q));
  }
}
