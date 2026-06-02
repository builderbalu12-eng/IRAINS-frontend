import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DistrictService } from 'src/app/services/district/district.service';

interface NormalDistrictDetail {
  id: number;
  district_code: number;
  district_name: string;
  region_name: string;
  region_code: number;
  subdiv_name: string;
  subdiv_code: number;
  sd: number;
  state_name: string;
  state_code: number;
  rst: number;
  ddd: number;
}

interface DistrictNormal {
  date: string;
  cumulative_rainfall_value: number;
  rainfall_value: number;
}

@Component({
  selector: 'app-district-management',
  templateUrl: './district-management.component.html',
  styleUrls: ['./district-management.component.css']
})
export class DistrictManagementComponent implements OnInit {
  searchText = '';
  districts: NormalDistrictDetail[] = [];
  isLoading = false;
  loadError = '';

  // Add modal
  showAddModal = false;
  selectedFile: File | null = null;
  fileError = '';
  isUploading = false;
  uploadError = '';
  uploadSuccess = '';
  isDragOver = false;

  // Edit modal
  showEditModal = false;
  editForm!: FormGroup;
  editingDistrict: NormalDistrictDetail | null = null;
  isSaving = false;
  saveError = '';

  // Edit normals modal
  // Bulk replace normals
  showBulkModal = false;
  bulkFile: File | null = null;
  bulkFileError = '';
  isBulkUploading = false;
  bulkUploadError = '';
  bulkUploadSuccess = '';
  bulkDetails: any[] = [];

  showEditNormalsModal = false;
  editNormalsDistrict: NormalDistrictDetail | null = null;
  editNormalsFile: File | null = null;
  editNormalsFileError = '';
  isEditNormalsUploading = false;
  editNormalsUploadError = '';
  editNormalsUploadSuccess = '';
  isEditNormalsDragOver = false;

  // Normals modal
  showNormalsModal = false;
  normalsDistrict: NormalDistrictDetail | null = null;
  normals: DistrictNormal[] = [];
  normalsLoading = false;
  normalsError = '';
  normalsSearch = '';

  templateUrl = '';

  constructor(private districtService: DistrictService, private fb: FormBuilder) {}

  ngOnInit() {
    this.editForm = this.fb.group({
      district_name: ['', Validators.required],
      district_code: [{ value: '', disabled: true }],
      region_name:   [{ value: '', disabled: true }],
      subdiv_name:   [{ value: '', disabled: true }],
      state_name:    [{ value: '', disabled: true }],
    });
    this.templateUrl = this.districtService.downloadDistrictNormalTemplate();
    this.loadDistricts();
  }

  loadDistricts() {
    this.isLoading = true;
    this.loadError = '';
    this.districtService.getNormalDistrictDetails().subscribe({
      next: (data) => { this.districts = data; this.isLoading = false; },
      error: () => { this.loadError = 'Failed to load districts. Please try again.'; this.isLoading = false; }
    });
  }

  get filtered(): NormalDistrictDetail[] {
    const s = this.searchText.toLowerCase();
    if (!s) return this.districts;
    return this.districts.filter(d =>
      d.district_name?.toLowerCase().includes(s) ||
      d.district_code?.toString().includes(s) ||
      d.state_name?.toLowerCase().includes(s) ||
      d.subdiv_name?.toLowerCase().includes(s) ||
      d.region_name?.toLowerCase().includes(s)
    );
  }

  // ── Add modal ────────────────────────────────────────────────
  openAdd() {
    this.selectedFile = null;
    this.fileError = '';
    this.uploadError = '';
    this.uploadSuccess = '';
    this.showAddModal = true;
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.handleFile(input.files[0]);
  }

