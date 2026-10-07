import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { RbacDirectoryService, RbacRole, RbacUser } from 'src/app/services/permissions/rbac-directory.service';

interface RoleChip {
  code: string;
  name: string;
  active: boolean;
}

@Component({
  selector: 'app-new-register',
  templateUrl: './new-register.component.html',
  styleUrls: ['./new-register.component.css']
})
export class NewRegisterComponent implements OnInit, OnDestroy {
  users: RbacUser[] = [];
  roles: RbacRole[] = [];
  regions: string[] = [];
  searchText = '';
  districtFilter = 'all';
  page = 1;
  pageSize = 10;

  showModal = false;
  isEditing = false;
  editingUser: RbacUser | null = null;
  viewUser: RbacUser | null = null;
  pendingDelete: RbacUser | null = null;
  roleMode: 'assign' | 'remove' | null = null;
  roleTarget: RbacUser | null = null;
  pickedRoleCodes: string[] = [];
  formError = '';
  showPassword = false;
  form!: FormGroup;

  private sub = new Subscription();

  constructor(
    private fb: FormBuilder,
    private directory: RbacDirectoryService
  ) {}

  ngOnInit(): void {
    this.regions = this.directory.regions;
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', Validators.email],
      phone: [''],
      designation: [''],
      district: ['HQ'],
      roleCode: [''],
      password: [''],
      active: [true]
    });
    this.sub.add(this.directory.users$.subscribe(users => {
      this.users = users;
      this.refreshOpenUser();
    }));
    this.sub.add(this.directory.roles$.subscribe(roles => {
      this.roles = roles;
    }));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get filtered(): RbacUser[] {
    const q = this.searchText.toLowerCase().trim();
    return this.users.filter(user => {
      if (this.districtFilter !== 'all' && user.district !== this.districtFilter) return false;
      if (!q) return true;
      const roleNames = this.userRoles(user).map(r => r.name).join(' ');
      const hay = `${user.username} ${user.fullName} ${user.email} ${user.phone} ${user.district} ${user.designation} ${roleNames}`.toLowerCase();
      return hay.includes(q);
    });
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }

  get paged(): RbacUser[] {
    if (this.page > this.pageCount) this.page = this.pageCount;
    if (this.page < 1) this.page = 1;
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get rangeFrom(): number {
    if (!this.filtered.length) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  get rangeTo(): number {
    return Math.min(this.page * this.pageSize, this.filtered.length);
  }

  get visiblePages(): number[] {
    const total = this.pageCount;
    const end = Math.min(total, Math.max(this.page + 2, 5));
    const start = Math.max(1, end - 4);
    const pages: number[] = [];
    for (let i = start; i <= Math.min(total, start + 4); i += 1) pages.push(i);
    return pages;
  }

  get roleChoices(): RbacRole[] {
    if (!this.roleTarget) return [];
    if (this.roleMode === 'remove') {
      return this.roles.filter(role => this.roleTarget!.roleCodes.includes(role.code));
    }
    return this.roles.filter(role => role.active && !this.roleTarget!.roleCodes.includes(role.code));
  }

  userRoles(user: RbacUser): RoleChip[] {
    return user.roleCodes.map(code => {
      const role = this.directory.roleByCode(code);
      return { code, name: role?.name || code, active: !!role?.active };
    });
  }

  resetPage(): void {
    this.page = 1;
  }

  prev(): void {
    if (this.page > 1) this.page -= 1;
  }

  next(): void {
    if (this.page < this.pageCount) this.page += 1;
  }

  goToPage(page: number): void {
    this.page = page;
  }

  openAdd(): void {
    this.isEditing = false;
    this.editingUser = null;
    this.formError = '';
    this.showPassword = false;
    const first = this.roles.find(role => role.active)?.code || '';
    this.form.reset({
      username: '',
      fullName: '',
      email: '',
      phone: '',
      designation: '',
      district: 'HQ',
      roleCode: first,
      password: '',
      active: true
    });
    this.form.get('roleCode')?.setValidators(Validators.required);
    this.form.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    this.form.get('email')?.setValidators(Validators.email);
    this.form.get('roleCode')?.updateValueAndValidity();
    this.form.get('password')?.updateValueAndValidity();
    this.showModal = true;
  }

  openEdit(user: RbacUser): void {
    this.isEditing = true;
    this.editingUser = user;
    this.formError = '';
    this.showPassword = false;
    this.form.reset({
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      designation: user.designation,
      district: user.district || 'HQ',
      roleCode: '',
      password: '',
      active: user.active
    });
    this.form.get('roleCode')?.clearValidators();
    this.form.get('password')?.clearValidators();
    this.form.get('roleCode')?.updateValueAndValidity();
    this.form.get('password')?.updateValueAndValidity();
    this.showModal = true;
  }

  openView(user: RbacUser): void {
    this.viewUser = user;
  }

  askDelete(user: RbacUser): void {
    this.pendingDelete = user;
  }

  confirmDelete(): void {
    if (!this.pendingDelete) return;
    const id = this.pendingDelete.id;
    if (this.viewUser?.id === id) this.viewUser = null;
    this.directory.deleteUser(id);
    this.pendingDelete = null;
  }

  openRoleModal(user: RbacUser, mode: 'assign' | 'remove'): void {
    this.roleTarget = user;
    this.roleMode = mode;
    this.pickedRoleCodes = [];
  }

  isRolePicked(code: string): boolean {
    return this.pickedRoleCodes.includes(code);
  }

  toggleRolePick(code: string): void {
    this.pickedRoleCodes = this.isRolePicked(code)
      ? this.pickedRoleCodes.filter(item => item !== code)
      : [...this.pickedRoleCodes, code];
  }

  saveRolePicks(): void {
    if (!this.roleTarget || !this.pickedRoleCodes.length) return;
    const current = [...this.roleTarget.roleCodes];
    const roleCodes = this.roleMode === 'assign'
      ? Array.from(new Set([...current, ...this.pickedRoleCodes]))
      : current.filter(code => !this.pickedRoleCodes.includes(code));
    this.directory.saveUser({ ...this.roleTarget, roleCodes });
    this.closeRoleModal();
  }

  save(): void {
    const username = String(this.form.value.username || '').trim();
    const fullName = String(this.form.value.fullName || '').trim();
    const password = String(this.form.value.password || '');
    if (this.form.invalid || !username || !fullName) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.directory.usernameTaken(username, this.editingUser?.id)) {
      this.formError = 'That username is already in use.';
      return;
    }
    if (!this.isEditing && password.length < 8) {
      this.form.get('password')?.setErrors({ minlength: true });
      this.form.get('password')?.markAsTouched();
      return;
    }
    const roleCode = String(this.form.value.roleCode || '');
    if (!this.isEditing && !roleCode) {
      this.form.get('roleCode')?.setErrors({ required: true });
      this.form.get('roleCode')?.markAsTouched();
      return;
    }
    this.formError = '';
    const user: RbacUser = {
      id: this.isEditing && this.editingUser ? this.editingUser.id : this.directory.nextUserId(),
      username,
      fullName,
      email: String(this.form.value.email || '').trim(),
      phone: String(this.form.value.phone || '').trim(),
      designation: String(this.form.value.designation || '').trim(),
      district: String(this.form.value.district || ''),
      roleCodes: this.isEditing && this.editingUser ? [...this.editingUser.roleCodes] : [roleCode],
      active: !!this.form.value.active
    };
    this.directory.saveUser(user);
    this.closeModal();
  }

  closeModal(): void {
    this.showModal = false;
    this.formError = '';
    this.editingUser = null;
  }

  closeRoleModal(): void {
    this.roleMode = null;
    this.roleTarget = null;
    this.pickedRoleCodes = [];
  }

  private refreshOpenUser(): void {
    if (this.viewUser) {
      this.viewUser = this.users.find(user => user.id === this.viewUser!.id) || null;
    }
    if (this.roleTarget) {
      this.roleTarget = this.users.find(user => user.id === this.roleTarget!.id) || null;
      if (!this.roleTarget) this.closeRoleModal();
    }
    if (this.editingUser) {
      this.editingUser = this.users.find(user => user.id === this.editingUser!.id) || this.editingUser;
    }
  }
}
