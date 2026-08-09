import {
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Chart } from 'angular-highcharts';
import * as Highcharts from 'highcharts';
import HighchartsMore from 'highcharts/highcharts-more';

// `bubble` lives in highcharts-more, not in the core bundle. Nothing else in
// the app registers it, so without this the concentration chart renders an
// empty plot area with no error — the series type simply does not exist.
HighchartsMore(Highcharts);
import * as L from 'leaflet';
import { saveAs } from 'file-saver';
import * as XLSXStyle from 'xlsx-js-style';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';

import {
  AwsCumulative,
  AwsCumulativeStation,
  AwsFilters,
  AwsRealtimeService,
  AwsSourceHealthResponse,
  AwsStationSeries,
  AwsTimeline,
  AwsTimelineStation,
  AwsUnmappedStation,
} from 'src/app/services/aws/awsRealtime.service';
import { Band, DEPTH_BANDS, NO_REPORT_COLOR, bandIndex } from './aws-scales';

/** Slots in one AWS day, matching SLOT_COUNT on the server. */
const SLOT_COUNT = 96;
/** Slots per hour — used for the "last hour" delta and the mm/hr conversion. */
const SLOTS_PER_HOUR = 4;
/** Dot size when every station is drawn the same. */
const MARKER_RADIUS = 5;

type TabKey = 'live' | 'cumulative' | 'station' | 'network';
/** What the map paints: accumulated depth, or how hard it is raining right now. */
type DisplayMode = 'cumulative' | 'intensity';
/** Which clock the Live tab reads in. Applies to that tab only.
 *  Not named `Zone` — zone.js already owns that identifier globally. */
type ClockZone = 'IST' | 'UTC';
/** Which quantity the wettest-stations strip colours its cells by. */
type HeatMode = 'slot' | 'rate' | 'cumulative';
/** Whether map dots are all one size, or grow with the band they fall in. */
type MarkerSizing = 'uniform' | 'scaled';
type BasemapKey = 'street' | 'satellite' | 'terrain';

/**
 * The available basemaps. `dark` drives the out-of-India veil and every hairline
 * over it: a white wash reads as fog on imagery, and dark borders vanish on it.
 * All three are key-free tile services.
 */
const BASEMAPS: ReadonlyArray<{
  key: BasemapKey;
  label: string;
  url: string;
  attribution: string;
  maxZoom: number;
  dark: boolean;
}> = [
  {
    key: 'street',
    label: 'Map',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18,
    dark: false,
  },
  {
    key: 'satellite',
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
    maxZoom: 18,
    dark: true,
  },
  {
    // Relief plus place names. Rainfall follows terrain closely in India — the
    // Western Ghats and the Himalayan foothills explain a lot of what the map
    // shows — and neither of the other two makes elevation legible.
    key: 'terrain',
    label: 'Terrain',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri, HERE, Garmin, USGS, NGA',
    maxZoom: 19,
    dark: false,
  },
];

/**
 * A timeline station with the derived arrays the scrubber needs.
 *
 * `filled` exists because a station that skips a slot must keep its previous
 * accumulation on the map rather than blinking out; `step` is precomputed for
 * the same reason — differencing 96 slots for thousands of stations on every
 * mouse move would make scrubbing stutter.
 */
interface LiveStation extends AwsTimelineStation {
  /** Cumulative depth, forward-filled. NaN before the station's first report. */
  filled: Float32Array;
  /** Increment over the preceding slot, clamped at zero. NaN where unknown. */
  step: Float32Array;
  marker: L.CircleMarker | null;
  /** Band index last painted, so unchanged markers skip setStyle. */
  lastBand: number;
}

/** What the strip shows about the cell under the pointer. */
interface HeatHover {
  stationName: string;
  source: string;
  mapped: boolean;
  slot: number;
  /** Clock at the slot's start, and at its end (15 min later). */
  slotLabel: string;
  endLabel: string;
  /** Calendar date the slot falls on, in the selected zone. */
  slotDate: string;
  /** Rain in that single 15-minute cell, and the same figure as a rate. */
  increment: number | null;
  rate: number | null;
  /** Accumulation for the day so far, as of that cell. */
  cum: number | null;
  /** Viewport coordinates of the cell's centre, for placing the tooltip. */
  x: number;
  y: number;
}

/** A station's contribution over the hour ending at the scrubbed slot. */
interface Mover {
  station: LiveStation;
  hourDelta: number;
  total: number;
}

/** Sortable column keys for the cumulative station table. */
type CumSortKey = keyof Pick<
  AwsCumulativeStation,
  | 'station_name' | 'state_name' | 'district_name' | 'total_rainfall'
  | 'mean_daily' | 'max_daily' | 'median_daily' | 'p95_daily' | 'sd_daily'
  | 'cv_pct' | 'rain_days' | 'dry_days' | 'longest_wet_spell'
  | 'reporting_pct' | 'peak_share_pct'
>;

