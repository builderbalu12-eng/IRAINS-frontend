import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface RbacRole {
  id: number;
  code: string;
  name: string;
  description: string;
  active: boolean;
  createdAt: string;
}

export interface RbacUser {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  district: string;
  roleCodes: string[];
  active: boolean;
}

const ROLES_KEY = 'irains_rbac_roles_v1';
const USERS_KEY = 'irains_rbac_users_v1';

@Injectable({ providedIn: 'root' })
export class RbacDirectoryService {
  readonly regions = [
    'HQ',
    'North West',
    'North East',
    'Central India',
    'South Peninsular',
    'East & North East',
  ];

  private readonly rolesSubject = new BehaviorSubject<RbacRole[]>(this.loadRoles());
  private readonly usersSubject = new BehaviorSubject<RbacUser[]>(this.loadUsers());

  readonly roles$: Observable<RbacRole[]> = this.rolesSubject.asObservable();
  readonly users$: Observable<RbacUser[]> = this.usersSubject.asObservable();

  get roles(): RbacRole[] {
    return this.rolesSubject.value;
  }

  get users(): RbacUser[] {
    return this.usersSubject.value;
  }

  userCount(roleCode: string): number {
    return this.users.filter(u => u.roleCodes.includes(roleCode)).length;
  }

  roleByCode(code: string): RbacRole | undefined {
    return this.roles.find(r => r.code === code);
  }

  nextRoleId(): number {
    return this.roles.reduce((max, r) => Math.max(max, r.id), 0) + 1;
  }

  nextUserId(): number {
    return this.users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
  }

  uniqueCode(name: string): string {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24) || 'role';
    let code = base;
    let n = 2;
    while (this.roles.some(r => r.code === code)) {
      code = `${base.slice(0, 20)}${n}`;
      n += 1;
    }
    return code;
  }

  saveRole(role: RbacRole): void {
    const list = this.roles.map(r => ({ ...r }));
    const idx = list.findIndex(r => r.id === role.id);
    if (idx > -1) list[idx] = { ...role };
    else list.push({ ...role });
    this.persistRoles(list);
  }

  deleteRole(id: number): void {
    this.persistRoles(this.roles.filter(r => r.id !== id));
  }

  saveUser(user: RbacUser): void {
    const list = this.users.map(u => ({ ...u }));
    const idx = list.findIndex(u => u.id === user.id);
    if (idx > -1) list[idx] = { ...user };
    else list.push({ ...user });
    this.persistUsers(list);
  }

  deleteUser(id: number): void {
    this.persistUsers(this.users.filter(u => u.id !== id));
  }

  usernameTaken(username: string, ignoreId?: number): boolean {
    const key = username.trim().toLowerCase();
    return this.users.some(u => u.username.toLowerCase() === key && u.id !== ignoreId);
  }

  formatDate(iso: string): string {
    const [y, m, d] = (iso || '').slice(0, 10).split('-').map(Number);
    if (!y || !m || !d) return '';
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  private persistRoles(roles: RbacRole[]): void {
    localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
    this.rolesSubject.next(roles);
  }

  private persistUsers(users: RbacUser[]): void {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    this.usersSubject.next(users);
  }

  private loadRoles(): RbacRole[] {
    return this.readList<RbacRole>(ROLES_KEY, seedRoles(), row => ({
      id: Number(row.id) || 0,
      code: String(row.code || '').toLowerCase().trim(),
      name: String(row.name || 'Role'),
      description: String(row.description || ''),
      active: row.active !== false,
      createdAt: String(row.createdAt || new Date().toISOString()),
    })).filter(r => r.id && r.code);
  }

  private loadUsers(): RbacUser[] {
    return this.readList<RbacUser>(USERS_KEY, seedUsers(), row => ({
      id: Number(row.id) || 0,
      username: String(row.username || '').trim(),
      fullName: String(row.fullName || ''),
      email: String(row.email || ''),
      phone: String(row.phone || ''),
      designation: String(row.designation || ''),
      district: String(row.district || ''),
      roleCodes: this.readRoleCodes(row),
      active: row.active !== false,
    })).filter(u => u.id && u.username);
  }

  private readRoleCodes(row: any): string[] {
    const fromList = Array.isArray(row.roleCodes) ? row.roleCodes : [];
    const fromOne = row.roleCode ? [row.roleCode] : [];
    const codes = [...fromList, ...fromOne]
      .map(code => String(code || '').toLowerCase().trim())
      .filter(Boolean);
    return Array.from(new Set(codes));
  }

  private readList<T>(key: string, fallback: T[], map: (row: any) => T): T[] {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return fallback;
      return parsed.map(map);
    } catch {
      return fallback;
    }
  }
}

function seedRoles(): RbacRole[] {
  return [
    { id: 1, code: 'hq', name: 'HQ Admin', description: 'Full access — headquarters', active: true, createdAt: '2025-12-29' },
    { id: 2, code: 'mc', name: 'MC User', description: 'Meteorological Centre pages', active: true, createdAt: '2026-06-11' },
    { id: 3, code: 'sp', name: 'SP User', description: 'State and special portal pages', active: true, createdAt: '2026-06-11' },
    { id: 4, code: 'public', name: 'Public', description: 'Read-only public maps and reports', active: true, createdAt: '2025-12-30' },
  ];
}

function seedUsers(): RbacUser[] {
  return [
    { id: 1, username: 'hq.admin', fullName: 'IMD HQ Admin', email: 'hq.admin@imd.gov.in', phone: '', designation: 'Headquarters', district: 'HQ', roleCodes: ['hq'], active: true },
    { id: 2, username: 'mc.delhi', fullName: 'MC Delhi', email: 'mc.delhi@imd.gov.in', phone: '', designation: 'Meteorologist', district: 'North West', roleCodes: ['mc'], active: true },
    { id: 3, username: 'mc.chennai', fullName: 'MC Chennai', email: 'mc.chennai@imd.gov.in', phone: '', designation: 'Meteorologist', district: 'South Peninsular', roleCodes: ['mc', 'sp'], active: true },
    { id: 4, username: 'sp.user', fullName: 'SP North West', email: 'sp.nw@imd.gov.in', phone: '', designation: 'State portal', district: 'North West', roleCodes: ['sp'], active: true },
    { id: 5, username: 'public.viewer', fullName: 'Public Viewer', email: 'public@imd.gov.in', phone: '', designation: 'Public access', district: 'HQ', roleCodes: ['public'], active: true },
  ];
}
