import { Component, OnInit } from '@angular/core';
import { SubdivisionService } from 'src/app/services/subDivision/subDivision.service';
import { AdminActivityLogService, AdminActivityUser, NormalsPage } from 'src/app/services/admin-activity-log.service';

interface SubdivisionNormal {
  sub_division_code: number;
  sub_division_name: string;
  sub_division_id: number;
}

interface NormalRecord {
  date: string;
  cumulative_rainfall_value: number;
  rainfall_value: number;
}

@Component({
  selector: 'app-subdivision-management',
  templateUrl: './subdivision-management.component.html',
  styleUrls: ['./subdivision-management.component.css']
})
export class SubdivisionManagementComponent implements OnInit {

  readonly currentYear = new Date().getFullYear();

  subdivisions: SubdivisionNormal[] = [];
  isLoading = false;
  loadError = '';
  searchText = '';

  get filtered(): SubdivisionNormal[] {
    const s = this.searchText.toLowerCase();
    if (!s) return this.subdivisions;
    return this.subdivisions.filter(sd =>
      sd.sub_division_name?.toLowerCase().includes(s) ||
      sd.sub_division_code?.toString().includes(s)
    );
  }

  showNormalsModal = false;
  normalsEntity: SubdivisionNormal | null = null;
  normals: NormalRecord[] = [];
  normalsLoading = false;
  normalsError = '';
  normalsSearch = '';
  normalsYear: number = this.currentYear;

  get normalsYearLabel(): string {
    if (!this.normals.length) return '';
    return new Date(this.normals[0].date).getFullYear().toString();
  }

  get filteredNormals(): NormalRecord[] {
    if (!this.normalsSearch) return this.normals;
    return this.normals.filter(n => n.date?.includes(this.normalsSearch));
  }

  get viewYearOptions(): number[] {
    return Array.from({ length: 11 }, (_, i) => this.currentYear - i);
  }

  showReplaceModal = false;
  replaceFile: File | null = null;
  replaceFileError = '';
  isReplaceUploading = false;
  replaceError = '';
  replaceSuccess = '';
  replaceYear: number = this.currentYear;

  get replaceYearOptions(): number[] {
    return Array.from({ length: 11 }, (_, i) => this.currentYear - i);
  }

  showAddYearModal = false;
  addYearFile: File | null = null;
  addYearFileError = '';
  isAddYearUploading = false;
  addYearError = '';
  addYearSuccess = '';
  addYearSelected: number = this.currentYear - 1;

  get addYearOptions(): number[] {
    return Array.from({ length: 10 }, (_, i) => this.currentYear - i - 1);
  }

  showBulkReplaceModal = false;
  bulkReplaceFile: File | null = null;
  bulkReplaceFileError = '';
  isBulkReplaceUploading = false;
  bulkReplaceError = '';
  bulkReplaceSuccess = '';
  bulkReplaceDetails: any[] = [];
  bulkReplaceYear: number = this.currentYear;

  get bulkReplaceYearOptions(): number[] {
    return Array.from({ length: 11 }, (_, i) => this.currentYear - i);
  }

  showBulkAddYearModal = false;
  bulkAddYearFile: File | null = null;
  bulkAddYearFileError = '';
  isBulkAddYearUploading = false;
  bulkAddYearError = '';
  bulkAddYearSuccess = '';
  bulkAddYearInserted: any[] = [];
  bulkAddYearSkipped: any[] = [];
  bulkAddYearSelected: number = this.currentYear - 1;

  get bulkAddYearOptions(): number[] {
    return Array.from({ length: 10 }, (_, i) => this.currentYear - i - 1);
  }

  // ── Missing Normals ──────────────────────────────────────────────────────────
  missingEntities: any[] = [];
  missingYear: number = this.currentYear;
  missingLoading = false;
  missingExpanded = false;

  showEmpModal = true;
  activityUser: AdminActivityUser | null = null;
  readonly pageRoute = '/data-management/subdivision-management';
  readonly normalsPageKey: NormalsPage = 'subdivision';
  readonly pageLabel = 'Subdivision Management';

  constructor(
    public subdivisionService: SubdivisionService,
    private activityLog: AdminActivityLogService,
  ) {}

  ngOnInit(): void {
    // list loads after officer identification
  }

  onOfficerIdentified(user: AdminActivityUser): void {
    this.activityUser = user;
    this.showEmpModal = false;
    this.loadSubdivisions();
    this.loadMissingNormals();
  }

