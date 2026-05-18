import { Component, OnInit } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { CalculationExclusionService } from 'src/app/services/admin-panel/calculationExclusion.service';
import { DistrictService } from 'src/app/services/district/district.service';
import { Constants } from 'src/app/services/constants';
import * as XLSX from 'xlsx-js-style';

export interface EntityRow {
  code: number;
  name: string;
  extra: string;
  isExcluded: boolean;
  isLoading: boolean;
}

export interface SeasonalDistrict {
  code: number;
  name: string;
  state: string;
  isExcluded: boolean;
  isLoading: boolean;
  gapCount: number;
  segments: { lineD: string; areaD: string }[];
  hoverPoints: { x: number; y: number; date: string; value: number }[];
  series: { label: string; startDate: string; endDate: string; value: number | null }[];
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

  // Seasonal tab
  seasonalLoading  = false;
  seasonalLoaded   = false;
  seasonalSearchText = '';
  seasonalColFilter = { name: '', state: '', status: '' };
  seasonalSortCol = '';
  seasonalSortDir: 'asc' | 'desc' = 'asc';
  currentSeasonName = '';
  currentSeasonRange = '';
  seasonStartDate = '';
  seasonEndDate   = '';
  seasonalDistricts: SeasonalDistrict[] = [];

  // Monthly tab
  monthlyLoading  = false;
  monthlyLoaded   = false;
  monthlySearchText = '';
  monthlyColFilter = { name: '', state: '', status: '' };
  monthlySortCol = '';
  monthlySortDir: 'asc' | 'desc' = 'asc';
  monthlyRangeLabel = '';
  monthlyStartDate = '';
  monthlyEndDate   = '';
  monthlyDistricts: SeasonalDistrict[] = [];

  // Weekly tab
  weeklyLoading  = false;
  weeklyLoaded   = false;
  weeklySearchText = '';
  weeklyColFilter = { name: '', state: '', status: '' };
  weeklySortCol = '';
  weeklySortDir: 'asc' | 'desc' = 'asc';
  weeklyRangeLabel = '';
  weeklyStartDate = '';
  weeklyEndDate   = '';
  weeklyDistricts: SeasonalDistrict[] = [];

  // Modal
  modalDistrict: SeasonalDistrict | null = null;
  modalSegments: { lineD: string; areaD: string }[] = [];
  modalHoverPoints: { x: number; y: number; date: string; value: number }[] = [];

