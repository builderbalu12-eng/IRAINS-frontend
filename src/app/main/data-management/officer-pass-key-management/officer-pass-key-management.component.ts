import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  OfficerPassKey,
  OfficerPassKeyService,
} from 'src/app/services/officer-pass-key.service';

@Component({
  selector: 'app-officer-pass-key-management',
  templateUrl: './officer-pass-key-management.component.html',
  styleUrls: ['./officer-pass-key-management.component.css'],
})
export class OfficerPassKeyManagementComponent implements OnInit {
  officers: OfficerPassKey[] = [];
  total = 0;
  limit = 50;
  offset = 0;
  searchText = '';
  activeFilter: '' | 'true' | 'false' = '';
  isLoading = false;
  loadError = '';
  actionError = '';
  actionSuccess = '';
  pendingNotice = false;
  revealedKey = '';
  revealedName = '';
  busyId: number | null = null;

  showModal = false;
  isEditing = false;
  editingId: number | null = null;
  isSaving = false;
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private passKeys: OfficerPassKeyService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      emp_name: ['', Validators.required],
      emp_designation: ['', Validators.required],
      emp_phone_number: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      emp_email: ['', Validators.email],
    });
    this.load();
  }

  get page(): number {
    return Math.floor(this.offset / this.limit) + 1;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.limit));
  }

  load(resetOffset = false): void {
    if (resetOffset) this.offset = 0;
    this.isLoading = true;
    this.loadError = '';
    this.passKeys.list({
      q: this.searchText.trim(),
      is_active: this.activeFilter === '' ? '' : this.activeFilter === 'true',
      limit: this.limit,
      offset: this.offset,
    }).subscribe({
      next: (res) => {
        this.officers = res.data || [];
        this.total = res.total || 0;
        this.limit = res.limit || this.limit;
        this.offset = res.offset || 0;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.loadError = this.passKeys.errorMessage(err, 'Failed to load Pass Keys.');
      },
    });
  }

  prevPage(): void {
    if (this.offset === 0) return;
    this.offset = Math.max(0, this.offset - this.limit);
    this.load();
  }

  nextPage(): void {
    if (this.offset + this.limit >= this.total) return;
    this.offset += this.limit;
    this.load();
  }

  openAdd(): void {
    this.isEditing = false;
    this.editingId = null;
    this.actionError = '';
    this.form.reset();
    this.showModal = true;
  }

  openEdit(row: OfficerPassKey): void {
    this.isEditing = true;
    this.editingId = row.id;
    this.actionError = '';
    this.form.patchValue({
      emp_name: row.emp_name,
      emp_designation: row.emp_designation,
      emp_phone_number: String(row.emp_phone_number ?? '').replace(/\D/g, ''),
      emp_email: row.emp_email || '',
    });
    this.showModal = true;
  }

  save(): void {
    if (this.form.invalid || this.isSaving) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSaving = true;
    this.actionError = '';
    const value = this.form.getRawValue();
    const payload = {
      emp_name: value.emp_name.trim(),
      emp_designation: value.emp_designation.trim(),
      emp_phone_number: String(value.emp_phone_number).replace(/\D/g, ''),
      emp_email: value.emp_email?.trim() || null,
    };

    const request$ = this.isEditing && this.editingId != null
      ? this.passKeys.update(this.editingId, payload)
      : this.passKeys.create(payload);

    request$.subscribe({
      next: (res) => {
        this.isSaving = false;
        this.showModal = false;
        this.pendingNotice = !this.isEditing && (
          res.status === 'pending' ||
          res.officer?.approval_status === 'pending' ||
          !res.pass_key
        );
        if (res.pass_key && !this.pendingNotice) {
          this.revealedKey = res.pass_key;
          this.revealedName = res.officer?.emp_name || payload.emp_name;
        } else {
          this.revealedKey = '';
          this.revealedName = '';
        }
        this.actionSuccess = res.message || (
          this.isEditing
            ? 'Officer details updated.'
            : this.pendingNotice
              ? 'Request submitted. HQ must approve via email before a Pass Key is issued.'
              : 'Pass Key created.'
        );
        this.load();
      },
      error: (err) => {
        this.isSaving = false;
        this.actionError = this.passKeys.errorMessage(err, 'Could not save Pass Key.');
      },
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.actionError = '';
  }

  deactivate(row: OfficerPassKey): void {
    if (!confirm(`Deactivate Pass Key for "${row.emp_name}"? They will not be able to use it until it is reactivated.`)) {
      return;
    }
    this.runRowAction(row.id, this.passKeys.deactivate(row.id), 'Pass Key deactivated.');
  }

  activate(row: OfficerPassKey): void {
    this.runRowAction(row.id, this.passKeys.activate(row.id), 'Pass Key activated.');
  }

  regenerate(row: OfficerPassKey): void {
    if (!confirm(`Request HQ approval to reset the Pass Key for "${row.emp_name}"? The current code stays valid until HQ approves.`)) {
      return;
    }
    this.busyId = row.id;
    this.actionSuccess = '';
    this.pendingNotice = false;
    this.passKeys.regenerateById(row.id).subscribe({
      next: (res) => {
        this.busyId = null;
        this.revealedKey = '';
        this.revealedName = '';
        this.pendingNotice = true;
        this.actionSuccess = res.message ||
          'Reset request sent to HQ for approval. The officer\'s current Pass Key remains valid until approval.';
        this.load();
      },
      error: (err) => {
        this.busyId = null;
        this.actionSuccess = '';
        alert(this.passKeys.errorMessage(err, 'Could not regenerate Pass Key.'));
      },
    });
  }

  remove(row: OfficerPassKey): void {
    if (!confirm(`Permanently delete Pass Key for "${row.emp_name}"? This cannot be undone.`)) {
      return;
    }
    this.runRowAction(row.id, this.passKeys.hardDelete(row.id), 'Pass Key deleted.');
  }

  copyKey(key?: string): void {
    if (!key) return;
    navigator.clipboard?.writeText(key).then(() => {
      this.actionSuccess = 'Pass Key copied.';
      setTimeout(() => {
        if (this.actionSuccess === 'Pass Key copied.') this.actionSuccess = '';
      }, 2000);
    });
  }

  dismissReveal(): void {
    this.revealedKey = '';
    this.revealedName = '';
    this.pendingNotice = false;
  }

  approvalLabel(status?: string, pendingType?: string | null): string {
    if (pendingType === 'reset') return 'Reset pending HQ';
    switch (status) {
      case 'pending': return 'Pending HQ';
      case 'rejected': return 'Rejected';
      case 'approved':
      default: return 'Approved';
    }
  }

  approvalBadgeClass(status?: string, pendingType?: string | null): string {
    if (pendingType === 'reset') return 'bg-warning text-dark';
    switch (status) {
      case 'pending': return 'bg-warning text-dark';
      case 'rejected': return 'bg-danger';
      case 'approved':
      default: return 'bg-success';
    }
  }

  phone(value: string | number | null | undefined): string {
    return String(value ?? '').replace(/\D/g, '') || '—';
  }

  private runRowAction(
    id: number,
    request$: ReturnType<OfficerPassKeyService['deactivate']>,
    fallbackMessage: string,
  ): void {
    this.busyId = id;
    this.actionSuccess = '';
    request$.subscribe({
      next: (res) => {
        this.busyId = null;
        if (res.pass_key) {
          this.revealedKey = res.pass_key;
          this.revealedName = res.officer?.emp_name || '';
        }
        this.actionSuccess = res.message || fallbackMessage;
        this.load();
      },
      error: (err) => {
        this.busyId = null;
        alert(this.passKeys.errorMessage(err, fallbackMessage));
      },
    });
  }
}
