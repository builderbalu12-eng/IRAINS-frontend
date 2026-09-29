import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

interface AppRoute {
  id: number;
  path: string;
  label: string;
  allowedRoles: string[];
  active: boolean;
}

interface RoleMeta {
  code: string;
  label: string;
  hint: string;
}

interface RouteGroup {
  name: string;
  items: AppRoute[];
}

@Component({
  selector: 'app-route-management',
  templateUrl: './route-management.component.html',
  styleUrls: ['./route-management.component.css']
})
export class RouteManagementComponent implements OnInit {
  searchText = '';
  showModal = false;
  isEditing = false;
  editingId: number | null = null;
  isSaving = false;
  form!: FormGroup;
  rolesInput = '';

  availableRoles = ['hq', 'mc', 'sp', 'public'];
  viewMode: 'lanes' | 'table' = 'lanes';
  roleFilter: string | null = null;
  statusFilter: 'all' | 'active' | 'off' = 'all';

  roleMeta: RoleMeta[] = [
    { code: 'hq', label: 'HQ', hint: 'Headquarters' },
    { code: 'mc', label: 'MC', hint: 'Meteorological Centre' },
    { code: 'sp', label: 'SP', hint: 'State / Special' },
    { code: 'public', label: 'Public', hint: 'Public maps' },
  ];

  appRoutes: AppRoute[] = [
    { id: 1,  path: '/irains-dashboard',         label: 'Dashboard',              allowedRoles: ['hq','mc','public','sp'], active: true },
    { id: 2,  path: '/data-entry',               label: 'Data Entry',             allowedRoles: ['hq','mc'],              active: true },
    { id: 3,  path: '/newverification',           label: 'Verification',           allowedRoles: ['hq','mc'],              active: true },
    { id: 4,  path: '/admin-panel',              label: 'Admin Panel',            allowedRoles: ['hq'],                   active: true },
    { id: 5,  path: '/data-management',          label: 'Data Management',        allowedRoles: ['hq'],                   active: true },
    { id: 6,  path: '/permissions',              label: 'Permissions',            allowedRoles: ['hq'],                   active: true },
    { id: 7,  path: '/new-email-dissemination',  label: 'Email Dissemination',    allowedRoles: ['hq','mc','sp'],         active: true },
    { id: 8,  path: '/station-statistics',       label: 'Station Statistics',     allowedRoles: ['hq','mc','sp'],         active: true },
    { id: 9,  path: '/spatial-table',            label: 'Spatial Table',          allowedRoles: ['hq','mc','public','sp'], active: true },
    { id: 10, path: '/monsoon-activity',         label: 'Monsoon Activity',       allowedRoles: ['hq','mc','public','sp'], active: true },
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.form = this.fb.group({
      path:  ['', Validators.required],
      label: ['', Validators.required],
      active: [true]
    });
  }

  get filtered(): AppRoute[] {
    const s = this.searchText.toLowerCase().trim();
    return this.appRoutes.filter(r => {
      const hay = `${r.path} ${r.label} ${r.allowedRoles.join(',')}`.toLowerCase();
      if (s && !hay.includes(s)) return false;
      if (this.roleFilter && !this.hasRole(r, this.roleFilter)) return false;
      if (this.statusFilter === 'active' && !r.active) return false;
      if (this.statusFilter === 'off' && r.active) return false;
      return true;
    });
  }

  get groupedRoutes(): RouteGroup[] {
    const buckets = new Map<string, AppRoute[]>();
    for (const r of this.filtered) {
      const name = this.groupOf(r.path);
      if (!buckets.has(name)) buckets.set(name, []);
      buckets.get(name)!.push(r);
    }
    return Array.from(buckets.entries()).map(([name, items]) => ({ name, items }));
  }

  get totalCount(): number {
    return this.appRoutes.length;
  }

  get activeCount(): number {
    return this.appRoutes.filter(r => r.active).length;
  }

