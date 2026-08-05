import { HttpClient } from '@angular/common/http';
import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Chart } from 'angular-highcharts';
import * as Highcharts from 'highcharts';
import * as L from 'leaflet';
import 'leaflet-draw';
import 'leaflet.heat';
import * as turf from '@turf/turf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';

import { getRegionService } from 'src/app/services/region/getregion.service';
import { CenterService } from 'src/app/services/centre/centre.service';
import { getStateService } from 'src/app/services/state/getState.service';
import { getDistrictService } from 'src/app/services/district/getdistrict.service';
import { FetchStationDataService } from 'src/app/services/station/station.service';
import { Constants } from 'src/app/services/constants';

import { RainfallCloudLayer, buildCloudField } from './rainfall-cloud-layer';
import {
  RAINFALL_BANDS,
  RainfallBand,
  bandFor,
  isMissing,
} from './rainfall-bands';

/** A station as returned by the API, narrowed to the fields this page reads. */
interface Station {
  station_code: string | number;
  station_name: string;
  state_name: string;
  district_name?: string;
  subdiv_name?: string;
  district_code?: string | number;
  state_code?: string | number;
  region_code?: string | number;
  centre_name?: string;
  station_type?: string;
  latitude: string | number;
  longitude: string | number;
  data: number;
}

/** One row in the compare table. The chart reads selection off these objects. */
interface CompareRow {
  station_code: string | number;
  station_name: string;
  state_name: string;
  /** Formatted "12.34 km", or null in polygon mode where distance is undefined. */
  distance: string | null;
  /** Raw reading, kept numeric so the table can sort and format consistently. */
  data: number;
  selected: boolean;
}

/** One day of a station's history, as returned by fetchAllDatesAndDataOfStation. */
interface HistoryRow {
  collection_date: string;
  data: number;
}

/** Filter state for one rainfall band: the band plus its live count and toggle. */
interface BandFilter {
  band: RainfallBand;
  count: number;
  selected: boolean;
}

/** Which detail panel the bottom drawer is showing. */
type PanelMode = 'station_details' | 'compare_charts' | 'polygon_compare';

/** The draggable analytics cards that float over the map. */
type CardKey = 'distribution' | 'coverage';

/** Reporting completeness for one meteorological centre. */
interface CentreCoverage {
  centre: string;
  total: number;
  missing: number;
  /** Percentage of the centre's stations that have reported, 0–100. */
  pct: number;
}

const MAP_MIN_PANEL_HEIGHT = 180;
/** Must match `--ss-drawer-max` in the stylesheet, or the chart outgrows the drawer. */
const MAP_MAX_PANEL_HEIGHT_RATIO = 0.6;
const DEFAULT_PANEL_HEIGHT = 320;
const CHART_VERTICAL_CHROME = 96;

@Component({
  selector: 'app-station-statistics-page',
  templateUrl: './station-statistics-page.component.html',
  styleUrls: ['./station-statistics-page.component.css'],
})
export class StationStatisticsPageComponent implements OnInit, OnDestroy {
  // ---------------------------------------------------------------- lifecycle
  private readonly destroy$ = new Subject<void>();

  // ------------------------------------------------------------------- user
  currentUserType: string;
  currentUserName: string;
  currentUserMcCategory: string;

  // ------------------------------------------------------------------- dates
  /** Bound to the date input; always a yyyy-MM-dd string. */
  selected_Date: string = this.toIsoDate(new Date());
  /** Upper bound for the date picker — observations cannot be in the future. */
  readonly maxDate: string = this.toIsoDate(new Date());
  currSeasonStartDate = '';
  currentSeasonEndDate = '';
  readonly currentYear = new Date().getFullYear();

  // ------------------------------------------------------------- filter data
  regions: Array<{ label: string; value: any }> = [];
  /** Master lists, fetched once. */
  private allMCs: any[] = [];
  private allRMCs: any[] = [];
  private allStates: any[] = [];
  private allDistricts: any[] = [];
  /** Lists narrowed by the level above them. */
  centersMC1: any[] = [];
  centersRMC1: any[] = [];
  filterStates: any[] = [];
  filterDistrict: any[] = [];
  filteredStations: any[] = [];

  selectedRegion: any[] = [];
  selectedMC: any[] = [];
  selectedRMC: any[] = [];
  selectedState: any[] = [];
  selectedDistrict: any[] = [];
  selectedstations: any[] = [];

  mcDisabled = false;
  rmcDisabled = false;

  isAwsSelected = true;
  isOrgSelected = true;
  isArgSelected = true;

  /** Show stations that reported nothing. Off by default, as before. */
  showMissingStations = false;

  // -------------------------------------------------------------- statistics
  bandFilters: BandFilter[] = RAINFALL_BANDS.map((band) => ({
    band,
    count: 0,
    selected: true,
  }));

  maxStationRainfall: string = '—';
  maxStationname = '';
  maxStationStatename = '';
  minStationRainfall: string = '—';
  TotalStationsRecieved = 0;
  TotalStationsPending = 0;

  maxSeasonalStationRainfall: string = '—';
  maxSeasonalStationname = '';

  topN = 10;
  topnStations: Station[] = [];

  // ------------------------------------------------------------------- state
  isLoading = false;
  isloadingSurrondingStations = false;
  ischartInLoading = false;
  topNstationsloader = false;
  /** True while html2canvas is rasterising the map. */
  isSnapshotting = false;
  /** User-facing error banner. Replaces the old alert() calls. */
  errorMessage = '';

  stationData: Station[] = [];
  filteredData: Station[] = [];
  /** Stations captured by the most recent free-hand polygon. */
  stationInsidethePolygon: Station[] | null = null;

  // --------------------------------------------------------------- selection
  showSelectedStation = '';
  showSelectedStationCode: string | number = '';
  showSelectedState_name = '';
  showSelectedDistrict_name = '';
  StationTotalEntries: number | string = '—';
  StationsMissingEntries: number | string = '—';
  StationHighestRecord = '—';
  StationLowestRecord = '—';
  StationFirstDate = '—';
  maxRecordedDataDateofSelectedStation = '';

  // ----------------------------------------------------------------- compare
  /**
   * The single selection model shared by both the radius table and the polygon
   * table. Previously the polygon table bound its checkboxes to
   * `stationInsidethePolygon` while the chart read selection from a detached
   * copy, so polygon compare never plotted anything.
   */
  compareRows: CompareRow[] = [];
  selectAllChecked = false;
  selectedRadius = 50;
  private selectedLatitute: number | null = null;
  private selectedLongitute: number | null = null;

  // ------------------------------------------------------------------ charts
  chart: Chart | null = null;
  chartCompare: Chart | null = null;
  /** Live Highcharts instance behind `chartCompare`, cached for resizing. */
  private chartCompareRef: Highcharts.Chart | null = null;
  panelHeight = DEFAULT_PANEL_HEIGHT;
  chartHeight = `${DEFAULT_PANEL_HEIGHT - CHART_VERTICAL_CHROME}px`;

  // ----------------------------------------------------- floating analytics
  /** Cards live over the empty sea areas; each folds to its title bar. */
  cardOpen: Record<CardKey, boolean> = {
    distribution: true,
    coverage: true,
  };

  /** Master switch, alongside the Filters and Insights panel toggles. */
  showFloatingCards = true;

  /**
   * Drag displacement from each card's CSS anchor, in pixels.
   *
   * Stored as an offset rather than an absolute position so the cards keep
   * their responsive anchoring (one pinned left, one pinned right) and only the
   * user's own displacement is layered on top.
   */
  cardOffset: Record<CardKey, { x: number; y: number }> = {
    distribution: { x: 0, y: 0 },
    coverage: { x: 0, y: 0 },
  };
  /** Non-null only while a card is being dragged; also raises its z-index. */
  draggingCard: CardKey | null = null;

