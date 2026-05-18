import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

interface AppRoute {
  id: number;
  path: string;
  label: string;
  allowedRoles: string[];
  active: boolean;
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
    const s = this.searchText.toLowerCase();
    return this.appRoutes.filter(r =>
      r.path.toLowerCase().includes(s) ||
      r.label.toLowerCase().includes(s) ||
      r.allowedRoles.join(',').includes(s)
    );
  }

  openAdd() {
    this.isEditing = false;
    this.editingId = null;
    this.rolesInput = '';
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
    const roles = this.rolesInput.split(',').map(s => s.trim()).filter(Boolean);
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

  hasRole(route: AppRoute, role: string): boolean {
    return route.allowedRoles.includes(role);
  }
}
