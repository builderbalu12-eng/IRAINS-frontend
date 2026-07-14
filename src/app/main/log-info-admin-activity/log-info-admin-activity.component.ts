import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';
import { of } from 'rxjs';
import {
  ADMIN_ACTIVITY_PAGES,
  DATA_MANAGEMENT_CATEGORIES,
  SPATIAL_BOUNDARY_CATEGORIES,
} from 'src/app/config/admin-realtime.config';
import {
  ActivityLogRecord,
  ActivityLogQuery,
  AdminActivityLogService,
  AdminActivityPageMeta,
} from 'src/app/services/admin-activity-log.service';

@Component({
  selector: 'app-log-info-admin-activity',
  templateUrl: './log-info-admin-activity.component.html',
  styleUrls: ['./log-info-admin-activity.component.css'],
})
export class LogInfoAdminActivityComponent implements OnInit, OnDestroy {
  readonly moduleOptions = ['', 'Data Management', 'Spatial Boundaries'];
  readonly embedded: boolean;

  moduleName = '';
  categoryName = '';
  routePath = '';
  fromDate = this.todayIso();
  toDate = this.todayIso();
  maxDate = this.todayIso();

  allPages: AdminActivityPageMeta[] = [...ADMIN_ACTIVITY_PAGES];

  logs: ActivityLogRecord[] = [];
  total = 0;
  limit = 50;
  offset = 0;
  loading = false;
  error = '';

  private readonly fetch$ = new Subject<ActivityLogQuery>();
  private readonly destroy$ = new Subject<void>();

  constructor(
    private activityLog: AdminActivityLogService,
    route: ActivatedRoute,
  ) {
    this.embedded = !!route.snapshot.data['embeddedInDataManagement'];
  }

  ngOnInit(): void {
    this.loadPageCatalog();

    this.fetch$
      .pipe(
        switchMap((query) => this.activityLog.getActivityLogs(query)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          this.logs = res.data ?? [];
          this.total = res.total ?? 0;
          this.limit = res.limit ?? this.limit;
          this.offset = res.offset ?? this.offset;
          this.loading = false;
        },
        error: () => {
          this.error = 'Failed to load activity logs. Please try again.';
          this.logs = [];
          this.loading = false;
        },
      });

    this.fetchLogs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get categoryOptions(): readonly string[] {
    if (this.moduleName === 'Data Management') return DATA_MANAGEMENT_CATEGORIES;
    if (this.moduleName === 'Spatial Boundaries') return SPATIAL_BOUNDARY_CATEGORIES;
    return ['', ...DATA_MANAGEMENT_CATEGORIES.slice(1), ...SPATIAL_BOUNDARY_CATEGORIES.slice(1)];
  }

  get pageOptions(): AdminActivityPageMeta[] {
    return this.allPages.filter((page) => {
      if (this.moduleName && page.module_name !== this.moduleName) return false;
      if (this.categoryName && page.category_name !== this.categoryName) return false;
      return true;
    });
  }

  get filterSummary(): string {
    if (this.routePath) {
      const page = this.allPages.find((p) => p.route_path === this.routePath);
      return page ? this.pageLabelFor(page) : '1 page';
    }
    if (this.moduleName || this.categoryName) {
      return `${this.pageOptions.length} page(s)`;
    }
    return `All ${this.allPages.length} pages`;
  }

  onModuleChange(): void {
    this.categoryName = '';
    this.routePath = '';
  }

  onCategoryChange(): void {
    this.routePath = '';
  }

  pageLabelFor(page: AdminActivityPageMeta): string {
    return `${page.module_name} / ${page.category_name} / ${page.page_name}`;
  }

  applyFilters(): void {
    this.offset = 0;
    this.fetchLogs();
  }

  fetchLogs(): void {
    this.loading = true;
    this.error = '';
    this.fetch$.next(this.buildQuery());
  }

  prevPage(): void {
    if (this.offset <= 0) return;
    this.offset = Math.max(0, this.offset - this.limit);
    this.fetchLogs();
  }

  nextPage(): void {
    if (this.offset + this.limit >= this.total) return;
    this.offset += this.limit;
    this.fetchLogs();
  }

  get pageLabel(): string {
    const page = Math.floor(this.offset / this.limit) + 1;
    const totalPages = Math.max(1, Math.ceil(this.total / this.limit));
    return `Page ${page} of ${totalPages}`;
  }

  formatWhen(row: ActivityLogRecord): string {
    const date = row.action_date ? String(row.action_date).slice(0, 10) : '';
    const time = row.action_time ? String(row.action_time).slice(0, 8) : '';
    return [date, time].filter(Boolean).join(' ');
  }

  private loadPageCatalog(): void {
    this.activityLog
      .getRealtimeConfig()
      .pipe(
        catchError(() => of(null)),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        if (res?.pages?.length) {
          this.allPages = res.pages;
        }
      });
  }

  private buildQuery(): ActivityLogQuery {
    return {
      module_name: this.moduleName || undefined,
      category_name: this.categoryName || undefined,
      route_path: this.routePath || undefined,
      from_date: this.activityLog.formatDateForApi(this.fromDate),
      to_date: this.activityLog.formatDateForApi(this.toDate),
      limit: this.limit,
      offset: this.offset,
    };
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
