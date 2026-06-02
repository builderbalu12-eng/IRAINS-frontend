import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CalculationsModeService } from 'src/app/services/calculationsMode.service';
import { environment } from 'src/environment/environment';
import * as XLSX from 'xlsx-js-style';
import * as FileSaver from 'file-saver';

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

  // Station data
  stationsLoading = false;
  imdStations: any[] = [];
  awsStations: any[] = [];
  imdTotal: number = 0;
  awsTotal: number = 0;
  activeTab: 'imd' | 'aws' = 'imd';
  selectedDate: string = this.todayStr();

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

  onDateChange(event: any): void {
    this.selectedDate = event.target.value;
    this.loadStations();
  }

  loadStations(): void {
    this.stationsLoading = true;
    this.imdStations = [];
    this.awsStations = [];
    this.sortCol = '';
    this.http.post<any>(`${this.baseUrl}/api/v1/fetchCalcModeStations`, { date: this.selectedDate }).subscribe({
      next: (res) => {
        this.imdStations = res.imd ?? [];
        this.awsStations = res.aws ?? [];
        this.imdTotal    = res.imdTotal ?? 0;
        this.awsTotal    = res.awsTotal ?? 0;
        this.stationsLoading = false;
      },
      error: () => { this.stationsLoading = false; }
    });
  }

  get displayedRows(): any[] {
    const rows = this.activeTab === 'imd' ? this.imdStations : this.awsStations;
    if (!this.sortCol) return rows;
    return [...rows].sort((a, b) => {
      let va = a[this.sortCol] ?? '';
      let vb = b[this.sortCol] ?? '';
      if (!isNaN(Number(va)) && !isNaN(Number(vb))) {
        return this.sortDir === 'asc' ? Number(va) - Number(vb) : Number(vb) - Number(va);
      }
      va = String(va).toLowerCase();
      vb = String(vb).toLowerCase();
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

  downloadExcel(): void {
    const date = this.selectedDate.replace(/-/g, '');
    const headers = ['S.No', 'Station Code', 'State', 'District', 'Block', 'Station Name', 'Value (mm)'];
    const colWidths = [{ wch: 6 }, { wch: 16 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 28 }, { wch: 12 }];

    const hdrStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '002467' } },
      alignment: { horizontal: 'center' as const },
      border: {
        top:    { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left:   { style: 'thin', color: { rgb: '000000' } },
        right:  { style: 'thin', color: { rgb: '000000' } },
      }
    };

    const buildSheet = (rows: any[]) => {
      const data = rows.map((r, i) => [
        i + 1,
        r.station_code  ?? '',
        r.state_name    ?? '',
        r.district_name ?? '',
        r.block_name    ?? '',
        r.station_name  ?? '',
        r.data          ?? '',
      ]);
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
      headers.forEach((_, i) => {
        const cell = XLSX.utils.encode_cell({ r: 0, c: i });
        if (ws[cell]) ws[cell].s = hdrStyle;
      });
      ws['!cols'] = colWidths;
      return ws;
    };

    const wb = XLSX.utils.book_new();

    if (this.useAws) {
      // IMD + AWS mode — two sheets
      XLSX.utils.book_append_sheet(wb, buildSheet(this.imdStations), 'Data-entry Stations');
      XLSX.utils.book_append_sheet(wb, buildSheet(this.awsStations), 'State AWS Stations');
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      FileSaver.saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `IMD_AWS_Stations_${date}.xlsx`);
    } else {
      // IMD only — single sheet
      XLSX.utils.book_append_sheet(wb, buildSheet(this.imdStations), 'Data-entry Stations');
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      FileSaver.saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `DataEntry_Stations_${date}.xlsx`);
    }
  }

  private todayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
}
