import { Component, OnInit } from '@angular/core';
import { FetchStationDataService } from 'src/app/services/station/station.service';
import { DataEntryLockService } from 'src/app/services/dataEntryLock.service';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

interface RevisionLogRow {
  revisionDate: string;
  dataDate: string;
  stationCount: number;
  stationNames: string[];
  centreNames: string[];
  backDated: boolean;
  expanded: boolean;
  loadingDetails: boolean;
  details: StationRevisionDetail[] | null;
}

interface StationRevisionDetail {
  stationCode: string;
  stationName: string;
  centreType: string;
  centreName: string;
  stateName: string;
  districtName: string;
  value: number | null;
  dataDate: string;
  updatedAt: string;
  backDated: boolean;
  // From rainfalldataedits. editCount === 0 means the edit predates that log
  // table, so there is no before/after to show for it.
  oldValue: number | null;
  newValue: number | null;
  editType: string | null;
  editCount: number;
}

interface McWiseRow {
  centreType: string;
  centreName: string;
  sameDayCount: number;
  backDatedCount: number;
  stationCount: number;
  stationNames: string[];
  expandedFilter: 'same-day' | 'back-dated' | null;
  loadingDetails: boolean;
  details: StationRevisionDetail[] | null;
}

interface LockTimelineSegment {
  isLocked: boolean;
  startPct: number;
  widthPct: number;
}

interface TimelineDot {
  leftPct: number;
  backDated: boolean;
  tooltip: string;
}

@Component({
  selector: 'app-data-entry-investigation',
  templateUrl: './data-entry-investigation.component.html',
  styleUrls: ['./data-entry-investigation.component.css']
})
export class DataEntryInvestigationComponent implements OnInit {
  activeTab: 'range' | 'daywise' = 'daywise';
  singleDate: string = this.formatDateLocal(new Date());    // Day Wise tab

  // Range tab — explicit from/to, both inclusive. Seeded to the last week
  // simply as a starting point; the user picks whatever range they want.
  today: string = this.formatDateLocal(new Date());
  fromDate: string = this.formatDateLocal(this.addDays(new Date(), -6));
  toDate: string = this.formatDateLocal(new Date());
  rangeError: string = '';

  loading: boolean = false;
  downloading: boolean = false;
  message: string = '';
  messageType: 'success' | 'error' = 'success';

  // ── Header toolbar: search + type filter, applied client-side to whatever
  // the current date window already loaded (no extra round trip). Both tables,
  // their expanded detail rows, the stat tiles and the downloads all honour
  // them, so what you export is what you're looking at.
  searchTerm: string = '';
  typeFilter: 'all' | 'back-dated' | 'same-day' = 'all';
  lastUpdated: Date | null = null;

  logRows: RevisionLogRow[] = [];
  filteredLogRows: RevisionLogRow[] = [];

  // ── Analytics derived client-side from logRows — no separate endpoint ──
  backDatedCount = 0;
  sameDayCount = 0;

  // ── MC-Wise Reupdates panel (always visible, left of Revision Log) ──
  loadingMcWise: boolean = false;
  mcWiseRows: McWiseRow[] = [];
  filteredMcWiseRows: McWiseRow[] = [];

  // ── Data Entry Lock status + Day Wise timeline ───────────────────────
  isLocked: boolean = false;
  lockTimelineSegments: LockTimelineSegment[] = [];
  timelineDots: TimelineDot[] = [];
  hoveredDot: TimelineDot | null = null;
  popupPos: { left: number; top: number } = { left: 0, top: 0 };

