import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { Chart } from 'angular-highcharts';
import * as L from 'leaflet';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { StationImportService } from 'src/app/services/station-import/station-import.service';
import {
  ApplyRequest,
  ApplyResult,
  ChangeField,
  FieldChange,
  FlagChange,
  NetworkOverview,
  PreviewResponse,
  RowIssue,
  StationRow,
  StationTable,
  seedDayCount,
} from 'src/app/services/station-import/station-import.models';
import {
  SI_COLORS,
  buildCentreChart,
  buildFileTypeChart,
  buildImpactByCentreChart,
  buildRegionChart,
  buildTypeChart,
} from './station-import.charts';

type Step = 1 | 2 | 3 | 4;
type ReviewTab = 'new' | 'changes' | 'flags' | 'missing' | 'errors' | 'warnings';
type MapLayer = 'new' | 'change' | 'flag' | 'missing';
type Tone = 'new' | 'change' | 'flag' | 'missing' | 'error' | 'warn';

interface TabInfo {
  id: ReviewTab;
  label: string;
  count: number;
  tone: Tone;
  icon: string;
}

interface FileCheck {
  fileName: string;
  sizeLabel: string;
  sheetName: string;
  rowCount: number;
  districtCount: number;
  activeCount: number;
  inactiveCount: number;
  sTypeCount: number;
  types: { type: string; count: number; sType: boolean }[];
  columns: { name: string; present: boolean }[];
}

interface WritePlanRow {
  table: string;
  action: string;
  count: number;
}

/** The columns the import reads. The search-results export has 34; the others are ignored. */
const REQUIRED_COLUMNS = [
  'station_co', 'station_na', 'station_ty', 'district_c', 'block_code', 'block_name',
  'latitude', 'longitude', 'rmc_mc', 'abbrevited', 'flag',
];
/** Upper-cased: the file mixes sARG and SARG. */
const S_TYPES = new Set(['SARG', 'SAWS']);
const PAGE_SIZE = 50;
const CONFIRM_WORD = 'APPLY';
const INDIA_BOUNDS: L.LatLngBoundsExpression = [[6.5, 68], [35.7, 97.5]];
const LAYER_COLOR: Record<MapLayer, string> = {
  new: SI_COLORS.new,
  change: SI_COLORS.change,
  flag: SI_COLORS.flag,
  missing: SI_COLORS.missing,
};
const FIELD_LABEL: Record<ChangeField, string> = {
  station_name: 'Station name',
  latitude: 'Latitude',
  longitude: 'Longitude',
  block_name: 'Block name',
  centre: 'Centre',
  station_type: 'Station type',
};

@Component({
  selector: 'app-station-import',
  templateUrl: './station-import.component.html',
  styleUrls: ['./station-import.component.css'],
})
export class StationImportComponent implements OnInit, OnDestroy {
  readonly colors = SI_COLORS;
  readonly confirmWord = CONFIRM_WORD;
  readonly pageSize = PAGE_SIZE;
  readonly steps: { id: Step; label: string; hint: string }[] = [
    { id: 1, label: 'Upload', hint: 'Choose the Excel' },
    { id: 2, label: 'Review', hint: 'Tick what to apply' },
    { id: 3, label: 'Confirm', hint: 'See what is written' },
    { id: 4, label: 'Done', hint: 'Result and report' },
  ];
  step: Step = 1;

  // ── Network overview ──────────────────────────────────────────────────────
  overview: NetworkOverview | null = null;
  overviewLoading = true;
  overviewError = '';
  overviewOpen = true;
  centreChart: Chart | null = null;
  typeChart: Chart | null = null;
  regionChart: Chart | null = null;

  // ── Step 1: upload ───────────────────────────────────────────────────────
  file: File | null = null;
  fileCheck: FileCheck | null = null;
  fileTypeChart: Chart | null = null;
  fileReading = false;
  fileError = '';
  isDragging = false;
  activationDate = todayLocal();

  // ── Step 2: review ───────────────────────────────────────────────────────
  preview: PreviewResponse | null = null;
  previewLoading = false;
  previewError = '';
  impactChart: Chart | null = null;
  tabs: TabInfo[] = [];
  activeTab: ReviewTab = 'new';
  search = '';
  page = 1;
  flagFilter: 'all' | 'on' | 'off' = 'all';
  selectedNew = new Set<string>();
  selectedChanges = new Set<string>();
  selectedFlags = new Set<string>();
  mapLayers: Record<MapLayer, boolean> = { new: true, change: true, flag: true, missing: true };

