import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

interface District {
  id: number;
  code: string;
  name: string;
  stateName: string;
  subdivisionName: string;
  active: boolean;
}

@Component({
  selector: 'app-district-management',
  templateUrl: './district-management.component.html',
  styleUrls: ['./district-management.component.css']
})
export class DistrictManagementComponent implements OnInit {
  searchText = '';
  showModal = false;
  isEditing = false;
  editingId: number | null = null;
  isSaving = false;
  form!: FormGroup;

  districts: District[] = [
    { id: 1, code: 'DIS001', name: 'Agra', stateName: 'Uttar Pradesh', subdivisionName: 'West Uttar Pradesh', active: true },
    { id: 2, code: 'DIS002', name: 'East Khasi Hills', stateName: 'Meghalaya', subdivisionName: 'Northeast', active: true },
    { id: 3, code: 'DIS003', name: 'Bangalore Urban', stateName: 'Karnataka', subdivisionName: 'South Peninsular', active: true },
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.form = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      stateName: ['', Validators.required],
      subdivisionName: ['', Validators.required],
      active: [true]
    });
  }

  get filtered(): District[] {
    const s = this.searchText.toLowerCase();
    return this.districts.filter(d =>
      d.name.toLowerCase().includes(s) ||
      d.code.toLowerCase().includes(s) ||
      d.stateName.toLowerCase().includes(s) ||
      d.subdivisionName.toLowerCase().includes(s)
    );
  }

  openAdd() { this.isEditing = false; this.editingId = null; this.form.reset({ active: true }); this.showModal = true; }

  openEdit(d: District) { this.isEditing = true; this.editingId = d.id; this.form.patchValue(d); this.showModal = true; }

  save() {
    if (this.form.invalid) return;
    this.isSaving = true;
    setTimeout(() => {
      const v = this.form.value;
      if (this.isEditing && this.editingId !== null) {
        const idx = this.districts.findIndex(d => d.id === this.editingId);
        if (idx > -1) this.districts[idx] = { ...this.districts[idx], ...v };
      } else {
        this.districts.push({ id: Date.now(), ...v });
      }
      this.isSaving = false;
      this.closeModal();
    }, 600);
  }

  delete(d: District) {
    if (!confirm(`Delete district "${d.name}"?`)) return;
    this.districts = this.districts.filter(x => x.id !== d.id);
  }

  closeModal() { this.showModal = false; }
}