  constructor(
    private exclusionService: CalculationExclusionService,
    private districtService: DistrictService,
    private constants: Constants
  ) {
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
    if (this.searchText[tab] !== undefined) this.searchText[tab] = '';
    if (tab === 'seasonal' && !this.seasonalLoaded) this.loadSeasonalData();
    if (tab === 'monthly'  && !this.monthlyLoaded)  this.loadMonthlyData();
    if (tab === 'weekly'   && !this.weeklyLoaded)   this.loadWeeklyData();
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

  // ── Seasonal Tab ─────────────────────────────────────────────────────────

  loadSeasonalData(): void {
    this.seasonalLoading = true;

    const today = new Date();
    const year  = today.getFullYear();

    const seasonName = this.constants.getCurrentSeason(today).toLowerCase();
    this.currentSeasonName = seasonName.charAt(0).toUpperCase() + seasonName.slice(1);

    const intervals = this.constants.getWeeklyIntervals(seasonName, year);
    if (!intervals.length) {
      this.seasonalLoading = false;
      return;
    }

    this.seasonStartDate = intervals[0].startDate;
    this.seasonEndDate   = intervals[intervals.length - 1].endDate;
    this.currentSeasonRange = `${this.seasonStartDate} → ${this.seasonEndDate}`;

    const districtCalls: Observable<any>[] = intervals.map(iv =>
      this.districtService.fetchData({ startDate: iv.startDate, endDate: iv.endDate })
    );

    forkJoin({
      responses: forkJoin(districtCalls),
      exclusions: this.exclusionService.getExclusions({
        from_date: this.seasonStartDate,
        to_date: this.seasonEndDate
      })
    }).subscribe({
      next: ({ responses, exclusions }: { responses: any[]; exclusions: any }) => {
        const INVALID = -999.9;

        const seasonExcludedSet = new Set<string>();
        (exclusions?.exclusions || []).forEach((e: any) => {
          seasonExcludedSet.add(`${e.entity_type}_${e.entity_code}`);
        });

        const byCode = new Map<string, { endDate: string; actual: number | null }[]>();

        responses.forEach((res: any, idx: number) => {
          const endDate = intervals[idx].endDate;
          (res?.data || []).forEach((item: any) => {
            const code = String(item.district_code);
            if (!byCode.has(code)) byCode.set(code, []);
            const actual = parseFloat(item.actual_rainfall);
            byCode.get(code)!.push({
              endDate,
              actual: (isNaN(actual) || actual === INVALID) ? null : actual
            });
          });
        });

        this.seasonalDistricts = this.data['district'].map((d: EntityRow) => {
          const series = (byCode.get(String(d.code)) || [])
            .sort((a, b) => a.endDate.localeCompare(b.endDate));

          const { segments, hoverPoints } = this.buildSparkline(
            series.map(s => ({ value: s.actual, date: s.endDate })), 280, 56
          );

          const seriesRows = intervals.map((iv, i) => {
            const match = series.find(s => s.endDate === iv.endDate);
            return {
              label: `Week ${i + 1}`,
              startDate: iv.startDate,
              endDate: iv.endDate,
              value: match ? match.actual : null
            };
          });

          const gapCount = seriesRows.filter(r => r.value === null).length;

          return {
            code: d.code,
            name: d.name,
            state: d.extra,
            isExcluded: seasonExcludedSet.has(`district_${d.code}`),
            isLoading: false,
            gapCount,
            segments,
            hoverPoints,
            series: seriesRows
          };
        });

        // Sort: most gaps first (districts with missing data appear at top)
        this.seasonalDistricts.sort((a, b) => b.gapCount - a.gapCount);

        this.seasonalLoaded  = true;
        this.seasonalLoading = false;
      },
      error: (err: any) => {
        console.error('Seasonal load failed:', err);
        this.seasonalLoading = false;
      }
    });
  }

  buildSparkline(
    points: { value: number | null; date: string }[],
    W: number, H: number
  ): {
    segments: { lineD: string; areaD: string }[];
    hoverPoints: { x: number; y: number; date: string; value: number }[];
  } {
    const PAD = 4;
    const n = points.length;
    if (n === 0) return { segments: [], hoverPoints: [] };

    const validVals = points.filter(p => p.value !== null).map(p => p.value as number);
    if (validVals.length === 0) return { segments: [], hoverPoints: [] };

    const minV  = Math.min(...validVals, 0);
    const maxV  = Math.max(...validVals);
    const range = maxV - minV || 1;
    const xStep = n > 1 ? W / (n - 1) : W;
    const sy    = (v: number) => H - PAD - ((v - minV) / range) * (H - PAD * 2);

    const segments: { lineD: string; areaD: string }[] = [];
    const hoverPoints: { x: number; y: number; date: string; value: number }[] = [];
    let lineD = '';
    let areaD = '';
    let lastX = 0;

    for (let i = 0; i < n; i++) {
      const x = Math.round(i * xStep);
      const v = points[i].value;

      if (v !== null) {
        const y = Math.round(sy(v));
        hoverPoints.push({ x, y, date: points[i].date, value: v });
        if (!lineD) {
          lineD = `M${x},${y}`;
          areaD = `M${x},${H} L${x},${y}`;
        } else {
          lineD += ` L${x},${y}`;
          areaD += ` L${x},${y}`;
        }
        lastX = x;
      } else {
        if (lineD) {
          segments.push({ lineD, areaD: areaD + ` L${lastX},${H} Z` });
          lineD = '';
          areaD = '';
        }
      }
    }

    if (lineD) {
      segments.push({ lineD, areaD: areaD + ` L${lastX},${H} Z` });
    }
    return { segments, hoverPoints };
  }

  filteredSeasonalDistricts() {
    const s  = this.seasonalSearchText.toLowerCase().trim();
    const cf = this.seasonalColFilter;
    let rows = this.seasonalDistricts.filter(d => {
      if (s && !d.name.toLowerCase().includes(s) && !d.state.toLowerCase().includes(s)) return false;
      if (cf.name  && !d.name.toLowerCase().includes(cf.name.toLowerCase()))   return false;
      if (cf.state && !d.state.toLowerCase().includes(cf.state.toLowerCase())) return false;
      if (cf.status === 'excluded' && !d.isExcluded)  return false;
      if (cf.status === 'included' &&  d.isExcluded)  return false;
      return true;
    });

    if (this.seasonalSortCol) {
      const dir = this.seasonalSortDir === 'asc' ? 1 : -1;
      rows = [...rows].sort((a, b) => {
        let av: any, bv: any;
        if (this.seasonalSortCol === 'name')    { av = a.name;       bv = b.name; }
        else if (this.seasonalSortCol === 'state')   { av = a.state;      bv = b.state; }
        else if (this.seasonalSortCol === 'status')  { av = a.isExcluded ? 1 : 0; bv = b.isExcluded ? 1 : 0; }
        else if (this.seasonalSortCol === 'gaps')    { av = a.gapCount;   bv = b.gapCount; }
        return av < bv ? -dir : av > bv ? dir : 0;
      });
    }

    return rows;
  }

  setSeasonalSort(col: string): void {
    if (this.seasonalSortCol === col) {
      this.seasonalSortDir = this.seasonalSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.seasonalSortCol = col;
      this.seasonalSortDir = 'asc';
    }
  }

  reloadSeasonal(): void {
    this.seasonalLoaded = false;
    this.loadSeasonalData();
  }

  toggleSeasonalDistrict(d: SeasonalDistrict): void {
    d.isLoading = true;
    this.exclusionService.toggleExclusion({
      entity_type: 'district',
      entity_code: d.code,
      entity_name: d.name,
      from_date: this.seasonStartDate,
      to_date: this.seasonEndDate
    }).subscribe({
      next: (res: any) => {
        d.isExcluded = res.state === 'excluded';
        d.isLoading = false;
      },
      error: () => { d.isLoading = false; }
    });
  }

  // ── Monthly / Weekly shared loader ──────────────────────────────────────

  private loadChartDistricts(
    intervals: { startDate: string; endDate: string; label: string }[],
    startDate: string,
    endDate: string,
    onDone: (rows: SeasonalDistrict[]) => void,
    onError: () => void
  ): void {
    const calls: Observable<any>[] = intervals.map(iv =>
      this.districtService.fetchData({ startDate: iv.startDate, endDate: iv.endDate })
    );
    forkJoin({
      responses: forkJoin(calls),
      exclusions: this.exclusionService.getExclusions({ from_date: startDate, to_date: endDate })
    }).subscribe({
      next: ({ responses, exclusions }: { responses: any[]; exclusions: any }) => {
        const INVALID = -999.9;
        const excSet = new Set<string>();
        (exclusions?.exclusions || []).forEach((e: any) => excSet.add(`${e.entity_type}_${e.entity_code}`));

        const byCode = new Map<string, { endDate: string; actual: number | null }[]>();
        responses.forEach((res: any, idx: number) => {
          (res?.data || []).forEach((item: any) => {
            const code = String(item.district_code);
            if (!byCode.has(code)) byCode.set(code, []);
            const actual = parseFloat(item.actual_rainfall);
            byCode.get(code)!.push({
              endDate: intervals[idx].endDate,
              actual: (isNaN(actual) || actual === INVALID) ? null : actual
            });
          });
        });

        const rows: SeasonalDistrict[] = this.data['district'].map((d: EntityRow) => {
          const series = (byCode.get(String(d.code)) || [])
            .sort((a, b) => a.endDate.localeCompare(b.endDate));
          const { segments, hoverPoints } = this.buildSparkline(
            series.map(s => ({ value: s.actual, date: s.endDate })), 280, 56
          );
          const seriesRows = intervals.map(iv => {
            const match = series.find(s => s.endDate === iv.endDate);
            return { label: iv.label, startDate: iv.startDate, endDate: iv.endDate, value: match ? match.actual : null };
          });
          return {
            code: d.code, name: d.name, state: d.extra,
            isExcluded: excSet.has(`district_${d.code}`),
            isLoading: false,
            gapCount: seriesRows.filter(r => r.value === null).length,
            segments, hoverPoints, series: seriesRows
          };
        });
        rows.sort((a, b) => b.gapCount - a.gapCount);
        onDone(rows);
      },
      error: onError
    });
  }

  // ── Monthly ───────────────────────────────────────────────────────────────

  private getMonthlyIntervals(year: number): { startDate: string; endDate: string; label: string }[] {
    const NAMES = ['January','February','March','April','May','June',
                   'July','August','September','October','November','December'];
    const today = new Date();
    const max = today.getMonth();
    const result: { startDate: string; endDate: string; label: string }[] = [];
    for (let m = 0; m <= max; m++) {
      let end = new Date(year, m + 1, 0);
      if (end > today) end = new Date(today);
      result.push({
        label: NAMES[m],
        startDate: this.formatDate(new Date(year, m, 1)),
        endDate: this.formatDate(end)
      });
    }
    return result;
  }

  loadMonthlyData(): void {
    this.monthlyLoading = true;
    const today = new Date();
    const year = today.getFullYear();
    const intervals = this.getMonthlyIntervals(year);
    if (!intervals.length) { this.monthlyLoading = false; return; }

    this.monthlyStartDate = intervals[0].startDate;
    this.monthlyEndDate   = intervals[intervals.length - 1].endDate;
    const ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    this.monthlyRangeLabel = `${year} — Jan → ${ABBR[today.getMonth()]}`;

    this.loadChartDistricts(intervals, this.monthlyStartDate, this.monthlyEndDate,
      (rows: SeasonalDistrict[]) => { this.monthlyDistricts = rows; this.monthlyLoaded = true; this.monthlyLoading = false; },
      () => { this.monthlyLoading = false; }
    );
  }

  filteredMonthlyDistricts(): SeasonalDistrict[] {
    const s = this.monthlySearchText.toLowerCase().trim();
    const cf = this.monthlyColFilter;
    let rows = this.monthlyDistricts.filter(d => {
      if (s && !d.name.toLowerCase().includes(s) && !d.state.toLowerCase().includes(s)) return false;
      if (cf.name  && !d.name.toLowerCase().includes(cf.name.toLowerCase()))   return false;
      if (cf.state && !d.state.toLowerCase().includes(cf.state.toLowerCase())) return false;
      if (cf.status === 'excluded' && !d.isExcluded) return false;
      if (cf.status === 'included' &&  d.isExcluded) return false;
      return true;
    });
    if (this.monthlySortCol) {
      const dir = this.monthlySortDir === 'asc' ? 1 : -1;
      rows = [...rows].sort((a, b) => {
        const av = this.monthlySortCol === 'name' ? a.name : this.monthlySortCol === 'state' ? a.state : this.monthlySortCol === 'status' ? (a.isExcluded ? 1 : 0) : a.gapCount;
        const bv = this.monthlySortCol === 'name' ? b.name : this.monthlySortCol === 'state' ? b.state : this.monthlySortCol === 'status' ? (b.isExcluded ? 1 : 0) : b.gapCount;
        return av < bv ? -dir : av > bv ? dir : 0;
      });
    }
    return rows;
  }

  setMonthlySort(col: string): void {
    this.monthlySortDir = this.monthlySortCol === col ? (this.monthlySortDir === 'asc' ? 'desc' : 'asc') : 'asc';
    this.monthlySortCol = col;
  }

  reloadMonthly(): void { this.monthlyLoaded = false; this.loadMonthlyData(); }

  toggleMonthlyDistrict(d: SeasonalDistrict): void {
    d.isLoading = true;
    this.exclusionService.toggleExclusion({
      entity_type: 'district', entity_code: d.code, entity_name: d.name,
      from_date: this.monthlyStartDate, to_date: this.monthlyEndDate
    }).subscribe({
      next: (res: any) => { d.isExcluded = res.state === 'excluded'; d.isLoading = false; },
      error: () => { d.isLoading = false; }
    });
  }

  // ── Weekly ────────────────────────────────────────────────────────────────

  private getWeeklyIntervalsForMonth(year: number, month: number): { startDate: string; endDate: string; label: string }[] {
    const today = new Date();
    const seasonName = this.constants.getCurrentSeason(today).toLowerCase();
    const allWeeks = this.constants.getWeeklyIntervals(seasonName, year);
    const monthStart = new Date(year, month, 1);
    const monthEnd   = new Date(year, month + 1, 0);
    return allWeeks
      .filter(w => new Date(w.endDate + 'T00:00:00') >= monthStart && new Date(w.startDate + 'T00:00:00') <= monthEnd)
      .map((w, i) => ({ startDate: w.startDate, endDate: w.endDate, label: `Week ${i + 1}` }));
  }

  loadWeeklyData(): void {
    this.weeklyLoading = true;
    const today = new Date();
    const year  = today.getFullYear();
    const month = today.getMonth();
    const intervals = this.getWeeklyIntervalsForMonth(year, month);
    if (!intervals.length) { this.weeklyLoading = false; return; }

    this.weeklyStartDate = intervals[0].startDate;
    this.weeklyEndDate   = intervals[intervals.length - 1].endDate;
    const NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    this.weeklyRangeLabel = `${NAMES[month]} ${year}`;

    this.loadChartDistricts(intervals, this.weeklyStartDate, this.weeklyEndDate,
      (rows: SeasonalDistrict[]) => { this.weeklyDistricts = rows; this.weeklyLoaded = true; this.weeklyLoading = false; },
      () => { this.weeklyLoading = false; }
    );
  }

  filteredWeeklyDistricts(): SeasonalDistrict[] {
    const s = this.weeklySearchText.toLowerCase().trim();
    const cf = this.weeklyColFilter;
    let rows = this.weeklyDistricts.filter(d => {
      if (s && !d.name.toLowerCase().includes(s) && !d.state.toLowerCase().includes(s)) return false;
      if (cf.name  && !d.name.toLowerCase().includes(cf.name.toLowerCase()))   return false;
      if (cf.state && !d.state.toLowerCase().includes(cf.state.toLowerCase())) return false;
      if (cf.status === 'excluded' && !d.isExcluded) return false;
      if (cf.status === 'included' &&  d.isExcluded) return false;
      return true;
    });
    if (this.weeklySortCol) {
      const dir = this.weeklySortDir === 'asc' ? 1 : -1;
      rows = [...rows].sort((a, b) => {
        const av = this.weeklySortCol === 'name' ? a.name : this.weeklySortCol === 'state' ? a.state : this.weeklySortCol === 'status' ? (a.isExcluded ? 1 : 0) : a.gapCount;
        const bv = this.weeklySortCol === 'name' ? b.name : this.weeklySortCol === 'state' ? b.state : this.weeklySortCol === 'status' ? (b.isExcluded ? 1 : 0) : b.gapCount;
        return av < bv ? -dir : av > bv ? dir : 0;
      });
    }
    return rows;
  }

  setWeeklySort(col: string): void {
    this.weeklySortDir = this.weeklySortCol === col ? (this.weeklySortDir === 'asc' ? 'desc' : 'asc') : 'asc';
    this.weeklySortCol = col;
  }

  reloadWeekly(): void { this.weeklyLoaded = false; this.loadWeeklyData(); }

  toggleWeeklyDistrict(d: SeasonalDistrict): void {
    d.isLoading = true;
    this.exclusionService.toggleExclusion({
      entity_type: 'district', entity_code: d.code, entity_name: d.name,
      from_date: this.weeklyStartDate, to_date: this.weeklyEndDate
    }).subscribe({
      next: (res: any) => { d.isExcluded = res.state === 'excluded'; d.isLoading = false; },
      error: () => { d.isLoading = false; }
    });
  }

  openDistrictModal(d: SeasonalDistrict): void {
    this.modalDistrict = d;
    const { segments, hoverPoints } = this.buildSparkline(
      d.series.map(s => ({ value: s.value, date: s.endDate })), 560, 120
    );
    this.modalSegments    = segments;
    this.modalHoverPoints = hoverPoints;
  }

  closeDistrictModal(): void {
    this.modalDistrict = null;
  }

  stationCountForDistrict(districtName: string): number {
    const blockNames = new Set(
      this.data['block'].filter(b => b.extra === districtName).map(b => b.name)
    );
    return this.data['station'].filter(s => blockNames.has(s.extra)).length;
  }

}