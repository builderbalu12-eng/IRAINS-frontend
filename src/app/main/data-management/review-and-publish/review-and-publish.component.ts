import { Component, OnInit } from '@angular/core';
import { DataEntryLockService } from 'src/app/services/dataEntryLock.service';
import { MapDataScheduleService } from 'src/app/services/mapDataSchedule.service';
import { TopRainfallStationsService } from 'src/app/services/topRainfallStations.service';

interface RoleSchedule {
  role: string;
  label: string;
  restrictDays: number | null;
  publish: boolean;
  loading: boolean;
  saving: boolean;
  message: string;
  messageType: 'success' | 'error';
}

@Component({
  selector: 'app-review-and-publish',
  templateUrl: './review-and-publish.component.html',
  styleUrls: ['./review-and-publish.component.css']
})
export class ReviewAndPublishComponent implements OnInit {
  isLocked: boolean = false;
  loading: boolean = false;
  saving: boolean = false;
  message: string = '';
  messageType: 'success' | 'error' = 'success';

  roleSchedules: RoleSchedule[] = [
    { role: 'mc', label: 'MC', restrictDays: null, publish: false, loading: true, saving: false, message: '', messageType: 'success' },
    { role: 'hq', label: 'HQ', restrictDays: null, publish: false, loading: true, saving: false, message: '', messageType: 'success' },
  ];

  // ── Public & SP — separate section, same login table has 4 mcorhq_type values ──
  publicSpSchedules: RoleSchedule[] = [
    { role: 'public', label: 'Public', restrictDays: null, publish: false, loading: true, saving: false, message: '', messageType: 'success' },
    { role: 'sp', label: 'SP', restrictDays: null, publish: false, loading: true, saving: false, message: '', messageType: 'success' },
  ];

  // ── Highest rainfall by date (right panel) ──────────────────────────────
  topN: number = 100;
  loadingTopRainfall: boolean = false;
  topRainfallDates: string[] = [];
  topRainfallByDate: { [date: string]: any[] } = {};
  selectedTopRainfallDate: string = '';
  private readonly defaultTopRainfallDays = 30;

  constructor(
    private lockService: DataEntryLockService,
    private scheduleService: MapDataScheduleService,
    private topRainfallService: TopRainfallStationsService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.lockService.loadLock().subscribe({
      next: (res) => {
        this.isLocked = res.is_locked === 1;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });

    this.roleSchedules.forEach(rs => {
      this.scheduleService.getSchedule(rs.role).subscribe({
        next: (res) => {
          rs.restrictDays = res.restrict_days;
          rs.publish = res.publish === 1;
          rs.loading = false;
          this.maybeLoadTopRainfall();
        },
        error: () => {
          rs.loading = false;
          this.maybeLoadTopRainfall();
        }
      });
    });

    this.publicSpSchedules.forEach(rs => {
      this.scheduleService.getSchedule(rs.role).subscribe({
        next: (res) => {
          rs.restrictDays = res.restrict_days;
          rs.publish = res.publish === 1;
          rs.loading = false;
        },
        error: () => { rs.loading = false; }
      });
    });
  }

  /** Highest restrictDays across MC/HQ (falls back to a default window if both are unrestricted). */
  effectiveTopRainfallDays(): number {
    const values = this.roleSchedules
      .map(rs => rs.restrictDays)
      .filter((d): d is number => d != null);
    return values.length > 0 ? Math.max(...values) : this.defaultTopRainfallDays;
  }

  private maybeLoadTopRainfall(): void {
    if (this.roleSchedules.every(rs => !rs.loading)) {
      this.loadTopRainfall();
    }
  }

  loadTopRainfall(): void {
    this.loadingTopRainfall = true;
    this.topRainfallService.getTopRainfallStations(this.effectiveTopRainfallDays(), this.topN).subscribe({
      next: (res) => {
        this.groupTopRainfallByDate(res.data || []);
        this.loadingTopRainfall = false;
      },
      error: () => { this.loadingTopRainfall = false; }
    });
  }

  private groupTopRainfallByDate(rows: any[]): void {
    const byDate: { [date: string]: any[] } = {};
    rows.forEach((row: any) => {
      if (!byDate[row.collection_date]) byDate[row.collection_date] = [];
      byDate[row.collection_date].push(row);
    });
    this.topRainfallByDate = byDate;
    this.topRainfallDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));
    if (!this.topRainfallDates.includes(this.selectedTopRainfallDate)) {
      this.selectedTopRainfallDate = this.topRainfallDates[0] || '';
    }
  }

  get selectedDateStations(): any[] {
    return this.topRainfallByDate[this.selectedTopRainfallDate] || [];
  }

  onToggleChange(): void {
    this.saving = true;
    this.message = '';
    const newVal = this.isLocked ? 1 : 0;
    this.lockService.setLock(newVal).subscribe({
      next: (res) => {
        this.saving = false;
        this.messageType = 'success';
        this.message = res.is_locked === 1
          ? 'Data entry is now locked — the data-entry page will show a lock popup blocking submissions.'
          : 'Data entry is now unlocked — users can submit data as normal.';
        setTimeout(() => this.message = '', 4000);
      },
      error: () => {
        this.saving = false;
        this.messageType = 'error';
        this.message = 'Failed to update lock status. Please try again.';
        this.isLocked = !this.isLocked;
      }
    });
  }

  saveRestrictDays(rs: RoleSchedule): void {
    rs.saving = true;
    rs.message = '';
    this.scheduleService.setSchedule(rs.role, rs.restrictDays, rs.publish ? 1 : 0).subscribe({
      next: () => {
        rs.saving = false;
        rs.messageType = 'success';
        rs.message = 'Saved.';
        setTimeout(() => rs.message = '', 3000);
      },
      error: () => {
        rs.saving = false;
        rs.messageType = 'error';
        rs.message = 'Failed to save. Please try again.';
      }
    });
  }

  onPublishToggle(rs: RoleSchedule): void {
    rs.saving = true;
    rs.message = '';
    this.scheduleService.setSchedule(rs.role, rs.restrictDays, rs.publish ? 1 : 0).subscribe({
      next: () => {
        rs.saving = false;
        rs.messageType = 'success';
        rs.message = rs.publish
          ? `Today's data is now published for ${rs.label}.`
          : `Today's data is now held back for ${rs.label} until published.`;
        setTimeout(() => rs.message = '', 4000);
      },
      error: () => {
        rs.saving = false;
        rs.messageType = 'error';
        rs.message = 'Failed to update publish status. Please try again.';
        rs.publish = !rs.publish;
      }
    });
  }
}
