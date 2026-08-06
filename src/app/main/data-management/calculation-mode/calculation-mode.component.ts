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

  // Station data — flat across the whole [fromDate, toDate] range, each row
  // carries its own collection_date; pivoted into station-rows × date-columns
  // for display (see pivotRows / pivotDates).
  stationsLoading = false;
  imdStations: any[] = [];
  awsStations: any[] = [];
  imdTotal: number = 0;
  awsTotal: number = 0;
  activeTab: 'imd' | 'aws' = 'imd';
  fromDate: string = this.todayStr();
  toDate: string = this.todayStr();

  // Single day picked → classic flat table (In/Ex column, whole row highlighted
  // red when excluded), same as before the range feature. A real multi-day
  // range → the pivoted table (dates as columns).
  get isSingleDate(): boolean {
    return this.fromDate === this.toDate;
  }

  // Per-date country actual values for the selected range (from fetchCalcModeCountryRange)
  rangeCountryData: { date: string; imd: number | null; aws: number | null }[] = [];
  rangeLoading = false;

  // Fixed "Today" country actual pill at the top — independent of the range
  // picker below, always the real calendar date.
  todayCountryActualImd: number | null = null;
  todayCountryActualAws: number | null = null;
  todayCountryLoading = false;

  // ── Station Data | Station Logs ──────────────────────────────────────────
  rightTab: 'data' | 'logs' = 'data';
  logsTab: 'imd' | 'aws' = 'imd';

  // Data-entry Stations Logs — MC/RMC rows, exactly the data Verification HQ's
  // own Range tab uses (fetchCentreStationSummary), reshaped client-side the
  // same way its transformCumulativeData() does. Numbers only, no buttons.
  dataEntryCentreLogs: { mc: string; total: number; byDate: { [date: string]: { updated: number; notUpdated: number } } }[] = [];
  dataEntryLogsDates: string[] = [];
  dataEntryLogsLoading = false;
  // One metric shown per date column at a time (same as Verification HQ's own
  // Range tab filter) — avoids cramming 2 columns per date into the table.
  dataEntryLogsMetric: 'updated' | 'notUpdated' = 'updated';

  // State AWS Stations Logs — one row per source (7 sources), one column per date.
  awsSourceLogs: { key: string; label: string; url: string; totalStations: number; totalBlocks: number; daily: { date: string; count: number }[] }[] = [];
  awsSourceLogsDates: string[] = [];
  awsSourceLogsLoading = false;

  // City IMD AWS sources that ARE fetched (controllers/scripts/aws/awsFetcher.js)
  // but have no aws_mapping_id entry — their data lands only in its own raw
  // observation table and never reaches aws_station_daily_data, so it isn't
  // part of any calculation. totalBlocks is null for sources with no block
  // column at all (NHP/Zomato) — only Karnataka's table has one. "Total
  // Stations" is an all-time distinct count since there's no master registry
  // for these to compare against.
  excludedAwsSourceLogs: { key: string; label: string; url: string; totalStations: number; totalBlocks: number | null; daily: { date: string; count: number }[] }[] = [];

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
        this.loadRange();
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

  private initPage(): void {
    this.loading = true;
    this.calcMode.loadMode().subscribe({
      next: (res) => {
        this.suppressToggleChange = true;
        this.useAws = res.use_aws === 1;
        this.suppressToggleChange = false;
        this.loading = false;
        this.loadRange();
      },
      error: () => { this.loading = false; }
    });
    this.loadTodayCountryActual();
  }

  /** Undo checkbox change without triggering onToggleChange → setMode */
  private revertToggle(): void {
    this.suppressToggleChange = true;
    this.useAws = !this.useAws;
    setTimeout(() => { this.suppressToggleChange = false; });
  }

  // Fixed "Today" pill — always the real calendar date, independent of fromDate/toDate below.
  private loadTodayCountryActual(): void {
    const today = this.todayStr();
    this.todayCountryLoading = true;
    const payload = { startDate: today, endDate: today };

    this.http.post<any>(`${this.baseUrl}/api/v1/fetchCountryData`, payload).subscribe({
      next: (res) => {
        const d = res.data?.[0] ?? res.data;
        this.todayCountryActualImd = d?.actual_rainfall ?? null;
        this.todayCountryLoading = false;
      },
      error: () => { this.todayCountryLoading = false; }
    });

    this.http.post<any>(`${this.baseUrl}/api/v1/fetchCountryDataWithAWS`, payload).subscribe({
      next: (res) => {
        const d = res.data?.[0] ?? res.data;
        this.todayCountryActualAws = d?.actual_rainfall ?? null;
      },
      error: () => {}
    });
  }

  onRangeChange(): void {
    if (!this.fromDate) this.fromDate = this.todayStr();
    if (!this.toDate) this.toDate = this.fromDate;
    if (this.fromDate > this.toDate) this.toDate = this.fromDate;
    this.loadRange();
    if (this.rightTab === 'logs') this.loadActiveLogsTab();
  }

  private daysBetween(from: string, to: string): number {
    return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000);
  }

  rangeError: string = '';

  loadRange(): void {
    if (this.daysBetween(this.fromDate, this.toDate) + 1 > 31) {
      this.rangeError = 'Date range cannot exceed 31 days.';
      return;
    }
    this.rangeError = '';

    this.stationsLoading = true;
    this.imdStations = [];
    this.awsStations = [];
    this.sortCol = '';
    this.rangeCountryData = [];
    this.rangeLoading = true;

    this.http.post<any>(`${this.baseUrl}/api/v1/fetchCalcModeStations`, { fromDate: this.fromDate, toDate: this.toDate }).subscribe({
      next: (res) => {
        this.imdStations = res.imd ?? [];
        this.awsStations = res.aws ?? [];
        this.imdTotal    = res.imdTotal ?? 0;
        this.awsTotal    = res.awsTotal ?? 0;
        this.stationsLoading = false;
      },
      error: () => { this.stationsLoading = false; }
    });

    this.http.post<any>(`${this.baseUrl}/api/v1/fetchCalcModeCountryRange`, { fromDate: this.fromDate, toDate: this.toDate }).subscribe({
      next: (res) => {
        this.rangeCountryData = (res.data ?? []).map((d: any) => ({
          date: d.date,
          imd: d.imd?.actual_rainfall ?? null,
          aws: d.aws?.actual_rainfall ?? null,
        }));
        this.rangeLoading = false;
      },
      error: () => { this.rangeLoading = false; }
    });
  }

  switchRightTab(tab: 'data' | 'logs'): void {
    if (this.rightTab === tab) return;
    this.rightTab = tab;
    if (tab === 'logs') this.loadActiveLogsTab();
  }

  switchLogsTab(tab: 'imd' | 'aws'): void {
    if (this.logsTab === tab) return;
    this.logsTab = tab;
    this.loadActiveLogsTab();
  }

  private loadActiveLogsTab(): void {
    if (this.logsTab === 'imd') {
      this.loadDataEntryLogs();
    } else {
      this.loadAwsSourceLogs();
    }
  }

  // Reuses the exact endpoint Verification HQ's own Range tab calls
  // (fetchCentreStationSummary) — same per-(MC, date) rows, reshaped into
  // MC rows the same way its transformCumulativeData() does. No new backend
  // logic, no Verified/Not Verified here (not part of this table).
  private loadDataEntryLogs(): void {
    this.dataEntryLogsLoading = true;
    this.http.post<any>(`${this.baseUrl}/api/v1/fetchCentreStationSummary`, { startDate: this.fromDate, endDate: this.toDate }).subscribe({
      next: (res) => {
        const rows: any[] = res.data ?? [];
        const map = new Map<string, { mc: string; total: number; byDate: { [date: string]: { updated: number; notUpdated: number } } }>();
        for (const r of rows) {
          const mc = r['MC or RMC'];
          const date = r['DATE'];
          // Postgres COUNT()/numeric columns come back as strings via the pg
          // driver — coerce to Number here so the TOTAL row sums add instead
          // of string-concatenating into astronomical garbage.
          if (!map.has(mc)) map.set(mc, { mc, total: Number(r['TOTAL STATIONS']) || 0, byDate: {} });
          map.get(mc)!.byDate[date] = {
            updated: Number(r['UPDATED STATIONS']) || 0,
            notUpdated: Number(r['NOT UPDATED STATIONS']) || 0,
          };
        }
        this.dataEntryCentreLogs = Array.from(map.values()).sort((a, b) => a.mc.localeCompare(b.mc));
        this.dataEntryLogsDates = Array.from(new Set(rows.map(r => r['DATE'] as string))).sort();
        this.dataEntryLogsLoading = false;
      },
      error: () => { this.dataEntryLogsLoading = false; }
    });
  }

  centreCell(row: { byDate: { [date: string]: { updated: number; notUpdated: number } } }, date: string): { updated: number; notUpdated: number } {
    return row.byDate[date] ?? { updated: 0, notUpdated: 0 };
  }

  // Whichever metric is currently toggled on, for one row's one date column.
  centreMetric(row: { byDate: { [date: string]: { updated: number; notUpdated: number } } }, date: string): number {
    const cell = this.centreCell(row, date);
    return this.dataEntryLogsMetric === 'updated' ? cell.updated : cell.notUpdated;
  }

  get dataEntryTotalStations(): number {
    return this.dataEntryCentreLogs.reduce((sum, r) => sum + (r.total || 0), 0);
  }

  dataEntryDateMetricTotal(date: string): number {
    return this.dataEntryCentreLogs.reduce((sum, r) => sum + this.centreMetric(r, date), 0);
  }

  dataEntryDateUpdatedTotal(date: string): number {
    return this.dataEntryCentreLogs.reduce((sum, r) => sum + this.centreCell(r, date).updated, 0);
  }

  dataEntryDateNotUpdatedTotal(date: string): number {
    return this.dataEntryCentreLogs.reduce((sum, r) => sum + this.centreCell(r, date).notUpdated, 0);
  }

  private loadAwsSourceLogs(): void {
    this.awsSourceLogsLoading = true;
    this.http.post<any>(`${this.baseUrl}/api/v1/fetchAwsSourceLogs`, { fromDate: this.fromDate, toDate: this.toDate }).subscribe({
      next: (res) => {
        this.awsSourceLogs = res.sources ?? [];
        this.awsSourceLogsDates = res.dates ?? [];
        this.excludedAwsSourceLogs = res.excludedSources ?? [];
        this.awsSourceLogsLoading = false;
      },
      error: () => { this.awsSourceLogsLoading = false; }
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

  // Every date in [fromDate, toDate] inclusive, in order — the column set for
  // the pivoted table. Generated directly from the range (not from whichever
  // async call happens to land first) so columns appear immediately.
  get pivotDates(): string[] {
    const dates: string[] = [];
    let cursor = new Date(`${this.fromDate}T00:00:00`);
    const last = new Date(`${this.toDate}T00:00:00`);
    while (cursor <= last) {
      dates.push(this.formatDateLocal(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  }

  // One row per station (not per station-date), each carrying a map of
  // date -> that station's value/excluded-flag on that date. Built from
  // displayedRows so it stays filtered by activeTab and sorted by whichever
  // identity column was clicked.
  get pivotRows(): { station_code: any; station_name: any; state_name: any; district_name: any; block_name: any; values: { [date: string]: { data: number | null; is_excluded: boolean } } }[] {
    const byStation = new Map<string, any>();
    for (const r of this.displayedRows) {
      let p = byStation.get(r.station_code);
      if (!p) {
        p = {
          station_code: r.station_code,
          station_name: r.station_name,
          state_name: r.state_name,
          district_name: r.district_name,
          block_name: r.block_name,
          values: {},
        };
        byStation.set(r.station_code, p);
      }
      p.values[r.collection_date] = { data: r.data, is_excluded: r.is_excluded };
    }
    return Array.from(byStation.values());
  }

  cellValue(row: { values: { [date: string]: { data: number | null; is_excluded: boolean } } }, date: string): number | null {
    return row.values[date]?.data ?? null;
  }

  cellPositive(row: { values: { [date: string]: { data: number | null; is_excluded: boolean } } }, date: string): boolean {
    const v = row.values[date]?.data;
    return v != null && v > 0;
  }

  cellExcluded(row: { values: { [date: string]: { data: number | null; is_excluded: boolean } } }, date: string): boolean {
    return !!row.values[date]?.is_excluded;
  }

  countryActualForDate(date: string): number | null {
    const c = this.rangeCountryData.find(x => x.date === date);
    if (!c) return null;
    return this.activeTab === 'imd' ? c.imd : c.aws;
  }

  // Distinct stations with valid (non -999.9) data — the table itself now
  // shows every station regardless of value, but this badge is meant to answer
  // "how many actually have real data", so it filters here.
  get imdStationCount(): number {
    return new Set(this.imdStations.filter(r => Number(r.data) !== -999.9).map(r => r.station_code)).size;
  }

  get awsStationCount(): number {
    return new Set(this.awsStations.filter(r => Number(r.data) >= 0).map(r => r.station_code)).size;
  }

  private formatDateLocal(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
    const date = `${this.fromDate}_to_${this.toDate}`.replace(/-/g, '');

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

    const applyCommonStyle = (ws: XLSX.WorkSheet, headers: string[], colWidths: { wch: number }[]) => {
      const summaryCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
      if (ws[summaryCell]) ws[summaryCell].s = infoStyle;
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];
      headers.forEach((_, i) => {
        const cell = XLSX.utils.encode_cell({ r: 1, c: i });
        if (ws[cell]) ws[cell].s = hdrStyle;
      });
      ws['!cols'] = colWidths;
    };

    // Single date: one flat row per station — small and simple, same as before.
    const buildFlatSheet = (rows: any[], label: string, total: number) => {
      const headers = ['S.No', 'In/Ex', 'Station Code', 'State', 'District', 'Block', 'Station Name', 'Value (mm)'];
      const colWidths = [{ wch: 6 }, { wch: 10 }, { wch: 16 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 28 }, { wch: 12 }];
      const summaryRow = [`${label} — ${this.fromDate}    Stations shown: ${rows.length} / ${total}`];
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
      applyCommonStyle(ws, headers, colWidths);
      return ws;
    };

    // Real multi-day range: pivot by station (one row per station, one column
    // per date) instead of one row per station-per-date — a 30-day range with
    // thousands of stations was generating hundreds of thousands of flat rows,
    // which froze the tab building/writing the sheet. Pivoting keeps the row
    // count at "number of stations" regardless of how many dates are picked.
    const buildPivotSheet = (rows: any[], label: string, total: number) => {
      const dates = this.pivotDates;
      const headers = ['S.No', 'Station Code', 'State', 'District', 'Block', 'Station Name', ...dates];
      const colWidths = [{ wch: 6 }, { wch: 16 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 28 }, ...dates.map(() => ({ wch: 12 }))];

      const byStation = new Map<string, any>();
      for (const r of rows) {
        let p = byStation.get(r.station_code);
        if (!p) {
          p = { station_code: r.station_code, station_name: r.station_name, state_name: r.state_name, district_name: r.district_name, block_name: r.block_name, values: {} };
          byStation.set(r.station_code, p);
        }
        p.values[r.collection_date] = { data: r.data, is_excluded: r.is_excluded };
      }
      const pivoted = Array.from(byStation.values());

      const summaryRow = [`${label} — ${this.fromDate} to ${this.toDate}    Stations shown: ${pivoted.length} / ${total}`];
      const data = pivoted.map((p, i) => [
        i + 1,
        p.station_code  ?? '',
        p.state_name    ?? '',
        p.district_name ?? '',
        p.block_name    ?? '',
        p.station_name  ?? '',
        ...dates.map(d => {
          const cell = p.values[d];
          if (!cell || cell.data == null) return '';
          return cell.is_excluded ? `${cell.data} (Excluded)` : cell.data;
        }),
      ]);
      const ws = XLSX.utils.aoa_to_sheet([summaryRow, headers, ...data]);
      applyCommonStyle(ws, headers, colWidths);
      return ws;
    };

    const buildSheet = this.isSingleDate ? buildFlatSheet : buildPivotSheet;

    const wb = XLSX.utils.book_new();

    const imdSheetName = `IMD (${this.imdStationCount}-${this.imdTotal})`;
    const awsSheetName = `AWS (${this.awsStationCount}-${this.awsTotal})`;

    if (this.useAws) {
      XLSX.utils.book_append_sheet(wb, buildSheet(this.imdStations, 'IMD Only',  this.imdTotal), imdSheetName);
      XLSX.utils.book_append_sheet(wb, buildSheet(this.awsStations, 'IMD + AWS', this.awsTotal), awsSheetName);
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      FileSaver.saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `IMD_AWS_Stations_${date}.xlsx`);
    } else {
      XLSX.utils.book_append_sheet(wb, buildSheet(this.imdStations, 'IMD Only', this.imdTotal), imdSheetName);
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      FileSaver.saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `DataEntry_Stations_${date}.xlsx`);
    }
  }

  downloadLogsExcel(): void {
    if (this.logsTab === 'imd') {
      this.downloadDataEntryLogsExcel();
    } else {
      this.downloadAwsSourceLogsExcel();
    }
  }

  private logsRangeSuffix(): string {
    return `${this.fromDate}_to_${this.toDate}`.replace(/-/g, '');
  }

  private styleHeaderRow(ws: XLSX.WorkSheet, headers: string[]): void {
    const hdrStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '002467' } },
      alignment: { horizontal: 'center' as const },
    };
    headers.forEach((_, i) => {
      const cell = XLSX.utils.encode_cell({ r: 0, c: i });
      if (ws[cell]) ws[cell].s = hdrStyle;
    });
  }

  // Exports the full Updated + Not Updated breakdown per date, regardless of
  // which single metric the on-screen toggle currently shows — Excel isn't
  // width-constrained the way the table is.
  private downloadDataEntryLogsExcel(): void {
    const headers = ['S.No', 'MC or RMC', 'Total Stations'];
    this.dataEntryLogsDates.forEach(d => headers.push(`${d} Updated`, `${d} Not Updated`));

    const data = this.dataEntryCentreLogs.map((row, i) => {
      const line: (string | number)[] = [i + 1, row.mc, row.total];
      this.dataEntryLogsDates.forEach(d => {
        const cell = this.centreCell(row, d);
        line.push(cell.updated, cell.notUpdated);
      });
      return line;
    });

    const totalLine: (string | number)[] = ['', 'TOTAL', this.dataEntryTotalStations];
    this.dataEntryLogsDates.forEach(d => {
      totalLine.push(this.dataEntryDateUpdatedTotal(d), this.dataEntryDateNotUpdatedTotal(d));
    });
    data.push(totalLine);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    this.styleHeaderRow(ws, headers);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data-entry Stations');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    FileSaver.saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `DataEntry_Stations_Data_Logs_${this.logsRangeSuffix()}.xlsx`);
  }

  private downloadAwsSourceLogsExcel(): void {
    const headers = ['Source', 'URL', 'Total Stations', 'Blocks Included', ...this.awsSourceLogsDates];
    const data = this.awsSourceLogs.map(src => [
      src.label,
      src.url,
      src.totalStations,
      src.totalBlocks,
      ...src.daily.map(d => d.count),
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    this.styleHeaderRow(ws, headers);

    const excludedHeaders = ['Source', 'URL', 'Total Stations (all-time)', 'Blocks Included', ...this.awsSourceLogsDates];
    const excludedData = this.excludedAwsSourceLogs.map(src => [
      src.label,
      src.url,
      src.totalStations,
      src.totalBlocks !== null ? src.totalBlocks : 'Not available',
      ...src.daily.map(d => d.count),
    ]);
    const excludedWs = XLSX.utils.aoa_to_sheet([excludedHeaders, ...excludedData]);
    this.styleHeaderRow(excludedWs, excludedHeaders);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Included Sources');
    XLSX.utils.book_append_sheet(wb, excludedWs, 'Not Included Sources');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    FileSaver.saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `AWS_Source_Data_Logs_${this.logsRangeSuffix()}.xlsx`);
  }

  private todayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  // ── Cron trigger buttons ──────────────────────────────────────────────────
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
        this.loadRange();
      },
      error: (err) => {
        this.runningDailyStore = false;
        this.dailyStoreMsg = err.error?.message ?? 'Failed';
        this.dailyStoreErr = true;
      }
    });
  }
}
