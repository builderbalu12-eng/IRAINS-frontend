import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

interface Subdivision {
  id: number;
  code: string;
  name: string;
  regionName: string;
  active: boolean;
}

@Component({
  selector: 'app-subdivision-management',
  templateUrl: './subdivision-management.component.html',
  styleUrls: ['./subdivision-management.component.css']
})
export class SubdivisionManagementComponent implements OnInit {
  searchText = '';
  showModal = false;
  isEditing = false;
  editingId: number | null = null;
  isSaving = false;
  form!: FormGroup;

  subdivisions: Subdivision[] = [
    { id: 1, code: 'SUB001', name: 'West Uttar Pradesh', regionName: 'North West', active: true },
    { id: 2, code: 'SUB002', name: 'Konkan', regionName: 'Central India', active: true },
    { id: 3, code: 'SUB003', name: 'Tamil Nadu', regionName: 'South Peninsular', active: true },
    { id: 4, code: 'SUB004', name: 'Assam & Meghalaya', regionName: 'North East', active: true },
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.form = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      regionName: ['', Validators.required],
      active: [true]
    });
  }

  get filtered(): Subdivision[] {
    const s = this.searchText.toLowerCase();
    return this.subdivisions.filter(sub =>
      sub.name.toLowerCase().includes(s) ||
      sub.code.toLowerCase().includes(s) ||
      sub.regionName.toLowerCase().includes(s)
    );
  }

  openAdd() { this.isEditing = false; this.editingId = null; this.form.reset({ active: true }); this.showModal = true; }

  openEdit(sub: Subdivision) { this.isEditing = true; this.editingId = sub.id; this.form.patchValue(sub); this.showModal = true; }

  save() {
    if (this.form.invalid) return;
    this.isSaving = true;
    setTimeout(() => {
      const v = this.form.value;
      if (this.isEditing && this.editingId !== null) {
        const idx = this.subdivisions.findIndex(s => s.id === this.editingId);
        if (idx > -1) this.subdivisions[idx] = { ...this.subdivisions[idx], ...v };
      } else {
        this.subdivisions.push({ id: Date.now(), ...v });
      }
      this.isSaving = false;
      this.closeModal();
    }, 600);
  }

  delete(sub: Subdivision) {
    if (!confirm(`Delete subdivision "${sub.name}"?`)) return;
    this.subdivisions = this.subdivisions.filter(x => x.id !== sub.id);
  }

  closeModal() { this.showModal = false; }
}
