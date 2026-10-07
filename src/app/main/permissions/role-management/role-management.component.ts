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

  save(): void {
    const name = String(this.form.value.name || '').trim();
    if (!name) {
      this.form.get('name')?.setErrors({ required: true });
      this.form.get('name')?.markAsTouched();
      return;
    }
    const description = String(this.form.value.description || '').trim();
    const active = !!this.form.value.active;
    if (this.isEditing && this.editing) {
      this.directory.saveRole({ ...this.editing, name, description, active });
    } else {
      this.directory.saveRole({
        id: this.directory.nextRoleId(),
        code: this.directory.uniqueCode(name),
        name,
        description,
        active,
        createdAt: new Date().toISOString().slice(0, 10)
      });
    }
    this.closeModal();
  }

  remove(role: RbacRole, event: Event): void {
    event.stopPropagation();
    const count = this.userCount(role);
    if (count > 0) {
      alert(`"${role.name}" is assigned to ${count} user${count === 1 ? '' : 's'}. Reassign them before deleting this role.`);
      return;
    }
    if (!confirm(`Delete role "${role.name}"?`)) return;
    const routes = this.routeAccess.getRoutes().map(route => ({
      ...route,
      allowedRoles: route.allowedRoles.filter(code => code !== role.code)
    }));
    this.routeAccess.saveRoutes(routes);
    this.directory.deleteRole(role.id);
  }

  closeModal(): void {
    this.showModal = false;
  }
}
