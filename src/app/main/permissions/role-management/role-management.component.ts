import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

interface Role {
  id: number;
  name: string;
  code: string;
  description: string;
  userCount: number;
  active: boolean;
}

@Component({
  selector: 'app-role-management',
  templateUrl: './role-management.component.html',
  styleUrls: ['./role-management.component.css']
})
export class RoleManagementComponent implements OnInit {
  searchText = '';
  showModal = false;
  isEditing = false;
  editingId: number | null = null;
  isSaving = false;
  form!: FormGroup;

  roles: Role[] = [
    { id: 1, code: 'hq',     name: 'HQ Admin',  description: 'Full access — headquarters admin', userCount: 5,  active: true },
    { id: 2, code: 'mc',     name: 'MC User',   description: 'Meteorological centre user',       userCount: 24, active: true },
    { id: 3, code: 'sp',     name: 'SP User',   description: 'State portal user',                userCount: 38, active: true },
    { id: 4, code: 'public', name: 'Public',    description: 'Read-only public access',          userCount: 0,  active: true },
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.form = this.fb.group({
      code:        ['', Validators.required],
      name:        ['', Validators.required],
      description: [''],
      active:      [true]
    });
  }

  get filtered(): Role[] {
    const s = this.searchText.toLowerCase();
    return this.roles.filter(r => r.name.toLowerCase().includes(s) || r.code.toLowerCase().includes(s));
  }

  openAdd() { this.isEditing = false; this.editingId = null; this.form.reset({ active: true }); this.showModal = true; }

  openEdit(r: Role) { this.isEditing = true; this.editingId = r.id; this.form.patchValue(r); this.showModal = true; }

  save() {
    if (this.form.invalid) return;
    this.isSaving = true;
    setTimeout(() => {
      const v = this.form.value;
      if (this.isEditing && this.editingId !== null) {
        const idx = this.roles.findIndex(r => r.id === this.editingId);
        if (idx > -1) this.roles[idx] = { ...this.roles[idx], ...v };
      } else {
        this.roles.push({ id: Date.now(), userCount: 0, ...v });
      }
      this.isSaving = false;
      this.closeModal();
    }, 600);
  }

  delete(r: Role) {
    if (!confirm(`Delete role "${r.name}"?`)) return;
    this.roles = this.roles.filter(x => x.id !== r.id);
  }

  closeModal() { this.showModal = false; }
}
