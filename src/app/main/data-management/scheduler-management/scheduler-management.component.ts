import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CronJobSchedule, CronScheduleService } from 'src/app/services/cronSchedule.service';

@Component({
  selector: 'app-scheduler-management',
  templateUrl: './scheduler-management.component.html',
  styleUrls: ['./scheduler-management.component.css']
})
export class SchedulerManagementComponent implements OnInit {
  schedules: CronJobSchedule[] = [];
  isLoading = false;
  loadError = '';
  searchText = '';

  showModal = false;
  isEditing = false;
  editingJobKey: string | null = null;
  isSaving = false;
  saveError = '';
  form!: FormGroup;

  toggling = new Set<string>();
  deleting = new Set<string>();

  constructor(
    private fb: FormBuilder,
    private cronService: CronScheduleService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      job_key:           ['', Validators.required],
      job_group:         ['', Validators.required],
      job_name:          ['', Validators.required],
      description:       [''],
      schedule_type:     ['daily_time', Validators.required],
      run_time:          [''],
      window_start_time: [''],
      window_end_time:   [''],
      interval_minutes:  [null],
      timezone:          ['Asia/Kolkata'],
      is_active:         [true],
    });
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.loadError = '';
    this.cronService.getAll().subscribe({
      next: (res) => { this.schedules = res.data ?? []; this.isLoading = false; },
      error: () => { this.loadError = 'Failed to load cron schedules.'; this.isLoading = false; }
    });
  }

  get filtered(): CronJobSchedule[] {
    const s = this.searchText.toLowerCase();
    if (!s) return this.schedules;
    return this.schedules.filter(j =>
      j.job_key.toLowerCase().includes(s) ||
      j.job_group.toLowerCase().includes(s) ||
      j.job_name.toLowerCase().includes(s)
    );
  }

  scheduleSummary(j: CronJobSchedule): string {
    if (j.schedule_type === 'daily_time') {
      return `Daily at ${this.formatTime(j.run_time)}`;
    }
    return `Every ${j.interval_minutes} min, ${this.formatTime(j.window_start_time)} - ${this.formatTime(j.window_end_time)}`;
  }

  formatTime(t?: string | null): string {
    if (!t) return '-';
    return t.slice(0, 5);
  }

  // ── Add / Edit modal ────────────────────────────────────────────────────────
  openAdd(): void {
    this.isEditing = false;
    this.editingJobKey = null;
    this.saveError = '';
    this.form.reset({
      job_key: '',
      job_group: '',
      job_name: '',
      description: '',
      schedule_type: 'daily_time',
      run_time: '',
      window_start_time: '',
      window_end_time: '',
      interval_minutes: null,
      timezone: 'Asia/Kolkata',
      is_active: true,
    });
    this.form.get('job_key')?.enable();
    this.showModal = true;
  }

  openEdit(j: CronJobSchedule): void {
    this.isEditing = true;
    this.editingJobKey = j.job_key;
    this.saveError = '';
    this.form.reset({
      job_key: j.job_key,
      job_group: j.job_group,
      job_name: j.job_name,
      description: j.description ?? '',
      schedule_type: j.schedule_type,
      run_time: this.formatTime(j.run_time) === '-' ? '' : this.formatTime(j.run_time),
      window_start_time: this.formatTime(j.window_start_time) === '-' ? '' : this.formatTime(j.window_start_time),
      window_end_time: this.formatTime(j.window_end_time) === '-' ? '' : this.formatTime(j.window_end_time),
      interval_minutes: j.interval_minutes ?? null,
      timezone: j.timezone ?? 'Asia/Kolkata',
      is_active: j.is_active ?? true,
    });
    this.form.get('job_key')?.disable();
    this.showModal = true;
  }

  closeModal(): void {
    if (this.isSaving) return;
    this.showModal = false;
  }

  get isDailyType(): boolean {
    return this.form?.get('schedule_type')?.value === 'daily_time';
  }

  save(): void {
    if (this.form.invalid) return;

    const v = this.form.getRawValue();

    if (v.schedule_type === 'daily_time' && !v.run_time) {
      this.saveError = 'Run time is required for daily schedules.';
      return;
    }
    if (v.schedule_type === 'interval' && (!v.window_start_time || !v.window_end_time || !v.interval_minutes)) {
      this.saveError = 'Window start/end time and interval (minutes) are required for interval schedules.';
      return;
    }

    this.isSaving = true;
    this.saveError = '';

    const payload: CronJobSchedule = {
      job_key: v.job_key,
      job_group: v.job_group,
      job_name: v.job_name,
      description: v.description || null,
      schedule_type: v.schedule_type,
      run_time: v.schedule_type === 'daily_time' ? v.run_time : null,
      window_start_time: v.schedule_type === 'interval' ? v.window_start_time : null,
      window_end_time: v.schedule_type === 'interval' ? v.window_end_time : null,
      interval_minutes: v.schedule_type === 'interval' ? v.interval_minutes : null,
      timezone: v.timezone,
      is_active: v.is_active,
    };

    const req$ = this.isEditing && this.editingJobKey
      ? this.cronService.update(this.editingJobKey, payload)
      : this.cronService.create(payload);

    req$.subscribe({
      next: () => {
        this.isSaving = false;
        this.showModal = false;
        this.load();
      },
      error: (err) => {
        this.isSaving = false;
        this.saveError = err?.error?.message || 'Failed to save schedule.';
      }
    });
  }

  // ── Toggle active ────────────────────────────────────────────────────────────
  toggleActive(j: CronJobSchedule): void {
    const newVal = !j.is_active;
    this.toggling.add(j.job_key);
    this.cronService.toggleActive(j.job_key, newVal).subscribe({
      next: () => { j.is_active = newVal; this.toggling.delete(j.job_key); },
      error: () => { this.toggling.delete(j.job_key); }
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────────────
  delete(j: CronJobSchedule): void {
    if (!confirm(`Delete schedule "${j.job_name}"?`)) return;
    this.deleting.add(j.job_key);
    this.cronService.delete(j.job_key).subscribe({
      next: () => {
        this.schedules = this.schedules.filter(s => s.job_key !== j.job_key);
        this.deleting.delete(j.job_key);
      },
      error: () => { this.deleting.delete(j.job_key); }
    });
  }
}