  // ── Steps 3–4: confirm and apply ─────────────────────────────────────────
  confirmText = '';
  applying = false;
  applyError = '';
  result: ApplyResult | null = null;

  @ViewChild('top') private topRef?: ElementRef<HTMLElement>;

  private map: L.Map | null = null;
  private markerLayer: L.LayerGroup | null = null;
  private subs = new Subscription();

  /**
   * The map only exists while step 2 is on screen. Building it from this
   * setter (rather than ngAfterViewInit) means it is created every time the
   * container appears and torn down every time it goes away.
   */
  @ViewChild('impactMap')
  set impactMapHost(ref: ElementRef<HTMLDivElement> | undefined) {
    if (ref) {
      setTimeout(() => this.initMap(ref.nativeElement));
    } else {
      this.destroyMap();
    }
  }

  constructor(public api: StationImportService) {}

  ngOnInit(): void {
    this.subs.add(
      this.api.getOverview().subscribe({
        next: (o) => {
          this.overview = o;
          this.overviewLoading = false;
          this.centreChart = buildCentreChart(o);
          this.typeChart = buildTypeChart(o);
          this.regionChart = buildRegionChart(o);
        },
        error: (e: unknown) => {
          this.overviewLoading = false;
          this.overviewError = errorText(e, 'The station network summary could not be loaded.');
        },
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.destroyMap();
  }

  // ── Navigation ───────────────────────────────────────────────────────────

  canGoTo(target: Step): boolean {
    return target < this.step && this.step !== 4 && !this.applying;
  }

  goToStep(target: Step): void {
    if (!this.canGoTo(target)) return;
    this.step = target;
    this.scrollToTop();
  }

  // ── Step 1: file ─────────────────────────────────────────────────────────

  onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const chosen = input.files && input.files.length ? input.files[0] : null;
    input.value = '';
    if (chosen) this.readFile(chosen);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(): void {
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const dropped = event.dataTransfer?.files?.[0];
    if (dropped) this.readFile(dropped);
  }

  clearFile(): void {
    this.file = null;
    this.fileCheck = null;
    this.fileTypeChart = null;
    this.fileError = '';
    this.previewError = '';
    this.resetReview();
  }

  get missingColumns(): string[] {
    return this.fileCheck ? this.fileCheck.columns.filter((c) => !c.present).map((c) => c.name) : [];
  }

  get canCheck(): boolean {
    return !!this.file && !!this.fileCheck && !this.fileReading && this.missingColumns.length === 0 && !!this.activationDate;
  }

  get seedHorizon(): string {
    return this.preview?.seedHorizon ?? this.overview?.dailyRows.horizon ?? '';
  }

  /** Header, row count and type mix are read in the browser — the file never leaves until "Check". */
  private readFile(chosen: File): void {
    if (!/\.(xlsx|xls)$/i.test(chosen.name)) {
      this.fileError = `"${chosen.name}" is not an Excel file. Choose the .xlsx search-results export.`;
      return;
    }
    this.resetReview();
    this.file = chosen;
    this.fileCheck = null;
    this.fileTypeChart = null;
    this.fileError = '';
    this.previewError = '';
    this.fileReading = true;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        this.fileCheck = inspectWorkbook(chosen, reader.result as ArrayBuffer);
        this.fileTypeChart = buildFileTypeChart(this.fileCheck.types);
      } catch (err) {
        this.fileError = err instanceof Error ? err.message : 'The file could not be read.';
      }
      this.fileReading = false;
    };
    reader.onerror = () => {
      this.fileReading = false;
      this.fileError = 'The file could not be read from disk. Try choosing it again.';
    };
    reader.readAsArrayBuffer(chosen);
  }

  checkFile(): void {
    if (!this.file || !this.canCheck || this.previewLoading) return;
    this.previewLoading = true;
    this.previewError = '';
    this.subs.add(
      this.api.preview(this.file, this.activationDate).subscribe({
        next: (p) => {
          this.previewLoading = false;
          this.setPreview(p);
          this.step = 2;
          this.overviewOpen = false;
          this.scrollToTop();
        },
        error: (e: unknown) => {
          this.previewLoading = false;
          this.previewError = errorText(e, 'The file could not be checked against the database.');
        },
      })
    );
  }

  // ── Step 2: review ───────────────────────────────────────────────────────

  private setPreview(p: PreviewResponse): void {
    this.preview = p;
    // New rows are ticked by default, except ones the file itself marks inactive.
    this.selectedNew = new Set(p.newStations.filter((s) => s.flag === 1).map((s) => s.stationCode));
    this.selectedChanges = new Set();
    this.selectedFlags = new Set();
    this.impactChart = buildImpactByCentreChart(p);
    this.tabs = [
      { id: 'new', label: 'New stations', count: p.newStations.length, tone: 'new', icon: 'bi-plus-circle-fill' },
      { id: 'changes', label: 'Field changes', count: p.fieldChanges.length, tone: 'change', icon: 'bi-pencil-square' },
      { id: 'flags', label: 'Flag changes', count: p.flagChanges.length, tone: 'flag', icon: 'bi-toggles' },
      { id: 'missing', label: 'Missing from file', count: p.missingFromFile.length, tone: 'missing', icon: 'bi-question-circle-fill' },
      { id: 'errors', label: 'Errors', count: p.issues.filter((i) => i.severity === 'error').length, tone: 'error', icon: 'bi-x-octagon-fill' },
      { id: 'warnings', label: 'Warnings', count: p.issues.filter((i) => i.severity === 'warning').length, tone: 'warn', icon: 'bi-exclamation-triangle-fill' },
    ];
    this.activeTab = 'new';
    this.search = '';
    this.page = 1;
    this.flagFilter = 'all';
    this.confirmText = '';
    this.applyError = '';
    this.result = null;
    this.mapLayers = { new: true, change: true, flag: true, missing: true };
  }

  private resetReview(): void {
    this.preview = null;
    this.impactChart = null;
    this.tabs = [];
    this.selectedNew = new Set();
    this.selectedChanges = new Set();
    this.selectedFlags = new Set();
    this.result = null;
    this.confirmText = '';
    this.applyError = '';
    this.step = 1;
  }

  setTab(tab: ReviewTab): void {
    this.activeTab = tab;
    this.page = 1;
  }

  trackTab(_: number, t: TabInfo): ReviewTab {
    return t.id;
  }

  /** The small line under each tile: what the admin can do with that category. */
  tileHint(tab: ReviewTab): string {
    switch (tab) {
      case 'new': return `${this.selectedNew.size} ticked`;
      case 'changes': return this.selectedChanges.size ? `${this.selectedChanges.size} ticked` : 'tick to apply';
      case 'flags': return this.selectedFlags.size ? `${this.selectedFlags.size} ticked` : 'off by default';
      case 'missing': return 'report only';
      case 'errors': return 'rows skipped';
      case 'warnings': return 'for information';
    }
  }

  private matches(code: string, name: string, centre: string): boolean {
    const q = this.search.trim().toLowerCase();
    return !q || code.includes(q) || name.toLowerCase().includes(q) || centre.toLowerCase().includes(q);
  }

  get newRows(): StationRow[] {
    return this.preview ? this.preview.newStations.filter((r) => this.matches(r.stationCode, r.stationName, r.centre)) : [];
  }

  get changeRows(): FieldChange[] {
    return this.preview ? this.preview.fieldChanges.filter((r) => this.matches(r.stationCode, r.stationName, r.centre)) : [];
  }

  get flagRows(): FlagChange[] {
    if (!this.preview) return [];
    return this.preview.flagChanges.filter((r) => {
      if (this.flagFilter === 'on' && r.fileFlag !== 1) return false;
      if (this.flagFilter === 'off' && r.fileFlag !== 0) return false;
      return this.matches(r.stationCode, r.stationName, r.centre);
    });
  }

  get missingRows(): StationRow[] {
    return this.preview ? this.preview.missingFromFile.filter((r) => this.matches(r.stationCode, r.stationName, r.centre)) : [];
  }

  get errorRows(): RowIssue[] {
    return this.issueRows('error');
  }

  get warningRows(): RowIssue[] {
    return this.issueRows('warning');
  }

  private issueRows(severity: RowIssue['severity']): RowIssue[] {
    return this.preview
      ? this.preview.issues.filter((r) => r.severity === severity && this.matches(r.stationCode, r.stationName, r.centre))
      : [];
  }

  get activeRowCount(): number {
    switch (this.activeTab) {
      case 'new': return this.newRows.length;
      case 'changes': return this.changeRows.length;
      case 'flags': return this.flagRows.length;
      case 'missing': return this.missingRows.length;
      case 'errors': return this.errorRows.length;
      case 'warnings': return this.warningRows.length;
    }
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.activeRowCount / PAGE_SIZE));
  }

  get pageStart(): number {
    return this.activeRowCount ? (this.page - 1) * PAGE_SIZE + 1 : 0;
  }

  get pageEnd(): number {
    return Math.min(this.page * PAGE_SIZE, this.activeRowCount);
  }

  pageSlice<T>(rows: T[]): T[] {
    const start = (this.page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }

  changePage(delta: number): void {
    this.page = Math.min(this.pageCount, Math.max(1, this.page + delta));
  }

  onSearchChange(): void {
    this.page = 1;
  }

  setFlagFilter(filter: 'all' | 'on' | 'off'): void {
    this.flagFilter = filter;
    this.page = 1;
  }

  get flagsTurningOn(): number {
    return this.preview ? this.preview.flagChanges.filter((f) => f.fileFlag === 1).length : 0;
  }

  get flagsTurningOff(): number {
    return this.preview ? this.preview.flagChanges.filter((f) => f.fileFlag === 0).length : 0;
  }

  get errorCount(): number {
    return this.preview ? this.preview.issues.filter((i) => i.severity === 'error').length : 0;
  }

  get flagsWithNotes(): number {
    return this.preview ? this.preview.flagChanges.filter((f) => !!f.note).length : 0;
  }

  // ── Selection ────────────────────────────────────────────────────────────

  changeKey(c: FieldChange): string {
    return `${c.stationCode}|${c.field}`;
  }

  toggle(set: Set<string>, key: string): void {
    if (set.has(key)) set.delete(key);
    else set.add(key);
  }

  get newKeys(): string[] {
    return this.newRows.map((r) => r.stationCode);
  }

  get changeKeys(): string[] {
    return this.changeRows.map((r) => this.changeKey(r));
  }

  get flagKeys(): string[] {
    return this.flagRows.map((r) => r.stationCode);
  }

  allTicked(set: Set<string>, keys: string[]): boolean {
    return keys.length > 0 && keys.every((k) => set.has(k));
  }

  someTicked(set: Set<string>, keys: string[]): boolean {
    return keys.some((k) => set.has(k)) && !this.allTicked(set, keys);
  }

  /** Header checkbox: acts on the rows matching the current search, not the whole category. */
  toggleAll(set: Set<string>, keys: string[], event: Event): void {
    const on = (event.target as HTMLInputElement).checked;
    keys.forEach((k) => (on ? set.add(k) : set.delete(k)));
  }

  get selectedCount(): number {
    return this.selectedNew.size + this.selectedChanges.size + this.selectedFlags.size;
  }

  // ── Map ──────────────────────────────────────────────────────────────────

  get mapLegend(): { id: MapLayer; label: string; color: string; count: number }[] {
    const p = this.preview;
    if (!p) return [];
    return [
      { id: 'new', label: 'New', color: LAYER_COLOR.new, count: p.newStations.length },
      { id: 'change', label: 'Field change', color: LAYER_COLOR.change, count: p.fieldChanges.length },
      { id: 'flag', label: 'Flag change', color: LAYER_COLOR.flag, count: p.flagChanges.length },
      { id: 'missing', label: 'Missing from file', color: LAYER_COLOR.missing, count: p.missingFromFile.length },
    ];
  }

  toggleMapLayer(layer: MapLayer): void {
    this.mapLayers[layer] = !this.mapLayers[layer];
    this.drawMarkers(false);
  }

  private initMap(host: HTMLDivElement): void {
    if (this.map && this.map.getContainer() === host) return;
    this.destroyMap();
    this.map = L.map(host, {
      center: [22.5, 80],
      zoom: 4.4,
      zoomSnap: 0.25,
      minZoom: 3,
      preferCanvas: true,
      attributionControl: false,
      scrollWheelZoom: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, crossOrigin: 'anonymous' }).addTo(this.map);
    this.markerLayer = L.layerGroup().addTo(this.map);
    this.drawMarkers(true);
    setTimeout(() => this.map?.invalidateSize(), 200);
  }

  private destroyMap(): void {
    this.map?.remove();
    this.map = null;
    this.markerLayer = null;
  }

  private drawMarkers(fit: boolean): void {
    const map = this.map;
    const group = this.markerLayer;
    const p = this.preview;
    if (!map || !group || !p) return;
    group.clearLayers();
    const points: L.LatLngTuple[] = [];

    const add = (layer: MapLayer, lat: number | null, lon: number | null, title: string, detail: string): void => {
      if (!this.mapLayers[layer] || lat === null || lon === null) return;
      L.circleMarker([lat, lon], {
        radius: layer === 'new' ? 7.5 : 5.5,
        color: '#ffffff',
        weight: 1.5,
        fillColor: LAYER_COLOR[layer],
        fillOpacity: 0.92,
      })
        .bindTooltip(`<b>${escapeHtml(title)}</b><br>${escapeHtml(detail)}`, { direction: 'top', offset: [0, -4] })
        .addTo(group);
      points.push([lat, lon]);
    };

    // Drawn back to front, so new stations sit on top.
    p.missingFromFile.forEach((r) => add('missing', r.latitude, r.longitude, r.stationName, `${r.stationCode} · in database, not in file`));
    p.flagChanges.forEach((r) =>
      add('flag', r.latitude, r.longitude, r.stationName, `${r.stationCode} · flag ${r.dbFlag} → ${r.fileFlag}`)
    );
    p.fieldChanges.forEach((r) =>
      add('change', r.latitude, r.longitude, r.stationName, `${r.stationCode} · ${FIELD_LABEL[r.field].toLowerCase()} changes`)
    );
    p.newStations.forEach((r) =>
      add('new', r.latitude, r.longitude, r.stationName, `${r.stationCode} · new ${r.stationTypeOld} · ${r.centre}`)
    );

    if (!fit) return;
    if (points.length) map.fitBounds(L.latLngBounds(points).pad(0.2), { maxZoom: 7 });
    else map.fitBounds(INDIA_BOUNDS);
  }

  // ── Step 3: confirm ──────────────────────────────────────────────────────

  goToConfirm(): void {
    if (!this.selectedCount) return;
    this.confirmText = '';
    this.applyError = '';
    this.step = 3;
    this.scrollToTop();
  }

  private get chosenNew(): StationRow[] {
    return this.preview ? this.preview.newStations.filter((s) => this.selectedNew.has(s.stationCode)) : [];
  }

  get plainNewCount(): number {
    return this.chosenNew.filter((s) => s.table === 'station_details').length;
  }

  get awsNewCount(): number {
    return this.chosenNew.filter((s) => s.table === 'aws_station_details').length;
  }

  get seedDays(): number {
    return seedDayCount(this.activationDate, this.seedHorizon);
  }

  private get chosenFlags(): FlagChange[] {
    return this.preview ? this.preview.flagChanges.filter((f) => this.selectedFlags.has(f.stationCode)) : [];
  }

  get stationsTouched(): number {
    const codes = new Set<string>(this.selectedNew);
    this.selectedChanges.forEach((k) => codes.add(k.split('|')[0]));
    this.selectedFlags.forEach((c) => codes.add(c));
    return codes.size;
  }

  get writePlan(): WritePlanRow[] {
    const flags = this.chosenFlags;
    return [
      { table: 'station_details', action: 'Insert new stations', count: this.plainNewCount },
      { table: 'aws_station_details', action: 'Insert new sARG / sAWS stations', count: this.awsNewCount },
      { table: 'aws_mapping_id', action: 'Link each new sARG / sAWS to its AWS source', count: this.awsNewCount },
      {
        table: 'station_daily_data_updates',
        action: `Insert −999.9 rows (${this.plainNewCount} × ${this.seedDays} days)`,
        count: this.plainNewCount * this.seedDays,
      },
      { table: 'station tables', action: 'Update ticked fields', count: this.selectedChanges.size },
      { table: 'station tables', action: 'Turn stations on (flag 1)', count: flags.filter((f) => f.fileFlag === 1).length },
      { table: 'station tables', action: 'Turn stations off (flag 0)', count: flags.filter((f) => f.fileFlag === 0).length },
      { table: 'station_logs', action: 'One log row per station touched', count: this.stationsTouched },
    ];
  }

  get confirmOk(): boolean {
    return this.confirmText.trim().toUpperCase() === CONFIRM_WORD;
  }

  apply(): void {
    if (!this.file || !this.preview || !this.confirmOk || this.applying) return;
    const request: ApplyRequest = {
      activationDate: this.activationDate,
      newStationCodes: Array.from(this.selectedNew),
      fieldChanges: Array.from(this.selectedChanges).map((k) => {
        const [stationCode, field] = k.split('|');
        return { stationCode, field: field as ChangeField };
      }),
      flagChangeCodes: Array.from(this.selectedFlags),
    };
    this.applying = true;
    this.applyError = '';
    this.subs.add(
      this.api.apply(this.file, request).subscribe({
        next: (r) => {
          this.applying = false;
          this.result = r;
          this.step = 4;
          this.scrollToTop();
        },
        error: (e: unknown) => {
          this.applying = false;
          this.applyError = errorText(e, 'The import was not applied. Nothing was written.');
        },
      })
    );
  }

  // ── Step 4: done ─────────────────────────────────────────────────────────

  get resultTiles(): { table: string; label: string; value: number; icon: string }[] {
    const r = this.result;
    if (!r) return [];
    return [
      { table: 'station_details', label: 'stations added', value: r.inserted.stationDetails, icon: 'bi-geo-alt-fill' },
      { table: 'aws_station_details', label: 'sARG / sAWS added', value: r.inserted.awsStationDetails, icon: 'bi-broadcast' },
      { table: 'aws_mapping_id', label: 'AWS links added', value: r.inserted.awsMappingId, icon: 'bi-link-45deg' },
      { table: 'station_daily_data_updates', label: '−999.9 rows added', value: r.inserted.dailyRows, icon: 'bi-calendar3' },
      { table: 'station tables', label: 'fields updated', value: r.updatedFields, icon: 'bi-pencil-square' },
      { table: 'station tables', label: 'flags changed', value: r.flagsChanged, icon: 'bi-toggles' },
      { table: 'station_logs', label: 'log rows', value: r.stationLogs, icon: 'bi-journal-text' },
    ];
  }

  startOver(): void {
    this.clearFile();
    this.activationDate = todayLocal();
    this.overviewOpen = true;
    this.scrollToTop();
  }

  // ── Excel exports ────────────────────────────────────────────────────────

  downloadReview(): void {
    const p = this.preview;
    if (!p) return;
    const tick = (on: boolean): string => (on ? 'yes' : 'no');
    writeWorkbook(
      {
        'New stations': p.newStations.map((r) => ({
          ticked: tick(this.selectedNew.has(r.stationCode)),
          ...stationSheetRow(r),
          warnings: r.warnings.join('; '),
        })),
        'Field changes': p.fieldChanges.map((r) => ({
          ticked: tick(this.selectedChanges.has(this.changeKey(r))),
          excel_row: r.rowNumber,
          station_code: r.stationCode,
          station_name: r.stationName,
          field: FIELD_LABEL[r.field],
          database: r.dbValue,
          file: r.fileValue,
        })),
        'Flag changes': p.flagChanges.map((r) => ({
          ticked: tick(this.selectedFlags.has(r.stationCode)),
          excel_row: r.rowNumber,
          station_code: r.stationCode,
          station_name: r.stationName,
          table: r.table,
          centre: r.centre,
          database_flag: r.dbFlag,
          file_flag: r.fileFlag,
          note: r.note ?? '',
        })),
        'Missing from file': p.missingFromFile.map((r) => stationSheetRow(r)),
        Issues: p.issues.map((r) => ({
          severity: r.severity,
          excel_row: r.rowNumber,
          station_code: r.stationCode,
          station_name: r.stationName,
          centre: r.centre,
          rule: r.rule,
          message: r.message,
        })),
      },
      `station_import_review_${fileStamp()}.xlsx`
    );
  }

  downloadReport(): void {
    const r = this.result;
    if (!r) return;
    writeWorkbook(
      {
        Summary: [
          { item: 'Applied at', value: r.appliedAt },
          { item: 'Sample run (nothing written)', value: r.isSample ? 'yes' : 'no' },
          { item: 'Activation date', value: this.activationDate },
          ...this.resultTiles.map((t) => ({ item: `${t.table}: ${t.label}`, value: t.value })),
          { item: 'Rows skipped', value: r.skipped.length },
        ],
        'New stations applied': this.chosenNew.map((s) => stationSheetRow(s)),
        Skipped: r.skipped.map((s) => ({
          excel_row: s.rowNumber,
          station_code: s.stationCode,
          station_name: s.stationName,
          rule: s.rule,
          message: s.message,
        })),
      },
      `station_import_report_${fileStamp()}.xlsx`
    );
  }

  // ── Display helpers ──────────────────────────────────────────────────────

  fmt(n: number | null | undefined): string {
    return n === null || n === undefined ? '—' : n.toLocaleString('en-IN');
  }

  pct(part: number, whole: number): number {
    return whole ? Math.round((part / whole) * 1000) / 10 : 0;
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  fieldLabel(f: ChangeField): string {
    return FIELD_LABEL[f];
  }

  tableLabel(t: StationTable): string {
    return t === 'aws_station_details' ? 'State AWS' : 'IMD';
  }

  coord(n: number | null): string {
    return n === null ? '—' : n.toFixed(4);
  }

  private scrollToTop(): void {
    setTimeout(() => this.topRef?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
}

// ── Module helpers ───────────────────────────────────────────────────────────

function inspectWorkbook(file: File, data: ArrayBuffer): FileCheck {
  const wb = XLSX.read(data, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error('The workbook has no sheets.');
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName], { defval: null });
  if (!rows.length) throw new Error(`The first sheet ("${sheetName}") has no data rows.`);

  // Header cells sometimes carry stray spaces; match them trimmed and lower-cased.
  const keyOf = new Map<string, string>();
  Object.keys(rows[0]).forEach((k) => keyOf.set(k.trim().toLowerCase(), k));
  const cell = (row: Record<string, unknown>, col: string): unknown => {
    const key = keyOf.get(col);
    return key === undefined ? undefined : row[key];
  };

  const typeCounts = new Map<string, number>();
  const districts = new Set<string>();
  let active = 0;
  let inactive = 0;
  for (const row of rows) {
    const type = String(cell(row, 'station_ty') ?? '').trim() || '(blank)';
    typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);
    const district = cell(row, 'district_c');
    if (district !== null && district !== undefined && district !== '') districts.add(String(district).trim());
    const flag = Number(cell(row, 'flag'));
    if (flag === 1) active++;
    else if (flag === 0) inactive++;
  }

  const types = Array.from(typeCounts.entries())
    .map(([type, count]) => ({ type, count, sType: S_TYPES.has(type.toUpperCase()) }))
    .sort((a, b) => Number(a.sType) - Number(b.sType) || b.count - a.count);

  return {
    fileName: file.name,
    sizeLabel: formatBytes(file.size),
    sheetName,
    rowCount: rows.length,
    districtCount: districts.size,
    activeCount: active,
    inactiveCount: inactive,
    sTypeCount: types.filter((t) => t.sType).reduce((sum, t) => sum + t.count, 0),
    types,
    columns: REQUIRED_COLUMNS.map((name) => ({ name, present: keyOf.has(name) })),
  };
}

function stationSheetRow(r: StationRow): Record<string, string | number> {
  return {
    excel_row: r.rowNumber ?? '',
    station_code: r.stationCode,
    station_name: r.stationName,
    station_type: r.stationType,
    station_type_old: r.stationTypeOld,
    table: r.table,
    district_code: r.districtCode,
    district_name: r.districtName,
    block_code: r.blockCode,
    block_name: r.blockName,
    centre: r.centre,
    latitude: r.latitude ?? '',
    longitude: r.longitude ?? '',
    flag: r.flag,
  };
}

function writeWorkbook(sheets: Record<string, object[]>, fileName: string): void {
  const names = Object.keys(sheets);
  const workbook: XLSX.WorkBook = { Sheets: {}, SheetNames: names };
  names.forEach((name) => {
    const rows = sheets[name];
    workbook.Sheets[name] = rows.length ? XLSX.utils.json_to_sheet(rows) : XLSX.utils.aoa_to_sheet([['(none)']]);
  });
  const buffer: ArrayBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  FileSaver.saveAs(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' }),
    fileName
  );
}

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fileStamp(): string {
  const d = new Date();
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${todayLocal()}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Station names go into Leaflet tooltips as HTML. */
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] ?? c);
}

function errorText(e: unknown, fallback: string): string {
  const err = e as { error?: { message?: string; error?: string }; message?: string } | null;
  return err?.error?.message || err?.error?.error || fallback;
}
