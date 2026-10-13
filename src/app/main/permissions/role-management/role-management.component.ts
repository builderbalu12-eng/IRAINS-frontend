import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { RbacDirectoryService, RbacRole } from 'src/app/services/permissions/rbac-directory.service';
import { RouteAccessService } from 'src/app/services/permissions/route-access.service';

@Component({
  selector: 'app-role-management',
  templateUrl: './role-management.component.html',
  styleUrls: ['./role-management.component.css']
})
export class RoleManagementComponent implements OnInit, OnDestroy {
  roles: RbacRole[] = [];
  showModal = false;
  isEditing = false;
  editing: RbacRole | null = null;
  form!: FormGroup;
  private sub = new Subscription();

  constructor(
    private fb: FormBuilder,
    private directory: RbacDirectoryService,
    private routeAccess: RouteAccessService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      active: [true]
    });
    void this.directory.ensureLoaded().catch((err) => {
      console.error('Failed to load roles', err);
    });
    this.sub.add(this.directory.roles$.subscribe(roles => {
      this.roles = roles;
    }));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  userCount(role: RbacRole): number {
    return this.directory.userCount(role.code);
  }

  openAdd(): void {
    this.isEditing = false;
    this.editing = null;
    this.form.reset({ name: '', description: '', active: true });
    this.showModal = true;
  }

  openEdit(role: RbacRole): void {
    this.isEditing = true;
    this.editing = role;
    this.form.reset({
      name: role.name,
      description: role.description,
      active: role.active
    });
    this.showModal = true;
  }

  async save(): Promise<void> {
    const name = String(this.form.value.name || '').trim();
    if (!name) {
      this.form.get('name')?.setErrors({ required: true });
      this.form.get('name')?.markAsTouched();
      return;
    }
    const description = String(this.form.value.description || '').trim();
    const active = !!this.form.value.active;
    try {
      if (this.isEditing && this.editing) {
        await this.directory.saveRole({ ...this.editing, name, description, active });
      } else {
        await this.directory.saveRole({
          code: this.directory.uniqueCode(name),
          name,
          description,
          active,
        });
      }
      this.closeModal();
    } catch (err: any) {
      alert(err?.error?.message || err?.message || 'Failed to save role.');
    }
  }

  async remove(role: RbacRole, event: Event): Promise<void> {
    event.stopPropagation();
    const count = this.userCount(role);
    if (count > 0) {
      alert(`"${role.name}" is assigned to ${count} user${count === 1 ? '' : 's'}. Reassign them before deleting this role.`);
      return;
    }
    if (!confirm(`Delete role "${role.name}"?`)) return;
    try {
      const routes = this.routeAccess.getRoutes().map(route => ({
        ...route,
        allowedRoles: route.allowedRoles.filter(code => code !== role.code)
      }));
      await this.routeAccess.saveRoutes(routes);
      await this.directory.deleteRole(role.id);
    } catch (err: any) {
      alert(err?.error?.message || err?.message || 'Failed to delete role.');
    }
  }

  closeModal(): void {
    this.showModal = false;
  }
}