  roleCoverage(role: string): number {
    if (!this.appRoutes.length) return 0;
    const n = this.appRoutes.filter(r => this.hasRole(r, role)).length;
    return Math.round((n / this.appRoutes.length) * 100);
  }

  roleCount(role: string): number {
    return this.appRoutes.filter(r => this.hasRole(r, role)).length;
  }

  coverage(route: AppRoute): number {
    return this.availableRoles.filter(role => this.hasRole(route, role)).length;
  }

  setRoleFilter(role: string | null): void {
    this.roleFilter = this.roleFilter === role ? null : role;
  }

  setStatusFilter(status: 'all' | 'active' | 'off'): void {
    this.statusFilter = status;
  }

  meta(role: string): RoleMeta {
    return this.roleMeta.find(r => r.code === role) || { code: role, label: role, hint: role };
  }

  iconFor(path: string): string {
    const p = path.toLowerCase();
    if (p.includes('dashboard')) return 'bi-speedometer2';
    if (p.includes('data-entry')) return 'bi-pencil-square';
    if (p.includes('verif')) return 'bi-check2-square';
    if (p.includes('admin')) return 'bi-gear-wide-connected';
    if (p.includes('data-management')) return 'bi-database';
    if (p.includes('permission')) return 'bi-shield-lock';
    if (p.includes('email')) return 'bi-envelope-paper';
    if (p.includes('station-stat')) return 'bi-bar-chart-line';
    if (p.includes('spatial')) return 'bi-grid-3x3-gap';
    if (p.includes('monsoon')) return 'bi-cloud-rain';
    if (p.includes('map')) return 'bi-map';
    return 'bi-signpost-2';
  }

  groupOf(path: string): string {
    const p = path.toLowerCase();
    if (p.includes('admin') || p.includes('data-management') || p.includes('permission')) {
      return 'Administration';
    }
    if (p.includes('data-entry') || p.includes('verif') || p.includes('dashboard')) {
      return 'Operations';
    }
    return 'Products';
  }

  openAdd() {
    this.isEditing = false;
    this.editingId = null;
    this.rolesInput = 'hq';
    this.form.reset({ active: true });
    this.showModal = true;
  }

  openEdit(r: AppRoute) {
    this.isEditing = true;
    this.editingId = r.id;
    this.rolesInput = r.allowedRoles.join(', ');
    this.form.patchValue(r);
    this.showModal = true;
  }

  save() {
    if (this.form.invalid) return;
    this.isSaving = true;
    const roles = this.parseRolesInput();
    setTimeout(() => {
      const v = { ...this.form.value, allowedRoles: roles };
      if (this.isEditing && this.editingId !== null) {
        const idx = this.appRoutes.findIndex(r => r.id === this.editingId);
        if (idx > -1) this.appRoutes[idx] = { ...this.appRoutes[idx], ...v };
      } else {
        this.appRoutes.push({ id: Date.now(), ...v });
      }
      this.isSaving = false;
      this.closeModal();
    }, 600);
  }

  delete(r: AppRoute) {
    if (!confirm(`Remove route "${r.path}"?`)) return;
    this.appRoutes = this.appRoutes.filter(x => x.id !== r.id);
  }

  closeModal() { this.showModal = false; }

  toggleRole(route: AppRoute, role: string) {
    const idx = route.allowedRoles.indexOf(role);
    if (idx > -1) route.allowedRoles.splice(idx, 1);
    else route.allowedRoles.push(role);
  }

  toggleActive(route: AppRoute) {
    route.active = !route.active;
  }

  hasRole(route: AppRoute, role: string): boolean {
    return route.allowedRoles.includes(role);
  }

  formHasRole(role: string): boolean {
    return this.parseRolesInput().includes(role);
  }

  toggleFormRole(role: string) {
    const roles = this.parseRolesInput();
    const idx = roles.indexOf(role);
    if (idx > -1) roles.splice(idx, 1);
    else roles.push(role);
    this.rolesInput = roles.join(', ');
  }

  private parseRolesInput(): string[] {
    return this.rolesInput
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);
  }
}
