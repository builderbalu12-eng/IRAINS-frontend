import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

interface Block {
  id: number;
  code: string;
  name: string;
  districtName: string;
  stateName: string;
  active: boolean;
}

@Component({
  selector: 'app-block-management',
  templateUrl: './block-management.component.html',
  styleUrls: ['./block-management.component.css']
})
export class BlockManagementComponent implements OnInit {
  searchText = '';
  showModal = false;
  isEditing = false;
  editingId: number | null = null;
  isSaving = false;
  form!: FormGroup;

  blocks: Block[] = [
    { id: 1, code: 'BLK001', name: 'Agra Block', districtName: 'Agra', stateName: 'Uttar Pradesh', active: true },
    { id: 2, code: 'BLK002', name: 'Mathura Block', districtName: 'Mathura', stateName: 'Uttar Pradesh', active: true },
    { id: 3, code: 'BLK003', name: 'Shillong Block', districtName: 'East Khasi Hills', stateName: 'Meghalaya', active: false },
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.form = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      districtName: ['', Validators.required],
      stateName: ['', Validators.required],
      active: [true]
    });
  }

  get filtered(): Block[] {
    const s = this.searchText.toLowerCase();
    return this.blocks.filter(b =>
      b.name.toLowerCase().includes(s) ||
      b.code.toLowerCase().includes(s) ||
      b.districtName.toLowerCase().includes(s) ||
      b.stateName.toLowerCase().includes(s)
    );
  }

  openAdd() {
    this.isEditing = false;
    this.editingId = null;
    this.form.reset({ active: true });
    this.showModal = true;
  }

  openEdit(b: Block) {
    this.isEditing = true;
    this.editingId = b.id;
    this.form.patchValue(b);
    this.showModal = true;
  }

  save() {
    if (this.form.invalid) return;
    this.isSaving = true;
    setTimeout(() => {
      const v = this.form.value;
      if (this.isEditing && this.editingId !== null) {
        const idx = this.blocks.findIndex(b => b.id === this.editingId);
        if (idx > -1) this.blocks[idx] = { ...this.blocks[idx], ...v };
      } else {
        this.blocks.push({ id: Date.now(), ...v });
      }
      this.isSaving = false;
      this.closeModal();
    }, 600);
  }

  delete(b: Block) {
    if (!confirm(`Delete block "${b.name}"?`)) return;
    this.blocks = this.blocks.filter(x => x.id !== b.id);
  }

  closeModal() { this.showModal = false; }
}
