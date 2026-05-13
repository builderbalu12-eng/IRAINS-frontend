import { Component, OnInit } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { CalculationExclusionService } from 'src/app/services/admin-panel/calculationExclusion.service';
import * as XLSX from 'xlsx-js-style';

export interface EntityRow {
  code: number;
  name: string;
  extra: string;
  isExcluded: boolean;
  isLoading: boolean;
}

@Component({
  selector: 'app-calculation-exclusion',
  templateUrl: './calculation-exclusion.component.html',
  styleUrls: ['./calculation-exclusion.component.css']
})
export class CalculationExclusionComponent implements OnInit {

  isLoading: boolean = false;
  today: string = '';
  fromDate: string = '';
  toDate: string = '';
  dateError: string = '';

  isTriggeringRefresh: boolean = false;
  refreshMessage: string = '';
  refreshError: string = '';

  // Excel Upload
  showUploadPanel: boolean = false;
  excelFileName: string = '';
  excelRows: any[] = [];
  excelErrors: string[] = [];
  isApplyingExcel: boolean = false;


  activeTab: string = 'district';

  tabs = [
    { key: 'district', label: 'District' },
    { key: 'block', label: 'Block' },
    { key: 'station', label: 'Station' },
  ];

  data: { [tab: string]: EntityRow[] } = {
    district: [],
    block: [],
    station: []
  };

  searchText: { [tab: string]: string } = {
    district: '',
    block: '',
    station: ''
  };

  sortCol: { [tab: string]: string } = { district: '', block: '', station: '' };
  sortDir: { [tab: string]: 'asc' | 'desc' } = { district: 'asc', block: 'asc', station: 'asc' };
  colFilter: { [tab: string]: { name: string; extra: string; code: string; status: string } } = {
    district: { name: '', extra: '', code: '', status: '' },
    block:    { name: '', extra: '', code: '', status: '' },
    station:  { name: '', extra: '', code: '', status: '' },
  };

  excludedSet = new Set<string>();



  constructor(private exclusionService: CalculationExclusionService) {
    const now = new Date();
    this.today = this.formatDate(now);
    this.fromDate = this.today;
    this.toDate = this.today;
  }

  

  ngOnInit(): void {
    this.loadAllEntities();
  }

  formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private validateDates(): boolean {
    this.dateError = '';

    if (!this.fromDate) {
      this.dateError = 'From Date is required.';
      return false;
    }

    if (!this.toDate) {
      this.toDate = this.fromDate;
    }

    if (this.toDate < this.fromDate) {
      this.dateError = 'To Date must be on or after From Date.';
      return false;
    }

    return true;
  }

  loadAllEntities(): void {
    this.isLoading = true;

    forkJoin({
      states: this.exclusionService.getAllStates(),
      districts: this.exclusionService.getAllDistricts(),
      blocks: this.exclusionService.getAllBlocks(),
      stations: this.exclusionService.getAllStations(),
      exclusions: this.exclusionService.getExclusions({
        from_date: this.fromDate,
        to_date: this.toDate
      }),
    }).subscribe({
      next: ({ states, districts, blocks, stations, exclusions }) => {
        this.excludedSet.clear();
        (exclusions?.exclusions || []).forEach((e: any) => {
          this.excludedSet.add(`${e.entity_type}_${e.entity_code}`);
        });

        // Build state_code → state_name lookup
        const stateMap = new Map<number, string>();
        (states?.data || []).forEach((s: any) => {
          stateMap.set(Number(s.state_code ?? s.new_state_code), s.state_name);
        });

        this.data['district'] = (districts?.data || []).map((d: any) => ({
          code: d.district_code,
          name: d.district_name,
          extra: d.state_name || stateMap.get(Number(d.state_code ?? d.new_state_code)) || '',
          isExcluded: this.excludedSet.has(`district_${d.district_code}`),
          isLoading: false
        }));

        this.data['block'] = (blocks?.data || []).map((b: any) => ({
          code: b.block_code,
          name: b.block_name,
          extra: b.district_name,
          isExcluded: this.excludedSet.has(`block_${b.block_code}`),
          isLoading: false
        }));

        this.data['station'] = (stations?.data || []).map((s: any) => ({
          code: s.station_code,
          name: s.station_name,
          extra: s.block_name || s.district_name || '',
          isExcluded: this.excludedSet.has(`station_${s.station_code}`),
          isLoading: false
        }));

        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading exclusion page data:', err);
        this.isLoading = false;
      }
    });
  }

