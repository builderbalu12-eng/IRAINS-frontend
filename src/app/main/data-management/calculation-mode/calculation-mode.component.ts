import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { CalculationsModeService } from 'src/app/services/calculationsMode.service';
import { AdminActivityLogService, AdminActivityUser } from 'src/app/services/admin-activity-log.service';
import { AdminRealtimeService } from 'src/app/services/admin-realtime.service';
import { backendRoutePath } from 'src/app/config/admin-realtime.config';
import { environment } from 'src/environment/environment';
import * as XLSX from 'xlsx-js-style';
import * as FileSaver from 'file-saver';

@Component({
  selector: 'app-calculation-mode',
  templateUrl: './calculation-mode.component.html',
  styleUrls: ['./calculation-mode.component.css']
})
export class CalculationModeComponent implements OnInit, OnDestroy {
  useAws: boolean = true;
  loading: boolean = false;
  saving:  boolean = false;
  message: string  = '';
  messageType: 'success' | 'error' = 'success';

  // Employee identification modal
  showEmpModal = false;
  empSubmitting = false;
  empFormError = '';
  empIdentificationForm: FormGroup;

  // Station data
  stationsLoading = false;
  imdStations: any[] = [];
  awsStations: any[] = [];
  imdTotal: number = 0;
  awsTotal: number = 0;
  activeTab: 'imd' | 'aws' = 'imd';
  selectedDate: string = this.todayStr();

  // Country actual values
  countryActualImd: number | null = null;
  countryActualAws: number | null = null;
  countryLoading = false;

  // Sort
  sortCol: string = '';
  sortDir: 'asc' | 'desc' = 'asc';

  private baseUrl = environment.baseUrl;
  private activityUser: AdminActivityUser | null = null;
  private readonly pageRoute = '/data-management/calculation-mode';
  /** Prevents programmatic checkbox revert from firing a second POST */
  private suppressToggleChange = false;
  private realtimeSub?: Subscription;

