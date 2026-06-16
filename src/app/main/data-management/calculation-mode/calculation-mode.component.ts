import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CalculationsModeService } from 'src/app/services/calculationsMode.service';
import { environment } from 'src/environment/environment';
import * as XLSX from 'xlsx-js-style';
import * as FileSaver from 'file-saver';

interface DateColumn {
  date: string;
  count: number;
  total: number;
  countryActual: number | null;
}

interface PivotRow {
  station_code: string;
  station_name: string;
  state_name: string;
  district_name: string;
  block_name: string;
  values: { [date: string]: number | null };
}

@Component({
  selector: 'app-calculation-mode',
  templateUrl: './calculation-mode.component.html',
  styleUrls: ['./calculation-mode.component.css']
})
export class CalculationModeComponent implements OnInit {
  useAws: boolean = true;
  loading: boolean = false;
  saving:  boolean = false;
  message: string  = '';
  messageType: 'success' | 'error' = 'success';

  // Date range
  fromDate: string = this.todayStr();
  toDate: string   = this.todayStr();

  // Pivot data
  stationsLoading = false;
  dates: string[] = [];
  imdColumns: DateColumn[] = [];
  awsColumns: DateColumn[] = [];
  imdStations: PivotRow[] = [];
  awsStations: PivotRow[] = [];
  activeTab: 'imd' | 'aws' = 'imd';

  // Sort
  sortCol: string = '';
  sortDir: 'asc' | 'desc' = 'asc';

  private baseUrl = environment.baseUrl;

  constructor(
    private calcMode: CalculationsModeService,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.calcMode.loadMode().subscribe({
      next: (res) => {
        this.useAws = res.use_aws === 1;
        this.loading = false;
        this.loadStations();
      },
      error: () => { this.loading = false; }
    });
  }

  onToggleChange(): void {
    this.saving = true;
    this.message = '';
    const newVal = this.useAws ? 1 : 0;
    this.calcMode.setMode(newVal).subscribe({
      next: (res) => {
        this.saving = false;
        this.messageType = 'success';
        this.message = res.use_aws === 1
          ? 'Mode set to IMD + AWS — all maps and exports now include AWS stations.'
          : 'Mode set to IMD Only — all maps and exports use IMD stations only.';
        setTimeout(() => this.message = '', 4000);
        this.activeTab = 'imd';
        this.loadStations();
      },
      error: () => {
        this.saving = false;
        this.messageType = 'error';
        this.message = 'Failed to update mode. Please try again.';
        this.useAws = !this.useAws;
      }
    });
  }

  applyDates(): void {
    if (this.fromDate && this.toDate && this.toDate >= this.fromDate) {
      this.loadStations();
    }
  }

  loadStations(): void {
    this.stationsLoading = true;
    this.dates       = [];
    this.imdColumns  = [];
    this.awsColumns  = [];
    this.imdStations = [];
    this.awsStations = [];
    this.sortCol     = '';

    this.http.post<any>(`${this.baseUrl}/api/v1/fetchCalcModeStationsPivot`, {
      startDate: this.fromDate,
      endDate:   this.toDate,
    }).subscribe({
      next: (res) => {
        this.dates = res.dates ?? [];

        // Build date column metadata for IMD and AWS
        this.imdColumns = this.dates.map(d => ({
          date:         d,
          count:        res.imd?.perDate?.[d]?.count        ?? 0,
          total:        res.imd?.perDate?.[d]?.total        ?? 0,
          countryActual: res.imd?.perDate?.[d]?.countryActual ?? null,
        }));
        this.awsColumns = this.dates.map(d => ({
          date:         d,
          count:        res.aws?.perDate?.[d]?.count        ?? 0,
          total:        res.aws?.perDate?.[d]?.total        ?? 0,
          countryActual: res.aws?.perDate?.[d]?.countryActual ?? null,
        }));

        this.imdStations = res.imd?.stations ?? [];
        this.awsStations = res.aws?.stations ?? [];
        this.stationsLoading = false;
      },
      error: () => { this.stationsLoading = false; }
    });
  }