  onDragOver(event: DragEvent) { event.preventDefault(); this.isDragOver = true; }
  onDragLeave() { this.isDragOver = false; }
  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.handleFile(file);
  }

  handleFile(file: File) {
    this.fileError = '';
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      this.fileError = 'Only .xlsx or .xls files are allowed.';
      this.selectedFile = null;
      return;
    }
    this.selectedFile = file;
    this.uploadError = '';
    this.uploadSuccess = '';
  }

  clearFile() { this.selectedFile = null; this.fileError = ''; }

  submitAdd() {
    if (!this.selectedFile) { this.fileError = 'Please select an Excel file.'; return; }
    this.isUploading = true;
    this.uploadError = '';
    this.uploadSuccess = '';
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    this.districtService.insertNewDistrictAndNormalValues(formData).subscribe({
      next: (res) => {
        this.uploadSuccess = res?.message || 'Districts added successfully.';
        this.isUploading = false;
        this.loadDistricts();
      },
      error: (err) => {
        this.uploadError = err?.error?.error || 'Upload failed. Please check the file format.';
        this.isUploading = false;
      }
    });
  }

  closeAddModal() { if (!this.isUploading) this.showAddModal = false; }

  // ── Edit modal ───────────────────────────────────────────────
  openEdit(d: NormalDistrictDetail) {
    this.editingDistrict = d;
    this.saveError = '';
    this.editForm.patchValue({
      district_name: d.district_name,
      district_code: d.district_code,
      region_name:   d.region_name,
      subdiv_name:   d.subdiv_name,
      state_name:    d.state_name,
    });
    this.showEditModal = true;
  }

  saveEdit() {
    if (this.editForm.invalid || !this.editingDistrict) return;
    this.isSaving = true;
    this.saveError = '';
    this.districtService.updateDistrictDetails({
      district_code: this.editingDistrict.district_code,
      district_name: this.editForm.get('district_name')!.value
    }).subscribe({
      next: () => {
        this.isSaving = false;
        this.showEditModal = false;
        this.loadDistricts();
      },
      error: (err) => {
        this.saveError = err?.error?.error || 'Failed to update district.';
        this.isSaving = false;
      }
    });
  }

  closeEditModal() { if (!this.isSaving) this.showEditModal = false; }

  // ── Normals modal ────────────────────────────────────────────
  openNormals(d: NormalDistrictDetail) {
    this.normalsDistrict = d;
    this.normals = [];
    this.normalsError = '';
    this.normalsSearch = '';
    this.normalsLoading = true;
    this.showNormalsModal = true;
    this.districtService.getDistrictNormals(d.district_code).subscribe({
      next: (data) => { this.normals = data; this.normalsLoading = false; },
      error: () => { this.normalsError = 'Failed to load normals.'; this.normalsLoading = false; }
    });
  }

  get filteredNormals(): DistrictNormal[] {
    if (!this.normalsSearch) return this.normals;
    return this.normals.filter(n => n.date?.includes(this.normalsSearch));
  }

  closeNormalsModal() { this.showNormalsModal = false; }

  // ── Edit Normals modal ───────────────────────────────────────
  openEditNormals(d: NormalDistrictDetail) {
    this.editNormalsDistrict = d;
    this.editNormalsFile = null;
    this.editNormalsFileError = '';
    this.editNormalsUploadError = '';
    this.editNormalsUploadSuccess = '';
    this.showEditNormalsModal = true;
  }

  onEditNormalsFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.handleEditNormalsFile(input.files[0]);
  }

  onEditNormalsDragOver(e: DragEvent) { e.preventDefault(); this.isEditNormalsDragOver = true; }
  onEditNormalsDragLeave() { this.isEditNormalsDragOver = false; }
  onEditNormalsDrop(e: DragEvent) {
    e.preventDefault();
    this.isEditNormalsDragOver = false;
    const file = e.dataTransfer?.files[0];
    if (file) this.handleEditNormalsFile(file);
  }

  handleEditNormalsFile(file: File) {
    this.editNormalsFileError = '';
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      this.editNormalsFileError = 'Only .xlsx or .xls files are allowed.';
      this.editNormalsFile = null;
      return;
    }
    this.editNormalsFile = file;
    this.editNormalsUploadError = '';
    this.editNormalsUploadSuccess = '';
  }

  submitEditNormals() {
    if (!this.editNormalsFile || !this.editNormalsDistrict) return;
    this.isEditNormalsUploading = true;
    this.editNormalsUploadError = '';
    this.editNormalsUploadSuccess = '';
    const formData = new FormData();
    formData.append('file', this.editNormalsFile);
    this.districtService.updateDistrictNormals(this.editNormalsDistrict.district_code, formData).subscribe({
      next: (res) => {
        this.editNormalsUploadSuccess = res?.message || 'Normals updated successfully.';
        this.isEditNormalsUploading = false;
        // Reload normals if the normals modal is open for the same district
        if (this.showNormalsModal && this.normalsDistrict?.district_code === this.editNormalsDistrict!.district_code) {
          this.openNormals(this.editNormalsDistrict!);
        }
      },
      error: (err) => {
        this.editNormalsUploadError = err?.error?.error || 'Upload failed. Please check the file format.';
        this.isEditNormalsUploading = false;
      }
    });
  }

  closeEditNormalsModal() { if (!this.isEditNormalsUploading) this.showEditNormalsModal = false; }

  // ── Bulk Replace Normals ─────────────────────────────────────
  openBulkModal() {
    this.bulkFile = null;
    this.bulkFileError = '';
    this.bulkUploadError = '';
    this.bulkUploadSuccess = '';
    this.bulkDetails = [];
    this.showBulkModal = true;
  }

  onBulkFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'xlsx' && ext !== 'xls') {
        this.bulkFileError = 'Only .xlsx or .xls files are allowed.';
        this.bulkFile = null;
        return;
      }
      this.bulkFile = file;
      this.bulkFileError = '';
    }
  }

  submitBulkReplace() {
    if (!this.bulkFile) { this.bulkFileError = 'Please select an Excel file.'; return; }
    this.isBulkUploading = true;
    this.bulkUploadError = '';
    this.bulkUploadSuccess = '';
    this.bulkDetails = [];
    const formData = new FormData();
    formData.append('file', this.bulkFile);
    this.districtService.bulkReplaceDistrictNormals(formData).subscribe({
      next: (res) => {
        this.bulkUploadSuccess = res?.message || 'Bulk replace completed.';
        this.bulkDetails = res?.details ?? [];
        this.isBulkUploading = false;
      },
      error: (err) => {
        const status = err?.status;
        const serverMsg = err?.error?.error || err?.error?.message || '';
        if (status === 0) {
          this.bulkUploadError = 'Cannot reach server. Please check your connection.';
        } else if (status === 404) {
          this.bulkUploadError = `District not found in database: ${serverMsg}`;
        } else if (status === 400) {
          this.bulkUploadError = `File issue: ${serverMsg}`;
        } else if (status === 500) {
          this.bulkUploadError = `Server error: ${serverMsg}`;
        } else {
          this.bulkUploadError = serverMsg || 'Bulk replace failed. Please try again.';
        }
        this.isBulkUploading = false;
      }
    });
  }

  closeBulkModal() { if (!this.isBulkUploading) this.showBulkModal = false; }
}
