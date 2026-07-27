import { Component, OnInit } from '@angular/core';
import { FetchStationDataService } from 'src/app/services/station/station.service';
import { DataEntryLockService } from 'src/app/services/dataEntryLock.service';

interface RevisionLogRow {
  revisionDate: string;
  dataDate: string;
  stationCount: number;
  stationNames: string[];
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
}

interface McWiseRow {
  centreType: string;
  centreName: string;
  sameDayCount: number;
  backDatedCount: number;
  stationCount: number;
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
  days: number = 7;                                        // Range tab
  singleDate: string = this.formatDateLocal(new Date());    // Day Wise tab

  loading: boolean = false;
  message: string = '';
  messageType: 'success' | 'error' = 'success';

  logRows: RevisionLogRow[] = [];

  // ── Analytics derived client-side from logRows — no separate endpoint ──
  backDatedCount = 0;
  sameDayCount = 0;

  // ── MC-Wise Reupdates panel (always visible, left of Revision Log) ──
  loadingMcWise: boolean = false;
  mcWiseRows: McWiseRow[] = [];

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

  /** Which filter is currently active — { days } for Range, { date } for Day Wise — used by every fetch below. */
  private currentParams(): { days?: number; date?: string } {
    return this.activeTab === 'daywise' ? { date: this.singleDate } : { days: this.days };
  }

  onDayWiseDateChange(): void {
    this.resetZoom();
    this.loadLog();
    this.loadLockTimeline();
    this.loadTimelineDots();
  }

  loadLog(): void {
    this.loading = true;
    this.message = '';
    this.stationService.fetchRevisionLog(this.currentParams()).subscribe({
      next: (res) => {
        this.logRows = (res.data || []).map((r: any) => ({
          revisionDate: r.revision_date,
          dataDate: r.data_date,
          stationCount: r.station_count,
          stationNames: r.station_names || [],
          backDated: r.data_date < r.revision_date,
          expanded: false,
          loadingDetails: false,
          details: null
        }));
        this.computeAnalytics();
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
          expandedFilter: null,
          loadingDetails: false,
          details: null
        }));
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
            backDated: d.back_dated
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

  /** Details for a centre row, filtered to whichever count (same-day / back-dated) is currently expanded. */
  getFilteredMcDetails(row: McWiseRow): StationRevisionDetail[] {
    if (!row.details || !row.expandedFilter) return [];
    const wantBackDated = row.expandedFilter === 'back-dated';
    return row.details.filter(d => d.backDated === wantBackDated);
  }

  private computeAnalytics(): void {
    const totalRevisionEvents = this.logRows.reduce((sum, r) => sum + r.stationCount, 0);
    this.backDatedCount = this.logRows
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
            backDated: row.backDated
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
