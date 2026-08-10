import { Component, OnInit, OnDestroy, ViewChild, ElementRef, NgZone, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as L from 'leaflet';
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

/**
 * One station's activity on one revision day, as returned by the API. Several
 * of these merge into a single dot when the map is showing the whole range.
 */
interface MapStation {
  revisionDate: string;
  stationCode: string;
  stationName: string;
  lat: number;
  lon: number;
  centreType: string;
  centreName: string;
  stateName: string;
  districtName: string;
  revisionCount: number;
  backDatedCount: number;
  sameDayCount: number;
  editCount: number;
  lastUpdated: string;
  lastDataDate: string;
  /** The data dates behind the two counts, so the popup can name them. */
  backDatedDates: string[];
  sameDayDates: string[];
}

/** One day-slot on the Range tab's timeline scrubber. */
interface RangeDay {
  date: string;
  label: string;
  stations: number;
  edits: number;
  backDated: number;
  sameDay: number;
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
export class DataEntryInvestigationComponent implements OnInit, OnDestroy {
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

  // ── India MC/RMC-wise map ────────────────────────────────────────────────
  // Base layer is the India state map with everything outside the country
  // dimmed; station dots ride on top, coloured by back-dated vs same-day.
  // Open by default — the Visualise button hides it rather than reveals it.
  showMap: boolean = true;
  loadingBoundaries: boolean = false;
  loadingPoints: boolean = false;
  /** Both fetches run concurrently — the loader stays up until both are done.
   *  The page-level `loading` counts too: on a cold start the map is on screen
   *  before loadMapPoints() has even been reached, and an empty grey panel with
   *  no spinner reads as a broken map rather than a loading one. */
  get loadingMap(): boolean {
    return this.loadingBoundaries || this.loadingPoints || (this.loading && this.showMap);
  }
  mapPoints: MapStation[] = [];
  filteredMapPoints: MapStation[] = [];
  showStations: boolean = true;
  mapError: string = '';
  dotSize: number = 3;
  mapFullscreen: boolean = false;
  mapBase: 'plain' | 'satellite' | 'streets' = 'satellite';
  private dotValueEl: HTMLElement | null = null;
  private baseLayer: L.TileLayer | null = null;

  // Range tab timeline scrubber
  rangeDays: RangeDay[] = [];
  scrubIndex: number | null = null;   // null = whole range
  scrubPlaying: boolean = false;
  scrubDragging: boolean = false;
  // The timeline is drawn as a chart of the range, so a glance shows where the
  // editing actually happened instead of an evenly-spaced row of dots. The two
  // series are the same split the map colours stations by.
  chartMax: number = 0;
  sameDayAreaPath: string = '';
  sameDayLinePath: string = '';
  backDatedAreaPath: string = '';
  backDatedLinePath: string = '';
  // Same-day corrections dwarf back-dated edits on most ranges, so the line
  // that matters for an investigation starts as the only one drawn; the legend
  // switches turn each series on and off.
  showSameDay: boolean = false;
  showBackDated: boolean = true;
  hoverIndex: number | null = null;
  @ViewChild('scrubTrack') scrubTrack?: ElementRef<HTMLElement>;
  private scrubTimer: any = null;
  private hoverPinTimer: any = null;

  private map: L.Map | null = null;
  private markerLayer: L.LayerGroup = L.layerGroup();
  private boundaryLayer: L.LayerGroup = L.layerGroup();
  // Fetched once on first render and reused for every later filter/date change.
  private boundaryCache: { key: string; geo: any }[] | null = null;
  private countryGeo: any = null;

  constructor(
    private stationService: FetchStationDataService,
    private lockService: DataEntryLockService,
    private http: HttpClient,
    private zone: NgZone
  ) {}

  // ── Full-size table ──────────────────────────────────────────────────────
  // Both cards scroll inside a fixed height next to the map; this opens either
  // one over the page so a long table can be read without that letterbox.
  expandedTable: 'mc' | 'log' | null = null;

  openTable(which: 'mc' | 'log'): void {
    this.expandedTable = which;
  }

  closeTable(): void {
    this.expandedTable = null;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    // Leaflet's own fullscreen is a separate toggle, so only close the table.
    if (this.expandedTable) this.closeTable();
  }

  ngOnInit(): void {
    this.loadLog();
    this.loadLockStatus();
    if (this.activeTab === 'daywise') {
      this.loadLockTimeline();
      this.loadTimelineDots();
    }
  }

  ngOnDestroy(): void {
    this.stopScrubPlayback();
    this.clearHoverPin();
    if (this.map) {
      this.map.remove();
      this.map = null;
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
    // A station dot counts as back-dated if any of its edits in scope was.
    // Rows are per station per day, so once the day filter has been applied
    // they're merged back down to one dot per station.
    const day = this.scrubDate;
    const rows = this.mapPoints.filter(p =>
      (!day || p.revisionDate === day) &&
      (this.typeFilter === 'all'
        || (this.typeFilter === 'back-dated' ? p.backDatedCount > 0 : p.sameDayCount > 0)) &&
      this.matchesSearch(
        p.stationName, p.stationCode, p.stateName, p.districtName, `${p.centreType} ${p.centreName}`
      )
    );
    this.filteredMapPoints = this.mergeByStation(rows);
    this.computeAnalytics();
    this.renderMarkers();
  }

  /** Collapse per-day rows for the same station into the single dot it draws as. */
  private mergeByStation(rows: MapStation[]): MapStation[] {
    const merged = new Map<string, MapStation>();
    for (const r of rows) {
      const seen = merged.get(r.stationCode);
      if (!seen) {
        merged.set(r.stationCode, { ...r });
        continue;
      }
      seen.revisionCount += r.revisionCount;
      seen.backDatedCount += r.backDatedCount;
      seen.sameDayCount += r.sameDayCount;
      seen.editCount += r.editCount;
      if (r.lastUpdated > seen.lastUpdated) seen.lastUpdated = r.lastUpdated;
      if (r.lastDataDate > seen.lastDataDate) seen.lastDataDate = r.lastDataDate;
      // Replaced rather than pushed into: the spread above copies the array
      // reference, so mutating in place would also edit the source row.
      seen.backDatedDates = this.unionDates(seen.backDatedDates, r.backDatedDates);
      seen.sameDayDates = this.unionDates(seen.sameDayDates, r.sameDayDates);
    }
    return Array.from(merged.values());
  }

  /** The same data date can be touched on several revision days. */
  private unionDates(a: string[], b: string[]): string[] {
    return Array.from(new Set([...a, ...b])).sort();
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
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageType = 'error';
        this.message = 'Failed to load revision log. Please try again.';
      }
    });
    this.loadMcWiseReupdates();
    // Only costs a query for people who actually opened the map.
    if (this.showMap) this.loadMapPoints();
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

  // ── India MC/RMC-wise map ────────────────────────────────────────────────

  /** Show/hide the left map panel. Data is fetched the first time it's opened. */
  toggleMap(): void {
    this.showMap = !this.showMap;
    if (this.showMap && this.mapPoints.length === 0) {
      this.loadMapPoints();
    }
  }

  // Fires as the map container enters or leaves the DOM behind *ngIf="showMap".
  // The init is deferred a tick so Leaflet measures a laid-out element and so
  // the loading flags aren't mutated inside the change-detection pass that
  // created the element.
  @ViewChild('stationMap') set stationMapEl(el: ElementRef<HTMLElement> | undefined) {
    if (el) {
      setTimeout(() => this.initMap(el.nativeElement));
    } else if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initMap(el: HTMLElement): void {
    if (this.map) return;

    // No tile layer, matching the other iRAINS product maps — the MC/RMC
    // boundaries are the basemap. Pan/zoom stay enabled since this one is for
    // digging into stations rather than for print.
    // scrollWheelZoom stays ON: this is an investigation map you dig around in,
    // not one of the locked print-style product maps.
    this.map = L.map(el, {
      center: [22.5, 80],
      zoom: 4,
      zoomSnap: 0.25,
      scrollWheelZoom: true,
      wheelPxPerZoomLevel: 120
    });
    this.map.fitBounds([[6.5, 68], [37.5, 97.5]]);
    // Above the tiles (200), below the overlay pane (400) that holds the
    // borders and the station dots.
    this.map.createPane('di-mask').style.zIndex = '350';
    this.boundaryLayer.addTo(this.map);
    this.markerLayer.addTo(this.map);

    this.addMapControls();
    this.setMapBase(this.mapBase);
    // Dots also restyle with the basemap (ring colour flips), so a base change
    // has to repaint them too.
    this.renderMarkers();
    this.loadBoundaries();
    this.renderMarkers();
  }

  // Dot size and fullscreen live on the map itself rather than in the card
  // header, so they're where you're looking when you want them. Built by hand
  // instead of via the fullscreen plugin: that plugin patches whichever Leaflet
  // instance it was loaded against, which isn't reliably the one this module
  // imports, and a class toggle needs no plugin at all.
  private addMapControls(): void {
    if (!this.map) return;

    const DotControl = L.Control.extend({
      options: { position: 'topleft' },
      onAdd: () => {
        const box = L.DomUtil.create('div', 'leaflet-bar di-map-control di-dot-control');
        box.innerHTML =
          `<a href="#" data-act="dec" title="Smaller dots">&minus;</a>` +
          `<span class="di-dot-value">${this.dotSize}</span>` +
          `<a href="#" data-act="inc" title="Bigger dots">+</a>`;
        this.dotValueEl = box.querySelector('.di-dot-value');
        L.DomEvent.disableClickPropagation(box);
        L.DomEvent.on(box, 'click', (ev: any) => {
          L.DomEvent.preventDefault(ev);
          const act = (ev.target as HTMLElement).getAttribute('data-act');
          if (act === 'inc') this.setDotSize(this.dotSize + 1);
          if (act === 'dec') this.setDotSize(this.dotSize - 1);
        });
        return box;
      }
    });

    const FullscreenControl = L.Control.extend({
      options: { position: 'topright' },
      onAdd: () => {
        const box = L.DomUtil.create('div', 'leaflet-bar di-map-control');
        box.innerHTML = `<a href="#" title="Fullscreen"><i class="bi bi-arrows-fullscreen"></i></a>`;
        L.DomEvent.disableClickPropagation(box);
        L.DomEvent.on(box, 'click', (ev: any) => {
          L.DomEvent.preventDefault(ev);
          // Leaflet's listener runs outside Angular, so the bound class on the
          // card won't update unless the flag is flipped back inside the zone.
          this.zone.run(() => this.toggleMapFullscreen());
        });
        return box;
      }
    });

    this.map.addControl(new DotControl());
    this.map.addControl(new FullscreenControl());
  }

  setDotSize(size: number): void {
    this.dotSize = Math.max(1, Math.min(12, size));
    // The control's markup is Leaflet's, not Angular's — update it directly.
    if (this.dotValueEl) this.dotValueEl.textContent = String(this.dotSize);
    this.renderMarkers();
  }

  toggleMapFullscreen(): void {
    this.mapFullscreen = !this.mapFullscreen;
    // Let the card resize first, then tell Leaflet to re-measure.
    setTimeout(() => this.map?.invalidateSize(), 0);
  }

  /** Plain outlines / satellite imagery / street tiles behind the boundaries. */
  setMapBase(kind: 'plain' | 'satellite' | 'streets'): void {
    this.mapBase = kind;
    if (!this.map) return;

    if (this.baseLayer) {
      this.map.removeLayer(this.baseLayer);
      this.baseLayer = null;
    }
    if (kind === 'satellite') {
      this.baseLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18, attribution: 'Imagery &copy; Esri' }
      );
    } else if (kind === 'streets') {
      this.baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18, attribution: '&copy; OpenStreetMap contributors'
      });
    }
    if (this.baseLayer) {
      this.baseLayer.addTo(this.map);
      this.baseLayer.bringToBack();
    }
    // Filled white polygons would hide the imagery, so the boundaries switch to
    // outline-only whenever there are tiles underneath, and the dots' rings
    // flip from dark to white.
    this.renderBoundaries();
    this.renderMarkers();
  }

  /**
   * State boundaries + the country outline, fetched once.
   *
   * States rather than MC/RMC: the per-MC files are district polygons, so they
   * paint district lines all over the country, and unioning them into centre
   * outlines cost ~2.3s of blocked UI. One state file is small and instant, and
   * states are the level a national map is read at.
   */
  private loadBoundaries(): void {
    if (this.boundaryCache) {
      this.renderBoundaries();
      return;
    }
    this.loadingBoundaries = true;

    forkJoin([
      this.http.get('assets/geojson/INDIA_STATE.json').pipe(catchError(() => of(null))),
      this.http.get('assets/geojson/INDIA_COUNTRY.json').pipe(catchError(() => of(null)))
    ]).subscribe({
      next: ([states, country]: any[]) => {
        this.countryGeo = country;
        this.boundaryCache = (states?.features || []).map((f: any) => ({
          key: f.properties?.state_name || '',
          geo: f
        }));
        this.loadingBoundaries = false;
        this.renderBoundaries();
      },
      error: () => {
        this.loadingBoundaries = false;
        this.mapError = 'Could not load the state boundaries.';
      }
    });
  }

  /** State borders, with the national outline drawn last so it sits on top. */
  private renderBoundaries(): void {
    if (!this.map || !this.boundaryCache) return;
    this.boundaryLayer.clearLayers();
    const overTiles = this.mapBase !== 'plain';

    this.renderOutsideMask(overTiles);

    for (const entry of this.boundaryCache) {
      L.geoJSON(entry.geo, {
        style: () => ({
          fillColor: '#ffffff',
          fillOpacity: overTiles ? 0 : 1,
          color: overTiles ? '#ffffff' : '#7c8894',
          weight: overTiles ? 0.9 : 1.1,
          opacity: overTiles ? 0.75 : 1
        })
      })
        .bindTooltip(entry.key, { sticky: true })
        .addTo(this.boundaryLayer);
    }

    if (this.countryGeo) {
      L.geoJSON(this.countryGeo, {
        style: () => ({
          fill: false,
          color: overTiles ? '#ffffff' : '#002467',
          weight: 2.5
        }),
        interactive: false
      }).addTo(this.boundaryLayer);
    }
  }

  /**
   * Everything outside India goes dark, so the eye stays on the country. Built
   * as one polygon covering the world with India's rings punched out as holes —
   * the same trick the AWS realtime map uses. It lives in its own pane above
   * the tiles but below the borders and dots.
   */
  private renderOutsideMask(overTiles: boolean): void {
    if (!this.map || !this.countryGeo) return;

    const holes: L.LatLngExpression[][] = [];
    for (const feature of (this.countryGeo.features || [this.countryGeo])) {
      const geom = feature.geometry || feature;
      if (!geom) continue;
      const polygons = geom.type === 'MultiPolygon' ? geom.coordinates : [geom.coordinates];
      for (const poly of polygons) {
        // Ring 0 is the outer boundary; interior rings would be lakes, and
        // punching those out too would leave them lit.
        if (poly?.[0]) holes.push(poly[0].map((c: number[]) => [c[1], c[0]] as L.LatLngExpression));
      }
    }
    if (holes.length === 0) return;

    const world: L.LatLngExpression[] = [[-89.9, -360], [-89.9, 360], [89.9, 360], [89.9, -360]];
    L.polygon([world, ...holes], {
      pane: 'di-mask',
      interactive: false,
      stroke: false,
      fillColor: overTiles ? '#05080f' : '#0b1220',
      fillOpacity: 0.8
    }).addTo(this.boundaryLayer);
  }

  // ── Range tab timeline scrubber ──────────────────────────────────────────
  // One slot per day of the selected range. Dragging (or the slider, the arrows
  // or play) picks a day and the map redraws for just that day; "All days" goes
  // back to the whole range. The tables always show the whole range — only the
  // dots follow the scrubber.

  /** The day the map is pinned to, or '' for the whole range. */
  get scrubDate(): string {
    return this.scrubIndex === null ? '' : (this.rangeDays[this.scrubIndex]?.date || '');
  }

  get scrubPercent(): number {
    if (this.scrubIndex === null || this.rangeDays.length < 2) return 0;
    return (this.scrubIndex / (this.rangeDays.length - 1)) * 100;
  }

  get scrubDay(): RangeDay | null {
    return this.scrubIndex === null ? null : (this.rangeDays[this.scrubIndex] || null);
  }

  /** The date the plotted stations belong to, stamped onto the map itself. */
  get mapDateLabel(): string {
    // The points in hand are still the previous window's until the fetch
    // returns, so naming the new dates here would caption the wrong markers.
    if (this.loadingMap) return 'Loading…';
    if (this.activeTab === 'daywise') return this.prettyDate(this.singleDate);
    if (this.scrubDay) return this.prettyDate(this.scrubDay.date);
    return `${this.prettyDate(this.fromDate)} → ${this.prettyDate(this.toDate)}`;
  }

  /** Whether that date is one day or the whole window. */
  get mapDateNote(): string {
    if (this.loadingMap) return 'fetching the edits for this window';
    if (this.activeTab === 'daywise') return 'edits made on this day';
    return this.scrubDay ? 'one day of the range' : 'whole range';
  }

  /** 2026-08-10 → 10 Aug 2026. */
  private prettyDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return `${String(d.getDate()).padStart(2, '0')} `
      + `${d.toLocaleString('en-IN', { month: 'short' })} ${d.getFullYear()}`;
  }

  /** One slot per calendar day in the range, with that day's edit volume. */
  private buildRangeDays(): void {
    this.rangeDays = [];
    this.scrubIndex = null;
    this.stopScrubPlayback();
    if (this.activeTab !== 'range' || !this.fromDate || !this.toDate) return;

    const perDay = new Map<string,
      { stations: Set<string>; edits: number; backDated: number; sameDay: number }>();
    for (const p of this.mapPoints) {
      let bucket = perDay.get(p.revisionDate);
      if (!bucket) {
        bucket = { stations: new Set<string>(), edits: 0, backDated: 0, sameDay: 0 };
        perDay.set(p.revisionDate, bucket);
      }
      bucket.stations.add(p.stationCode);
      bucket.edits += this.editTotal(p);
      bucket.backDated += p.backDatedCount;
      bucket.sameDay += p.sameDayCount;
    }

    // Walk the calendar rather than the data so quiet days keep their slot and
    // the timeline stays evenly spaced.
    const cursor = new Date(`${this.fromDate}T00:00:00`);
    const end = new Date(`${this.toDate}T00:00:00`);
    const days: RangeDay[] = [];
    while (cursor <= end && days.length < 400) {
      const date = this.formatDateLocal(cursor);
      const bucket = perDay.get(date);
      days.push({
        date,
        label: `${String(cursor.getDate()).padStart(2, '0')} ${cursor.toLocaleString('en-IN', { month: 'short' })}`,
        stations: bucket ? bucket.stations.size : 0,
        edits: bucket ? bucket.edits : 0,
        backDated: bucket ? bucket.backDated : 0,
        sameDay: bucket ? bucket.sameDay : 0
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    this.rangeDays = days;
    this.buildChartPaths();
  }

  /** Redrawn whenever the range changes or a series is switched on or off. */
  private buildChartPaths(): void {
    const days = this.rangeDays;

    // One shared scale for the lines on show: scaled to their own maxima a
    // quiet back-dated day would draw as tall as a heavy same-day one. Only
    // the visible series set it, so a lone back-dated line still fills the
    // track instead of hugging the floor under an invisible same-day peak.
    this.chartMax = days.reduce((m, d) => Math.max(
      m,
      this.showSameDay ? d.sameDay : 0,
      this.showBackDated ? d.backDated : 0
    ), 0);

    this.sameDayLinePath = this.showSameDay
      ? this.smoothPath(this.chartPoints(days.map(d => d.sameDay))) : '';
    this.sameDayAreaPath = this.closeArea(this.sameDayLinePath);
    this.backDatedLinePath = this.showBackDated
      ? this.smoothPath(this.chartPoints(days.map(d => d.backDated))) : '';
    this.backDatedAreaPath = this.closeArea(this.backDatedLinePath);
  }

  toggleSameDay(): void {
    this.showSameDay = !this.showSameDay;
    this.buildChartPaths();
  }

  toggleBackDated(): void {
    this.showBackDated = !this.showBackDated;
    this.buildChartPaths();
  }

  /** Drops a line path down to the baseline so it can be filled. */
  private closeArea(line: string): string {
    return line ? `${line} L100,100 L0,100 Z` : '';
  }

  /** Where day i sits along the rail, as a %. */
  dayPercent(index: number): number {
    if (this.rangeDays.length < 2) return 0;
    return (index / (this.rangeDays.length - 1)) * 100;
  }

  // ── Timeline chart geometry ───────────────────────────────────────────
  // Everything is plotted into a 0–100 × 0–100 viewBox that the SVG stretches
  // to whatever width the card has (preserveAspectRatio="none").

  /** Height of a value on the track, as a viewBox y. */
  private plotY(value: number): number {
    // 6% headroom so the tallest day never touches the top edge.
    return 100 - Math.min(94, (value / Math.max(1, this.chartMax)) * 94);
  }

  private chartPoints(values: number[]): Array<{ x: number; y: number }> {
    if (values.length < 2) return [];
    return values.map((v, i) => ({
      x: (i / (values.length - 1)) * 100,
      y: this.plotY(v)
    }));
  }

  /** Catmull-Rom through the points as cubic beziers, so a week of days reads
   *  as a curve instead of the hard polygon straight segments produced. */
  private smoothPath(pts: Array<{ x: number; y: number }>): string {
    if (pts.length < 2) return '';
    const round = (n: number) => Math.min(100, Math.max(0, n)).toFixed(2);
    let d = `M${pts[0].x.toFixed(2)},${round(pts[0].y)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      // /6 is the standard Catmull-Rom tension; the clamp stops a sharp cliff
      // (a busy day next to a silent one) from bowing outside the track.
      d += ` C${(p1.x + (p2.x - p0.x) / 6).toFixed(2)},${round(p1.y + (p2.y - p0.y) / 6)}`
        + ` ${(p2.x - (p3.x - p1.x) / 6).toFixed(2)},${round(p2.y - (p3.y - p1.y) / 6)}`
        + ` ${p2.x.toFixed(2)},${round(p2.y)}`;
    }
    return d;
  }

  /** Per-day dots on both curves. Dropped on long ranges — at 90 days they
   *  merge into a smear and just add DOM. */
  get dayMarkers(): Array<{ x: number; sameDay: number; backDated: number }> {
    if (this.rangeDays.length < 2 || this.rangeDays.length > 31) return [];
    return this.rangeDays.map((d, i) => ({
      x: this.dayPercent(i),
      sameDay: this.plotY(d.sameDay),
      backDated: this.plotY(d.backDated)
    }));
  }

  /** Nothing to point at when every series is switched off. */
  get anySeriesShown(): boolean {
    return this.showSameDay || this.showBackDated;
  }


  /** Sparse date labels under the track — a 90-day range can't label every day. */
  get dayTicks(): Array<{ label: string; percent: number }> {
    const n = this.rangeDays.length;
    if (n < 2) return [];
    const step = Math.max(1, Math.ceil(n / 8));
    const ticks: Array<{ label: string; percent: number }> = [];
    for (let i = 0; i < n - 1; i += step) {
      ticks.push({ label: this.rangeDays[i].label, percent: this.dayPercent(i) });
    }
    // The last day always earns a label; drop its neighbour if they'd collide.
    if (ticks.length > 1 && (n - 1) - (ticks.length - 1) * step < step / 2) ticks.pop();
    ticks.push({ label: this.rangeDays[n - 1].label, percent: 100 });
    return ticks;
  }

  get hoverDay(): RangeDay | null {
    return this.hoverIndex === null ? null : (this.rangeDays[this.hoverIndex] || null);
  }

  /** Kept off the card edges so the hover tooltip isn't clipped. */
  get hoverTipPercent(): number {
    if (this.hoverIndex === null) return 0;
    return Math.min(88, Math.max(12, this.dayPercent(this.hoverIndex)));
  }

  onRailDown(event: PointerEvent): void {
    this.stopScrubPlayback();
    this.scrubDragging = true;
    // Capture on the rail so a fast drag that leaves the element keeps working.
    this.scrubTrack?.nativeElement.setPointerCapture?.(event.pointerId);
    this.pickDayFromPointer(event);
  }

  // Hovering a day pins the map to it — no click needed. The readout follows
  // the pointer instantly; the map redraw waits for the pointer to settle so
  // sweeping across a 90-day range doesn't repaint the markers 90 times.
  onRailMove(event: PointerEvent): void {
    const day = this.dayFromPointer(event);
    if (day === null || day === this.hoverIndex) return;
    this.hoverIndex = day;
    if (this.scrubDragging) {
      this.pickDayFromPointer(event);
    } else {
      this.stopScrubPlayback();
      this.queueHoverPin(day);
    }
  }

  onRailUp(): void {
    this.scrubDragging = false;
  }

  // The pinned day survives the pointer leaving: snapping back to "all days"
  // on the way to the map would undo the day you just went to look at.
  onRailLeave(): void {
    this.hoverIndex = null;
    this.clearHoverPin();
  }

  private queueHoverPin(index: number): void {
    this.clearHoverPin();
    this.hoverPinTimer = setTimeout(() => {
      this.hoverPinTimer = null;
      if (this.hoverIndex === index) this.setScrubIndex(index);
    }, 90);
  }

  private clearHoverPin(): void {
    if (this.hoverPinTimer) {
      clearTimeout(this.hoverPinTimer);
      this.hoverPinTimer = null;
    }
  }

  /** Which day sits under the pointer, or null if the track isn't measurable. */
  private dayFromPointer(event: PointerEvent): number | null {
    const rail = this.scrubTrack?.nativeElement;
    if (!rail || this.rangeDays.length < 2) return null;
    const rect = rail.getBoundingClientRect();
    if (rect.width <= 0) return null;
    const frac = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    return Math.round(frac * (this.rangeDays.length - 1));
  }

  private pickDayFromPointer(event: PointerEvent): void {
    const next = this.dayFromPointer(event);
    // A slow drag fires dozens of events inside one day's slot.
    if (next !== null && next !== this.scrubIndex) this.setScrubIndex(next);
  }

  setScrubIndex(index: number | null): void {
    if (index === null) {
      this.scrubIndex = null;
    } else {
      this.scrubIndex = Math.min(this.rangeDays.length - 1, Math.max(0, index));
    }
    this.applyFilters();
  }

  stepScrub(delta: number): void {
    this.stopScrubPlayback();
    const from = this.scrubIndex === null ? -1 : this.scrubIndex;
    this.setScrubIndex(from + delta);
  }

  showAllDays(): void {
    this.stopScrubPlayback();
    this.setScrubIndex(null);
  }

  toggleScrubPlayback(): void {
    if (this.scrubPlaying) {
      this.stopScrubPlayback();
      return;
    }
    if (this.rangeDays.length < 2) return;
    this.scrubPlaying = true;
    if (this.scrubIndex === null || this.scrubIndex >= this.rangeDays.length - 1) {
      this.setScrubIndex(0);
    }
    this.scrubTimer = setInterval(() => {
      const next = (this.scrubIndex ?? 0) + 1;
      if (next >= this.rangeDays.length) {
        this.stopScrubPlayback();
        return;
      }
      this.setScrubIndex(next);
    }, 700);
  }

  private stopScrubPlayback(): void {
    this.scrubPlaying = false;
    if (this.scrubTimer) {
      clearInterval(this.scrubTimer);
      this.scrubTimer = null;
    }
  }

  loadMapPoints(): void {
    this.loadingPoints = true;
    this.mapError = '';
    this.stationService.fetchRevisionStationMap(this.currentParams()).subscribe({
      next: (res) => {
        this.mapPoints = (res.data || []).map((p: any) => ({
          revisionDate: p.revision_date,
          stationCode: p.station_code,
          stationName: p.station_name,
          lat: Number(p.latitude),
          lon: Number(p.longitude),
          centreType: p.centre_type,
          centreName: p.centre_name,
          stateName: p.state_name,
          districtName: p.district_name,
          revisionCount: p.revision_count,
          backDatedCount: p.back_dated_count,
          sameDayCount: p.same_day_count,
          editCount: p.edit_count,
          lastUpdated: p.last_updated,
          lastDataDate: p.last_data_date,
          backDatedDates: p.back_dated_dates || [],
          sameDayDates: p.same_day_dates || []
        }));
        this.buildRangeDays();
        this.applyFilters();
        this.loadingPoints = false;
      },
      error: () => {
        this.loadingPoints = false;
        this.mapError = 'Failed to load the station map.';
      }
    });
  }

  onMapLayerToggle(): void {
    this.renderMarkers();
  }

  // One dot per station, all the same size — the size is the user's to set with
  // the slider rather than something the map decides. How often a station was
  // edited is in its popup, not in its radius.
  private renderMarkers(): void {
    if (!this.map) return;
    this.markerLayer.clearLayers();
    if (!this.showStations) return;

    // A dark hairline ring on every basemap — it reads against imagery, street
    // tiles and the plain white map alike, and keeps the dot's own colour clean.
    for (const p of this.filteredMapPoints) {
      const baseWeight = this.dotSize >= 3 ? 0.9 : 0;
      const marker = L.circleMarker([p.lat, p.lon], {
        radius: this.dotSize,
        color: '#161c26',
        weight: baseWeight,
        opacity: 0.9,
        fillColor: p.backDatedCount > 0 ? '#e23d4d' : '#f5b820',
        fillOpacity: 0.92
      });

      // Hover gives the whole story without a click; click still pins it so you
      // can move the pointer away and keep reading.
      marker.bindTooltip(this.markerTooltip(p), {
        sticky: true,
        direction: 'top',
        opacity: 1,
        className: 'di-map-tip'
      });
      marker.bindPopup(this.markerPopup(p));

      // Grow the hovered dot so you can tell which one you're reading in a
      // crowded area.
      marker.on('mouseover', () => marker.setStyle({ radius: this.dotSize + 3, weight: 2 }));
      marker.on('mouseout', () => marker.setStyle({ radius: this.dotSize, weight: baseWeight }));

      marker.addTo(this.markerLayer);
    }
  }

  /** Logged edits if the change log covers them, else the number of dates touched. */
  private editTotal(p: MapStation): number {
    return Math.max(p.editCount, p.revisionCount);
  }

  /** Shared body for the hover tooltip and the click popup. */
  /** The actual data dates behind the counts, each tagged with its kind. The
   *  popup used to show only MAX(collection_date), which lands on the same-day
   *  edit whenever a station has one — so on a station with both kinds it hid
   *  the very date the dot is red for. */
  private dataDatesHtml(p: MapStation): string {
    const dates = [
      ...p.backDatedDates.map(d => ({ date: d, backDated: true })),
      ...p.sameDayDates.map(d => ({ date: d, backDated: false }))
    ].sort((a, b) => b.date.localeCompare(a.date));   // newest first
    if (!dates.length) return '—';

    // A wide range can touch dozens of dates; the tooltip has to stay a card.
    const CAP = 6;
    const shown = dates.slice(0, CAP).map(d =>
      `<span class="di-map-date ${d.backDated ? 'backdated' : 'sameday'}">${d.date}`
      + `<small>${d.backDated ? 'back-dated' : 'same-day'}</small></span>`
    ).join('');
    const rest = dates.length - CAP;
    return shown + (rest > 0 ? `<span class="di-map-date-more">+${rest} more</span>` : '');
  }

  private stationCardHtml(p: MapStation, includeColourNote: boolean): string {
    const when = new Date(p.lastUpdated).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
    const isBackDated = p.backDatedCount > 0;
    // A station can be both. Calling it plain "Back-dated" while the table
    // underneath shows a same-day count reads as a contradiction.
    const isMixed = p.backDatedCount > 0 && p.sameDayCount > 0;
    const kind = isMixed ? 'Back-dated + same-day' : (isBackDated ? 'Back-dated' : 'Same-day');
    // Spell out what the dot's colour is telling you — the legend is easy to
    // forget once you're deep in the map.
    const colourNote = includeColourNote
      ? `<div class="di-map-why">
           <span class="di-map-swatch" style="background:${isBackDated ? '#e23d4d' : '#f5b820'}"></span>
           ${isMixed
             ? 'Red — this station has <em>both</em> kinds; the dot follows its back-dated edits'
             : isBackDated
               ? 'Red — the value was changed on a day <em>after</em> the date it belongs to'
               : 'Amber — every change was made on the same day as the data date'}
         </div>`
      : '';

    return `
      <div class="di-map-popup">
        <div class="di-map-popup-title">${p.stationName} <span>(${p.stationCode})</span></div>
        <div class="di-map-popup-kind ${isBackDated ? 'backdated' : 'sameday'}">${kind}</div>
        ${colourNote}
        <table>
          <tr><th>Edited by</th><td>${p.centreType} ${p.centreName}</td></tr>
          <tr><th>District</th><td>${p.districtName}</td></tr>
          <tr><th>State</th><td>${p.stateName}</td></tr>
          <tr><th>Times edited</th><td>${this.editTotal(p)}</td></tr>
          <tr><th>Days touched</th><td>${p.revisionCount}</td></tr>
          <tr><th>Back-dated</th><td>${p.backDatedCount}</td></tr>
          <tr><th>Same-day</th><td>${p.sameDayCount}</td></tr>
          <tr><th>Last edited</th><td>${when}</td></tr>
          <tr><th>Data dates</th><td class="di-map-dates">${this.dataDatesHtml(p)}</td></tr>
          <tr><th>Coordinates</th><td>${p.lat.toFixed(3)}, ${p.lon.toFixed(3)}</td></tr>
        </table>
      </div>
    `;
  }

  private markerTooltip(p: MapStation): string {
    return this.stationCardHtml(p, true) +
      `<div class="di-map-tip-foot">Click to pin this card</div>`;
  }

  private markerPopup(p: MapStation): string {
    return this.stationCardHtml(p, true);
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
