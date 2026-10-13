import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { environment } from 'src/environment/environment';

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
  loginUserid?: string | null;
}

interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  message?: string;
}

interface ApiItemResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

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

  private readonly baseUrl = `${environment.baseUrl}/api/v1/rbac`;
  private readonly rolesSubject = new BehaviorSubject<RbacRole[]>([]);
  private readonly usersSubject = new BehaviorSubject<RbacUser[]>([]);
  private loadPromise: Promise<void> | null = null;

  readonly roles$: Observable<RbacRole[]> = this.rolesSubject.asObservable();
  readonly users$: Observable<RbacUser[]> = this.usersSubject.asObservable();

  constructor(private http: HttpClient) {
    void this.ensureLoaded();
  }

  get roles(): RbacRole[] {
    return this.rolesSubject.value;
  }

  get users(): RbacUser[] {
    return this.usersSubject.value;
  }

  ensureLoaded(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = this.refreshAll().catch((err) => {
        this.loadPromise = null;
        throw err;
      });
    }
    return this.loadPromise;
  }

  async refreshAll(): Promise<void> {
    await Promise.all([this.refreshRoles(), this.refreshUsers()]);
  }

  async refreshRoles(): Promise<RbacRole[]> {
    const res = await firstValueFrom(
      this.http.get<ApiListResponse<RbacRole>>(`${this.baseUrl}/roles`)
    );
    const roles = (res?.data || []).map((row) => this.mapRole(row)).filter((r) => r.id && r.code);
    this.rolesSubject.next(roles);
    return roles;
  }

  async refreshUsers(): Promise<RbacUser[]> {
    const res = await firstValueFrom(
      this.http.get<ApiListResponse<RbacUser>>(`${this.baseUrl}/users`)
    );
    const users = (res?.data || []).map((row) => this.mapUser(row)).filter((u) => u.id && u.username);
    this.usersSubject.next(users);
    return users;
  }

  userCount(roleCode: string): number {
    return this.users.filter((u) => u.roleCodes.includes(roleCode)).length;
  }

  roleByCode(code: string): RbacRole | undefined {
    return this.roles.find((r) => r.code === code);
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
    while (this.roles.some((r) => r.code === code)) {
      code = `${base.slice(0, 20)}${n}`;
      n += 1;
    }
    return code;
  }

  async saveRole(role: Partial<RbacRole> & { name: string }): Promise<RbacRole> {
    await this.ensureLoaded();
    if (role.id && this.roles.some((r) => r.id === role.id)) {
      const res = await firstValueFrom(
        this.http.put<ApiItemResponse<RbacRole>>(`${this.baseUrl}/roles/${role.id}`, {
          name: role.name,
          description: role.description || '',
          active: role.active !== false,
        })
      );
      await this.refreshRoles();
      return this.mapRole(res.data);
    }

    const res = await firstValueFrom(
      this.http.post<ApiItemResponse<RbacRole>>(`${this.baseUrl}/roles`, {
        name: role.name,
        description: role.description || '',
        active: role.active !== false,
        code: role.code,
      })
    );
    await this.refreshRoles();
    return this.mapRole(res.data);
  }

  async deleteRole(id: number): Promise<void> {
    await firstValueFrom(this.http.delete<ApiItemResponse<unknown>>(`${this.baseUrl}/roles/${id}`));
    await this.refreshRoles();
  }

  async saveUser(
    user: Partial<RbacUser> & { username: string; fullName: string },
    options: { password?: string; roleCode?: string } = {}
  ): Promise<RbacUser> {
    await this.ensureLoaded();
    const payload: Record<string, unknown> = {
      username: user.username,
      fullName: user.fullName,
      email: user.email || '',
      phone: user.phone || '',
      designation: user.designation || '',
      district: user.district || 'HQ',
      active: user.active !== false,
    };

    if (user.roleCodes?.length) payload['roleCodes'] = user.roleCodes;
    if (options.roleCode) payload['roleCode'] = options.roleCode;
    if (options.password) payload['password'] = options.password;

    if (user.id && this.users.some((u) => u.id === user.id)) {
      const res = await firstValueFrom(
        this.http.put<ApiItemResponse<RbacUser>>(`${this.baseUrl}/users/${user.id}`, payload)
      );
      await this.refreshUsers();
      return this.mapUser(res.data);
    }

    if (!options.password && !payload['password']) {
      throw new Error('Password is required when creating a user.');
    }
    if (!options.roleCode && !(user.roleCodes && user.roleCodes.length)) {
      throw new Error('A role is required when creating a user.');
    }

    const res = await firstValueFrom(
      this.http.post<ApiItemResponse<RbacUser>>(`${this.baseUrl}/users`, payload)
    );
    await this.refreshUsers();
    return this.mapUser(res.data);
  }

  async deleteUser(id: number): Promise<void> {
    await firstValueFrom(this.http.delete<ApiItemResponse<unknown>>(`${this.baseUrl}/users/${id}`));
    await this.refreshUsers();
  }

  async setUserRoles(userId: number, roleCodes: string[]): Promise<RbacUser> {
    const res = await firstValueFrom(
      this.http.put<ApiItemResponse<RbacUser>>(`${this.baseUrl}/users/${userId}/roles`, { roleCodes })
    );
    await this.refreshUsers();
    return this.mapUser(res.data);
  }

  usernameTaken(username: string, ignoreId?: number): boolean {
    const key = username.trim().toLowerCase();
    return this.users.some((u) => u.username.toLowerCase() === key && u.id !== ignoreId);
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

  private mapRole(row: any): RbacRole {
    return {
      id: Number(row.id) || 0,
      code: String(row.code || '').toLowerCase().trim(),
      name: String(row.name || 'Role'),
      description: String(row.description || ''),
      active: row.active !== false,
      createdAt: String(row.createdAt || row.created_at || new Date().toISOString()).slice(0, 10),
    };
  }

  private mapUser(row: any): RbacUser {
    const fromList = Array.isArray(row.roleCodes) ? row.roleCodes : [];
    const fromOne = row.roleCode ? [row.roleCode] : [];
    const roleCodes = Array.from(
      new Set(
        [...fromList, ...fromOne]
          .map((code) => String(code || '').toLowerCase().trim())
          .filter(Boolean)
      )
    );
    return {
      id: Number(row.id) || 0,
      username: String(row.username || '').trim(),
      fullName: String(row.fullName || row.full_name || ''),
      email: String(row.email || ''),
      phone: String(row.phone || ''),
      designation: String(row.designation || ''),
      district: String(row.district || ''),
      roleCodes,
      active: row.active !== false,
      loginUserid: row.loginUserid ?? row.login_userid ?? null,
    };
  }
}