  constructor(
    private calcMode: CalculationsModeService,
    private http: HttpClient,
    private activityLog: AdminActivityLogService,
    private adminRealtime: AdminRealtimeService,
    private fb: FormBuilder,
  ) {
    this.empIdentificationForm = this.fb.group({
      emp_name: ['', Validators.required],
      emp_designation: ['', Validators.required],
      emp_phone_number: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      remark: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.activityUser = null;
    this.prefillEmployeeForm();
    this.showEmpModal = true;

    const calcRoute = backendRoutePath(this.pageRoute);
    this.realtimeSub = this.adminRealtime.pageStateChanged$.subscribe(event => {
      if (event.route_path !== calcRoute || event.state_type !== 'calculation_mode') return;
      const useAws = Number(event.data?.['use_aws']);
      if (useAws === 0 || useAws === 1) {
        this.suppressToggleChange = true;
        this.useAws = useAws === 1;
        this.suppressToggleChange = false;
      }
      if (event.data?.['updated_at']) {
        this.calcMode.applyModeState({
          use_aws: useAws,
          updated_at: String(event.data['updated_at']),
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.realtimeSub?.unsubscribe();
  }

  private prefillEmployeeForm(): void {
    const stored = this.activityLog.getStoredUser(this.pageRoute);
    if (!stored) return;
    this.empIdentificationForm.patchValue({
      emp_name: stored.emp_name,
      emp_designation: stored.emp_designation,
      emp_phone_number: stored.emp_phone_number,
      remark: stored.remark ?? '',
    });
  }

  submitEmployeeForm(): void {
    if (this.empSubmitting) return;

    this.empFormError = '';

    if (this.empIdentificationForm.invalid) {
      this.empIdentificationForm.markAllAsTouched();
      this.empFormError = 'Please fill in all required fields correctly.';
      return;
    }

    this.empSubmitting = true;

    const { emp_name, emp_designation, emp_phone_number, remark } = this.empIdentificationForm.getRawValue();
    this.activityUser = this.activityLog.buildUserFromForm({
      emp_name: emp_name.trim(),
      emp_designation: emp_designation.trim(),
      emp_phone_number: String(emp_phone_number).replace(/\D/g, ''),
      remark: remark.trim(),
    });

    this.calcMode.recordOfficerAccess(this.activityLog.toApiPayload(this.activityUser)).subscribe({
      next: () => {
        this.empSubmitting = false;
        this.activityLog.storeUser(this.activityUser!, this.pageRoute);
        this.adminRealtime.onOfficerIdentified(this.pageRoute, this.activityUser!);
        this.showEmpModal = false;
        this.initPage();
      },
      error: () => {
        this.empSubmitting = false;
        this.empFormError = 'Failed to save your details. Please try again.';
      },
    });
  }

  onToggleChange(): void {
    if (this.suppressToggleChange || this.saving) return;

    if (!this.activityUser) {
      this.showEmpModal = true;
      this.empFormError = 'Please enter your officer details before changing calculation mode.';
      this.revertToggle();
      return;
    }

    this.saving = true;
    this.message = '';
    const newVal = this.useAws ? 1 : 0;
    const remark = this.activityUser.remark ?? 'Calculation mode toggle';
    this.calcMode.setMode(newVal, this.activityLog.toApiPayload(this.activityUser), remark).subscribe({
      next: (res) => {
        this.saving = false;
        this.messageType = 'success';
        this.message = res.use_aws === 1
          ? 'Mode set to IMD + AWS — all maps and exports now include AWS stations.'
          : 'Mode set to IMD Only — all maps and exports use IMD stations only.';
        setTimeout(() => this.message = '', 4000);
        this.activeTab = 'imd';
        this.loadStations();
      },
      error: (err) => {
        this.saving = false;
        const body = err?.error;
        if (err?.status === 409 && body) {
          this.messageType = 'error';
          const who = body.last_changed_by?.emp_name ?? 'Another officer';
          this.message = `${who} already changed the mode.`;
          this.suppressToggleChange = true;
          this.useAws = body.use_aws === 1;
          this.suppressToggleChange = false;
          if (body.use_aws !== undefined) {
            this.calcMode.applyModeState(body);
          }
          setTimeout(() => this.message = '', 6000);
          return;
        }
        this.messageType = 'error';
        this.message = 'Failed to update mode. Please try again.';
        this.revertToggle();
      }
    });
  }

  onDateChange(event: any): void {
    this.selectedDate = event.target.value;
    this.loadStations();
  }

  loadStations(): void {
    this.stationsLoading = true;
    this.imdStations = [];
    this.awsStations = [];
    this.sortCol = '';
    this.countryActualImd = null;
    this.countryActualAws = null;
    this.countryLoading = true;

    const payload = { startDate: this.selectedDate, endDate: this.selectedDate };

    this.http.post<any>(`${this.baseUrl}/api/v1/fetchCalcModeStations`, { date: this.selectedDate }).subscribe({
      next: (res) => {
        this.imdStations = res.imd ?? [];
        this.awsStations = res.aws ?? [];
        this.imdTotal    = res.imdTotal ?? 0;
        this.awsTotal    = res.awsTotal ?? 0;
        this.stationsLoading = false;
      },
      error: () => { this.stationsLoading = false; }
    });

    this.http.post<any>(`${this.baseUrl}/api/v1/fetchCountryData`, payload).subscribe({
      next: (res) => {
        const d = res.data?.[0] ?? res.data;
        this.countryActualImd = d?.actual_rainfall ?? null;
        this.countryLoading = false;
      },
      error: () => { this.countryLoading = false; }
    });

    this.http.post<any>(`${this.baseUrl}/api/v1/fetchCountryDataWithAWS`, payload).subscribe({
      next: (res) => {
        const d = res.data?.[0] ?? res.data;
        this.countryActualAws = d?.actual_rainfall ?? null;
      },
      error: () => {}
    });
  }

  get displayedRows(): any[] {
    const rows = this.activeTab === 'imd' ? this.imdStations : this.awsStations;
    if (!this.sortCol) return rows;
    return [...rows].sort((a, b) => {
      let va = a[this.sortCol] ?? '';
      let vb = b[this.sortCol] ?? '';
      if (!isNaN(Number(va)) && !isNaN(Number(vb))) {
        return this.sortDir === 'asc' ? Number(va) - Number(vb) : Number(vb) - Number(va);
      }
      va = String(va).toLowerCase();
      vb = String(vb).toLowerCase();
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return this.sortDir === 'asc' ? cmp : -cmp;
    });
  }

  sort(col: string): void {
    if (this.sortCol === col) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortCol = col;
      this.sortDir = 'asc';
    }
  }

  sortIcon(col: string): string {
    if (this.sortCol !== col) return '⇅';
    return this.sortDir === 'asc' ? '▲' : '▼';
  }

  downloadExcel(): void {
    const date = this.selectedDate.replace(/-/g, '');
    const headers = ['S.No', 'In/Ex', 'Station Code', 'State', 'District', 'Block', 'Station Name', 'Value (mm)'];
    const colWidths = [{ wch: 6 }, { wch: 10 }, { wch: 16 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 28 }, { wch: 12 }];

    const hdrStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '002467' } },
      alignment: { horizontal: 'center' as const },
      border: {
        top:    { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left:   { style: 'thin', color: { rgb: '000000' } },
        right:  { style: 'thin', color: { rgb: '000000' } },
      }
    };

    const infoStyle = {
      font: { bold: true, color: { rgb: '002467' } },
      fill: { fgColor: { rgb: 'EBF0FA' } },
      alignment: { horizontal: 'left' as const }
    };

    const buildSheet = (rows: any[], countryActual: number | null, label: string, total: number) => {
      const summaryRow = [`${label} — Country Actual: ${countryActual !== null ? countryActual.toFixed(5) + ' mm' : 'N/A'}    Stations shown: ${rows.length} / ${total}`];

      const data = rows.map((r, i) => [
        i + 1,
        r.is_excluded ? 'Excluded' : 'Included',
        r.station_code  ?? '',
        r.state_name    ?? '',
        r.district_name ?? '',
        r.block_name    ?? '',
        r.station_name  ?? '',
        r.data          ?? '',
      ]);

      const ws = XLSX.utils.aoa_to_sheet([summaryRow, headers, ...data]);

      const summaryCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
      if (ws[summaryCell]) ws[summaryCell].s = infoStyle;
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];

      headers.forEach((_, i) => {
        const cell = XLSX.utils.encode_cell({ r: 1, c: i });
        if (ws[cell]) ws[cell].s = hdrStyle;
      });
      ws['!cols'] = colWidths;
      return ws;
    };

    const wb = XLSX.utils.book_new();

    const imdSheetName = `IMD (${this.imdStations.length}-${this.imdTotal})`;
    const awsSheetName = `AWS (${this.awsStations.length}-${this.awsTotal})`;

    if (this.useAws) {
      XLSX.utils.book_append_sheet(wb, buildSheet(this.imdStations, this.countryActualImd, 'IMD Only',  this.imdTotal), imdSheetName);
      XLSX.utils.book_append_sheet(wb, buildSheet(this.awsStations, this.countryActualAws, 'IMD + AWS', this.awsTotal), awsSheetName);
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      FileSaver.saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `IMD_AWS_Stations_${date}.xlsx`);
    } else {
      XLSX.utils.book_append_sheet(wb, buildSheet(this.imdStations, this.countryActualImd, 'IMD Only', this.imdTotal), imdSheetName);
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      FileSaver.saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `DataEntry_Stations_${date}.xlsx`);
    }
  }

  private initPage(): void {
    this.loading = true;
    this.calcMode.loadMode().subscribe({
      next: (res) => {
        this.suppressToggleChange = true;
        this.useAws = res.use_aws === 1;
        this.suppressToggleChange = false;
        this.loading = false;
        this.loadStations();
      },
      error: () => { this.loading = false; }
    });
  }

  /** Undo checkbox change without triggering onToggleChange → setMode */
  private revertToggle(): void {
    this.suppressToggleChange = true;
    this.useAws = !this.useAws;
    setTimeout(() => { this.suppressToggleChange = false; });
  }

  private todayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  runningAddDaily = false;
  addDailyMsg = '';
  addDailyErr = false;

  runAddDailyStationData(): void {
    this.runningAddDaily = true;
    this.addDailyMsg = '';
    this.http.get<any>(`${this.baseUrl}/api/v1/AddDailyStationData`).subscribe({
      next: (res) => {
        this.runningAddDaily = false;
        this.addDailyMsg = res.message ?? 'Done — station_daily_data_updates → station_daily_data';
        this.addDailyErr = false;
      },
      error: (err) => {
        this.runningAddDaily = false;
        this.addDailyMsg = err.error?.message ?? 'Failed';
        this.addDailyErr = true;
      }
    });
  }

  runningDailyStore = false;
  dailyStoreMsg = '';
  dailyStoreErr = false;

  runDailyStore(): void {
    this.runningDailyStore = true;
    this.dailyStoreMsg = '';
    this.http.post<any>(`${this.baseUrl}/api/v1/aws-station/run-daily-store`, {}).subscribe({
      next: (res) => {
        this.runningDailyStore = false;
        this.dailyStoreMsg = res.message ?? 'Done — aws_station_daily_data refreshed';
        this.dailyStoreErr = false;
        this.loadStations();
      },
      error: (err) => {
        this.runningDailyStore = false;
        this.dailyStoreMsg = err.error?.message ?? 'Failed';
        this.dailyStoreErr = true;
      }
    });
  }
}
