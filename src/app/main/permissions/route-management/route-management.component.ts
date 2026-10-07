import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ManagedAppRoute, RouteAccessService } from 'src/app/services/permissions/route-access.service';

@Component({
  selector: 'app-route-management',
  templateUrl: './route-management.component.html',
  styleUrls: ['./route-management.component.css']
})
export class RouteManagementComponent implements OnInit, OnDestroy {
  routes: ManagedAppRoute[] = [];
  showModal = false;
  isEditing = false;
  editingId: number | null = null;
  form!: FormGroup;
  pathError = '';
  private sub = new Subscription();

  constructor(
    private fb: FormBuilder,
    private routeAccess: RouteAccessService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      label: ['', Validators.required],
      path: ['', Validators.required],
      active: [true]
    });
    this.sub.add(this.routeAccess.routes$.subscribe(routes => {
      this.routes = [...routes].sort((a, b) => a.id - b.id);
    }));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  openAdd(): void {
    this.isEditing = false;
    this.editingId = null;
    this.pathError = '';
    this.form.reset({ label: '', path: '', active: true });
    this.showModal = true;
  }

  openEdit(route: ManagedAppRoute): void {
    this.isEditing = true;
    this.editingId = route.id;
    this.pathError = '';
    this.form.reset({ label: route.label, path: route.path, active: route.active });
    this.showModal = true;
  }

  save(): void {
    const label = String(this.form.value.label || '').trim();
    const path = this.routeAccess.normalizePath(String(this.form.value.path || '').trim());
    if (!label || !this.form.value.path || path === '/') {
      this.form.markAllAsTouched();
      if (!label) this.form.get('label')?.setErrors({ required: true });
      if (path === '/') this.form.get('path')?.setErrors({ required: true });
      return;
    }
    const duplicate = this.routes.some(r => r.path === path && r.id !== this.editingId);
    if (duplicate) {
      this.pathError = 'A route with this path already exists.';
      return;
    }
    this.pathError = '';
    const active = !!this.form.value.active;
    const next = this.routes.map(r => ({ ...r, allowedRoles: [...r.allowedRoles] }));
    if (this.isEditing && this.editingId !== null) {
      const idx = next.findIndex(r => r.id === this.editingId);
      if (idx > -1) next[idx] = { ...next[idx], label, path, active };
    } else {
      const id = next.reduce((max, r) => Math.max(max, r.id), 0) + 1;
      next.push({ id, label, path, active, allowedRoles: [] });
    }
    this.routeAccess.saveRoutes(next);
    this.closeModal();
  }

  remove(route: ManagedAppRoute): void {
    if (!confirm(`Remove route "${route.label}"?`)) return;
    this.routeAccess.saveRoutes(this.routes.filter(r => r.id !== route.id));
  }

  closeModal(): void {
    this.showModal = false;
    this.pathError = '';
  }
}
