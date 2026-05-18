import { Component } from '@angular/core';

interface Permission {
  module: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

interface RoleMatrix {
  role: string;
  color: string;
  permissions: Permission[];
}

@Component({
  selector: 'app-rbac',
  templateUrl: './rbac.component.html',
  styleUrls: ['./rbac.component.css']
})
export class RbacComponent {
  modules = ['Dashboard', 'Data Entry', 'Verification', 'Maps', 'Reports', 'Station Mgmt', 'Data Mgmt', 'Admin Panel', 'Email'];

  roles: RoleMatrix[] = [
    {
      role: 'HQ Admin',
      color: 'danger',
      permissions: this.modules.map(m => ({ module: m, view: true, create: true, edit: true, delete: true }))
    },
    {
      role: 'MC User',
      color: 'primary',
      permissions: this.modules.map((m, i) => ({
        module: m,
        view: true,
        create: i < 4,
        edit: i < 3,
        delete: false
      }))
    },
    {
      role: 'SP User',
      color: 'success',
      permissions: this.modules.map((m, i) => ({
        module: m,
        view: true,
        create: i < 2,
        edit: i < 1,
        delete: false
      }))
    },
    {
      role: 'Public',
      color: 'secondary',
      permissions: this.modules.map((m, i) => ({
        module: m,
        view: i < 5,
        create: false,
        edit: false,
        delete: false
      }))
    }
  ];

  selectedRole: RoleMatrix | null = null;
  saved = false;

  selectRole(r: RoleMatrix) {
    this.selectedRole = r;
    this.saved = false;
  }

  savePermissions() {
    this.saved = true;
    setTimeout(() => this.saved = false, 3000);
  }

  hasFullAccess(r: RoleMatrix): boolean {
    return r.permissions.every(p => p.view && p.create && p.edit && p.delete);
  }

  viewCount(r: RoleMatrix): number {
    let count = 0;
    for (const p of r.permissions) { if (p.view) count++; }
    return count;
  }

  getPermissions(): Permission[] {
    return this.selectedRole ? this.selectedRole.permissions : [];
  }

  getSelectedColor(): string {
    return this.selectedRole ? this.selectedRole.color : '';
  }

  getSelectedRole(): string {
    return this.selectedRole ? this.selectedRole.role : '';
  }
}