  onDateSubmit(): void {
    if (!this.validateDates()) return;

    this.isLoading = true;

    this.exclusionService.getExclusions({
      from_date: this.fromDate,
      to_date: this.toDate
    }).subscribe({
      next: (res: any) => {
        this.excludedSet.clear();
        (res?.exclusions || []).forEach((e: any) => {
          this.excludedSet.add(`${e.entity_type}_${e.entity_code}`);
        });

        for (const tab of Object.keys(this.data)) {
          this.data[tab].forEach((row: EntityRow) => {
            row.isExcluded = this.excludedSet.has(`${tab}_${row.code}`);
          });
        }

        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error fetching exclusions:', err);
        this.isLoading = false;
      }
    });
  }

  onToggle(tab: string, row: EntityRow): void {
    row.isLoading = true;

    this.exclusionService.toggleExclusion({
      entity_type: tab,
      entity_code: row.code,
      entity_name: row.name,
      from_date: this.fromDate,
      to_date: this.toDate || this.fromDate
    }).subscribe({
      next: (res: any) => {
        const nowExcluded = res.state === 'excluded';
        row.isExcluded = nowExcluded;
        row.isLoading = false;

        const key = `${tab}_${row.code}`;
        if (nowExcluded) {
          this.excludedSet.add(key);
        } else {
          this.excludedSet.delete(key);
        }
      },
      error: (err: any) => {
        console.error('Toggle failed:', err);
        row.isLoading = false;
      }
    });
  }

  onBulkAction(tab: string, action: 'include' | 'exclude'): void {
    const visible = this.filteredData(tab);
    if (!visible.length) return;

    const entities = visible.map(r => ({
      entity_type: tab,
      entity_code: r.code,
      entity_name: r.name
    }));

    this.isLoading = true;

    this.exclusionService.bulkToggle({
      action,
      from_date: this.fromDate,
      to_date: this.toDate || this.fromDate,
      entities
    }).subscribe({
      next: () => {
        visible.forEach(r => {
          r.isExcluded = action === 'exclude';

          const key = `${tab}_${r.code}`;
          if (action === 'exclude') {
            this.excludedSet.add(key);
          } else {
            this.excludedSet.delete(key);
          }
        });

        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Bulk action failed:', err);
        this.isLoading = false;
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.searchText[tab] = '';
  }

  filteredData(tab: string): EntityRow[] {
    const search = (this.searchText[tab] || '').toLowerCase().trim();
    const cf = this.colFilter[tab] || { name: '', extra: '', code: '', status: '' };

    let rows = this.data[tab].filter(r => {
      if (search && !r.name.toLowerCase().includes(search) && !r.extra.toLowerCase().includes(search)) return false;
      if (cf.name   && !r.name.toLowerCase().includes(cf.name.toLowerCase()))   return false;
      if (cf.extra  && !r.extra.toLowerCase().includes(cf.extra.toLowerCase()))  return false;
      if (cf.code   && !String(r.code).includes(cf.code))                        return false;
      if (cf.status && !(cf.status === 'excluded' ? r.isExcluded : !r.isExcluded)) return false;
      return true;
    });

    const col = this.sortCol[tab];
    if (col) {
      const dir = this.sortDir[tab] === 'asc' ? 1 : -1;
      rows = [...rows].sort((a: any, b: any) => {
        const av = col === 'code' ? a.code : col === 'status' ? (a.isExcluded ? 1 : 0) : (a[col] || '');
        const bv = col === 'code' ? b.code : col === 'status' ? (b.isExcluded ? 1 : 0) : (b[col] || '');
        return av < bv ? -dir : av > bv ? dir : 0;
      });
    }

    return rows;
  }

  setSort(tab: string, col: string): void {
    if (this.sortCol[tab] === col) {
      this.sortDir[tab] = this.sortDir[tab] === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortCol[tab] = col;
      this.sortDir[tab] = 'asc';
    }
  }

  excludedCount(tab: string): number {
    return this.data[tab].filter(r => r.isExcluded).length;
  }

  totalCount(tab: string): number {
    return this.data[tab].length;
  }


  getParentLabel(tab: string): string {
  const labels: { [key: string]: string } = {
    subdivision: 'Region',
    state: 'Region',
    district: 'State',
    block: 'District',
    station: 'Block'
  };
  return labels[tab] || 'Parent';
}


triggerMapRefresh(): void {
  this.isTriggeringRefresh = true;
  this.refreshMessage = '';
  this.refreshError = '';

  this.exclusionService.triggerDailyStationData().subscribe({
    next: (res: any) => {
      this.isTriggeringRefresh = false;
      this.refreshMessage = res?.message || 'Map data refreshed successfully';
    },
    error: (err: any) => {
      this.isTriggeringRefresh = false;
      this.refreshError = err?.error?.message || 'Failed to refresh map data';
    }
  });
}

  // ── Excel Upload ──────────────────────────────────────────────────────────

  onExcelFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.parseExcel(input.files[0]);
  }

  onExcelDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.parseExcel(file);
  }

  private toDateStr(val: any): string {
    if (!val) return '';
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    const num = Number(val);
    if (!isNaN(num) && num > 1000) {
      const d = new Date((num - 25569) * 86400 * 1000);
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
    }
    return String(val);
  }

  private parseExcel(file: File): void {
    this.excelFileName = file.name;
    this.excelRows = [];
    this.excelErrors = [];

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '', raw: true });
      const validTypes = ['district', 'block', 'station'];
      const validActions = ['exclude', 'include'];

