import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

interface Region {
  id: number;
  code: string;
  name: string;
  description: string;
  active: boolean;
}

@Component({
  selector: 'app-region-management',
  templateUrl: './region-management.component.html',
  styleUrls: ['./region-management.component.css']
})
export class RegionManagementComponent implements OnInit {
  searchText = '';
  showModal = false;
  isEditing = false;
  editingId: number | null = null;
  isSaving = false;
  form!: FormGroup;

  regions: Region[] = [
    { id: 1, code: 'NW',  name: 'North West',       description: 'Covers NW India states', active: true },
    { id: 2, code: 'NE',  name: 'North East',        description: 'Covers NE India states', active: true },
    { id: 3, code: 'CI',  name: 'Central India',     description: 'Central belt states', active: true },
    { id: 4, code: 'SP',  name: 'South Peninsular',  description: 'Southern peninsula states', active: true },
    { id: 5, code: 'ENE', name: 'East & North East', description: 'East and NE combined region', active: true },
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.form = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      active: [true]
    });
  }

  get filtered(): Region[] {
    const s = this.searchText.toLowerCase();
    return this.regions.filter(r =>
      r.name.toLowerCase().includes(s) ||
      r.code.toLowerCase().includes(s) ||
      r.description.toLowerCase().includes(s)
    );
  }

  openAdd() { this.isEditing = false; this.editingId = null; this.form.reset({ active: true }); this.showModal = true; }

  openEdit(r: Region) { this.isEditing = true; this.editingId = r.id; this.form.patchValue(r); this.showModal = true; }

  save() {
    if (this.form.invalid) return;
    this.isSaving = true;
    setTimeout(() => {
      const v = this.form.value;
      if (this.isEditing && this.editingId !== null) {
        const idx = this.regions.findIndex(r => r.id === this.editingId);
        if (idx > -1) this.regions[idx] = { ...this.regions[idx], ...v };
      } else {
        this.regions.push({ id: Date.now(), ...v });
      }
      this.isSaving = false;
      this.closeModal();
    }, 600);
  }

  delete(r: Region) {
    if (!confirm(`Delete region "${r.name}"?`)) return;
    this.regions = this.regions.filter(x => x.id !== r.id);
  }

  closeModal() { this.showModal = false; }
}