  get activeCols(): DateColumn[] {
    return this.activeTab === 'imd' ? this.imdColumns : this.awsColumns;
  }

  get displayedRows(): PivotRow[] {
    const rows = this.activeTab === 'imd' ? this.imdStations : this.awsStations;
    if (!this.sortCol) return rows;
    return [...rows].sort((a: any, b: any) => {
      const va = String(a[this.sortCol] ?? '').toLowerCase();
      const vb = String(b[this.sortCol] ?? '').toLowerCase();
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return this.sortDir === 'asc' ? cmp : -cmp;
    });
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

  formatDateDisplay(dateStr: string): string {
    const [y, m, d] = dateStr.split('-');
    return `${d}-${m}-${y}`;
  }

  downloadExcel(): void {
    const fileLabel = `${this.fromDate.replace(/-/g,'')}_${this.toDate.replace(/-/g,'')}`;
    const fixed     = ['S.No', 'Station Code', 'State', 'District', 'Block', 'Station Name'];
    const hdrStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '002467' } },
      alignment: { horizontal: 'center' as const },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } }, bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } }, right: { style: 'thin', color: { rgb: '000000' } },
      }
    };
    const infoStyle = {
      font: { bold: true, color: { rgb: '002467' } },
      fill: { fgColor: { rgb: 'EBF0FA' } },
      alignment: { horizontal: 'center' as const }
    };

    const buildSheet = (rows: PivotRow[], cols: DateColumn[], isAws: boolean) => {
      const label   = isAws ? 'Country IMD+AWS' : 'Country IMD';
      const headers = [...fixed, ...cols.map(c => this.formatDateDisplay(c.date))];
      const metaRow = [
        '', '', '', '', '', '',
        ...cols.map(c => `${c.count}/${c.total} | ${label}: ${c.countryActual !== null ? c.countryActual.toFixed(5) + ' mm' : 'N/A'}`)
      ];
      const data = rows.map((r, i) => [
        i + 1, r.station_code ?? '', r.state_name ?? '', r.district_name ?? '', r.block_name ?? '', r.station_name ?? '',
        ...cols.map(c => r.values[c.date] ?? '')
      ]);

      const ws = XLSX.utils.aoa_to_sheet([metaRow, headers, ...data]);

      cols.forEach((_, ci) => {
        const cell = XLSX.utils.encode_cell({ r: 0, c: fixed.length + ci });
        if (ws[cell]) ws[cell].s = infoStyle;
      });
      headers.forEach((_, ci) => {
        const cell = XLSX.utils.encode_cell({ r: 1, c: ci });
        if (ws[cell]) ws[cell].s = hdrStyle;
      });
      ws['!cols'] = [
        { wch: 6 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 26 },
        ...cols.map(() => ({ wch: 16 }))
      ];
      return ws;
    };

    const wb = XLSX.utils.book_new();
    if (this.useAws) {
      XLSX.utils.book_append_sheet(wb, buildSheet(this.imdStations, this.imdColumns, false), `IMD (${this.imdStations.length})`);
      XLSX.utils.book_append_sheet(wb, buildSheet(this.awsStations, this.awsColumns, true),  `AWS (${this.awsStations.length})`);
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      FileSaver.saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `IMD_AWS_Stations_${fileLabel}.xlsx`);
    } else {
      XLSX.utils.book_append_sheet(wb, buildSheet(this.imdStations, this.imdColumns, false), `IMD (${this.imdStations.length})`);
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      FileSaver.saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `DataEntry_Stations_${fileLabel}.xlsx`);
    }
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
        this.loadStations();
      },
      error: (err) => {
        this.runningDailyStore = false;
        this.dailyStoreMsg = err.error?.message ?? 'Failed';
        this.dailyStoreErr = true;
      }
    });
  }
}