      rows.forEach((row: any, idx: number) => {
        const n = idx + 2;
        const errs: string[] = [];
        if (!validTypes.includes((row['entity_type'] || '').toLowerCase()))
          errs.push(`Row ${n}: entity_type must be district, block, or station`);
        if (!row['entity_code'])
          errs.push(`Row ${n}: entity_code is required`);
        if (!row['entity_name'])
          errs.push(`Row ${n}: entity_name is required`);
        if (!validActions.includes((row['action'] || '').toLowerCase()))
          errs.push(`Row ${n}: action must be exclude or include`);

        this.excelErrors.push(...errs);
        this.excelRows.push({
          entity_type: (row['entity_type'] || '').toLowerCase(),
          entity_code: Number(row['entity_code']),
          entity_name: row['entity_name'] || '',
          from_date: this.toDateStr(row['from_date']) || this.fromDate,
          to_date: this.toDateStr(row['to_date']) || this.toDate || this.fromDate,
          action: (row['action'] || '').toLowerCase(),
          _hasError: errs.length > 0
        });
      });
    };
    reader.readAsArrayBuffer(file);
  }

  clearExcelUpload(): void {
    this.excelFileName = '';
    this.excelRows = [];
    this.excelErrors = [];
  }

  confirmExcelUpload(): void {
    const valid = this.excelRows.filter(r => !r._hasError);
    if (!valid.length) return;

    this.isApplyingExcel = true;

    const calls: Observable<any>[] = [];

    // Group by action + type + date range to minimise API calls
    const groupKey = (r: any) => `${r.action}|${r.entity_type}|${r.from_date}|${r.to_date}`;
    const groups: { [key: string]: any[] } = {};
    valid.forEach((r: any) => {
      const k = groupKey(r);
      groups[k] = groups[k] || [];
      groups[k].push(r);
    });

    Object.keys(groups).forEach(key => {
      const [action, , from_date, to_date] = key.split('|');
      const grpRows = groups[key];
      calls.push(
        this.exclusionService.bulkToggle({
          action: action as 'exclude' | 'include',
          from_date,
          to_date,
          entities: grpRows.map((r: any) => ({
            entity_type: r.entity_type,
            entity_code: r.entity_code,
            entity_name: r.entity_name
          }))
        })
      );
    });

    forkJoin(calls).subscribe({
      next: () => {
        valid.forEach((r: any) => {
          const key = `${r.entity_type}_${r.entity_code}`;
          if (r.action === 'exclude') {
            this.excludedSet.add(key);
          } else {
            this.excludedSet.delete(key);
          }
          const row = this.data[r.entity_type]?.find((d: EntityRow) => d.code === r.entity_code);
          if (row) row.isExcluded = r.action === 'exclude';
        });
        this.isApplyingExcel = false;
        this.clearExcelUpload();
        this.showUploadPanel = false;
      },
      error: () => { this.isApplyingExcel = false; }
    });
  }

  downloadExcelTemplate(): void {
    const header = ['entity_type', 'entity_code', 'entity_name', 'from_date', 'to_date', 'action'];

    const rows: any[][] = [];
    const tabKeys = ['district', 'block', 'station'];

    tabKeys.forEach(type => {
      (this.data[type] || []).forEach((row: EntityRow) => {
        rows.push([
          type,
          row.code,
          row.name,
          this.fromDate,
          this.toDate || this.fromDate,
          row.isExcluded ? 'exclude' : 'include'
        ]);
      });
    });

    const sheetData = rows.length > 0
      ? [header, ...rows]
      : [header, ['district', '', '', this.fromDate, this.toDate || this.fromDate, 'exclude']];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Style header row bold + green background
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
      if (cell) {
        cell.s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '198754' } }
        };
      }
    }

    ws['!cols'] = [
      { wch: 12 }, { wch: 14 }, { wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 10 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Exclusions');
    XLSX.writeFile(wb, `exclusion_${this.fromDate}_to_${this.toDate || this.fromDate}.xlsx`);
  }

}