  private ensureIdentified(): boolean {
    if (this.activityUser) return true;
    this.showEmpModal = true;
    return false;
  }

  private log(actionType: string, extra: Record<string, unknown> = {}): void {
    this.activityLog.logNormalsActivity(this.normalsPageKey, actionType, this.activityUser, {
      remark: this.activityUser?.remark ?? '',
      ...extra,
    }).subscribe();
  }

  onDownloadTemplate(): void {
    this.log('DOWNLOAD_TEMPLATE');
  }

  loadSubdivisions(): void {
    this.isLoading = true;
    this.loadError = '';
    this.subdivisionService.getSubdivisionNormalList().subscribe({
      next: (res) => { this.subdivisions = res.data ?? []; this.isLoading = false; },
      error: () => { this.loadError = 'Failed to load subdivisions.'; this.isLoading = false; }
    });
  }

  openNormals(sd: SubdivisionNormal): void {
    this.normalsEntity = sd;
    this.normalsYear   = this.currentYear;
    this.normals       = [];
    this.normalsError  = '';
    this.normalsSearch = '';
    this.showNormalsModal = true;
    this.fetchNormals(sd.sub_division_code, this.normalsYear);
  }

  fetchNormals(sub_division_code: number, year: number): void {
    this.normalsLoading = true;
    this.normalsError   = '';
    this.normals        = [];
    this.subdivisionService.getSubdivisionNormals(sub_division_code, year).subscribe({
      next: (res) => { this.normals = res.data ?? []; this.normalsLoading = false; },
      error: () => { this.normalsError = 'Failed to load normals.'; this.normalsLoading = false; }
    });
  }

  onNormalsYearChange(): void {
    if (this.normalsEntity) this.fetchNormals(this.normalsEntity.sub_division_code, this.normalsYear);
  }

  closeNormalsModal(): void { this.showNormalsModal = false; }

  openReplace(sd: SubdivisionNormal): void {
    this.normalsEntity    = sd;
    this.replaceFile      = null;
    this.replaceFileError = '';
    this.replaceError     = '';
    this.replaceSuccess   = '';
    this.replaceYear      = this.currentYear;
    this.showReplaceModal = true;
  }

  onReplaceFileChange(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase();
    this.replaceFileError = (ext !== 'xlsx' && ext !== 'xls') ? 'Only .xlsx or .xls allowed.' : '';
    this.replaceFile = this.replaceFileError ? null : f;
  }

  submitReplace(): void {
    if (!this.replaceFile || !this.normalsEntity) return;
    this.isReplaceUploading = true;
    this.replaceError = '';
    this.replaceSuccess = '';
    const fd = new FormData();
    fd.append('file', this.replaceFile);
    this.subdivisionService.replaceSubdivisionNormals(this.normalsEntity.sub_division_code, fd, this.replaceYear).subscribe({
      next: (res) => { this.replaceSuccess = res?.message || 'Replaced.'; this.isReplaceUploading = false; },
      error: (err) => {
        const s = err?.status;
        const m = err?.error?.error || '';
        this.replaceError = s === 0 ? 'Cannot reach server.' : m || 'Replace failed.';
        this.isReplaceUploading = false;
      }
    });
  }

  closeReplaceModal(): void { if (!this.isReplaceUploading) this.showReplaceModal = false; }

  openAddYear(sd: SubdivisionNormal): void {
    this.normalsEntity    = sd;
    this.addYearFile      = null;
    this.addYearFileError = '';
    this.addYearError     = '';
    this.addYearSuccess   = '';
    this.addYearSelected  = this.currentYear - 1;
    this.showAddYearModal = true;
  }

  onAddYearFileChange(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase();
    this.addYearFileError = (ext !== 'xlsx' && ext !== 'xls') ? 'Only .xlsx or .xls allowed.' : '';
    this.addYearFile = this.addYearFileError ? null : f;
  }

  submitAddYear(): void {
    if (!this.addYearFile || !this.normalsEntity) return;
    this.isAddYearUploading = true;
    this.addYearError = '';
    this.addYearSuccess = '';
    const fd = new FormData();
    fd.append('file', this.addYearFile);
    fd.append('year', this.addYearSelected.toString());
    this.subdivisionService.addSubdivisionYearNormals(this.normalsEntity.sub_division_code, fd).subscribe({
      next: (res) => { this.addYearSuccess = res?.message || 'Added.'; this.isAddYearUploading = false; },
      error: (err) => {
        const s = err?.status;
        const m = err?.error?.error || '';
        this.addYearError = s === 409 ? `⚠️ ${m}` : s === 0 ? 'Cannot reach server.' : m || 'Failed.';
        this.isAddYearUploading = false;
      }
    });
  }