  // ── Timeline zoom (Day Wise) — spreads out overlapping pins on busy days ──
  zoomLevel: number = 1;
  readonly maxZoom: number = 24;
  hourLabels: string[] = Array.from({ length: 25 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

  constructor(
    private stationService: FetchStationDataService,
    private lockService: DataEntryLockService
  ) {}

  ngOnInit(): void {
    this.loadLog();
    this.loadLockStatus();
    if (this.activeTab === 'daywise') {
      this.loadLockTimeline();
      this.loadTimelineDots();
    }
  }

  switchTab(tab: 'range' | 'daywise'): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.loadLog();
    if (tab === 'daywise') {
      this.loadLockTimeline();
      this.loadTimelineDots();
    }
  }

  /** Which filter is currently active — { fromDate, toDate } for Range, { date } for Day Wise — used by every fetch below. */
  private currentParams(): { date?: string; fromDate?: string; toDate?: string } {
    return this.activeTab === 'daywise'
      ? { date: this.singleDate }
      : { fromDate: this.fromDate, toDate: this.toDate };
  }

  /** Both ends required, and From must not sit after To — checked before any fetch on the Range tab. */
  private validateRange(): boolean {
    if (!this.fromDate || !this.toDate) {
      this.rangeError = 'Please select both From date and To date.';
      return false;
    }
    if (this.fromDate > this.toDate) {
      this.rangeError = 'From date cannot be after To date.';
      return false;
    }
    this.rangeError = '';
    return true;
  }

  onRangeChange(): void {
    if (!this.validateRange()) return;
    this.loadLog();
  }

  // ── Header toolbar: search + type filter ─────────────────────────────────
  // Purely client-side over the rows the current date window already returned,
  // so typing is instant and costs no requests. Filtered lists are rebuilt into
  // arrays (rather than computed by a template getter) so change detection
  // isn't re-filtering on every cycle, and they hold the SAME row objects —
  // expanded/details state survives a filter change.

  get filtersActive(): boolean {
    return this.searchTerm.trim().length > 0 || this.typeFilter !== 'all';
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  setTypeFilter(filter: 'all' | 'back-dated' | 'same-day'): void {
    this.typeFilter = filter;
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.typeFilter = 'all';
    this.applyFilters();
  }

  /** Refresh icon in the header — reloads everything the active tab shows. */
  refreshAll(): void {
    this.loadLog();
    this.loadLockStatus();
    if (this.activeTab === 'daywise') {
      this.loadLockTimeline();
      this.loadTimelineDots();
    }
  }

  private applyFilters(): void {
    // Each table matches on the names it contains AND the names on the other
    // side of the grouping, so one search term narrows both panels: searching a
    // centre keeps the log groups that centre edited in, and searching a station
    // keeps the centres that station belongs to.
    this.filteredLogRows = this.logRows.filter(r =>
      this.matchesType(r.backDated) &&
      this.matchesSearch(r.revisionDate, r.dataDate, r.stationNames.join(' '), r.centreNames.join(' '))
    );
    // A centre stays visible under a type filter as long as it has at least one
    // edit of that kind — the counts themselves are still shown in full.
    this.filteredMcWiseRows = this.mcWiseRows.filter(m =>
      (this.typeFilter === 'all'
        || (this.typeFilter === 'back-dated' ? m.backDatedCount > 0 : m.sameDayCount > 0)) &&
      this.matchesSearch(`${m.centreType} ${m.centreName}`, m.stationNames.join(' '))
    );
    this.computeAnalytics();
  }

  private matchesType(backDated: boolean): boolean {
    if (this.typeFilter === 'all') return true;
    return backDated === (this.typeFilter === 'back-dated');
  }

  private matchesSearch(...fields: (string | null | undefined)[]): boolean {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) return true;
    return fields.some(f => (f || '').toLowerCase().includes(q));
  }

  /** Search applied to an inner station row — station, code, state, district or centre. */
  private matchesDetail(d: StationRevisionDetail): boolean {
    return this.matchesSearch(
      d.stationName, d.stationCode, d.stateName, d.districtName, `${d.centreType} ${d.centreName}`
    );
  }

  onDayWiseDateChange(): void {
    this.resetZoom();
    this.loadLog();
    this.loadLockTimeline();
    this.loadTimelineDots();
  }

  loadLog(): void {
    if (this.activeTab === 'range' && !this.validateRange()) return;
    this.loading = true;
    this.message = '';
    this.stationService.fetchRevisionLog(this.currentParams()).subscribe({
      next: (res) => {
        this.logRows = (res.data || []).map((r: any) => ({
          revisionDate: r.revision_date,
          dataDate: r.data_date,
          stationCount: r.station_count,
          stationNames: r.station_names || [],
          centreNames: r.centre_names || [],
          backDated: r.data_date < r.revision_date,
          expanded: false,
          loadingDetails: false,
          details: null
        }));
        this.applyFilters();
        this.lastUpdated = new Date();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageType = 'error';
        this.message = 'Failed to load revision log. Please try again.';
      }
    });
    this.loadMcWiseReupdates();
  }

  loadMcWiseReupdates(): void {
    this.loadingMcWise = true;
    this.stationService.fetchRevisionLogByCentre(this.currentParams()).subscribe({
      next: (res) => {
        this.mcWiseRows = (res.data || []).map((m: any) => ({
          centreType: m.centre_type,
          centreName: m.centre_name,
          sameDayCount: m.same_day_count,
          backDatedCount: m.back_dated_count,
          stationCount: m.station_count,
          stationNames: m.station_names || [],
          expandedFilter: null,
          loadingDetails: false,
          details: null
        }));
        this.applyFilters();
        this.loadingMcWise = false;
      },
      error: () => { this.loadingMcWise = false; }
    });
  }

  /** Click a centre's Same Day / Backdate count to expand (or switch) the filtered per-station breakdown. */
  toggleMcDetails(row: McWiseRow, filter: 'same-day' | 'back-dated'): void {
    row.expandedFilter = row.expandedFilter === filter ? null : filter;
    if (row.expandedFilter && row.details === null) {
      row.loadingDetails = true;
      this.stationService.fetchCentreRevisionDetails(row.centreType, row.centreName, this.currentParams()).subscribe({
        next: (res) => {
          row.details = (res.data || []).map((d: any) => ({
            stationCode: d.station_code,
            stationName: d.station_name,
            centreType: d.centre_type,
            centreName: d.centre_name,
            stateName: d.state_name,
            districtName: d.district_name,
            value: d.station_value,
            dataDate: d.data_date,
            updatedAt: d.updated_at,
            backDated: d.back_dated,
            oldValue: d.old_value ?? null,
            newValue: d.new_value ?? null,
            editType: d.edit_type ?? null,
            editCount: d.edit_count ?? 0
          }));
          row.loadingDetails = false;
        },
        error: () => {
          row.loadingDetails = false;
          row.details = [];
        }
      });
    }
  }

  /** Details for a centre row, filtered to whichever count (same-day / back-dated) is currently expanded, then by the header search. */
  getFilteredMcDetails(row: McWiseRow): StationRevisionDetail[] {
    if (!row.details || !row.expandedFilter) return [];
    const wantBackDated = row.expandedFilter === 'back-dated';
    return row.details.filter(d => d.backDated === wantBackDated && this.matchesDetail(d));
  }

  /** Inner station rows of a Revision Log group, narrowed by the header search. */
  getFilteredDetails(row: RevisionLogRow): StationRevisionDetail[] {
    if (!row.details) return [];
    return row.details.filter(d => this.matchesDetail(d));
  }

  // ── Downloads ────────────────────────────────────────────────────────────
  // Both workbooks come from one fetch of the flat station rows: the summary
  // sheet is those rows grouped the way the on-screen table groups them, and
  // the detail sheet is every row un-grouped. The on-screen tables only hold
  // the inner rows of groups the user has expanded, so exporting from them
  // would silently miss everything still collapsed — hence the extra fetch.

  downloadRevisionLog(): void {
    this.runExport('revision', 'Revision-Log');
  }

  downloadMcWiseLog(): void {
    this.runExport('mcwise', 'MC-Wise-Reupdates');
  }

  private runExport(kind: 'revision' | 'mcwise', fileLabel: string): void {
    if (this.activeTab === 'range' && !this.validateRange()) return;
    this.downloading = true;
    this.message = '';
    this.stationService.fetchRevisionLogExport(this.currentParams()).subscribe({
      next: (res) => {
        // Same search/type filter the tables are showing — the export should
        // never contain rows the user has filtered off screen.
        const rows: any[] = (res.data || []).filter((r: any) => this.exportRowMatches(r));
        if (rows.length === 0) {
          this.downloading = false;
          this.messageType = 'error';
          this.message = this.filtersActive
            ? 'Nothing to download — no rows match the current search or filter.'
            : 'Nothing to download for the selected period.';
          return;
        }
        const summary = kind === 'revision'
          ? this.buildRevisionSummarySheet(rows)
          : this.buildMcWiseSummarySheet(rows);
        this.writeWorkbook(fileLabel, summary, this.buildDetailSheet(rows));
        this.downloading = false;
      },
      error: () => {
        this.downloading = false;
        this.messageType = 'error';
        this.message = 'Failed to prepare the download. Please try again.';
      }
    });
  }

  /** The header search/type filter applied to a flat export row (snake_case, straight from the API). */
  private exportRowMatches(r: any): boolean {
    if (!this.matchesType(!!r.back_dated)) return false;
    return this.matchesSearch(
      r.station_name, r.station_code, r.state_name, r.district_name,
      `${r.centre_type} ${r.centre_name}`, r.revision_date, r.data_date
    );
  }

  /** Parent rows of the Revision Log table: one per (revision date, data date). */
  private buildRevisionSummarySheet(rows: any[]): any[] {
    const groups = new Map<string, any>();
    for (const r of rows) {
      const key = `${r.revision_date}|${r.data_date}`;
      let g = groups.get(key);
      if (!g) {
        g = {
          'Revision Date': r.revision_date,
          'Data Date': r.data_date,
          'Stations': 0,
          'Type': r.back_dated ? 'Back-dated edit' : 'Same-day correction'
        };
        groups.set(key, g);
      }
      g['Stations']++;
    }
    return Array.from(groups.values());
  }

  /** Parent rows of the MC-Wise table: one per centre, with the same two counts. */
  private buildMcWiseSummarySheet(rows: any[]): any[] {
    const groups = new Map<string, any>();
    for (const r of rows) {
      const key = `${r.centre_type}|${r.centre_name}`;
      let g = groups.get(key);
      if (!g) {
        g = {
          'MC / RMC': `${r.centre_type} ${r.centre_name}`,
          'Same Day': 0,
          'Backdate': 0,
          'Stations': 0
        };
        groups.set(key, g);
      }
      if (r.back_dated) { g['Backdate']++; } else { g['Same Day']++; }
      g['Stations']++;
    }
    return Array.from(groups.values());
  }

  /** Every inner row, flat, with its parent's columns repeated so it can be filtered/pivoted. */
  private buildDetailSheet(rows: any[]): any[] {
    return rows.map(r => ({
      'Revision Date': r.revision_date,
      'Data Date': r.data_date,
      'Type': r.back_dated ? 'Back-dated edit' : 'Same-day correction',
      'MC / RMC': `${r.centre_type} ${r.centre_name}`,
      'Station Code': r.station_code,
      'Station': r.station_name,
      'State': r.state_name,
      'District': r.district_name,
      'Value (mm)': r.station_value,
      'Old Value': r.edit_count > 0 ? this.formatEditValue(r.old_value) : '',
      'New Value': r.edit_count > 0 ? this.formatEditValue(r.new_value) : '',
      'Change Type': r.edit_count > 0 ? this.editTypeLabel(r.edit_type) : 'Not tracked',
      'Edits': r.edit_count || 0,
      'Updated At': r.updated_at
    }));
  }

  private writeWorkbook(fileLabel: string, summary: any[], details: any[]): void {
    const workbook: XLSX.WorkBook = {
      Sheets: {
        'Summary': XLSX.utils.json_to_sheet(summary),
        'Station Details': XLSX.utils.json_to_sheet(details)
      },
      SheetNames: ['Summary', 'Station Details']
    };
    const buffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
    });
    const period = this.activeTab === 'daywise' ? this.singleDate : `${this.fromDate}_to_${this.toDate}`;
    const suffix = this.filtersActive ? '_filtered' : '';
    FileSaver.saveAs(blob, `${fileLabel}_${period}${suffix}.xlsx`);
  }

  /** -999.9 is the "no reading" sentinel — show it as such rather than as a number. */
  formatEditValue(v: number | null): string {
    if (v === null || v === undefined) return '—';
    return v < 0 ? 'No data' : `${v}`;
  }

  /** Human label for the kind of change, used as the badge next to the old → new pair. */
  editTypeLabel(editType: string | null): string {
    switch (editType) {
      case 'fill':       return 'Filled in';
      case 'erase':      return 'Erased';
      case 'correction': return 'Corrected';
      default:           return '';
    }
  }

  /** Tiles track the filtered view, so they always agree with the table under them. */
  private computeAnalytics(): void {
    const totalRevisionEvents = this.filteredLogRows.reduce((sum, r) => sum + r.stationCount, 0);
    this.backDatedCount = this.filteredLogRows
      .filter(r => r.backDated)
      .reduce((sum, r) => sum + r.stationCount, 0);
    this.sameDayCount = totalRevisionEvents - this.backDatedCount;
  }

  /** Click the Stations count to expand/collapse the per-station detail breakdown for that row. */
  toggleStationDetails(row: RevisionLogRow): void {
    row.expanded = !row.expanded;
    if (row.expanded && row.details === null) {
      row.loadingDetails = true;
      this.stationService.fetchRevisionStationDetails(row.revisionDate, row.dataDate).subscribe({
        next: (res) => {
          row.details = (res.data || []).map((d: any) => ({
            stationCode: d.station_code,
            stationName: d.station_name,
            centreType: d.centre_type,
            centreName: d.centre_name,
            stateName: d.state_name,
            districtName: d.district_name,
            value: d.station_value,
            dataDate: d.data_date,
            updatedAt: d.updated_at,
            backDated: row.backDated,
            oldValue: d.old_value ?? null,
            newValue: d.new_value ?? null,
            editType: d.edit_type ?? null,
            editCount: d.edit_count ?? 0
          }));
          row.loadingDetails = false;
        },
        error: () => {
          row.loadingDetails = false;
          row.details = [];
        }
      });
    }
  }

  loadLockStatus(): void {
    this.lockService.loadLock().subscribe({
      next: (res) => { this.isLocked = res.is_locked === 1; },
      error: () => {}
    });
  }

  loadLockTimeline(): void {
    this.lockService.getLockHistoryForDate(this.singleDate).subscribe({
      next: (res) => {
        this.lockTimelineSegments = this.computeLockTimeline(res.initialState, res.transitions || [], this.singleDate);
      },
      error: () => { this.lockTimelineSegments = []; }
    });
  }

  /** One dot per revision event that day, positioned at its time of day — yellow for same-day, red for back-dated. */
  loadTimelineDots(): void {
    this.stationService.fetchRevisionEventsForDate(this.singleDate).subscribe({
      next: (res) => {
        this.timelineDots = this.computeTimelineDots(res.data || [], this.singleDate);
      },
      error: () => { this.timelineDots = []; }
    });
  }

  // Positioned via the pin's actual viewport rect (position: fixed) rather than
  // a %-based offset inside the scrollable timeline — that was getting clipped
  // by the scroll container's overflow, cutting the popup off.
  onPinHover(event: MouseEvent, dot: TimelineDot): void {
    this.hoveredDot = dot;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.popupPos = { left: rect.left + rect.width / 2, top: rect.top };
  }

  private computeTimelineDots(events: { updated_at: string; back_dated: boolean; centre_type: string; centre_name: string }[], targetDate: string): TimelineDot[] {
    const dayStart = new Date(`${targetDate}T00:00:00`);
    const totalMs = 24 * 60 * 60 * 1000;
    return events.map(e => {
      const t = new Date(e.updated_at);
      const timeLabel = t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      return {
        leftPct: ((t.getTime() - dayStart.getTime()) / totalMs) * 100,
        backDated: e.back_dated,
        tooltip: `${e.centre_type} ${e.centre_name} — ${timeLabel}`
      };
    });
  }

  zoomIn(): void {
    this.zoomLevel = Math.min(this.maxZoom, this.zoomLevel * 2);
  }

  zoomOut(): void {
    this.zoomLevel = Math.max(1, this.zoomLevel / 2);
  }

  resetZoom(): void {
    this.zoomLevel = 1;
  }

  private addDays(date: Date, delta: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    return d;
  }

  private formatDateLocal(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  /** Walks the day's lock transitions into contiguous green/red segments (as % of the 24h day) for the timeline bar. */
  private computeLockTimeline(initialState: number, transitions: { is_locked: number; changed_at: string }[], targetDate: string): LockTimelineSegment[] {
    const dayStart = new Date(`${targetDate}T00:00:00`);
    const isToday = targetDate === this.formatDateLocal(new Date());
    const dayEnd = isToday ? new Date() : new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const totalMs = 24 * 60 * 60 * 1000;

    const segments: LockTimelineSegment[] = [];
    let cursor = dayStart;
    let state = initialState;

    for (const t of transitions) {
      const changedAt = new Date(t.changed_at);
      if (changedAt > cursor) {
        segments.push({
          isLocked: state === 1,
          startPct: ((cursor.getTime() - dayStart.getTime()) / totalMs) * 100,
          widthPct: ((changedAt.getTime() - cursor.getTime()) / totalMs) * 100
        });
      }
      cursor = changedAt;
      state = t.is_locked;
    }

    if (dayEnd > cursor) {
      segments.push({
        isLocked: state === 1,
        startPct: ((cursor.getTime() - dayStart.getTime()) / totalMs) * 100,
        widthPct: ((dayEnd.getTime() - cursor.getTime()) / totalMs) * 100
      });
    }

    return segments;
  }
}