  private dragOrigin = { x: 0, y: 0, ox: 0, oy: 0 };
  private dragBounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  private readonly onCardDragRef = (e: MouseEvent) => this.onCardDrag(e);
  private readonly onCardDragEndRef = () => this.endCardDrag();
  distributionChart: Chart | null = null;
  /** Reporting completeness donut in the right panel's day summary. */
  coverageDonut: Chart | null = null;
  /** Horizontal bars for the top-station leaderboard. */
  topChart: Chart | null = null;
  coverage: CentreCoverage[] = [];
  /** Stations kept by the hierarchy + type filters, before band visibility. */
  private scopedData: Station[] = [];
  /** Geographic scope only — no station-type or band filtering. Drives clouds. */
  private cloudSourceData: Station[] = [];

  showHeatLayer = false;
  private heatLayer: L.HeatLayer | null = null;

  /**
   * Single source for the heat gradient — the layer and its legend are both
   * built from this, so the swatch can never drift from what is drawn.
   */
  readonly heatGradient: ReadonlyArray<{ stop: number; color: string }> = [
    { stop: 0, color: '#2c7bb6' },
    { stop: 0.3, color: '#00ccbc' },
    { stop: 0.5, color: '#90eb9d' },
    { stop: 0.7, color: '#f9d057' },
    { stop: 0.85, color: '#f29e2e' },
    { stop: 1, color: '#d7191c' },
  ];
  /** The day's highest reading; heat intensity is normalised against it. */
  heatPeak = 0;

  // -------------------------------------------------------------------- ui
  /** Left rail: date, hierarchy, station type, rainfall categories. */
  isFilterPanelOpen = true;
  /** Right rail: day summary and the top-station leaderboard. */
  isInsightPanelOpen = true;
  isBottomNavOpen = false;
  selectedOption: PanelMode = 'station_details';
  isDraggingEnabled = true;

  // ------------------------------------------------------------------- map
  private stationObservationMap!: L.Map;
  private markerLayer = L.layerGroup();
  private drawnItems = new L.FeatureGroup();
  private compareCircle: L.Circle | null = null;

  // ------------------------------------------------------------------ clouds
  /** Synthetic cloud rendered from this page's own rainfall readings. */
  showRainClouds = false;
  private rainCloudLayer: RainfallCloudLayer | null = null;

  /** 'street' = OpenStreetMap, 'satellite' = Esri World Imagery. */
  basemap: 'street' | 'satellite' = 'street';
  private streetTiles!: L.TileLayer;
  private satelliteTiles!: L.TileLayer;
  private stateBorders: L.GeoJSON | null = null;
  /**
   * The mask is ~17k vertices and the outline repeats them. On SVG that is 34k
   * DOM path points re-projected on every zoom; canvas rebuilds the same path
   * far more cheaply, and Leaflet's canvas renderer fills with the even-odd
   * rule, which is exactly what punching holes needs.
   */
  private maskRenderer = L.canvas({ pane: 'ss-mask', padding: 0.1 });

  // --------------------------------------------------------------- resizing
  private isResizing = false;
  /** Stored so the listeners can actually be removed again. */
  private readonly onMouseMoveRef = (e: MouseEvent) => this.onMouseMove(e);
  private readonly onMouseUpRef = () => this.onMouseUp();

  constructor(
    private datePipe: DatePipe,
    private http: HttpClient,
    private zone: NgZone,
    private regionService: getRegionService,
    private centerService: CenterService,
    private getStateService: getStateService,
    private getDistrictService: getDistrictService,
    private fetchStationDataService: FetchStationDataService,
    private constants: Constants
  ) {
    const loggedInUser = localStorage.getItem('isAuthorised');
    const parsed = loggedInUser ? JSON.parse(loggedInUser) : null;
    const user = parsed?.data?.[0] ?? {};
    this.currentUserType = user.mcorhq ?? '';
    this.currentUserName = (user.name ?? '').replace(/^\S+\s/, '');
    this.currentUserMcCategory = (user.name ?? '').split(' ')[0].toLowerCase();
  }

  // =========================================================== lifecycle ====

  async ngOnInit(): Promise<void> {

    this.initStationObservationMap();
    // GeoJSON first so state outlines sit underneath the markers rather than
    // racing them and covering the smaller icons.
    this.loadGeoJSON();

    this.fetchRegionData();
    await Promise.all([this.getAllMCData(), this.getAllRMCData()]);
    this.getAllStates();
    this.getAllDistricts();

    this.fetchStationData(this.selected_Date);
    this.fetchSeasonalStationData(this.selected_Date);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('mousemove', this.onMouseMoveRef);
    window.removeEventListener('mouseup', this.onMouseUpRef);
    window.removeEventListener('mousemove', this.onCardDragRef);
    window.removeEventListener('mouseup', this.onCardDragEndRef);
    this.stationObservationMap?.remove();
  }

  // =============================================================== helpers ==

  /** Formats any date-ish input as yyyy-MM-dd. Safe for strings and Dates. */
  private toIsoDate(value: Date | string): string {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }

  /** Public alias kept for the template's date formatting. */
  formatDate(value: Date | string): string {
    return this.toIsoDate(value);
  }

  displayDate(value: string): string {
    return this.datePipe.transform(value, 'dd MMM yyyy') ?? value;
  }

  /** Renders a reading for display, collapsing the missing-value sentinel. */
  formatReading(value: unknown): string {
    return isMissing(value) ? 'No data' : `${Number(value).toFixed(1)} mm`;
  }

  trackByStationCode = (_: number, s: { station_code: string | number }) =>
    s.station_code;
  trackByBandKey = (_: number, f: BandFilter) => f.band.key;
  trackByCentre = (_: number, c: CentreCoverage) => c.centre;

  dismissError(): void {
    this.errorMessage = '';
  }

  // ========================================================== data loading ==