@Component({
  selector: 'app-arg-aws-realtime',
  templateUrl: './arg-aws-realtime.component.html',
  styleUrls: ['./arg-aws-realtime.component.css'],
})
export class ArgAwsRealtimeComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  // ───────────────────────────────────────────────────────────── navigation
  activeTab: TabKey = 'live';
  readonly tabs: Array<{ key: TabKey; label: string; hint: string }> = [
    { key: 'live',       label: 'Live 24-Hour',    hint: '15-minute network replay' },
    { key: 'cumulative', label: 'Cumulative Stats', hint: 'Stored State-AWS daily series' },
    { key: 'station',    label: 'Station Profile',  hint: 'Single-station deep dive' },
    { key: 'network',    label: 'Sources & Mapping',  hint: 'Which stations reach the daily store' },
  ];

  // ────────────────────────────────────────────────────────────────── dates
  /** The AWS day being replayed. Its window is 08:30 IST → 08:30 IST. */
  liveDate = '';
  cumStartDate = '';
  cumEndDate = '';
  /** Latest date the stored daily series can have — the last COMPLETED AWS day. */
  maxDate = '';
  /**
   * Latest date the Live tab can show: the AWS day currently in progress.
   *
   * A day is named for the date it ENDS on, so the window running right now
   * carries tomorrow's label — at 10:30 IST on the 8th the live window is
   * `aws_day 9 Aug`. Capping this at today's calendar date made the in-progress
   * day unreachable for most of the day.
   */
  liveMaxDate = '';

  // ──────────────────────────────────────────────────────────────── filters
  filters: AwsFilters | null = null;
  sourceKeys: string[] = [];
  selectedSources: Record<string, boolean> = {};
  liveStateFilter = '';
  cumStateCode = '';
  cumDistrictCode = '';
  cumStationType = '';

  // ───────────────────────────────────────────────────────────── live state
  timeline: AwsTimeline | null = null;
  liveStations: LiveStation[] = [];
  slotIndex = SLOT_COUNT - 1;
  displayMode: DisplayMode = 'cumulative';
  isPlaying = false;
  playSpeed = 1;
  /**
   * Satellite by default. Rainfall markers are read against terrain more often
   * than against road labels here, and the imagery makes the coastline and the
   * ghats obvious without the basemap competing for attention.
   */
  basemap: BasemapKey = 'satellite';
  /**
   * The clock the Live tab is read in. The backend sends every slot's absolute
   * start in both zones, so switching is a formatting change — no refetch.
   */
  clockZone: ClockZone = 'IST';
  readonly basemaps = BASEMAPS;
  markerSizing: MarkerSizing = 'scaled';
  /**
   * Whether the map's settings popover is open. Closed by default: three
   * permanent control stacks covered a real corner of the country, and none of
   * these is changed often enough to earn that space.
   */
  mapSettingsOpen = false;
  liveLoading = false;
  liveError = '';
  /** Set while the pointer is on the scrubber, so the readout can say so. */
  scrubbing = false;

  /** Network aggregates recomputed for the scrubbed slot. */
  slotStats = {
    reporting: 0,
    raining: 0,
    sumDepth: 0,
    avgDepth: 0,
    maxDepth: 0,
    peakStation: '',
    intensitySum: 0,
    maxIntensity: 0,
    activeCells: 0,
  };

  /** Per-slot network increment, in mm summed across stations. Drives the sparkline. */
  networkPulse: number[] = [];
  /** Stations reporting at each slot — the second sparkline series. */
  networkReporting: number[] = [];
  private pulseMax = 1;
  private reportingMax = 1;
  /** SVG path strings for the scrubber backdrop, rebuilt only on data change. */
  pulsePath = '';
  reportingPath = '';

  topMovers: Mover[] = [];
  bandCounts: Array<{ band: Band; count: number }> = [];
  /** Top stations as a station × time strip, one cell per slot. */
  heatRows: Array<{ station: LiveStation; cells: string[]; focused: boolean }> = [];
  /** `source|id` of the station pinned by a click. Survives until unpinned. */
  focusedKey: string | null = null;
  /** `source|id` of the station under the pointer on the map. Transient. */
  hoverKey: string | null = null;
  heatHover: HeatHover | null = null;
  heatMode: HeatMode = 'slot';
  /** 0 means every station in the current selection. */
  heatSearch = '';
  heatTopN = 15;
  readonly heatTopNChoices = [15, 30, 60, 150, 500, 0];
  readonly heatModes: Array<{ key: HeatMode; label: string }> = [
    { key: 'slot',       label: 'Slot Rainfall' },
    { key: 'rate',       label: 'Rainfall Rate' },
    { key: 'cumulative', label: 'Cumulated Rainfall' },
  ];

  /**
   * Cell colours per station, keyed by station and mode.
   *
   * A row's colours depend only on the station's own readings and the colouring
   * mode, never on the scrubbed slot — only the "now" outline moves. Rebuilding
   * them on every scrub step was affordable at 14 rows and ruinous at 1900:
   * that is 96 band lookups per station, 96 times a day, for nothing.
   */
  private heatCellCache = new Map<string, string[]>();

  /**
   * The last ranking, kept so hovering the map can re-pin the top row without
   * re-scanning every station. A full rebuild is a pass over the whole network
   * plus a sort — far too much to run on every mouseover.
   */
  private rankedMovers: Mover[] = [];

  private playTimer: any = null;
  private map: L.Map | null = null;
  private markerLayer: L.LayerGroup | null = null;
  /** The mask is one huge polygon; canvas keeps it off the SVG hot path. */
  private maskRenderer = L.canvas({ pane: 'rt-mask', padding: 0.1 });
  /** Extent of the India GeoJSON — the view the map opens on and cannot leave. */
  private indiaBounds: L.LatLngBounds | null = null;
  private basemapLayers = new Map<BasemapKey, L.TileLayer>();
  /** Kept so the mask and borders can be restyled when the basemap changes. */
  private maskFill: L.Polygon | null = null;
  private maskRim: L.Polygon | null = null;
  private stateBorders: L.GeoJSON | null = null;
  /** Keeps Leaflet in step with a container whose height is now layout-driven. */
  private mapResizeObserver: ResizeObserver | null = null;

  // ─────────────────────────────────────────────────────── cumulative state
  cumulative: AwsCumulative | null = null;
  cumLoading = false;
  cumError = '';
  cumSearch = '';
  cumSortKey: CumSortKey = 'total_rainfall';
  cumSortDesc = true;
  cumPage = 0;
  readonly cumPageSize = 25;
  cumFilteredStations: AwsCumulativeStation[] = [];

  dailyChart: Chart | null = null;
  stateChart: Chart | null = null;
  spreadChart: Chart | null = null;
  /** Points on the concentration chart, so an empty result can say so. */
  spreadPointCount = 0;
  bandChart: Chart | null = null;

  // ────────────────────────────────────────────────────────── station state
  stationCodeInput = '';
  stationSeries: AwsStationSeries | null = null;
  stationLoading = false;
  stationError = '';
  stationChart: Chart | null = null;
  stationLiveChart: Chart | null = null;

  // ────────────────────────────────────────────────────────── network state
  health: AwsSourceHealthResponse | null = null;
  unmapped: AwsUnmappedStation[] = [];
  unmappedTruncated = false;
  unmappedBySource: Record<string, number> = {};
  networkLoading = false;
  networkError = '';
  unmappedSourceFilter = '';
  /**
   * Days of 15-minute history the feed probe scans. One day by default: each
   * extra day multiplies a COUNT(DISTINCT) sweep across ten observation
   * tables, and at seven this request took long enough to look like a hang.
   */
  networkLookback = 1;

  @ViewChild('scrubTrack') scrubTrack?: ElementRef<HTMLElement>;
  @ViewChild(CdkVirtualScrollViewport) heatViewport?: CdkVirtualScrollViewport;

  readonly depthBands = DEPTH_BANDS;
  readonly slotCount = SLOT_COUNT;
  /** Fixed row height the virtual scroller measures against, in px. */
  readonly rowHeight = 20;
  readonly Math = Math;

  constructor(
    private api: AwsRealtimeService,
    private zone: NgZone,
    private http: HttpClient
  ) {}

  // ═══════════════════════════════════════════════════════════════ lifecycle

  ngOnInit(): void {
    const today = new Date();
    this.maxDate = this.toIso(today);
    this.liveMaxDate = this.addDays(this.maxDate, 1);
    this.liveDate = this.maxDate;
    this.cumEndDate = this.maxDate;
    this.cumStartDate = this.toIso(new Date(today.getTime() - 29 * 86400000));

    this.api
      .fetchFilters(this.liveDate)
      .pipe(takeUntil(this.destroy$), catchError(() => of(null)))
      .subscribe((filters) => {
        if (filters) {
          this.filters = filters;
          this.sourceKeys = filters.sources.map((s) => s.key);
          for (const key of this.sourceKeys) this.selectedSources[key] = true;
          // The server's AWS day can be ahead of the browser's calendar date
          // just after the 08:30 IST rollover, and is the correct default.
          if (filters.aws_today) {
            this.liveDate = filters.aws_today;
            this.maxDate = filters.aws_today;
            this.liveMaxDate = this.addDays(filters.aws_today, 1);
          }
        }
        this.loadTimeline();
      });
  }

  ngOnDestroy(): void {
    this.stopPlayback();
    this.destroy$.next();
    this.destroy$.complete();
    this.mapResizeObserver?.disconnect();
    this.mapResizeObserver = null;
    this.map?.remove();
    this.map = null;
  }

  // ════════════════════════════════════════════════════════════════════ tabs

  selectTab(tab: TabKey): void {
    this.activeTab = tab;
    if (tab !== 'live') this.stopPlayback();

    if (tab === 'live') {
      setTimeout(() => {
        // Rebuild the layers if the map itself had to be re-created; otherwise
        // just re-measure, since Leaflet sizes to the container at creation
        // time and this one was display:none until a moment ago.
        if (this.ensureMap() && this.liveStations.length) {
          this.rebuildMarkers();
          this.applySlot(true);
        }
        this.map?.invalidateSize();
      }, 0);
    }
    if (tab === 'cumulative' && !this.cumulative && !this.cumLoading) this.loadCumulative();
    if (tab === 'network' && !this.health && !this.networkLoading) this.loadNetwork();
  }

  // ═════════════════════════════════════════════════════════ live — loading

  get selectedSourceKeys(): string[] {
    return this.sourceKeys.filter((k) => this.selectedSources[k]);
  }

  /**
   * Clicking a source shows that source on its own — map, strip and movers all
   * narrow to it. Clicking it again, or "All", restores the whole network.
   *
   * This used to be an include/exclude toggle, which meant isolating one source
   * took nine clicks to switch the others off.
   */
  selectSource(key: string): void {
    const alreadySolo = this.selectedSourceKeys.length === 1 && this.selectedSources[key];
    for (const k of this.sourceKeys) {
      this.selectedSources[k] = alreadySolo ? true : k === key;
    }
    this.loadTimeline();
  }

  isSolo(key: string): boolean {
    return this.selectedSourceKeys.length === 1 && this.selectedSources[key];
  }

  allSources(on: boolean): void {
    for (const key of this.sourceKeys) this.selectedSources[key] = on;
    if (!on && this.sourceKeys.length) this.selectedSources[this.sourceKeys[0]] = true;
    this.loadTimeline();
  }

  loadTimeline(): void {
    this.stopPlayback();
    this.liveLoading = true;
    this.liveError = '';

    this.api
      .fetchTimeline({
        date: this.liveDate,
        sources: this.selectedSourceKeys,
        state: this.liveStateFilter || null,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.timeline = data;
          this.prepareLiveStations(data);
          this.buildNetworkPulse();
          this.liveLoading = false;
          // The map element only exists once the live tab has rendered.
          setTimeout(() => {
            this.ensureMap();
            this.rebuildMarkers();
            this.slotIndex = this.lastReportedSlot();
            this.applySlot(true);
          }, 0);
        },
        error: (err) => {
          this.liveLoading = false;
          this.liveError = err?.error?.message || err?.message || 'Failed to load timeline';
          this.timeline = null;
          this.liveStations = [];
        },
      });
  }

  /**
   * Derives the forward-filled cumulative and per-slot increment arrays.
   *
   * The source rainfall column is cumulative within the AWS day, so `filled` is
   * a monotone running maximum: a mid-day dip means a bad packet, not that rain
   * was removed, and letting it dip would produce a negative increment and a
   * phantom "dry" flash in the replay.
   */
  private prepareLiveStations(data: AwsTimeline): void {
    // The last slot at which ANY station has a real reading.
    //
    // An AWS day runs to 08:30 the next morning, so for a day still in progress
    // most of it has not happened yet. Carrying each station's accumulation to
    // slot 95 regardless made those future slots look populated — a station
    // reported "Accumulated 17.6 mm" for a time six hours away, and the header
    // counted it among the stations reporting. Everything past this point is
    // blanked instead, so it reads as "no report" like any other gap.
    let lastData = -1;
    for (const s of data.stations) {
      for (let i = SLOT_COUNT - 1; i > lastData; i--) {
        if (s.cum[i] !== null) {
          lastData = i;
          break;
        }
      }
    }

    this.liveStations = data.stations.map((s) => {
      const filled = new Float32Array(SLOT_COUNT).fill(NaN);
      const step = new Float32Array(SLOT_COUNT).fill(NaN);

      let running = NaN;
      for (let i = 0; i < SLOT_COUNT; i++) {
        const raw = s.cum[i];
        if (raw !== null && Number.isFinite(raw)) {
          running = Number.isNaN(running) ? Math.max(raw, 0) : Math.max(running, raw);
        }
        filled[i] = running;
        // Read the value back out of the array before differencing it.
        // `running` is a 64-bit JS number but the arrays are Float32, so 590.8
        // goes in and 590.7999877929688 comes out. Subtracting the two left a
        // residue of ~1.2e-5 on every slot after the last report — greater than
        // zero, so bandIndex put it in Very Light and painted the whole tail
        // green, while the tooltip's toFixed(1) still read "0.0 mm".
        running = filled[i];
        const prev = i > 0 ? filled[i - 1] : NaN;
        step[i] = Number.isNaN(running)
          ? NaN
          : Number.isNaN(prev)
          ? running // first report of the day is itself the accumulation so far
          : Math.max(0, running - prev);
      }

      // Nothing is known past the network's last reading — not even a carried
      // accumulation. Blank it rather than imply a value.
      for (let i = lastData + 1; i < SLOT_COUNT; i++) {
        filled[i] = NaN;
        step[i] = NaN;
      }

      return { ...s, filled, step, marker: null, lastBand: -2 };
    });
    this.heatCellCache.clear();
    this.focusedKey = null;
    this.hoverKey = null;
  }

  /** Network-wide increment and reporting count per slot, plus their SVG paths. */
  private buildNetworkPulse(): void {
    const pulse = new Array(SLOT_COUNT).fill(0);
    const reporting = new Array(SLOT_COUNT).fill(0);

    for (const s of this.liveStations) {
      for (let i = 0; i < SLOT_COUNT; i++) {
        if (Number.isNaN(s.filled[i])) continue;
        reporting[i] += 1;
        if (!Number.isNaN(s.step[i])) pulse[i] += s.step[i];
      }
    }

    this.networkPulse = pulse;
    this.networkReporting = reporting;
    this.pulseMax = Math.max(1, ...pulse);
    this.reportingMax = Math.max(1, ...reporting);
    this.pulsePath = this.areaPath(pulse, this.pulseMax);
    this.reportingPath = this.linePath(reporting, this.reportingMax);
  }

  /** Closed area path across a 0–100 × 0–100 viewBox. */
  private areaPath(values: number[], max: number): string {
    if (!values.length) return '';
    const pts = values.map((v, i) => {
      const x = (i / (SLOT_COUNT - 1)) * 100;
      const y = 100 - Math.min(100, (v / max) * 100);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });
    return `M0,100 L${pts.join(' L')} L100,100 Z`;
  }

  private linePath(values: number[], max: number): string {
    if (!values.length) return '';
    const pts = values.map((v, i) => {
      const x = (i / (SLOT_COUNT - 1)) * 100;
      const y = 100 - Math.min(100, (v / max) * 100);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });
    return `M${pts.join(' L')}`;
  }

  /** Latest slot at which anything reported — a better landing point than 95. */
  private lastReportedSlot(): number {
    for (let i = SLOT_COUNT - 1; i >= 0; i--) {
      if (this.networkReporting[i] > 0) return i;
    }
    return SLOT_COUNT - 1;
  }

  // ═════════════════════════════════════════════════════════════ live — map

  /**
   * Creates the map if it does not exist, or re-creates it if Angular has
   * swapped the container out from under it.
   *
   * Returns true when a new map was built, so the caller knows the markers and
   * the painted slot have to be re-applied.
   */
  private ensureMap(): boolean {
    const host = document.getElementById('aws-rt-map');
    if (!host) return false;

    // A destroyed-and-recreated container leaves the old instance pointing at a
    // detached node: the page looks fine, the map is simply blank. The live
    // panel is [hidden] rather than *ngIf'd so this should not happen, but the
    // failure is silent enough to be worth catching anyway.
    if (this.map && this.map.getContainer() !== host) {
      this.map.remove();
      this.map = null;
      this.markerLayer = null;
      this.indiaBounds = null;
      this.basemapLayers.clear();
      this.maskFill = null;
      this.maskRim = null;
      this.stateBorders = null;
      this.mapResizeObserver?.disconnect();
      this.mapResizeObserver = null;
      for (const s of this.liveStations) {
        s.marker = null;
        s.lastBand = -2;
      }
    }
    if (this.map) return false;

    this.map = L.map('aws-rt-map', {
      // One canvas for every marker: with a few thousand stations repainting on
      // each scrub step, a DOM node per station would drop frames.
      preferCanvas: true,
      center: [22.5, 80],
      zoom: 5,
      zoomSnap: 0.25,
      minZoom: 3,
      zoomControl: true,
      attributionControl: false,
    });

    for (const b of BASEMAPS) {
      this.basemapLayers.set(
        b.key,
        L.tileLayer(b.url, {
          attribution: b.attribution,
          maxZoom: b.maxZoom,
          crossOrigin: 'anonymous',
        })
      );
    }
    this.basemapLayers.get(this.basemap)?.addTo(this.map);

    // Own pane for the dimming mask: above the tiles (200) but below the
    // markers (400), so it can never paint over a station.
    const maskPane = this.map.createPane('rt-mask');
    maskPane.style.zIndex = '350';
    maskPane.style.pointerEvents = 'none';

    this.markerLayer = L.layerGroup().addTo(this.map);
    this.observeMapResize(host.parentElement);
    this.loadGeoJSON();
    return true;
  }

  /**
   * Re-measures the map whenever its container changes size.
   *
   * The map used to have a fixed pixel height, so it only ever needed
   * re-measuring on a tab switch. It now stretches to match the rail, which
   * changes height as data lands — without this the tiles keep rendering into
   * the size the map had when it was created.
   */
  private observeMapResize(target: Element | null): void {
    this.mapResizeObserver?.disconnect();
    this.mapResizeObserver = null;
    if (!target || typeof ResizeObserver === 'undefined') return;

    // Outside Angular: this fires on every layout change and nothing it does
    // needs change detection.
    this.zone.runOutsideAngular(() => {
      this.mapResizeObserver = new ResizeObserver(() => this.map?.invalidateSize());
      this.mapResizeObserver.observe(target);
    });
  }

  /**
   * India state boundaries plus the out-of-country mask, from the same
   * `assets/geojson/INDIA_STATE.json` Station Statistics uses.
   *
   * The mask is what makes a narrow map honest: everything outside the national
   * outline is dimmed, so neighbouring countries stop reading as part of the
   * network even when the viewport spills past the border.
   */
  private loadGeoJSON(): void {
    this.http
      .get('assets/geojson/INDIA_STATE.json')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (!this.map) return;
          this.addCountryMask(res);

          // Internal borders stay light so they read as reference lines rather
          // than competing with the station markers.
          this.stateBorders = L.geoJSON(res, {
            interactive: false,
            style: () => this.borderStyle(),
          }).addTo(this.map);

          this.indiaBounds = this.stateBorders.getBounds();
          if (this.indiaBounds.isValid()) {
            this.map.fitBounds(this.indiaBounds, { animate: false });
            // Panning away from India is never useful here, and drifting off
            // is the main way the map ends up showing other countries.
            this.map.setMaxBounds(this.indiaBounds.pad(0.25));
            this.map.setMinZoom(this.map.getZoom() - 0.5);
          }
        },
        error: () => {
          this.liveError = 'India boundaries could not be loaded; the map shows markers only.';
        },
      });
  }

  /**
   * Dims everything outside India.
   *
   * One polygon covering the globe with India punched out as interior rings —
   * Leaflet treats every ring after the first as a hole. The states tile the
   * country exactly, so each state's outer ring works as a hole and the
   * national outline falls out without an expensive turf union.
   */
  private addCountryMask(geojson: any): void {
    if (!this.map) return;
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
        // [0] is the outer ring; further rings are the state's own holes, which
        // we ignore deliberately so enclaves stay lit.
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

    this.maskFill = L.polygon([world, ...holes], {
      pane: 'rt-mask',
      renderer: this.maskRenderer,
      interactive: false,
      stroke: false,
      ...this.maskStyle(),
    }).addTo(this.map);

    // Crisp rim on the dimmed side so the coastline still reads.
    this.maskRim = L.polygon(holes, {
      pane: 'rt-mask',
      renderer: this.maskRenderer,
      interactive: false,
      fill: false,
      ...this.rimStyle(),
    }).addTo(this.map);
  }

  /**
   * How hard the outside-India veil bites, per basemap.
   *
   * It was a near-opaque 0.82, which buried the surrounding countries almost
   * completely — enough that neighbouring coastlines stopped being readable as
   * context. At 0.55 the area outside the border is plainly secondary but still
   * legible. Satellite needs a dark veil rather than a light one: a white wash
   * over imagery just looks like fog.
   */
  private get isDarkBasemap(): boolean {
    return BASEMAPS.find((b) => b.key === this.basemap)?.dark ?? false;
  }

  private maskStyle(): L.PathOptions {
    return this.isDarkBasemap
      ? { fillColor: '#0b1220', fillOpacity: 0.6 }
      : { fillColor: '#f5f7fa', fillOpacity: 0.55 };
  }

  private rimStyle(): L.PathOptions {
    return this.isDarkBasemap
      ? { color: '#ffffff', weight: 1.4, opacity: 0.9 }
      : { color: '#1c2430', weight: 1.2, opacity: 0.75 };
  }

  /** Dark hairlines vanish on imagery, so the internal borders invert. */
  private borderStyle(): L.PathOptions {
    return this.isDarkBasemap
      ? { weight: 0.7, opacity: 0.5, color: '#ffffff', fill: false }
      : { weight: 0.7, opacity: 0.55, color: '#3d4652', fill: false };
  }

  setBasemap(mode: BasemapKey): void {
    if (this.basemap === mode || !this.map) return;
    this.basemap = mode;

    for (const [key, layer] of this.basemapLayers) {
      const wanted = key === mode;
      if (wanted && !this.map.hasLayer(layer)) layer.addTo(this.map);
      if (!wanted && this.map.hasLayer(layer)) this.map.removeLayer(layer);
    }

    // The veil and every hairline over it are basemap-dependent.
    this.maskFill?.setStyle(this.maskStyle());
    this.maskRim?.setStyle(this.rimStyle());
    this.stateBorders?.setStyle(this.borderStyle());
  }

  private rebuildMarkers(): void {
    if (!this.map || !this.markerLayer) return;
    this.markerLayer.clearLayers();

    const bounds: L.LatLngExpression[] = [];
    for (const s of this.liveStations) {
      if (s.latitude === null || s.longitude === null) continue;
      const marker = L.circleMarker([s.latitude, s.longitude], {
        // Placeholder only — the first applySlot() immediately restyles every
        // marker to the radius its band and the sizing mode call for.
        radius: MARKER_RADIUS,
        // A dark hairline is what keeps the white "Zero" fill visible against
        // the light basemap; without it dry stations disappear entirely.
        color: '#3a4757',
        weight: 1,
        fillColor: NO_REPORT_COLOR,
        fillOpacity: 0.9,
      });
      marker.bindPopup(() => this.buildPopup(s));
      // Leaflet's listener runs outside Angular's change detection.
      marker.on('click', () => this.zone.run(() => this.focusStation(s)));
      // Leaflet's listeners run outside Angular's change detection.
      marker.on('mouseover', () => this.zone.run(() => this.previewStation(s)));
      marker.on('mouseout', () => this.zone.run(() => this.clearPreview()));
      s.marker = marker;
      s.lastBand = -2;
      this.markerLayer.addLayer(marker);
      bounds.push([s.latitude, s.longitude]);
    }

    // The India outline, not the station spread, sets the frame — refitting to
    // the markers would re-crop the map every time a source filter changed, and
    // a single-state selection would zoom the country away.
    if (!this.indiaBounds && bounds.length) {
      this.map.fitBounds(L.latLngBounds(bounds).pad(0.1), { animate: false });
    }
  }

  /** Popup content reflects the currently scrubbed slot, not the day total. */
  private buildPopup(s: LiveStation): HTMLElement {
    const i = this.slotIndex;
    const depth = s.filled[i];
    const step = s.step[i];

    const root = document.createElement('div');
    root.className = 'aws-popup';

    const rows: Array<[string, string]> = [
      ['Source', s.source_label],
      ['Station ID', s.station_id],
      ['Station code', s.station_code ?? 'not mapped'],
      ['District', s.district_name || '—'],
      ['State', s.state_name || '—'],
      ['At ' + this.slotClock(i) + ' ' + this.clockZone, Number.isNaN(depth) ? 'no report yet' : `${depth.toFixed(1)} mm`],
      ['15-min rate', Number.isNaN(step) ? '—' : `${(step * SLOTS_PER_HOUR).toFixed(1)} mm/hr`],
      ['Day total', s.day_total === null ? '—' : `${s.day_total.toFixed(1)} mm`],
      ['Slots reported', `${s.slots_reported} / ${SLOT_COUNT}`],
    ];

    const title = document.createElement('div');
    title.className = 'aws-popup__title';
    title.textContent = s.station_name;
    root.appendChild(title);

    const table = document.createElement('dl');
    table.className = 'aws-popup__grid';
    for (const [k, v] of rows) {
      const dt = document.createElement('dt');
      dt.textContent = k;
      const dd = document.createElement('dd');
      dd.textContent = v;
      table.appendChild(dt);
      table.appendChild(dd);
    }
    root.appendChild(table);

    if (s.station_code) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'aws-popup__btn';
      btn.textContent = 'Open station profile';
      btn.addEventListener('click', () => {
        this.zone.run(() => {
          this.stationCodeInput = s.station_code as string;
          this.selectTab('station');
          this.loadStation();
        });
      });
      root.appendChild(btn);
    }

    return root;
  }

  // ═══════════════════════════════════════════════════════ live — scrubbing

  /**
   * The IMD bands, whichever quantity the map is showing. The display mode
   * still changes *what* is measured; it no longer changes how it is banded.
   */
  get activeBands(): readonly Band[] {
    return DEPTH_BANDS;
  }

  /** Value a station shows in the current display mode, or NaN if unreported. */
  private valueAt(s: LiveStation, i: number): number {
    if (this.displayMode === 'cumulative') return s.filled[i];
    const step = s.step[i];
    return Number.isNaN(step) ? NaN : step * SLOTS_PER_HOUR;
  }

  onScrubMove(event: MouseEvent): void {
    const track = this.scrubTrack?.nativeElement;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    if (rect.width <= 0) return;
    const frac = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const next = Math.round(frac * (SLOT_COUNT - 1));
    this.scrubbing = true;
    // Only do work when the pointer actually crosses into a new slot; a slow
    // sweep fires dozens of mousemove events inside a single 15-minute cell.
    if (next !== this.slotIndex) {
      this.stopPlayback();
      this.slotIndex = next;
      this.applySlot();
    }
  }

  onScrubLeave(): void {
    this.scrubbing = false;
  }

  onSliderChange(value: string | number): void {
    const next = Math.min(SLOT_COUNT - 1, Math.max(0, Math.round(Number(value))));
    if (next === this.slotIndex) return;
    this.slotIndex = next;
    this.applySlot();
  }

  stepSlot(delta: number): void {
    this.stopPlayback();
    this.slotIndex = Math.min(SLOT_COUNT - 1, Math.max(0, this.slotIndex + delta));
    this.applySlot();
  }

  setDisplayMode(mode: DisplayMode): void {
    if (this.displayMode === mode) return;
    this.displayMode = mode;
    // Every marker's band is meaningless across a scale change.
    for (const s of this.liveStations) s.lastBand = -2;
    this.applySlot(true);
  }

  togglePlay(): void {
    if (this.isPlaying) {
      this.stopPlayback();
      return;
    }
    if (!this.liveStations.length) return;
    this.isPlaying = true;
    if (this.slotIndex >= SLOT_COUNT - 1) this.slotIndex = 0;

    // The timer only ticks the slot; painting happens outside Angular so the
    // replay does not run change detection 96 times over.
    this.playTimer = setInterval(() => {
      this.slotIndex += 1;
      if (this.slotIndex >= SLOT_COUNT) {
        this.slotIndex = 0;
      }
      this.applySlot();
    }, 420 / this.playSpeed);
  }

  setSpeed(speed: number): void {
    this.playSpeed = speed;
    if (this.isPlaying) {
      this.stopPlayback();
      this.togglePlay();
    }
  }

  private stopPlayback(): void {
    this.isPlaying = false;
    if (this.playTimer) {
      clearInterval(this.playTimer);
      this.playTimer = null;
    }
  }

  /**
   * Repaints the map and recomputes every readout for `slotIndex`.
   * `force` skips the band-unchanged shortcut, needed after a scale change.
   */
  private applySlot(force = false): void {
    const i = this.slotIndex;
    const bands = this.activeBands;

    let reporting = 0;
    let raining = 0;
    let sumDepth = 0;
    let maxDepth = 0;
    let peakStation = '';
    let intensitySum = 0;
    let maxIntensity = 0;
    let activeCells = 0;
    const counts = new Array(bands.length).fill(0);

    for (const s of this.liveStations) {
      const depth = s.filled[i];
      const stepValue = s.step[i];
      const shown = this.valueAt(s, i);

      if (!Number.isNaN(depth)) {
        reporting += 1;
        sumDepth += depth;
        if (depth >= 0.1) raining += 1;
        if (depth > maxDepth) {
          maxDepth = depth;
          peakStation = s.station_name;
        }
      }
      if (!Number.isNaN(stepValue)) {
        const rate = stepValue * SLOTS_PER_HOUR;
        intensitySum += stepValue;
        if (rate > maxIntensity) maxIntensity = rate;
        if (stepValue > 0) activeCells += 1;
      }

      const bi = Number.isNaN(shown) ? -1 : bandIndex(bands, shown);
      if (bi >= 0) counts[bi] += 1;

      if (s.marker && (force || bi !== s.lastBand)) {
        const color = bi >= 0 ? bands[bi].color : NO_REPORT_COLOR;
        // The top two bands get a heavier ring so extreme cells stay findable
        // once the map is crowded.
        const emphatic = bi >= bands.length - 2;
        s.marker.setStyle({
          fillColor: color,
          fillOpacity: bi >= 0 ? 0.92 : 0.5,
          radius: this.radiusFor(bi, bands.length),
          color: emphatic ? '#7a1d12' : '#3a4757',
          weight: emphatic ? 1.6 : 0.8,
        });
        s.lastBand = bi;
      }
    }

    this.slotStats = {
      reporting,
      raining,
      sumDepth: Number(sumDepth.toFixed(1)),
      avgDepth: reporting ? Number((sumDepth / reporting).toFixed(2)) : 0,
      maxDepth: Number(maxDepth.toFixed(1)),
      peakStation,
      intensitySum: Number(intensitySum.toFixed(1)),
      maxIntensity: Number(maxIntensity.toFixed(1)),
      activeCells,
    };

    this.bandCounts = bands.map((band, idx) => ({ band, count: counts[idx] }));
    this.buildTopMovers(i);
  }

  applyHeatFilters(): void {
    this.composeHeatRows();
  }

  clearHeatSearch(): void {
    if (!this.heatSearch) return;
    this.heatSearch = '';
    this.composeHeatRows();
  }

  /** The IMD bands, whichever quantity the strip is showing. */
  get heatBands(): readonly Band[] {
    return DEPTH_BANDS;
  }

  /** The quantity a cell is coloured by, in the strip's current mode. */
  private heatValue(s: LiveStation, k: number): number {
    if (this.heatMode === 'cumulative') return s.filled[k];
    const step = s.step[k];
    if (Number.isNaN(step)) return NaN;
    return this.heatMode === 'rate' ? step * SLOTS_PER_HOUR : step;
  }

  setHeatMode(mode: HeatMode): void {
    if (this.heatMode === mode) return;
    this.heatMode = mode;
    // Cached colours belong to the old mode.
    this.heatCellCache.clear();
    this.buildTopMovers(this.slotIndex);
  }

  /**
   * Builds the visible rows from the last ranking.
   *
   * Separate from the ranking itself so hovering a marker costs a slice and a
   * map over the shown rows, not a pass over the whole network.
   */
  private composeHeatRows(): void {
    const ranked = this.rankedMovers;
    const key = (m: Mover) => `${m.station.source_key}|${m.station.station_id}`;

    // Search narrows the pool before the ranking is cut, so "Top 15" means the
    // fifteen wettest matches rather than whichever matches survive the cut.
    const q = this.heatSearch.trim().toLowerCase();
    const matched = q
      ? ranked.filter((m) =>
          [
            m.station.station_name,
            m.station.station_id,
            m.station.station_code,
            m.station.district_name,
            m.station.state_name,
          ].some((f) => (f ?? '').toString().toLowerCase().includes(q))
        )
      : ranked;

    // 0 is "every station in the selection" — the strip is virtualised, so the
    // row count no longer decides how much DOM exists.
    let shown = this.heatTopN > 0 ? matched.slice(0, this.heatTopN) : matched;

    // The focused station leads the list wherever it actually ranks, so a quiet
    // station picked off the map still appears.
    // Looked up in the full ranking, not the matches: a station pinned from the
    // map should not vanish because a search is active.
    const focus = this.activeFocusKey;
    if (focus) {
      const hit = ranked.find((m) => key(m) === focus);
      if (hit) shown = [hit, ...shown.filter((m) => key(m) !== focus)];
    }

    this.heatRows = shown.map((m) => ({
      station: m.station,
      cells: this.cellsFor(m.station),
      focused: key(m) === focus,
    }));
  }

  /** Cell colours for one station, computed once and cached. */
  private cellsFor(st: LiveStation): string[] {
    const key = `${st.source_key}|${st.station_id}`;
    let cells = this.heatCellCache.get(key);
    if (cells) return cells;

    const bands = this.heatBands;
    cells = new Array<string>(SLOT_COUNT);
    for (let k = 0; k < SLOT_COUNT; k++) {
      const v = this.heatValue(st, k);
      const bi = Number.isNaN(v) ? -1 : bandIndex(bands, v);
      cells[k] = bi >= 0 ? bands[bi].color : NO_REPORT_COLOR;
    }
    this.heatCellCache.set(key, cells);
    return cells;
  }

  /**
   * Resolves the strip cell under the pointer and fills the hover readout.
   *
   * One listener per row rather than per cell: there are 96 cells in a row and
   * they are 3–4px wide, so binding each one would mean ~1300 listeners and a
   * title string per cell rebuilt on every scrub step.
   */
  onHeatMove(event: MouseEvent, row: { station: LiveStation }): void {
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;

    const frac = Math.min(0.9999, Math.max(0, (event.clientX - rect.left) / rect.width));
    const slot = Math.min(SLOT_COUNT - 1, Math.floor(frac * SLOT_COUNT));
    const st = row.station;

    // Nothing changed inside the same cell — skip the write so a sweep across
    // one cell does not trigger change detection on every mousemove.
    if (this.heatHover && this.heatHover.slot === slot &&
        this.heatHover.stationName === st.station_name) {
      return;
    }

    const step = st.step[slot];
    const cum = st.filled[slot];
    // The last cell has no following slot; its window ends 15 minutes on.
    const endStamp = slot + 1 < SLOT_COUNT
      ? this.slotStamp(slot + 1)
      : this.addQuarterHour(this.slotStamp(slot));

    this.heatHover = {
      stationName: st.station_name,
      source: st.source_label,
      mapped: st.mapped,
      slot,
      slotLabel: this.slotClock(slot),
      endLabel: endStamp.slice(11),
      slotDate: this.slotDate(slot),
      increment: Number.isNaN(step) ? null : Number(step.toFixed(1)),
      rate: Number.isNaN(step) ? null : Number((step * SLOTS_PER_HOUR).toFixed(1)),
      cum: Number.isNaN(cum) ? null : Number(cum.toFixed(1)),
      // Anchored to the cell's centre rather than the cursor, so the tooltip
      // snaps cell to cell instead of drifting within one.
      x: rect.left + ((slot + 0.5) / SLOT_COUNT) * rect.width,
      y: rect.top,
    };
  }

  /**
   * Centres the map on a station from the strip and opens its popup.
   *
   * The strip ranks the wettest stations but says nothing about where they are;
   * this is the link between the two halves of the tab. Leaflet clamps the
   * centre to the map's maxBounds, so a station near the border lands as close
   * as the bounds allow rather than being refused.
   */
  /**
   * Pins a station to the top of the strip, so a marker picked off the map can
   * be read against the day's other stations without hunting for its row —
   * which, at "All stations", could be two thousand rows down.
   *
   * Clicking the same station again unpins it.
   */
  focusStation(station: LiveStation): void {
    const key = `${station.source_key}|${station.station_id}`;
    this.focusedKey = this.focusedKey === key ? null : key;
    this.composeHeatRows();
    // The viewport only exists once the rows have rendered.
    setTimeout(() => this.heatViewport?.scrollToIndex(0), 0);
  }

  /** Pointer over a marker: pin it to the top for as long as the pointer stays. */
  previewStation(station: LiveStation): void {
    const key = `${station.source_key}|${station.station_id}`;
    if (this.hoverKey === key) return;
    this.hoverKey = key;
    this.composeHeatRows();
    setTimeout(() => this.heatViewport?.scrollToIndex(0), 0);
  }

  /** Pointer left the marker: the preview row goes with it. */
  clearPreview(): void {
    if (!this.hoverKey) return;
    this.hoverKey = null;
    this.composeHeatRows();
  }

  clearFocus(): void {
    if (!this.focusedKey) return;
    this.focusedKey = null;
    this.composeHeatRows();
  }

  /** Hover wins over a click-pin, so the pointer always shows what it is over. */
  get activeFocusKey(): string | null {
    return this.hoverKey ?? this.focusedKey;
  }

  get focusedRow(): { station: LiveStation } | null {
    return this.heatRows.find((r) => r.focused) ?? null;
  }

  zoomToStation(station: LiveStation): void {
    if (!this.map || station.latitude === null || station.longitude === null) return;
    this.map.setView([station.latitude, station.longitude], 9, { animate: true });
    station.marker?.openPopup();
  }

  /** "YYYY-MM-DD HH:mm" plus 15 minutes, without pulling in a date library. */
  private addQuarterHour(stamp: string): string {
    const d = new Date(stamp.replace(' ', 'T') + ':00Z');
    d.setUTCMinutes(d.getUTCMinutes() + 15);
    return d.toISOString().slice(0, 16).replace('T', ' ');
  }

  clearHeatHover(): void {
    this.heatHover = null;
  }

  /** Clicking a cell drives the map to that moment, same as the scrubber. */
  onHeatClick(event: MouseEvent, row: { station: LiveStation }): void {
    this.onHeatMove(event, row);
    if (!this.heatHover) return;
    this.stopPlayback();
    this.slotIndex = this.heatHover.slot;
    this.applySlot();
  }

  /**
   * Dot radius for a band.
   *
   * Scaled by default: size reinforces the colour, so a heavy station is
   * findable without hunting for a shade. Uniform is offered because in a
   * dense cluster a bigger dot can read as "more stations here" rather than
   * "more rain here".
   */
  private radiusFor(bandIdx: number, bandTotal: number): number {
    if (this.markerSizing === 'uniform') return MARKER_RADIUS;
    if (bandIdx < 0) return 3.2;
    return 4 + (bandIdx / Math.max(1, bandTotal - 1)) * 5;
  }

  setMarkerSizing(mode: MarkerSizing): void {
    if (this.markerSizing === mode) return;
    this.markerSizing = mode;
    // Bands have not changed, so the unchanged-band shortcut would skip every
    // marker; force the repaint.
    this.applySlot(true);
  }

  /** Stations ranked by how much they added over the hour ending at slot `i`. */
  private buildTopMovers(i: number): void {
    const from = Math.max(0, i - SLOTS_PER_HOUR + 1);
    const movers: Mover[] = [];

    for (const s of this.liveStations) {
      let delta = 0;
      let any = false;
      for (let k = from; k <= i; k++) {
        if (!Number.isNaN(s.step[k])) {
          delta += s.step[k];
          any = true;
        }
      }
      const total = s.filled[i];
      if (!any && Number.isNaN(total)) continue;
      movers.push({ station: s, hourDelta: Number(delta.toFixed(1)), total: Number.isNaN(total) ? 0 : total });
    }

    movers.sort((a, b) => b.hourDelta - a.hourDelta || b.total - a.total);
    this.topMovers = movers.slice(0, 12);

    // Rows are the wettest stations by accumulation as of the scrubbed slot,
    // whichever quantity the cells are coloured by. Which sources are in play
    // is decided upstream by the source chips, so soloing a chip makes this the
    // top N within that source.
    this.rankedMovers = movers.slice().sort((a, b) => b.total - a.total);
    this.composeHeatRows();
  }

  // ─────────────────────────────────────────────────────── live — templating

  setZone(z: ClockZone): void {
    if (this.clockZone === z) return;
    this.clockZone = z;
    // Popups render their times once, at open; close so the next one is redrawn.
    this.map?.closePopup();
  }

  /** Absolute start of a slot in the selected zone, "YYYY-MM-DD HH:mm". */
  slotStamp(i: number): string {
    const slot = this.timeline?.slots[i];
    if (!slot) return '';
    return this.clockZone === 'UTC' ? slot.utc : slot.ist;
  }

  /** Just the clock, "HH:mm". */
  slotClock(i: number): string {
    return this.slotStamp(i).slice(11) || '--:--';
  }

  /** Just the date, "YYYY-MM-DD". */
  slotDate(i: number): string {
    return this.slotStamp(i).slice(0, 10);
  }

  get currentSlotLabel(): string {
    return this.slotClock(this.slotIndex);
  }

  /** The day this page opens on, in the selected zone. */
  get dayStartStamp(): string {
    return this.slotStamp(0);
  }

  /**
   * Calendar date the scrubbed slot falls on.
   *
   * The day is named for the date it ends on, so only the 00:00–02:45 tail
   * carries the label date; everything earlier is the previous calendar day.
   */
  get currentSlotDate(): string {
    return this.slotDate(this.slotIndex);
  }

  get scrubPercent(): number {
    return (this.slotIndex / (SLOT_COUNT - 1)) * 100;
  }

  /** Hour ticks along the scrubber: every fourth slot is a whole hour. */
  get hourTicks(): Array<{ index: number; label: string; percent: number }> {
    if (!this.timeline) return [];
    const ticks = [];
    for (let i = 0; i < SLOT_COUNT; i += SLOTS_PER_HOUR * 2) {
      ticks.push({
        index: i,
        label: this.slotClock(i),
        percent: (i / (SLOT_COUNT - 1)) * 100,
      });
    }
    return ticks;
  }

  sourceLabel(key: string): string {
    return this.filters?.sources.find((s) => s.key === key)?.label ?? key;
  }

  sourceShort(key: string): string {
    return this.filters?.sources.find((s) => s.key === key)?.short ?? key;
  }

  liveSourceCount(key: string): number {
    return this.timeline?.meta.count_by_source[key] ?? 0;
  }

  /** Distinct state names across every live source, for the live filter. */
  get liveStateOptions(): string[] {
    const set = new Set<string>();
    for (const s of this.filters?.sources ?? []) {
      for (const name of s.live_states) set.add(name);
    }
    return [...set].sort();
  }

  /**
   * Downloads the strip as a styled workbook, split into two sheets.
   *
   * Mapped and unmapped stations are separated because they answer different
   * questions: the first sheet can be joined back to aws_station_details by
   * station_code, the second cannot — those are the stations streaming data that
   * no cumulative product can see. The unmapped sheet keeps whatever geography
   * its source happens to carry and leaves the rest blank rather than guessing.
   *
   * Every station in the current selection is exported, not just the Top N on
   * screen — a download is for analysis — but the ranking is preserved by row
   * order. Value cells carry the same band colours the strip uses.
   */
  exportWettestXlsx(): void {
    if (!this.timeline || !this.liveStations.length) return;

    const bands = this.heatBands;
    const times = this.timeline.slots.map((_, i) => this.slotStamp(i));

    // Same ranking the strip shows: wettest first, by accumulation at the slot.
    const ranked = [...this.liveStations].sort((a, b) => {
      const av = a.filled[this.slotIndex];
      const bv = b.filled[this.slotIndex];
      return (Number.isNaN(bv) ? -1 : bv) - (Number.isNaN(av) ? -1 : av);
    });

    const build = (rows: LiveStation[], withCode: boolean) => {
      const head = withCode
        ? ['State', 'District', 'Block', 'Station Name', 'Station Code', 'Latitude', 'Longitude']
        : ['State', 'District', 'Block', 'Station Name', 'Latitude', 'Longitude'];
      const aoa: any[][] = [[...head, ...times]];

      for (const st of rows) {
        const lead = withCode
          ? [st.state_name ?? '', st.district_name ?? '', st.block_name ?? '', st.station_name,
             st.station_code ?? '', st.latitude ?? '', st.longitude ?? '']
          : [st.state_name ?? '', st.district_name ?? '', st.block_name ?? '', st.station_name,
             st.latitude ?? '', st.longitude ?? ''];
        const values = Array.from({ length: SLOT_COUNT }, (_, k) => {
          const v = this.heatValue(st, k);
          return Number.isNaN(v) ? '' : Number(v.toFixed(1));
        });
        aoa.push([...lead, ...values]);
      }

      const ws = XLSXStyle.utils.aoa_to_sheet(aoa);
      const leadCols = head.length;

      for (let c = 0; c < leadCols + SLOT_COUNT; c++) {
        const ref = XLSXStyle.utils.encode_cell({ r: 0, c });
        if (!ws[ref]) continue;
        ws[ref].s = {
          font: { bold: true, sz: 9 },
          fill: { fgColor: { rgb: 'EAF0FA' } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        };
      }

      for (let r = 1; r < aoa.length; r++) {
        for (let k = 0; k < SLOT_COUNT; k++) {
          const ref = XLSXStyle.utils.encode_cell({ r, c: leadCols + k });
          const cell = ws[ref];
          if (!cell) continue;
          const v = typeof cell.v === 'number' ? cell.v : NaN;
          const bi = Number.isNaN(v) ? -1 : bandIndex(bands, v);
          cell.s = {
            font: { sz: 9 },
            alignment: { horizontal: 'center' },
            // Grey where nothing was received, so a gap never reads as a zero.
            fill: { fgColor: { rgb: bi >= 0 ? bands[bi].color.replace('#', '') : 'E9EDF2' } },
          };
        }
      }

      ws['!cols'] = [
        ...head.map((h) => ({ wch: h === 'Station Name' ? 26 : 14 })),
        ...times.map(() => ({ wch: 8 })),
      ];
      return ws;
    };

    const wb = XLSXStyle.utils.book_new();
    XLSXStyle.utils.book_append_sheet(wb, build(ranked.filter((s) => s.mapped), true), 'With station code');
    XLSXStyle.utils.book_append_sheet(wb, build(ranked.filter((s) => !s.mapped), false), 'Without station code');

    const buf = XLSXStyle.write(wb, { bookType: 'xlsx', type: 'array' });
    // Mode and zone go in the filename: the numbers mean different things in each.
    saveAs(
      new Blob([buf], { type: 'application/octet-stream' }),
      `wettest_stations_${this.timeline.date}_${this.heatMode}_${this.clockZone}.xlsx`
    );
  }

  exportTimelineCsv(): void {
    if (!this.timeline) return;
    const header = [
      'source', 'station_id', 'station_code', 'station_name', 'state', 'district',
      'latitude', 'longitude', 'day_total_mm', 'slots_reported',
      ...this.timeline.slots.map((_, i) => this.slotStamp(i) + ' ' + this.clockZone),
    ];
    const rows = this.liveStations.map((s) => [
      s.source_label, s.station_id, s.station_code ?? '', s.station_name,
      s.state_name ?? '', s.district_name ?? '',
      s.latitude ?? '', s.longitude ?? '', s.day_total ?? '', s.slots_reported,
      ...Array.from(s.filled, (v) => (Number.isNaN(v) ? '' : v.toFixed(1))),
    ]);
    this.downloadCsv([header, ...rows], `aws_timeline_${this.timeline.date}.csv`);
  }

  // ══════════════════════════════════════════════════════════════ cumulative

  get cumDistrictOptions(): Array<{ district_code: string; district_name: string }> {
    if (!this.filters || !this.cumStateCode) return [];
    return this.filters.districts_by_state[this.cumStateCode] ?? [];
  }

  onCumStateChange(): void {
    this.cumDistrictCode = '';
  }

  loadCumulative(): void {
    if (!this.cumStartDate || !this.cumEndDate) return;
    if (this.cumStartDate > this.cumEndDate) {
      this.cumError = 'Start date must be on or before end date.';
      return;
    }

    this.cumLoading = true;
    this.cumError = '';
    this.api
      .fetchCumulative({
        startDate: this.cumStartDate,
        endDate: this.cumEndDate,
        stateCodes: this.cumStateCode ? [Number(this.cumStateCode)] : undefined,
        districtCodes: this.cumDistrictCode ? [Number(this.cumDistrictCode)] : undefined,
        stationType: this.cumStationType || null,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.cumulative = data;
          this.cumLoading = false;
          this.cumPage = 0;
          this.applyCumFilter();
          this.renderCumulativeCharts();
        },
        error: (err) => {
          this.cumLoading = false;
          this.cumulative = null;
          this.cumFilteredStations = [];
          this.cumError = err?.error?.message || err?.message || 'Failed to load cumulative statistics';
        },
      });
  }

  applyCumFilter(): void {
    const all = this.cumulative?.stations ?? [];
    const q = this.cumSearch.trim().toLowerCase();
    const filtered = q
      ? all.filter((s) =>
          [s.station_name, s.station_code, s.district_name, s.state_name, s.block_name, s.centre_name]
            .some((f) => (f ?? '').toString().toLowerCase().includes(q))
        )
      : all.slice();

    const key = this.cumSortKey;
    const dir = this.cumSortDesc ? -1 : 1;
    filtered.sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (typeof av === 'string' || typeof bv === 'string') {
        return String(av ?? '').localeCompare(String(bv ?? '')) * dir;
      }
      // Nulls always sort last, whichever direction the column is pointing.
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      return ((av as number) - (bv as number)) * dir;
    });

    this.cumFilteredStations = filtered;
    const maxPage = Math.max(0, Math.ceil(filtered.length / this.cumPageSize) - 1);
    if (this.cumPage > maxPage) this.cumPage = maxPage;
  }

  sortCum(key: CumSortKey): void {
    if (this.cumSortKey === key) this.cumSortDesc = !this.cumSortDesc;
    else {
      this.cumSortKey = key;
      this.cumSortDesc = true;
    }
    this.applyCumFilter();
  }

  get cumPageStations(): AwsCumulativeStation[] {
    const from = this.cumPage * this.cumPageSize;
    return this.cumFilteredStations.slice(from, from + this.cumPageSize);
  }

  get cumPageCount(): number {
    return Math.max(1, Math.ceil(this.cumFilteredStations.length / this.cumPageSize));
  }

  changeCumPage(delta: number): void {
    this.cumPage = Math.min(this.cumPageCount - 1, Math.max(0, this.cumPage + delta));
  }

  openStationFromRow(station: AwsCumulativeStation): void {
    this.stationCodeInput = station.station_code;
    this.selectTab('station');
    this.loadStation();
  }

  private renderCumulativeCharts(): void {
    const data = this.cumulative;
    if (!data) return;

    // ── Daily network curve: volume, per-station mean, and how much of the
    //    network was actually reporting behind those numbers.
    this.dailyChart = new Chart({
      chart: { type: 'column', backgroundColor: 'transparent', height: 320 },
      title: { text: '' },
      credits: { enabled: false },
      legend: { itemStyle: { color: '#5b6675', fontSize: '11px' } },
      xAxis: {
        categories: data.daily.map((d) => d.collection_date),
        labels: { style: { color: '#5b6675', fontSize: '10px' } },
        lineColor: '#dfe4ea',
      },
      yAxis: [
        {
          title: { text: 'Rainfall (mm)', style: { color: '#5b6675' } },
          labels: { style: { color: '#5b6675' } },
          gridLineColor: '#eef1f5',
        },
        {
          title: { text: 'Reporting (%)', style: { color: '#5b6675' } },
          labels: { style: { color: '#5b6675' } },
          max: 100,
          opposite: true,
          gridLineWidth: 0,
        },
      ],
      tooltip: { shared: true },
      plotOptions: { column: { borderWidth: 0 } },
      series: [
        {
          type: 'column',
          name: 'Network total',
          data: data.daily.map((d) => d.sum_rainfall ?? 0),
          color: '#1a4fa0',
        },
        {
          type: 'spline',
          name: 'Mean per station',
          data: data.daily.map((d) => d.avg_rainfall ?? 0),
          color: '#1e7a45',
        },
        {
          type: 'spline',
          name: 'Reporting %',
          yAxis: 1,
          dashStyle: 'ShortDot',
          data: data.daily.map((d) => d.reporting_pct),
          color: '#d99100',
        },
      ],
    } as any);

    // ── State rollup, ranked by mean station total.
    const states = data.states.slice(0, 14);
    this.stateChart = new Chart({
      chart: { type: 'bar', backgroundColor: 'transparent', height: Math.max(260, states.length * 26 + 60) },
      title: { text: '' },
      credits: { enabled: false },
      legend: { itemStyle: { color: '#5b6675', fontSize: '11px' } },
      xAxis: {
        categories: states.map((s) => s.name),
        labels: { style: { color: '#5b6675', fontSize: '10px' } },
      },
      yAxis: {
        title: { text: 'mm', style: { color: '#5b6675' } },
        labels: { style: { color: '#5b6675' } },
        gridLineColor: '#eef1f5',
      },
      plotOptions: { bar: { borderWidth: 0 } },
      series: [
        { type: 'bar', name: 'Mean station total', data: states.map((s) => s.avg_rainfall ?? 0), color: '#0f8ab5' },
        { type: 'bar', name: 'Wettest station', data: states.map((s) => s.max_rainfall ?? 0), color: '#e07b39' },
      ],
    } as any);

    // ── Total vs rain-days scatter. Two stations can share a seasonal total
    //    and behave completely differently: one drizzles for forty days, the
    //    other empties in three. This is the chart that separates them.
    const points = data.stations
      .filter((s) => s.days_reported > 0 && s.total_rainfall !== null)
      .map((s) => ({
        x: s.rain_days,
        y: s.total_rainfall as number,
        z: s.max_daily ?? 0,
        name: s.station_name,
        state: s.state_name,
        code: s.station_code,
      }));

    this.spreadPointCount = points.length;
    this.spreadChart = new Chart({
      chart: { type: 'bubble', backgroundColor: 'transparent', height: 340, zooming: { type: 'xy' } },
      title: { text: '' },
      credits: { enabled: false },
      legend: { enabled: false },
      xAxis: {
        title: { text: 'Rain days', style: { color: '#5b6675' } },
        labels: { style: { color: '#5b6675' } },
        gridLineColor: '#eef1f5',
      },
      yAxis: {
        title: { text: 'Total rainfall (mm)', style: { color: '#5b6675' } },
        labels: { style: { color: '#5b6675' } },
        gridLineColor: '#eef1f5',
      },
      tooltip: {
        useHTML: true,
        pointFormat:
          '<b>{point.name}</b><br/>{point.state}<br/>Total {point.y} mm over {point.x} rain days<br/>Wettest day {point.z} mm',
      },
      plotOptions: { bubble: { minSize: 4, maxSize: 26, opacity: 0.65 } },
      series: [{ type: 'bubble', name: 'Stations', data: points, color: '#1e7a45' }],
    } as any);

    // ── Where the station totals sit in the depth bands.
    const counts = DEPTH_BANDS.map((band) => ({
      name: band.label,
      color: band.color,
      y: data.stations.filter(
        (s) => s.days_reported > 0 && bandIndex(DEPTH_BANDS, s.total_rainfall ?? -1) === DEPTH_BANDS.indexOf(band)
      ).length,
    })).filter((c) => c.y > 0);

    this.bandChart = new Chart({
      chart: { type: 'pie', backgroundColor: 'transparent', height: 300 },
      title: { text: '' },
      credits: { enabled: false },
      legend: { enabled: true, itemStyle: { color: '#5b6675', fontSize: '11px' } },
      plotOptions: {
        pie: {
          innerSize: '58%',
          borderWidth: 0,
          dataLabels: { enabled: false },
          showInLegend: true,
        },
      },
      tooltip: { pointFormat: '<b>{point.y}</b> stations ({point.percentage:.1f}%)' },
      series: [{ type: 'pie', name: 'Stations', data: counts }],
    } as any);
  }

  exportCumulativeCsv(): void {
    if (!this.cumFilteredStations.length) return;
    const header = [
      'station_code', 'station_name', 'state', 'district', 'block', 'centre', 'station_type',
      'latitude', 'longitude', 'days_total', 'days_reported', 'days_missing', 'reporting_pct',
      'rain_days', 'dry_days', 'total_mm', 'mean_daily_mm', 'mean_rain_day_mm', 'median_mm',
      'p95_mm', 'sd_mm', 'cv_pct', 'max_daily_mm', 'peak_date', 'peak_share_pct',
      'longest_wet_spell_days', 'spell_total_mm', 'spell_start', 'spell_end',
    ];
    const rows = this.cumFilteredStations.map((s) => [
      s.station_code, s.station_name, s.state_name ?? '', s.district_name ?? '',
      s.block_name ?? '', s.centre_name ?? '', s.station_type ?? '',
      s.latitude ?? '', s.longitude ?? '', s.days_total, s.days_reported, s.days_missing,
      s.reporting_pct, s.rain_days, s.dry_days, s.total_rainfall ?? '', s.mean_daily ?? '',
      s.mean_rain_day ?? '', s.median_daily ?? '', s.p95_daily ?? '', s.sd_daily ?? '',
      s.cv_pct ?? '', s.max_daily ?? '', s.peak_date ?? '', s.peak_share_pct ?? '',
      s.longest_wet_spell, s.longest_spell_total ?? '', s.spell_start ?? '', s.spell_end ?? '',
    ]);
    this.downloadCsv([header, ...rows], `aws_cumulative_${this.cumStartDate}_${this.cumEndDate}.csv`);
  }

  // ═════════════════════════════════════════════════════════════════ station

  loadStation(): void {
    const code = this.stationCodeInput.trim();
    if (!code) {
      this.stationError = 'Enter a station code.';
      return;
    }

    this.stationLoading = true;
    this.stationError = '';
    this.api
      .fetchStationSeries({ stationCode: code, startDate: this.cumStartDate, endDate: this.cumEndDate })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.stationSeries = data;
          this.stationLoading = false;
          this.renderStationCharts();
        },
        error: (err) => {
          this.stationLoading = false;
          this.stationSeries = null;
          this.stationError = err?.error?.message || err?.message || 'Failed to load station';
        },
      });
  }

  private renderStationCharts(): void {
    const data = this.stationSeries;
    if (!data) return;

    this.stationChart = new Chart({
      chart: { backgroundColor: 'transparent', height: 330 },
      title: { text: '' },
      credits: { enabled: false },
      legend: { itemStyle: { color: '#5b6675', fontSize: '11px' } },
      xAxis: {
        categories: data.series.map((d) => d.collection_date),
        labels: { style: { color: '#5b6675', fontSize: '10px' } },
      },
      yAxis: [
        {
          title: { text: 'Daily (mm)', style: { color: '#5b6675' } },
          labels: { style: { color: '#5b6675' } },
          gridLineColor: '#eef1f5',
        },
        {
          title: { text: 'Accumulated (mm)', style: { color: '#5b6675' } },
          labels: { style: { color: '#5b6675' } },
          opposite: true,
          gridLineWidth: 0,
        },
      ],
      tooltip: { shared: true },
      series: [
        {
          type: 'column',
          name: 'Daily rainfall',
          // null keeps a -999.9 day as a visible gap instead of a false zero.
          data: data.series.map((d) => d.value),
          color: '#1a4fa0',
          borderWidth: 0,
        },
        {
          type: 'areaspline',
          name: 'Accumulated',
          yAxis: 1,
          data: data.series.map((d) => d.cumulative),
          color: '#1e7a45',
          fillOpacity: 0.15,
          marker: { enabled: false },
        },
      ],
    } as any);

    this.stationLiveChart = data.live
      ? new Chart({
          chart: { type: 'areaspline', backgroundColor: 'transparent', height: 260 },
          title: { text: '' },
          credits: { enabled: false },
          legend: { enabled: false },
          xAxis: {
            categories: data.live.slots.map((s) => s.label),
            tickInterval: 8,
            labels: { style: { color: '#5b6675', fontSize: '10px' } },
          },
          yAxis: {
            title: { text: 'Accumulated (mm)', style: { color: '#5b6675' } },
            labels: { style: { color: '#5b6675' } },
            gridLineColor: '#eef1f5',
          },
          tooltip: { valueSuffix: ' mm' },
          series: [
            {
              type: 'areaspline',
              name: 'Accumulated',
              data: data.live.cum,
              color: '#0f8ab5',
              fillOpacity: 0.2,
              marker: { enabled: false },
              connectNulls: true,
            },
          ],
        } as any)
      : null;
  }

  // ═════════════════════════════════════════════════════════════════ network

  loadNetwork(): void {
    this.networkLoading = true;
    this.networkError = '';
    forkJoin({
      health: this.api
        .fetchSourceHealth(this.liveDate, this.networkLookback)
        .pipe(catchError(() => of(null))),
      unmapped: this.api
        .fetchUnmapped({ date: this.liveDate, lookbackDays: this.networkLookback, limit: 2000 })
        .pipe(catchError(() => of(null))),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ health, unmapped }) => {
        this.networkLoading = false;
        this.health = health;
        this.unmapped = unmapped?.stations ?? [];
        this.unmappedTruncated = unmapped?.truncated ?? false;
        this.unmappedBySource = unmapped?.count_by_source ?? {};
        if (!health && !unmapped) this.networkError = 'Failed to load network health.';
      });
  }

  get filteredUnmapped(): AwsUnmappedStation[] {
    if (!this.unmappedSourceFilter) return this.unmapped;
    return this.unmapped.filter((s) => s.source_key === this.unmappedSourceFilter);
  }

  /**
   * Mapping rows whose station_code is absent from aws_station_details. They
   * look mapped but still produce no daily row, so they are worth calling out
   * separately from the plainly unmapped stations.
   */
  get danglingTotal(): number {
    return (this.health?.sources ?? []).reduce((a, s) => a + s.dangling_mappings, 0);
  }

  /** Sources that carry live stations but have no mapping rows at all. */
  get sourcesWithoutMapping(): string[] {
    return (this.health?.sources ?? [])
      .filter((s) => !s.feeds_cumulative_store && s.stations_window > 0)
      .map((s) => s.label);
  }

  exportUnmappedCsv(): void {
    const rows = this.filteredUnmapped;
    if (!rows.length) return;
    const header = [
      'source', 'source_table_key', 'station_id', 'station_name', 'state', 'district',
      'block', 'latitude', 'longitude', 'observations', 'days_seen', 'peak_rainfall_mm', 'last_observation_ist',
    ];
    const body = rows.map((s) => [
      s.source_label, s.source_key, s.station_id, s.station_name, s.state_name ?? '',
      s.district_name ?? '', s.block_name ?? '', s.latitude ?? '', s.longitude ?? '',
      s.observations, s.days_seen, s.peak_rainfall ?? '', s.last_obs_ist ?? '',
    ]);
    this.downloadCsv([header, ...body], `aws_unmapped_stations_${this.liveDate}.csv`);
  }

  // ═══════════════════════════════════════════════════════════════════ utils

  /** Shifts a "YYYY-MM-DD" by whole days, without dragging in a date library. */
  private addDays(date: string, days: number): string {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + days);
    return this.toIso(d);
  }

  private toIso(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  private downloadCsv(rows: Array<Array<string | number>>, filename: string): void {
    const escape = (v: string | number) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = rows.map((r) => r.map(escape).join(',')).join('\n');
    saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8' }), filename);
  }

  fmt(value: number | null | undefined, digits = 1): string {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—';
    return Number(value).toFixed(digits);
  }

  /** Formats a NaN-carrying Float32Array reading for the template. */
  fmtLive(value: number, digits = 1): string {
    return Number.isNaN(value) ? '—' : value.toFixed(digits);
  }

  trackByStationId(_: number, item: { station_id: string; source_key: string }): string {
    return `${item.source_key}|${item.station_id}`;
  }

  trackByMover(_: number, item: Mover): string {
    return `${item.station.source_key}|${item.station.station_id}`;
  }

  trackByHeatRow(_: number, item: { station: LiveStation }): string {
    return `${item.station.source_key}|${item.station.station_id}`;
  }

  trackByCode(_: number, item: AwsCumulativeStation): string {
    return item.station_code;
  }

  trackByIndex(index: number): number {
    return index;
  }
}
