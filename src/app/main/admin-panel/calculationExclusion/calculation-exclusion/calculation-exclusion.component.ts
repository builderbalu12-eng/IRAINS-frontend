import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
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

  uploadedRows: { [tab: string]: EntityRow[] } = { district: [], block: [], station: [] };
  uploadError: string = '';
  uploadNotFoundNames: string[] = [];


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
      districts: this.exclusionService.getAllDistricts(),
      blocks: this.exclusionService.getAllBlocks(),
      stations: this.exclusionService.getAllStations(),
      exclusions: this.exclusionService.getExclusions({
        from_date: this.fromDate,
        to_date: this.toDate
      }),
    }).subscribe({
      next: ({ districts, blocks, stations, exclusions }) => {
        this.excludedSet.clear();
        (exclusions?.exclusions || []).forEach((e: any) => {
          this.excludedSet.add(`${e.entity_type}_${e.entity_code}`);
        });

        this.data['district'] = (districts?.data || []).map((d: any) => ({
          code: d.district_code,
          name: d.district_name,
          extra: d.state_name,
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
    if (!search) return this.data[tab];

    return this.data[tab].filter(r =>
      r.name.toLowerCase().includes(search) ||
      r.extra.toLowerCase().includes(search)
    );
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

triggerFileInput(tab: string): void {
  const el = document.getElementById(`upload-${tab}`) as HTMLInputElement;
  el?.click();
}

onExcelUpload(event: Event, tab: string): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  this.uploadError = '';
  this.uploadNotFoundNames = [];
  this.uploadedRows[tab] = [];

  const reader = new FileReader();
  reader.onload = (e: any) => {
    try {
      const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
      const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

      if (!rows.length) {
        this.uploadError = 'Excel file is empty.';
        input.value = '';
        return;
      }

      // Read from_date / to_date from the first row if present
      const firstRow = rows[0];
      const excelFromDate: string = firstRow['from_date'] ?? firstRow['From Date'] ?? firstRow['FROM_DATE'] ?? '';
      const excelToDate: string   = firstRow['to_date']   ?? firstRow['To Date']   ?? firstRow['TO_DATE']   ?? '';
      if (excelFromDate) this.fromDate = excelFromDate;
      if (excelToDate)   this.toDate   = excelToDate;

      // Match by entity_code (primary) or entity_name (fallback)
      const hasCodeColumn = rows.some(r =>
        r['entity_code'] !== undefined || r['code'] !== undefined || r['Code'] !== undefined
      );

      if (hasCodeColumn) {
        const uploadedCodes = rows
          .map(r => Number(r['entity_code'] ?? r['code'] ?? r['Code']))
          .filter(c => !isNaN(c) && c > 0);

        if (uploadedCodes.length === 0) {
          this.uploadError = 'entity_code column found but contains no valid numeric codes.';
          input.value = '';
          return;
        }

        const codeSet    = new Set(uploadedCodes.map(String));
        const knownCodes = new Set(this.data[tab].map(r => String(r.code)));

        this.uploadedRows[tab]    = this.data[tab].filter(r => codeSet.has(String(r.code)));
        this.uploadNotFoundNames  = uploadedCodes.filter(c => !knownCodes.has(String(c))).map(String);

        if (this.uploadedRows[tab].length === 0) {
          this.uploadError = `None of the ${uploadedCodes.length} code(s) in the Excel matched any ${tab}.`;
        }
      } else {
        // Fall back to matching by entity_name
        const uploadedNames = rows
          .map(r => (r['entity_name'] ?? r['name'] ?? r['Name'] ?? '').toString().trim().toLowerCase())
          .filter(n => n.length > 0);

        if (uploadedNames.length === 0) {
          this.uploadError = 'No valid entity_code or entity_name column found in the Excel file.';
          input.value = '';
          return;
        }

        const nameSet    = new Set(uploadedNames);
        const knownNames = new Set(this.data[tab].map(r => r.name.toLowerCase()));

        this.uploadedRows[tab]   = this.data[tab].filter(r => nameSet.has(r.name.toLowerCase()));
        this.uploadNotFoundNames = uploadedNames.filter(n => !knownNames.has(n));

        if (this.uploadedRows[tab].length === 0) {
          this.uploadError = `None of the ${uploadedNames.length} name(s) in the Excel matched any ${tab}.`;
        }
      }
    } catch {
      this.uploadError = 'Failed to parse Excel file. Please upload a valid .xlsx file.';
    }
    input.value = '';
  };
  reader.readAsArrayBuffer(file);
}

onUploadedBulkAction(tab: string, action: 'include' | 'exclude'): void {
  const rows = this.uploadedRows[tab];
  if (!rows?.length) return;

  const entities = rows.map(r => ({
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
      rows.forEach(r => {
        r.isExcluded = action === 'exclude';
        const key = `${tab}_${r.code}`;
        if (action === 'exclude') this.excludedSet.add(key);
        else this.excludedSet.delete(key);
      });
      this.uploadedRows[tab] = [];
      this.uploadNotFoundNames = [];
      this.isLoading = false;
    },
    error: (err: any) => {
      console.error('Upload bulk action failed:', err);
      this.isLoading = false;
    }
  });
}

clearUpload(tab: string): void {
  this.uploadedRows[tab] = [];
  this.uploadError = '';
  this.uploadNotFoundNames = [];
}

downloadTemplate(tab: string): void {
  const from = this.fromDate;
  const to   = this.toDate || this.fromDate;
  const rows = this.data[tab].map(r => ({
    entity_type: tab,
    entity_code: r.code,
    entity_name: r.name,
    from_date:   from,
    to_date:     to
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, tab);
  XLSX.writeFile(wb, `${tab}_exclusion_template.xlsx`);
}


}