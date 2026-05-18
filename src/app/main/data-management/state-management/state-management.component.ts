import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

interface State {
  id: number;
  code: string;
  name: string;
  regionName: string;
  active: boolean;
}

@Component({
  selector: 'app-state-management',
  templateUrl: './state-management.component.html',
  styleUrls: ['./state-management.component.css']
})
export class StateManagementComponent implements OnInit {
  searchText = '';
  showModal = false;
  isEditing = false;
  editingId: number | null = null;
  isSaving = false;
  form!: FormGroup;

  states: State[] = [
    { id: 1, code: 'UP', name: 'Uttar Pradesh', regionName: 'North West', active: true },
    { id: 2, code: 'MH', name: 'Maharashtra', regionName: 'Central India', active: true },
    { id: 3, code: 'KA', name: 'Karnataka', regionName: 'South Peninsular', active: true },
    { id: 4, code: 'MG', name: 'Meghalaya', regionName: 'North East', active: true },
    { id: 5, code: 'TG', name: 'Telangana', regionName: 'South Peninsular', active: true },
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

  get filtered(): State[] {
    const s = this.searchText.toLowerCase();
    return this.states.filter(st =>
      st.name.toLowerCase().includes(s) ||
      st.code.toLowerCase().includes(s) ||
      st.regionName.toLowerCase().includes(s)
    );
  }

  openAdd() { this.isEditing = false; this.editingId = null; this.form.reset({ active: true }); this.showModal = true; }

  openEdit(st: State) { this.isEditing = true; this.editingId = st.id; this.form.patchValue(st); this.showModal = true; }

  save() {
    if (this.form.invalid) return;
    this.isSaving = true;
    setTimeout(() => {
      const v = this.form.value;
      if (this.isEditing && this.editingId !== null) {
        const idx = this.states.findIndex(s => s.id === this.editingId);
        if (idx > -1) this.states[idx] = { ...this.states[idx], ...v };
      } else {
        this.states.push({ id: Date.now(), ...v });
      }
      this.isSaving = false;
      this.closeModal();
    }, 600);
  }

  delete(st: State) {
    if (!confirm(`Delete state "${st.name}"?`)) return;
    this.states = this.states.filter(x => x.id !== st.id);
  }

  closeModal() { this.showModal = false; }
}