  closeAddYearModal(): void { if (!this.isAddYearUploading) this.showAddYearModal = false; }

  openBulkReplace(): void {
    this.bulkReplaceFile      = null;
    this.bulkReplaceFileError = '';
    this.bulkReplaceError     = '';
    this.bulkReplaceSuccess   = '';
    this.bulkReplaceDetails   = [];
    this.bulkReplaceYear      = this.currentYear;
    this.showBulkReplaceModal = true;
  }

  onBulkReplaceFileChange(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase();
    this.bulkReplaceFileError = (ext !== 'xlsx' && ext !== 'xls') ? 'Only .xlsx or .xls allowed.' : '';
    this.bulkReplaceFile = this.bulkReplaceFileError ? null : f;
  }

  submitBulkReplace(): void {
    if (!this.bulkReplaceFile) return;
    this.isBulkReplaceUploading = true;
    this.bulkReplaceError = '';
    this.bulkReplaceSuccess = '';
    this.bulkReplaceDetails = [];
    const fd = new FormData();
    fd.append('file', this.bulkReplaceFile);
    this.subdivisionService.bulkReplaceSubdivisionNormals(fd, this.bulkReplaceYear).subscribe({
      next: (res) => {
        this.bulkReplaceSuccess = res?.message || 'Done.';
        this.bulkReplaceDetails = res?.details ?? [];
        this.isBulkReplaceUploading = false;
      },
      error: (err) => {
        this.bulkReplaceError = err?.error?.error || 'Bulk replace failed.';
        this.isBulkReplaceUploading = false;
      }
    });
  }

  closeBulkReplaceModal(): void { if (!this.isBulkReplaceUploading) this.showBulkReplaceModal = false; }

  openBulkAddYear(): void {
    this.bulkAddYearFile      = null;
    this.bulkAddYearFileError = '';
    this.bulkAddYearError     = '';
    this.bulkAddYearSuccess   = '';
    this.bulkAddYearInserted  = [];
    this.bulkAddYearSkipped   = [];
    this.bulkAddYearSelected  = this.currentYear - 1;
    this.showBulkAddYearModal = true;
  }

  onBulkAddYearFileChange(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase();
    this.bulkAddYearFileError = (ext !== 'xlsx' && ext !== 'xls') ? 'Only .xlsx or .xls allowed.' : '';
    this.bulkAddYearFile = this.bulkAddYearFileError ? null : f;
  }

  submitBulkAddYear(): void {
    if (!this.bulkAddYearFile) return;
    this.isBulkAddYearUploading = true;
    this.bulkAddYearError = '';
    this.bulkAddYearSuccess = '';
    this.bulkAddYearInserted = [];
    this.bulkAddYearSkipped  = [];
    const fd = new FormData();
    fd.append('file', this.bulkAddYearFile);
    fd.append('year', this.bulkAddYearSelected.toString());
    this.subdivisionService.bulkAddSubdivisionYearNormals(fd).subscribe({
      next: (res) => {
        this.bulkAddYearSuccess  = res?.message || 'Done.';
        this.bulkAddYearInserted = res?.inserted ?? [];
        this.bulkAddYearSkipped  = res?.skipped  ?? [];
        this.isBulkAddYearUploading = false;
      },
      error: (err) => {
        this.bulkAddYearError = err?.error?.error || 'Bulk add failed.';
        this.isBulkAddYearUploading = false;
      }
    });
  }

  closeBulkAddYearModal(): void { if (!this.isBulkAddYearUploading) this.showBulkAddYearModal = false; }

  isLeapYear(y: number): boolean { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }

  loadMissingNormals(): void {
    this.missingLoading = true;
    this.missingExpanded = false;
    this.subdivisionService.getMissingSubdivisionNormals(this.missingYear).subscribe({
      next: (res) => { this.missingEntities = res.data ?? []; this.missingLoading = false; },
      error: () => { this.missingEntities = []; this.missingLoading = false; }
    });
  }

  onMissingYearChange(): void { this.loadMissingNormals(); }
}