  fetchRegionData(): void {
    this.regionService
      .fetchData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.regions = (response?.data ?? []).map((region: any) => ({
            label: region.region_name,
            value: region.region_code,
          }));
        },
        error: () => {
          this.errorMessage = 'Could not load regions. Filtering by region is unavailable.';
        },
      });
  }

  private async getAllMCData(): Promise<void> {
    try {
      const response = await this.centerService.fetchData('MC').toPromise();
      this.allMCs = response?.data ?? [];
      this.centersMC1 = this.allMCs;
    } catch {
      this.errorMessage = 'Could not load meteorological centres.';
    }
  }

  private async getAllRMCData(): Promise<void> {
    try {
      const response = await this.centerService.fetchData('RMC').toPromise();
      this.allRMCs = response?.data ?? [];
      this.centersRMC1 = this.allRMCs;
    } catch {
      this.errorMessage = 'Could not load regional meteorological centres.';
    }
  }

  private getAllStates(): void {
    this.getStateService
      .fetchData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.allStates = response?.data ?? [];
          this.filterStates = this.allStates;

          // MC/RMC users are pinned to their own centre and cannot widen the scope.
          if (this.currentUserType !== 'mc') return;

          const matchesUser = (c: any) =>
            c.centre_name?.toLowerCase() === this.currentUserName.toLowerCase();

          if (this.currentUserMcCategory === 'mc') {
            this.rmcDisabled = true;
            this.selectedMC = this.allMCs.filter(matchesUser);
            this.filterStates = this.statesForCentres(this.selectedMC);
          } else {
            this.mcDisabled = true;
            this.selectedRMC = this.allRMCs.filter(matchesUser);
            this.filterStates = this.statesForCentres(this.selectedRMC);
          }
        },
        error: () => {
          this.errorMessage = 'Could not load states.';
        },
      });
  }

  private getAllDistricts(): void {
    this.getDistrictService
      .fetchData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.allDistricts = response?.data ?? [];
        },
        error: () => {
          this.errorMessage = 'Could not load districts.';
        },
      });
  }

  private statesForCentres(centres: any[]): any[] {
    const names = new Set(centres.map((c) => c.centre_name));
    return this.allStates.filter((s) => names.has(s.centre_name));
  }

  fetchStationData(date: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.fetchStationDataService
      .fetchStationDataTemp(date ?? '')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.stationData = response?.data ?? [];
          this.computeDayHeadlines(this.stationData);
          // Re-apply whatever filters the user already had set rather than
          // silently resetting the map to "everything" on each date change.
          this.filterStationData();
          this.isLoading = false;
        },
        error: () => {
          this.stationData = [];
          this.filteredData = [];
          this.renderMarkers();
          this.resetHeadlines();
          this.isLoading = false;
          this.errorMessage = `No station data available for ${this.displayDate(date)}.`;
        },
      });
  }

  private resetHeadlines(): void {
    this.maxStationRainfall = '—';
    this.minStationRainfall = '—';
    this.maxStationname = '';
    this.maxStationStatename = '';
    this.TotalStationsRecieved = 0;
    this.TotalStationsPending = 0;
    this.bandFilters.forEach((f) => (f.count = 0));
    this.topnStations = [];
    this.coverage = [];
    this.distributionChart = null;
    this.coverageDonut = null;
    this.topChart = null;
  }

  /**
   * Highest/lowest and received/pending for the day.
   * The missing-value sentinel is excluded from both extremes — it used to be
   * folded into the minimum, so the "lowest recorded" figure was -999.9 for any
   * day where a single station had not reported.
   */
  private computeDayHeadlines(stations: Station[]): void {
    let max: Station | null = null;
    let min: Station | null = null;
    let received = 0;
    let pending = 0;

    for (const station of stations) {
      if (isMissing(station.data)) {
        pending++;
        continue;
      }
      received++;
      if (!max || station.data > max.data) max = station;
      if (!min || station.data < min.data) min = station;
    }

    this.maxStationRainfall = max ? this.formatReading(max.data) : '—';
    this.maxStationname = max?.station_name ?? '';
    this.maxStationStatename = max?.state_name ?? '';
    this.minStationRainfall = min ? this.formatReading(min.data) : '—';
    this.TotalStationsRecieved = received;
    this.TotalStationsPending = pending;
    this.renderCoverageDonut();
  }

  private fetchSeasonalStationData(date: string): void {
    const range = this.constants.getCurrentMonthSeasonFromAndToCurrentDate(
      new Date(date)
    );
    this.currSeasonStartDate = range.startDate;
    this.currentSeasonEndDate = range.endDate;

    this.fetchStationDataService
      .fetchInRangeStationdata(range.startDate, range.endDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const rows: Station[] = response?.data ?? [];
          let max: Station | null = null;
          for (const row of rows) {
            if (isMissing(row.data) || row.data === 0) continue;
            if (!max || row.data > max.data) max = row;
          }
          this.maxSeasonalStationRainfall = max
            ? this.formatReading(max.data)
            : '—';
          this.maxSeasonalStationname = max?.station_name ?? '';
        },
        error: () => {
          this.maxSeasonalStationRainfall = '—';
          this.maxSeasonalStationname = '';
        },
      });
  }

  // ============================================================== filtering ==

  onDateChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (!value) return;
    this.selected_Date = value;
    this.fetchStationData(value);
    this.fetchSeasonalStationData(value);
  }

  /**
   * Each cascade level clears everything below it. Without this you could leave
   * a district selected that no longer belonged to the chosen state, and the map
   * would come back empty with no explanation.
   */
  onRegionChange(): void {
    const codes = new Set(this.selectedRegion ?? []);
    const inRegion = (c: any) => codes.size === 0 || codes.has(c.region_code);
    this.centersMC1 = this.allMCs.filter(inRegion);
    this.centersRMC1 = this.allRMCs.filter(inRegion);

    this.selectedMC = [];
    this.selectedRMC = [];
    this.mcDisabled = false;
    this.rmcDisabled = false;
    this.filterStates = this.allStates;
    this.clearStateAndBelow();
  }

  onMcChange(): void {
    this.rmcDisabled = (this.selectedMC?.length ?? 0) > 0;
    this.filterStates = this.selectedMC?.length
      ? this.statesForCentres(this.selectedMC)
      : this.allStates;
    this.clearStateAndBelow();
  }

  onRMcChange(): void {
    this.mcDisabled = (this.selectedRMC?.length ?? 0) > 0;
    this.filterStates = this.selectedRMC?.length
      ? this.statesForCentres(this.selectedRMC)
      : this.allStates;
    this.clearStateAndBelow();
  }

  onStateChange(): void {
    const codes = new Set((this.selectedState ?? []).map((s: any) => s.state_code));
    this.filterDistrict = codes.size
      ? this.allDistricts.filter((d) => codes.has(d.state_code))
      : [];
    this.selectedDistrict = [];
    this.filteredStations = [];
    this.selectedstations = [];
  }

  onDistrictChange(): void {
    const codes = new Set(
      (this.selectedDistrict ?? []).map((d: any) => d.district_code)
    );
    this.filteredStations = codes.size
      ? this.stationData.filter((s) => codes.has(s.district_code))
      : [];
    this.selectedstations = [];
  }

  private clearStateAndBelow(): void {
    this.selectedState = [];
    this.selectedDistrict = [];
    this.selectedstations = [];
    this.filterDistrict = [];
    this.filteredStations = [];
  }

  /**
   * Rebuilds the visible station set from scratch.
   *
   * Order matters: band counts are computed from the *scoped* set (hierarchy +
   * station type) and before the band visibility filter is applied. That keeps
   * each count stable no matter which bands are ticked — previously unticking a
   * band re-derived the counts from the already-narrowed array, so the numbers
   * shifted underneath the user.
   */
  filterStationData(): void {
    let scoped: Station[] = this.selectedstations?.length
      ? [...this.selectedstations]
      : [...this.stationData];

    if (!this.selectedstations?.length) {
      if (this.selectedRegion?.length) {
        const codes = new Set(this.selectedRegion);
        scoped = scoped.filter((s) => codes.has(s.region_code));
      }
      if (this.selectedState?.length) {
        const codes = new Set(this.selectedState.map((s: any) => s.state_code));
        scoped = scoped.filter((s) => codes.has(s.state_code));
      }
      if (this.selectedDistrict?.length) {
        const codes = new Set(
          this.selectedDistrict.map((d: any) => d.district_code)
        );
        scoped = scoped.filter((s) => codes.has(s.district_code));
      }
    }

    /*
     * Snapshot for the cloud layer, taken before the station-type filter.
     *
     * The cloud represents the rainfall field over an area, not a set of
     * instruments — so hiding AWS/ORG/ARG markers should not dissolve it. It
     * still follows the geographic filters, which do change which area is
     * being described.
     */
    const geoScope = scoped;

    const types = new Set<string>();
    if (this.isAwsSelected) types.add('AWS');
    if (this.isOrgSelected) types.add('ORG');
    if (this.isArgSelected) types.add('ARG');
    scoped = scoped.filter((s) => types.has(s.station_type ?? ''));

    /*
     * The centre filter is applied *after* this snapshot on purpose.
     *
     * Coverage is built from the pre-centre scope so the Data Received card
     * keeps listing every centre. Selecting one from that list previously
     * narrowed the very data the list was built from, so the list collapsed to
     * the single row you had just clicked and there was no way back.
     */
    this.scopedData = scoped;

    // The centre restriction is geographic, so it applies to the cloud too.
    const byCentre = (rows: Station[]): Station[] => {
      if (this.selectedstations?.length) return rows;
      let out = rows;
      if (this.selectedMC?.length) {
        const names = new Set(this.selectedMC.map((m: any) => m.centre_name));
        out = out.filter((s) => names.has(s.centre_name));
      }
      if (this.selectedRMC?.length) {
        const names = new Set(this.selectedRMC.map((m: any) => m.centre_name));
        out = out.filter((s) => names.has(s.centre_name));
      }
      return out;
    };

    this.cloudSourceData = byCentre(geoScope);
    scoped = byCentre(scoped);

    this.updateBandCounts(scoped);

    const visibleBands = new Set(
      this.bandFilters.filter((f) => f.selected).map((f) => f.band.key)
    );
    this.filteredData = scoped.filter((station) => {
      const band = bandFor(station.data);
      if (!band) return this.showMissingStations;
      return visibleBands.has(band.key);
    });

    this.computeTopNStations();
    this.computeCoverage();
    this.renderDistributionChart();
    this.renderMarkers();
    this.refreshHeatLayer();
    this.refreshRainClouds();
  }

  /**
   * Reporting completeness per centre, worst first.
   *
   * The "pending" headline says how many stations are missing but never which
   * centres they belong to, which is the part an operator can act on. Computed
   * from the scoped set so it respects the active filters.
   */
  private computeCoverage(): void {
    const byCentre = new Map<string, { total: number; missing: number }>();

    for (const station of this.scopedData) {
      const centre = station.centre_name?.trim();
      if (!centre) continue;
      const entry = byCentre.get(centre) ?? { total: 0, missing: 0 };
      entry.total++;
      if (isMissing(station.data)) entry.missing++;
      byCentre.set(centre, entry);
    }

    // Every centre is listed — the card scrolls rather than truncating, so a
    // centre is never silently missing from the ranking. Worst first; fully
    // reported centres fall to the bottom showing 0.
    this.coverage = Array.from(byCentre, ([centre, v]) => ({
      centre,
      total: v.total,
      missing: v.missing,
      pct: v.total ? Math.round(((v.total - v.missing) / v.total) * 100) : 0,
    })).sort((a, b) => b.missing - a.missing || a.centre.localeCompare(b.centre));
  }

  /** Centres still missing at least one station — drives the card's subtitle. */
  get centresAwaiting(): number {
    return this.coverage.filter((c) => c.missing > 0).length;
  }

  /**
   * Totals derived from `coverage` rather than the day headlines, so the
   * card's summary always agrees with the rows underneath it — the headlines
   * count every station, while coverage respects the active filters.
   */
  get coverageTotal(): number {
    return this.coverage.reduce((sum, c) => sum + c.total, 0);
  }

  get coverageReceived(): number {
    return this.coverage.reduce((sum, c) => sum + (c.total - c.missing), 0);
  }

  /** Horizontal bars read better than columns inside a narrow floating card. */
  private renderDistributionChart(): void {
    const rows = this.bandFilters.filter((f) => f.count > 0);

    if (!rows.length) {
      this.distributionChart = null;
      return;
    }

    this.distributionChart = new Chart({
      chart: {
        type: 'bar',
        height: Math.max(120, rows.length * 26 + 34),
        backgroundColor: 'transparent',
        spacing: [4, 4, 4, 0],
      },
      title: { text: '' },
      credits: { enabled: false },
      legend: { enabled: false },
      exporting: { enabled: false },
      xAxis: {
        categories: rows.map((f) => f.band.label),
        lineWidth: 0,
        tickLength: 0,
        labels: { style: { fontSize: '10px', color: '#5b6675' } },
      },
      yAxis: {
        title: { text: null },
        gridLineColor: '#eef1f5',
        labels: { style: { fontSize: '10px', color: '#8b96a5' } },
      },
      tooltip: {
        headerFormat: '',
        pointFormat: '<b>{point.category}</b><br>{point.y} stations',
      },
      plotOptions: {
        bar: {
          borderWidth: 0,
          borderRadius: 2,
          pointPadding: 0.04,
          groupPadding: 0.08,
          cursor: 'pointer',
          point: {
            events: {
              // Clicking a bar isolates that band — the fastest way to ask
              // "where exactly is the heavy rain today?".
              click: (e: any) => {
                this.zone.run(() => this.isolateBand(e.point.category));
              },
            },
          },
        },
      },
      series: [
        {
          type: 'bar',
          name: 'Stations',
          data: rows.map((f) => ({ y: f.count, color: f.band.color })),
        },
      ],
    });
  }

  /** Received vs pending, as a donut sitting behind the two stat tiles. */
  private renderCoverageDonut(): void {
    const received = this.TotalStationsRecieved;
    const pending = this.TotalStationsPending;

    if (!received && !pending) {
      this.coverageDonut = null;
      return;
    }

    this.coverageDonut = new Chart({
      chart: {
        type: 'pie',
        height: 132,
        backgroundColor: 'transparent',
        spacing: [2, 2, 2, 2],
      },
      title: {
        // Completeness reads faster as a number in the hole than off the arc.
        text: `<span style="font-size:17px;font-weight:700;color:#1a4fa0">${Math.round(
          (received / Math.max(1, received + pending)) * 100
        )}%</span><br><span style="font-size:9px;color:#8b96a5">REPORTED</span>`,
        align: 'center',
        verticalAlign: 'middle',
        useHTML: true,
        y: 4,
      },
      credits: { enabled: false },
      legend: { enabled: false },
      exporting: { enabled: false },
      tooltip: { pointFormat: '<b>{point.y}</b> stations ({point.percentage:.1f}%)' },
      plotOptions: {
        pie: {
          innerSize: '72%',
          borderWidth: 0,
          dataLabels: { enabled: false },
          states: { hover: { halo: { size: 4 } } },
        },
      },
      series: [
        {
          type: 'pie',
          name: 'Stations',
          data: [
            { name: 'Received', y: received, color: '#1a4fa0' },
            { name: 'Pending', y: pending, color: '#e0e5ec' },
          ],
        },
      ],
    });
  }

  /** Visual companion to the leaderboard list, coloured by rainfall band. */
  private renderTopChart(): void {
    if (!this.topnStations.length) {
      this.topChart = null;
      return;
    }

    // Highcharts bar charts plot bottom-up, so reverse to put #1 on top.
    const rows = [...this.topnStations].reverse();

    this.topChart = new Chart({
      chart: {
        type: 'bar',
        height: Math.max(110, rows.length * 22 + 26),
        backgroundColor: 'transparent',
        spacing: [4, 4, 2, 0],
      },
      title: { text: '' },
      credits: { enabled: false },
      legend: { enabled: false },
      exporting: { enabled: false },
      xAxis: {
        categories: rows.map((s) => s.station_name),
        lineWidth: 0,
        tickLength: 0,
        labels: { style: { fontSize: '9px', color: '#5b6675' } },
      },
      yAxis: {
        title: { text: null },
        gridLineColor: '#eef1f5',
        labels: { style: { fontSize: '9px', color: '#8b96a5' }, format: '{value}' },
      },
      tooltip: {
        headerFormat: '',
        pointFormat: '<b>{point.category}</b><br>{point.y} mm',
      },
      plotOptions: {
        bar: {
          borderWidth: 0,
          borderRadius: 2,
          pointPadding: 0.05,
          groupPadding: 0.06,
          cursor: 'pointer',
          point: {
            events: {
              click: (e: any) => {
                const station = rows[e.point.index];
                if (station) this.zone.run(() => this.focusStation(station));
              },
            },
          },
        },
      },
      series: [
        {
          type: 'bar',
          name: 'Rainfall',
          data: rows.map((s) => ({
            y: s.data,
            // Pale bands need the outline they get on the map; here a darker
            // stroke would be noisy, so fall back to the brand colour.
            color: bandFor(s.data)?.color ?? '#1a4fa0',
            borderColor: '#c8d0da',
            borderWidth: 1,
          })),
        },
      ],
    });
  }

  /** Shows only the clicked band. Clicking the active band restores all. */
  isolateBand(label: string): void {
    const target = this.bandFilters.find((f) => f.band.label === label);
    if (!target) return;

    const alreadyIsolated =
      target.selected && this.bandFilters.every((f) => f.selected === (f === target));

    this.bandFilters.forEach((f) => (f.selected = alreadyIsolated || f === target));
    this.showMissingStations = false;
    this.filterStationData();
  }

  /** Centres the map on a station and opens its detail panel. */
  focusStation(station: Station): void {
    const lat = parseFloat(String(station.latitude));
    const lng = parseFloat(String(station.longitude));
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      this.stationObservationMap.flyTo([lat, lng], 9, { duration: 0.8 });
    }
    this.showStationData(station);
  }

  toggleCard(key: CardKey): void {
    this.cardOpen[key] = !this.cardOpen[key];

    // Unfolding rebuilds the body, so the chart needs a fresh instance for the
    // same reason toggleFloatingCards does.
    if (key === 'distribution' && this.cardOpen.distribution) {
      this.renderDistributionChart();
    }
  }

  toggleFloatingCards(): void {
    this.showFloatingCards = !this.showFloatingCards;

    // Hiding the layer destroys the chart's container, and an angular-highcharts
    // Chart instance cannot be re-attached to a new element — it would come back
    // as an empty box. Build a fresh instance for the fresh container.
    if (this.showFloatingCards) {
      this.renderDistributionChart();
    }
  }

  /** Returns both cards to their default anchored positions. */
  resetCardPositions(): void {
    this.cardOffset = { distribution: { x: 0, y: 0 }, coverage: { x: 0, y: 0 } };
  }

  /**
   * Starts a drag from the card's grip handle.
   *
   * The grip is separate from the fold button so a drag can never be mistaken
   * for a click on the title — no movement threshold or click suppression
   * needed. Travel is clamped at mousedown against the map pane, so a card
   * cannot be thrown off-screen and stranded.
   */
  startCardDrag(event: MouseEvent, key: CardKey): void {
    event.preventDefault();
    event.stopPropagation();

    const card = (event.currentTarget as HTMLElement).closest(
      '.ss-fcard'
    ) as HTMLElement | null;
    const pane = card?.closest('.ss-map-pane') as HTMLElement | null;
    if (!card || !pane) return;

    const cardRect = card.getBoundingClientRect();
    const paneRect = pane.getBoundingClientRect();
    const offset = this.cardOffset[key];

    this.draggingCard = key;
    this.dragOrigin = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
    this.dragBounds = {
      minX: offset.x + (paneRect.left + 8 - cardRect.left),
      maxX: offset.x + (paneRect.right - 8 - cardRect.right),
      minY: offset.y + (paneRect.top + 8 - cardRect.top),
      maxY: offset.y + (paneRect.bottom - 8 - cardRect.bottom),
    };

    window.addEventListener('mousemove', this.onCardDragRef);
    window.addEventListener('mouseup', this.onCardDragEndRef);
  }

  private onCardDrag(event: MouseEvent): void {
    const key = this.draggingCard;
    if (!key) return;

    const { minX, maxX, minY, maxY } = this.dragBounds;
    this.cardOffset[key] = {
      x: this.clamp(this.dragOrigin.ox + (event.clientX - this.dragOrigin.x), minX, maxX),
      y: this.clamp(this.dragOrigin.oy + (event.clientY - this.dragOrigin.y), minY, maxY),
    };
  }

  private endCardDrag(): void {
    this.draggingCard = null;
    window.removeEventListener('mousemove', this.onCardDragRef);
    window.removeEventListener('mouseup', this.onCardDragEndRef);
  }

  private clamp(value: number, min: number, max: number): number {
    // A folded card can be taller than its bounds allow; keep min authoritative.
    return max < min ? min : Math.min(max, Math.max(min, value));
  }

  /** True when this centre is the one currently restricting the map. */
  isCentreSelected(centre: string): boolean {
    return (
      this.selectedMC.some((c: any) => c.centre_name === centre) ||
      this.selectedRMC.some((c: any) => c.centre_name === centre)
    );
  }

  /**
   * Restricts the map to a single centre straight from the coverage list, and
   * highlights that row. Clicking the highlighted row again clears the
   * restriction, so the list is a toggle rather than a one-way trip.
   */
  focusCentre(centre: string): void {
    if (this.isCentreSelected(centre)) {
      this.selectedMC = [];
      this.selectedRMC = [];
      this.mcDisabled = false;
      this.rmcDisabled = false;
      this.filterStates = this.allStates;
      this.filterStationData();
      return;
    }

    const inMC = this.allMCs.find((c) => c.centre_name === centre);
    if (inMC) {
      this.selectedMC = [inMC];
      this.selectedRMC = [];
      this.rmcDisabled = true;
      this.mcDisabled = false;
    } else {
      const inRMC = this.allRMCs.find((c) => c.centre_name === centre);
      if (!inRMC) return;
      this.selectedRMC = [inRMC];
      this.selectedMC = [];
      this.mcDisabled = true;
      this.rmcDisabled = false;
    }
    this.filterStates = this.statesForCentres([...this.selectedMC, ...this.selectedRMC]);
    this.clearStateAndBelow();
    this.filterStationData();
  }

  // ================================================================= heat ==

  toggleHeatLayer(): void {
    this.showHeatLayer = !this.showHeatLayer;
    this.refreshHeatLayer();
  }

  /** CSS gradient for the legend bar, built from the same stops as the layer. */
  get heatGradientCss(): string {
    const stops = this.heatGradient
      .map((g) => `${g.color} ${Math.round(g.stop * 100)}%`)
      .join(', ');
    return `linear-gradient(to right, ${stops})`;
  }

  /**
   * Tick labels in millimetres.
   *
   * Intensity is normalised against the day's own peak, so the colours mean
   * nothing in absolute terms — the legend has to convert them back to mm or
   * it is decoration.
   */
  get heatLegendTicks(): Array<{ pct: number; label: string }> {
    const peak = this.heatPeak;
    if (!peak) return [];
    return [0, 0.25, 0.5, 0.75, 1].map((f) => ({
      pct: f * 100,
      label: (peak * f).toFixed(f === 0 ? 0 : 1),
    }));
  }

  /**
   * Density surface over the reporting stations. Intensity is normalised
   * against the day's own maximum so a quiet day still shows structure rather
   * than a uniformly cold map.
   */
  private refreshHeatLayer(): void {
    if (!this.showHeatLayer) {
      if (this.heatLayer) {
        this.stationObservationMap.removeLayer(this.heatLayer);
        this.heatLayer = null;
      }
      this.markerLayer.addTo(this.stationObservationMap);
      return;
    }

    // Markers and the heat surface together are unreadable; show one at a time.
    this.stationObservationMap.removeLayer(this.markerLayer);

    const readings = this.filteredData.filter((s) => !isMissing(s.data) && s.data > 0);
    const peak = readings.reduce((m, s) => Math.max(m, s.data), 0) || 1;
    // Published to the legend so its labels track the data, not a fixed scale.
    this.heatPeak = peak;

    const points: L.HeatLatLngTuple[] = [];
    for (const station of readings) {
      const lat = parseFloat(String(station.latitude));
      const lng = parseFloat(String(station.longitude));
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      points.push([lat, lng, Math.min(1, station.data / peak)]);
    }

    if (this.heatLayer) {
      this.heatLayer.setLatLngs(points);
      return;
    }

    this.heatLayer = L.heatLayer(points, {
      radius: 18,
      blur: 22,
      // Floor the alpha at 70% so light rainfall still reads as a solid signal
      // instead of fading into the basemap.
      minOpacity: 0.7,
      max: 1,
      gradient: this.heatGradient.reduce(
        (acc, g) => ({ ...acc, [g.stop]: g.color }),
        {} as Record<number, string>
      ),
    });
    this.heatLayer.addTo(this.stationObservationMap);
  }

  private updateBandCounts(scoped: Station[]): void {
    const counts = new Map<string, number>();
    for (const station of scoped) {
      const band = bandFor(station.data);
      if (!band) continue;
      counts.set(band.key, (counts.get(band.key) ?? 0) + 1);
    }
    for (const filter of this.bandFilters) {
      filter.count = counts.get(filter.band.key) ?? 0;
    }
  }

  toggleAllBands(selected: boolean): void {
    this.bandFilters.forEach((f) => (f.selected = selected));
    this.filterStationData();
  }

  get allBandsSelected(): boolean {
    return this.bandFilters.every((f) => f.selected);
  }

  // ================================================================= top N ==

  onTopNChange(value: number): void {
    const n = Number(value);
    this.topN = !Number.isFinite(n) ? 1 : Math.min(50, Math.max(1, Math.trunc(n)));
    this.computeTopNStations();
  }

  /**
   * `Array.prototype.sort` mutates in place, so the previous implementation
   * permanently reordered `filteredData` — and with it the marker draw order —
   * every time the Top N box changed. Sort a copy, and drop missing readings so
   * the sentinel cannot rank.
   */
  private computeTopNStations(): void {
    this.topNstationsloader = true;
    this.topnStations = [...this.filteredData]
      .filter((s) => !isMissing(s.data))
      .sort((a, b) => b.data - a.data)
      .slice(0, this.topN);
    this.renderTopChart();
    this.topNstationsloader = false;
  }

  // =================================================================== map ==

  private initStationObservationMap(): void {
    this.stationObservationMap = L.map('map_observations', {
      // Draw all vector layers into one canvas instead of one SVG/DOM node per
      // station. With several thousand markers this is the difference between a
      // responsive map and a janky one.
      preferCanvas: true,
      center: [23, 82],
      zoom: 5,
      zoomControl: true,
      scrollWheelZoom: true,
      zoomSnap: 0.1,
      zoomDelta: 0.5,
      minZoom: 4,
      // Panning is the primary interaction on a map page; it used to ship
      // disabled behind a toggle button.
      dragging: true,
    });

    // crossOrigin is what makes the snapshot possible: without it the tiles
    // taint the canvas and html2canvas produces a blank basemap.
    this.streetTiles = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
        crossOrigin: 'anonymous',
      }
    );

    // Esri World Imagery — no API key required, unlike Mapbox or Google.
    this.satelliteTiles = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution:
          'Imagery © Esri, Maxar, Earthstar Geographics, and the GIS User Community',
        maxZoom: 18,
        crossOrigin: 'anonymous',
      }
    );

    this.streetTiles.addTo(this.stationObservationMap);

    // Own pane for the dimming mask: above the tiles (200) but below the
    // markers (400), so it can never paint over a station.
    const maskPane = this.stationObservationMap.createPane('ss-mask');
    maskPane.style.zIndex = '350';
    maskPane.style.pointerEvents = 'none';

    // Synthetic cloud sits above the markers, as requested, at partial opacity
    // so the stations it was derived from remain visible underneath.
    const rainCloudPane = this.stationObservationMap.createPane('ss-raincloud');
    rainCloudPane.style.zIndex = '450';
    rainCloudPane.style.pointerEvents = 'none';
    rainCloudPane.style.opacity = '0.88';

    this.markerLayer.addTo(this.stationObservationMap);
    this.stationObservationMap.addLayer(this.drawnItems);

    const drawControl = new L.Control.Draw({
      edit: { featureGroup: this.drawnItems, remove: true },
      draw: {
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false,
      },
    });
    this.stationObservationMap.addControl(drawControl);

    this.stationObservationMap.on(L.Draw.Event.CREATED, (event: any) => {
      this.zone.run(() => this.onPolygonDrawn(event));
    });

    this.stationObservationMap.on(L.Draw.Event.DELETED, () => {
      this.zone.run(() => {
        this.stationInsidethePolygon = null;
      });
    });
  }

  private onPolygonDrawn(event: any): void {
    const layer = event.layer;
    this.drawnItems.addLayer(layer);

    const latlngs = layer.getLatLngs?.()[0] ?? [];
    if (latlngs.length < 3) return;

    const ring = latlngs.map((c: L.LatLng) => [c.lng, c.lat]);
    const [firstLng, firstLat] = ring[0];
    const [lastLng, lastLat] = ring[ring.length - 1];
    if (firstLng !== lastLng || firstLat !== lastLat) ring.push([firstLng, firstLat]);

    const polygon = turf.polygon([ring]);

    // Select from the currently visible set, not the full unfiltered list —
    // drawing over a filtered map used to silently pull in hidden stations.
    this.stationInsidethePolygon = this.filteredData.filter((station) => {
      const lon = parseFloat(String(station.longitude));
      const lat = parseFloat(String(station.latitude));
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) return false;
      return turf.booleanPointInPolygon(turf.point([lon, lat]), polygon);
    });
  }

  /**
   * Vector style for a reading.
   *
   * These used to be seven PNG sprites — seven image requests, plus one `<img>`
   * element in the DOM per station. `circleMarker` is drawn straight into the
   * map's shared canvas: no requests, no per-station DOM, and it stays crisp at
   * any zoom or pixel density.
   */
  private styleFor(value: number): L.CircleMarkerOptions {
    const band = bandFor(value);

    // "Not reported" is dark grey at 60% — clearly separated from a genuine
    // zero reading, which is solid white, without needing a dashed outline.
    if (!band) {
      return {
        radius: 5,
        color: '#1c2430',
        weight: 1,
        opacity: 0.7,
        fillColor: '#4d4d4d',
        fillOpacity: 0.6,
      };
    }

    return {
      radius: 5,
      // A dark hairline keeps the pale bands (#ffffff, #AAF200, #FFFF00)
      // legible against light terrain.
      color: '#1c2430',
      weight: 1,
      opacity: 0.85,
      fillColor: band.color,
      fillOpacity: 0.95,
    };
  }

  private renderMarkers(): void {
    this.markerLayer.clearLayers();

    for (const station of this.filteredData) {
      const lat = parseFloat(String(station.latitude));
      const lng = parseFloat(String(station.longitude));
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
        continue;
      }

      const marker = L.circleMarker([lat, lng], this.styleFor(station.data));
      marker.bindPopup(() => this.buildPopup(station, lat, lng));
      this.markerLayer.addLayer(marker);
    }
  }

  /**
   * Builds the popup as a real DOM node with listeners attached once at
   * construction.
   *
   * The old version interpolated the station name into an HTML string and then
   * re-attached a document-wide `querySelector` click handler on every
   * `popupopen`, removing it on close with a freshly-created arrow function that
   * could never match. Handlers accumulated, so the fifth time you opened a
   * marker "More Info" fired five requests. Matching by name also wired the
   * wrong button whenever two states shared a station name.
   */
  private buildPopup(station: Station, lat: number, lng: number): HTMLElement {
    const root = document.createElement('div');
    root.className = 'station-popup';

    const title = document.createElement('div');
    title.className = 'station-popup__title';
    title.textContent = station.station_name;
    root.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'station-popup__meta';
    meta.textContent = [station.district_name, station.state_name]
      .filter(Boolean)
      .join(', ');
    root.appendChild(meta);

    const reading = document.createElement('div');
    reading.className = 'station-popup__reading';
    reading.textContent = this.formatReading(station.data);
    root.appendChild(reading);

    const actions = document.createElement('div');
    actions.className = 'station-popup__actions';

    const infoBtn = document.createElement('button');
    infoBtn.type = 'button';
    infoBtn.className = 'station-popup__btn station-popup__btn--info';
    infoBtn.textContent = 'More info';
    infoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.zone.run(() => this.showStationData(station));
    });

    const compareBtn = document.createElement('button');
    compareBtn.type = 'button';
    compareBtn.className = 'station-popup__btn station-popup__btn--compare';
    compareBtn.textContent = 'Compare';
    compareBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.zone.run(() => this.startCompare(station, lat, lng));
    });

    actions.append(infoBtn, compareBtn);
    root.appendChild(actions);
    return root;
  }

  private loadGeoJSON(): void {
    this.http
      .get('assets/geojson/INDIA_STATE.json')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.addCountryMask(res);

          // Internal state borders stay light so they read as reference lines
          // rather than competing with the station markers.
          this.stateBorders = L.geoJSON(res, {
            interactive: false,
            style: () => this.stateBorderStyle(),
          }).addTo(this.stationObservationMap);
        },
        error: () => {
          this.errorMessage = 'State boundaries could not be loaded.';
        },
      });
  }

  /**
   * Dims everything outside India.
   *
   * Built as one polygon covering the globe with India punched out as interior
   * rings — Leaflet treats every ring after the first as a hole. The states in
   * the GeoJSON tile the country exactly, so using each state's outer ring as a
   * hole yields the national outline without an expensive turf union.
   */
  private addCountryMask(geojson: any): void {
    const holes: L.LatLngExpression[][] = [];

    for (const feature of geojson?.features ?? []) {
      const geometry = feature?.geometry;
      if (!geometry) continue;

      const polygons =
        geometry.type === 'Polygon'
          ? [geometry.coordinates]
          : geometry.type === 'MultiPolygon'
          ? geometry.coordinates
          : [];

      for (const polygon of polygons) {
        // [0] is the outer ring; any further rings are the state's own holes,
        // which we deliberately ignore so enclaves stay lit.
        const ring = polygon?.[0];
        if (!ring?.length) continue;
        holes.push(ring.map(([lng, lat]: number[]) => [lat, lng]));
      }
    }

    if (!holes.length) return;

    // Padded well past ±180 so the dimming survives horizontal panning.
    const world: L.LatLngExpression[] = [
      [-89.9, -360],
      [-89.9, 360],
      [89.9, 360],
      [89.9, -360],
    ];

    L.polygon([world, ...holes], {
      pane: 'ss-mask',
      renderer: this.maskRenderer,
      interactive: false,
      stroke: false,
      fillColor: '#0b1220',
      fillOpacity: 0.8,
    }).addTo(this.stationObservationMap);

    // Bright rim on the dimmed side, so the coastline reads on both basemaps.
    L.polygon(holes, {
      pane: 'ss-mask',
      renderer: this.maskRenderer,
      interactive: false,
      fill: false,
      color: '#ffffff',
      weight: 1.4,
      opacity: 0.9,
    }).addTo(this.stationObservationMap);
  }

  /** Dark hairlines vanish on satellite imagery, so the borders invert. */
  private stateBorderStyle(): L.PathOptions {
    return this.basemap === 'satellite'
      ? { weight: 0.7, opacity: 0.45, color: '#ffffff', fill: false }
      : { weight: 0.7, opacity: 0.55, color: '#3d4652', fill: false };
  }

  /**
   * Saves the current map view as a PNG.
   *
   * Deliberately WYSIWYG: whatever overlays are on screen — the legend, the
   * floating cards — land in the image, so hiding them with the Cards toggle
   * first gives a clean map. Only interactive chrome is stripped, and the
   * attribution strip is kept because OSM and Esri both require it.
   */
  async downloadMapSnapshot(): Promise<void> {
    const pane = document.querySelector('.ss-map-pane') as HTMLElement | null;
    if (!pane || this.isSnapshotting) return;

    this.isSnapshotting = true;
    this.errorMessage = '';

    try {
      const canvas = await html2canvas(pane, {
        useCORS: true,
        backgroundColor: '#ffffff',
        // Retina-quality output; the map is a deliverable, not a thumbnail.
        scale: 2,
        logging: false,
        ignoreElements: (el: Element) => {
          const cls = (el as HTMLElement).classList;
          if (!cls) return false;
          return (
            cls.contains('ss-map-controls') ||
            cls.contains('ss-status') ||
            cls.contains('ss-error') ||
            cls.contains('ss-drawer') ||
            // Zoom and draw toolbars sit in .leaflet-top; .leaflet-bottom holds
            // the attribution, which must survive.
            cls.contains('leaflet-top')
          );
        },
      });

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png')
      );

      if (!blob) throw new Error('encode failed');
      saveAs(blob, `station-rainfall-${this.selected_Date}.png`);
    } catch {
      this.errorMessage =
        'Could not capture the map. Some map tiles may have blocked the export.';
    } finally {
      this.isSnapshotting = false;
    }
  }

  // ================================================================ clouds ==

  /** Synthetic cloud derived from the rainfall currently on the map. */
  toggleRainClouds(): void {
    this.showRainClouds = !this.showRainClouds;

    if (!this.showRainClouds) {
      if (this.rainCloudLayer) {
        this.stationObservationMap.removeLayer(this.rainCloudLayer);
        this.rainCloudLayer = null;
      }
      return;
    }

    this.rainCloudLayer = new RainfallCloudLayer({
      pane: 'ss-raincloud',
      // Level 9 keeps the per-tile pixel work bounded; Leaflet upscales above it.
      maxNativeZoom: 9,
      updateWhenZooming: false,
    });
    this.rainCloudLayer.addTo(this.stationObservationMap);
    this.refreshRainClouds();
  }

  /** Rebuilds the density field from whatever is currently on the map. */
  private refreshRainClouds(): void {
    if (!this.rainCloudLayer) return;

    const points = [];
    // cloudSourceData, not filteredData: unticking every station type empties
    // the map but must not dissolve the rainfall field it represents.
    for (const station of this.cloudSourceData) {
      if (isMissing(station.data) || station.data <= 0) continue;
      const lat = parseFloat(String(station.latitude));
      const lng = parseFloat(String(station.longitude));
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      points.push({ lat, lng, value: station.data });
    }

    this.rainCloudLayer.setField(buildCloudField(points));
  }

  toggleBasemap(): void {
    const toSatellite = this.basemap === 'street';
    this.stationObservationMap.removeLayer(
      toSatellite ? this.streetTiles : this.satelliteTiles
    );
    (toSatellite ? this.satelliteTiles : this.streetTiles).addTo(
      this.stationObservationMap
    );
    // Tiles land in the tile pane, below the mask — no need to re-stack.
    this.basemap = toSatellite ? 'satellite' : 'street';
    this.stateBorders?.setStyle(this.stateBorderStyle());
  }

  // ====================================================== station details ===

  async showStationData(station: Station): Promise<void> {
    this.selectedOption = 'station_details';
    this.isBottomNavOpen = true;
    this.showSelectedStation = station.station_name;
    this.showSelectedState_name = station.state_name;
    this.showSelectedDistrict_name = station.district_name ?? '';
    this.showSelectedStationCode = station.station_code;

    try {
      const response = await this.fetchStationDataService
        .fetchAllDatesAndDataOfStation({ station_id: +station.station_code })
        .toPromise();
      const rows: HistoryRow[] = response?.data ?? [];

      this.StationTotalEntries = rows.filter((r) => !isMissing(r.data)).length;
      this.StationsMissingEntries = rows.filter((r) => isMissing(r.data)).length;

      let max: { data: number; collection_date: string } | null = null;
      let min: { data: number; collection_date: string } | null = null;
      let earliest: number | null = null;

      for (const row of rows) {
        const time = new Date(row.collection_date).getTime();
        if (Number.isFinite(time) && (earliest === null || time < earliest)) {
          earliest = time;
        }
        // Missing readings are excluded from both extremes.
        if (isMissing(row.data)) continue;
        if (!max || row.data > max.data) max = row;
        if (!min || row.data < min.data) min = row;
      }

      this.StationHighestRecord = max ? this.formatReading(max.data) : '—';
      this.maxRecordedDataDateofSelectedStation = max
        ? this.displayDate(this.toIsoDate(max.collection_date))
        : '';
      this.StationLowestRecord = min ? this.formatReading(min.data) : '—';
      this.StationFirstDate =
        earliest !== null ? this.displayDate(this.toIsoDate(new Date(earliest))) : '—';

      this.renderDailyChart(rows);
    } catch {
      this.errorMessage = `Could not load history for ${station.station_name}.`;
    }
  }

  /** Keeps only the 30 days ending on the selected date, inclusive. */
  private lastThirtyDays<T extends { collection_date: string }>(rows: T[]): T[] {
    const end = new Date(this.selected_Date);
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);

    return rows.filter((row) => {
      const d = new Date(row.collection_date);
      return d >= start && d <= end;
    });
  }

  private renderDailyChart(rows: HistoryRow[]): void {
    const points = this.lastThirtyDays(rows)
      .map((row) => ({
        date: this.toIsoDate(row.collection_date),
        // Missing days become null so Highcharts leaves a gap. They used to be
        // coerced to 0, which drew a false "no rain was recorded" trough.
        value: isMissing(row.data) ? null : row.data,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    this.chart = new Chart({
      chart: { type: 'line', height: this.chartPixelHeight(), spacingTop: 12 },
      title: { text: '' },
      credits: { enabled: false },
      legend: { enabled: false },
      exporting: { enabled: false },
      xAxis: {
        categories: points.map((p) => p.date),
        title: { text: 'Date' },
        tickInterval: Math.max(1, Math.ceil(points.length / 10)),
      },
      yAxis: { title: { text: 'Rainfall (mm)' }, min: 0 },
      tooltip: { valueSuffix: ' mm' },
      series: [
        {
          name: this.showSelectedStation || 'Station',
          type: 'line',
          data: points.map((p) => p.value),
          color: '#1a4fa0',
          connectNulls: false,
        },
      ],
    });
  }

  // ============================================================= comparing ==

  private startCompare(station: Station, lat: number, lng: number): void {
    this.selectedOption = 'compare_charts';
    this.isBottomNavOpen = true;
    this.showSelectedStation = station.station_name;
    this.selectedLatitute = lat;
    this.selectedLongitute = lng;
    this.drawCompareCircle(lat, lng);
    this.loadSurroundingStations();
  }

  private drawCompareCircle(lat: number, lng: number): void {
    if (this.compareCircle) {
      this.stationObservationMap.removeLayer(this.compareCircle);
    }
    this.compareCircle = L.circle([lat, lng], {
      radius: this.selectedRadius * 1000,
      color: '#1a4fa0',
      weight: 1,
      fillOpacity: 0.06,
    });
    this.compareCircle.addTo(this.stationObservationMap);
    this.compareCircle.bringToBack();
  }

  /** Debounced by the range input's own `change` event on the template side. */
  updateRadius(): void {
    if (this.selectedLatitute === null || this.selectedLongitute === null) return;
    this.compareCircle?.setRadius(this.selectedRadius * 1000);
    this.loadSurroundingStations();
  }

  private loadSurroundingStations(): void {
    if (this.selectedLatitute === null || this.selectedLongitute === null) return;

    this.isloadingSurrondingStations = true;
    this.fetchStationDataService
      .fetchStationDataInRadius(
        this.selected_Date,
        this.selectedLatitute,
        this.selectedLongitute,
        this.selectedRadius
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const rows: any[] = response?.data ?? [];
          this.compareRows = rows.map((x) => ({
            station_code: x.station_code,
            station_name: x.station_name,
            state_name: x.state_name,
            distance: `${Number(x.distance_km).toFixed(2)} km`,
            data: x.data,
            selected: false,
          }));
          this.selectAllChecked = false;
          this.isloadingSurrondingStations = false;
        },
        error: () => {
          this.compareRows = [];
          this.isloadingSurrondingStations = false;
          this.errorMessage = 'Could not load surrounding stations.';
        },
      });
  }

  /**
   * Loads the polygon selection into the same compare table the radius mode
   * uses, so one selection model backs both and the chart reads the very
   * objects the checkboxes bind to.
   */
  plotArea(): void {
    if (!this.stationInsidethePolygon?.length) {
      this.errorMessage =
        'Draw a polygon on the map first — use the polygon tool in the top-left toolbar.';
      return;
    }

    this.compareRows = this.stationInsidethePolygon.map((s) => ({
      station_code: s.station_code,
      station_name: s.station_name,
      state_name: s.state_name,
      distance: null,
      data: s.data,
      selected: false,
    }));
    this.selectAllChecked = false;
    this.selectedOption = 'polygon_compare';
    this.isBottomNavOpen = true;
  }

  toggleSelectAll(checked: boolean): void {
    this.selectAllChecked = checked;
    this.compareRows.forEach((row) => (row.selected = checked));
  }

  onCompareRowToggle(): void {
    this.selectAllChecked =
      this.compareRows.length > 0 && this.compareRows.every((r) => r.selected);
  }

  get selectedCompareCount(): number {
    return this.compareRows.filter((r) => r.selected).length;
  }

  /**
   * Fetches every selected station's history in parallel. The previous
   * implementation awaited them one at a time inside a `for` loop, so ten
   * stations meant ten sequential round-trips.
   */
  updateComparisonChart(): void {
    const selected = this.compareRows.filter((r) => r.selected);
    if (!selected.length) {
      this.errorMessage = 'Select at least one station to plot.';
      return;
    }

    this.ischartInLoading = true;
    this.errorMessage = '';

    forkJoin(
      selected.map((row) =>
        this.fetchStationDataService
          .fetchAllDatesAndDataOfStation({ station_id: +row.station_code })
          .pipe(catchError(() => of({ data: [] })))
      )
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (responses: any[]) => {
          // A shared, sorted date axis so series with different coverage still
          // line up. Previously the axis came from whichever station happened to
          // be first, and the others were plotted against it positionally.
          const perStation = responses.map((response, i) => {
            const rows = this.lastThirtyDays<HistoryRow>(response?.data ?? []);
            const byDate = new Map<string, number | null>();
            for (const row of rows) {
              byDate.set(
                this.toIsoDate(row.collection_date),
                isMissing(row.data) ? null : row.data
              );
            }
            return { name: selected[i].station_name, byDate };
          });

          const dates = Array.from(
            new Set(perStation.flatMap((s) => Array.from(s.byDate.keys())))
          ).sort((a, b) => a.localeCompare(b));

          const series = perStation.map((s) => ({
            name: s.name,
            type: 'line' as const,
            // Missing days stay null. They used to be substituted with the
            // literal value 10, inventing 10mm of rainfall on every gap.
            data: dates.map((d) => s.byDate.get(d) ?? null),
            connectNulls: false,
          }));

          this.chartCompare = new Chart({
            chart: { type: 'line', height: this.chartPixelHeight() },
            title: { text: '' },
            credits: { enabled: false },
            xAxis: {
              categories: dates,
              title: { text: 'Date' },
              tickInterval: Math.max(1, Math.ceil(dates.length / 10)),
            },
            yAxis: { title: { text: 'Rainfall (mm)' }, min: 0 },
            tooltip: { shared: true, valueSuffix: ' mm' },
            series,
      exporting: { enabled: false },
          });
          this.chartCompare.ref$
            .pipe(takeUntil(this.destroy$))
            .subscribe((instance) => (this.chartCompareRef = instance));
          this.ischartInLoading = false;
        },
        error: () => {
          this.ischartInLoading = false;
          this.errorMessage = 'Could not load comparison data.';
        },
      });
  }

  // ================================================================= panel ==

  closePopup(): void {
    this.isBottomNavOpen = false;
    this.chart = null;
    this.chartCompare = null;
    this.chartCompareRef = null;
    if (this.compareCircle) {
      this.stationObservationMap.removeLayer(this.compareCircle);
      this.compareCircle = null;
    }
    this.selectedLatitute = null;
    this.selectedLongitute = null;
  }

  /**
   * The drawer is capped at `--ss-drawer-max` by CSS, so derive the chart size
   * from the height the drawer will actually get — not from the raw
   * `panelHeight`, which on a short viewport is larger than the drawer itself.
   */
  private effectivePanelHeight(): number {
    const cap = window.innerHeight * MAP_MAX_PANEL_HEIGHT_RATIO;
    return Math.min(this.panelHeight, Math.max(MAP_MIN_PANEL_HEIGHT, cap));
  }

  private chartPixelHeight(): number {
    return Math.max(140, this.effectivePanelHeight() - CHART_VERTICAL_CHROME);
  }

  onMouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.isResizing = true;
    window.addEventListener('mousemove', this.onMouseMoveRef);
    window.addEventListener('mouseup', this.onMouseUpRef);
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isResizing) return;

    // Clamped to the viewport. The old version also multiplied the result by 10
    // when sizing the chart, so a small drag produced a chart ten screens tall.
    const raw = window.innerHeight - event.clientY;
    const max = window.innerHeight * MAP_MAX_PANEL_HEIGHT_RATIO;
    this.panelHeight = Math.min(max, Math.max(MAP_MIN_PANEL_HEIGHT, raw));
    this.chartHeight = `${this.chartPixelHeight()}px`;
    // Resize through the cached instance. Subscribing to `ref$` here would open
    // a fresh subscription on every mousemove event.
    this.chartCompareRef?.setSize(undefined, this.chartPixelHeight(), false);
  }

  private onMouseUp(): void {
    this.isResizing = false;
    window.removeEventListener('mousemove', this.onMouseMoveRef);
    window.removeEventListener('mouseup', this.onMouseUpRef);
  }

  toggleFilterPanel(): void {
    this.isFilterPanelOpen = !this.isFilterPanelOpen;
    this.remeasureAfterTransition();
  }

  toggleInsightPanel(): void {
    this.isInsightPanelOpen = !this.isInsightPanelOpen;
    this.remeasureAfterTransition();
  }

  /** Leaflet and Highcharts both need a nudge once the panel finishes sliding. */
  private remeasureAfterTransition(): void {
    setTimeout(() => {
      this.stationObservationMap?.invalidateSize();
      this.chartCompareRef?.reflow();
    }, 320);
  }

  clearPolygon(): void {
    this.drawnItems.clearLayers();
    this.stationInsidethePolygon = null;
  }
}
