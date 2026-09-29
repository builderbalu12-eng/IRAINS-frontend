import { Component } from '@angular/core';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface Permission {
  module: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

interface RoleMatrix {
  role: string;
  code: string;
  color: string;
  hint: string;
  permissions: Permission[];
}

type ActionKey = 'view' | 'create' | 'edit' | 'delete';

@Component({
  selector: 'app-rbac',
  templateUrl: './rbac.component.html',
  styleUrls: ['./rbac.component.css']
})
export class RbacComponent {
  modules = ['Dashboard', 'Data Entry', 'Verification', 'Maps', 'Reports', 'Station Mgmt', 'Data Mgmt', 'Admin Panel', 'Email'];
  actions: { key: ActionKey; label: string; icon: string }[] = [
    { key: 'view', label: 'View', icon: 'bi-eye' },
    { key: 'create', label: 'Create', icon: 'bi-plus-square' },
    { key: 'edit', label: 'Edit', icon: 'bi-pencil-square' },
    { key: 'delete', label: 'Delete', icon: 'bi-trash' },
  ];
  searchText = '';
  lastCell = '';
  activeTab: 'permissions' | 'statistics' = 'permissions';
  exporting = false;
  reportGeneratedAt = new Date();

  roles: RoleMatrix[] = [
    {
      role: 'HQ Admin',
      code: 'hq',
      color: 'danger',
      hint: 'Headquarters — full control',
      permissions: this.modules.map(m => ({ module: m, view: true, create: true, edit: true, delete: true }))
    },
    {
      role: 'MC User',
      code: 'mc',
      color: 'primary',
      hint: 'Meteorological Centre',
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
      code: 'sp',
      color: 'success',
      hint: 'State / Special',
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
      code: 'public',
      color: 'secondary',
      hint: 'Public maps',
      permissions: this.modules.map((m, i) => ({
        module: m,
        view: i < 5,
        create: false,
        edit: false,
        delete: false
      }))
    }
  ];

  selectedRole: RoleMatrix | null = this.roles[0];
  saved = false;

  get heroSub(): string {
    return this.activeTab === 'statistics'
      ? 'IMD access intelligence — role coverage overview for Hydromet Division.'
      : 'Select a role, then grant or revoke View, Create, Edit, and Delete on each module.';
  }

  setTab(tab: 'permissions' | 'statistics'): void {
    this.activeTab = tab;
    if (tab === 'statistics') {
      this.reportGeneratedAt = new Date();
    }
  }

  selectRole(r: RoleMatrix) {
    this.selectedRole = r;
    this.saved = false;
  }

  savePermissions() {
    this.saved = true;
    setTimeout(() => this.saved = false, 3000);
  }

  viewCount(r: RoleMatrix): number {
    return r.permissions.filter(p => p.view).length;
  }

  actionCount(r: RoleMatrix, key: ActionKey): number {
    return r.permissions.filter(p => p[key]).length;
  }

  getPermissions(): Permission[] {
    const list = this.selectedRole ? this.selectedRole.permissions : [];
    const s = this.searchText.toLowerCase().trim();
    if (!s) return list;
    return list.filter(p => p.module.toLowerCase().includes(s));
  }

  iconFor(module: string): string {
    const m = module.toLowerCase();
    if (m.includes('dashboard')) return 'bi-speedometer2';
    if (m.includes('data entry')) return 'bi-pencil-square';
    if (m.includes('verif')) return 'bi-check2-square';
    if (m.includes('map')) return 'bi-map';
    if (m.includes('report')) return 'bi-file-earmark-bar-graph';
    if (m.includes('station')) return 'bi-broadcast-pin';
    if (m.includes('data mgmt')) return 'bi-database';
    if (m.includes('admin')) return 'bi-gear-wide-connected';
    if (m.includes('email')) return 'bi-envelope-paper';
    return 'bi-grid';
  }

  toggleAction(perm: Permission, key: ActionKey): void {
    if (key !== 'view' && !perm.view) return;
    perm[key] = !perm[key];
    if (key === 'view' && !perm.view) {
      perm.create = false;
      perm.edit = false;
      perm.delete = false;
    }
    this.lastCell = perm.module + key;
    this.saved = false;
  }

  grantAll(key: ActionKey): void {
    if (!this.selectedRole) return;
    for (const p of this.selectedRole.permissions) {
      if (key === 'view') p.view = true;
      else if (p.view) p[key] = true;
    }
    this.saved = false;
  }

  revokeWrites(): void {
    if (!this.selectedRole) return;
    for (const p of this.selectedRole.permissions) {
      p.create = false;
      p.edit = false;
      p.delete = false;
    }
    this.saved = false;
  }

  grantTotal(r: RoleMatrix): number {
    return this.actions.reduce((n, a) => n + this.actionCount(r, a.key), 0);
  }

  get maxGrantsPerRole(): number {
    return this.modules.length * this.actions.length;
  }

  get maxGrants(): number {
    return this.roles.length * this.maxGrantsPerRole;
  }

  get totalGrants(): number {
    return this.roles.reduce((n, r) => n + this.grantTotal(r), 0);
  }

  get grantShare(): number {
    if (!this.maxGrants) return 0;
    return Math.round((this.totalGrants / this.maxGrants) * 100);
  }

  coveragePct(r: RoleMatrix): number {
    if (!this.maxGrantsPerRole) return 0;
    return Math.round((this.grantTotal(r) / this.maxGrantsPerRole) * 100);
  }

  hasPerm(r: RoleMatrix, module: string, key: ActionKey): boolean {
    const p = r.permissions.find(x => x.module === module);
    return !!(p && p[key]);
  }

  private pad2(n: number): string {
    return n < 10 ? '0' + n : String(n);
  }

  private formatStamp(d: Date): { date: string; time: string; file: string; display: string } {
    const y = d.getFullYear();
    const m = this.pad2(d.getMonth() + 1);
    const day = this.pad2(d.getDate());
    const hh = this.pad2(d.getHours());
    const mm = this.pad2(d.getMinutes());
    const ss = this.pad2(d.getSeconds());
    return {
      date: `${y}-${m}-${day}`,
      time: `${hh}:${mm}:${ss}`,
      file: `${y}${m}${day}_${hh}${mm}${ss}`,
      display: `${day}-${m}-${y} ${hh}:${mm}`
    };
  }

  private yn(v: boolean): string {
    return v ? 'Yes' : 'No';
  }

  downloadExcel(): void {
    this.exporting = true;
    try {
      const now = new Date();
      const stamp = this.formatStamp(now);
      const wb = XLSX.utils.book_new();

      const summaryAoA: (string | number)[][] = [
        ['India Meteorological Department (IMD)'],
        ['Hydromet Division, New Delhi'],
        ['iRAINS — Role Based Access Control Report'],
        [],
        ['Generated on', stamp.display],
        ['Report date', stamp.date],
        ['Total roles', this.roles.length],
        ['Total modules', this.modules.length],
        ['Grants awarded', this.totalGrants],
        ['Possible grants', this.maxGrants],
        ['Overall coverage %', this.grantShare],
        [],
        ['Role', 'Description', 'Coverage %', 'View', 'Create', 'Edit', 'Delete', 'Total grants']
      ];
      for (const r of this.roles) {
        summaryAoA.push([
          r.role,
          r.hint,
          this.coveragePct(r),
          this.actionCount(r, 'view'),
          this.actionCount(r, 'create'),
          this.actionCount(r, 'edit'),
          this.actionCount(r, 'delete'),
          this.grantTotal(r)
        ]);
      }
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryAoA);
      summarySheet['!cols'] = [
        { wch: 14 }, { wch: 32 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 12 }
      ];
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

      const matrixHeader = ['Module', ...this.roles.flatMap(r =>
        this.actions.map(a => `${r.role} — ${a.label}`)
      )];
      const matrixAoA: (string | number)[][] = [
        ['IMD iRAINS — Module × Role permission matrix'],
        [`Generated: ${stamp.display}`],
        [],
        matrixHeader
      ];
      for (const m of this.modules) {
        const row: (string | number)[] = [m];
        for (const r of this.roles) {
          for (const a of this.actions) {
            row.push(this.yn(this.hasPerm(r, m, a.key)));
          }
        }
        matrixAoA.push(row);
      }
      const matrixSheet = XLSX.utils.aoa_to_sheet(matrixAoA);
      matrixSheet['!cols'] = [{ wch: 16 }, ...matrixHeader.slice(1).map(() => ({ wch: 16 }))];
      XLSX.utils.book_append_sheet(wb, matrixSheet, 'Module Matrix');

      for (const r of this.roles) {
        const roleAoA: (string | number)[][] = [
          [`Role: ${r.role}`],
          [r.hint],
          [`Generated: ${stamp.display}`],
          [],
          ['Module', 'View', 'Create', 'Edit', 'Delete']
        ];
        for (const p of r.permissions) {
          roleAoA.push([p.module, this.yn(p.view), this.yn(p.create), this.yn(p.edit), this.yn(p.delete)]);
        }
        const roleSheet = XLSX.utils.aoa_to_sheet(roleAoA);
        roleSheet['!cols'] = [{ wch: 16 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }];
        const sheetName = r.role.replace(/[\\/?*[\]]/g, '').slice(0, 28);
        XLSX.utils.book_append_sheet(wb, roleSheet, sheetName);
      }

      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
      });
      const filename = `IMD_RBAC_Access_Report_${stamp.file}.xlsx`;
      saveAs(blob, filename);
    } finally {
      this.exporting = false;
    }
  }
}
