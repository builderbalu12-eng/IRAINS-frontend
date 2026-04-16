import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CalculationExclusionService } from 'src/app/services/admin-panel/calculationExclusion.service';

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

  activeTab: string = 'region';

  tabs = [
    { key: 'region', label: 'Region' },
    { key: 'subdivision', label: 'Sub Division' },
    { key: 'state', label: 'State' },
    { key: 'district', label: 'District' },
    { key: 'block', label: 'Block' },
    { key: 'station', label: 'Station' },
  ];

  data: { [tab: string]: EntityRow[] } = {
    region: [],
    subdivision: [],
    state: [],
    district: [],
    block: [],
    station: []
  };

  searchText: { [tab: string]: string } = {
    region: '',
    subdivision: '',
    state: '',
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
      regions: this.exclusionService.getAllRegions(),
      subdivs: this.exclusionService.getAllSubDivisions(),
      states: this.exclusionService.getAllStates(),
      districts: this.exclusionService.getAllDistricts(),
      blocks: this.exclusionService.getAllBlocks(),
      stations: this.exclusionService.getAllStations(),
      exclusions: this.exclusionService.getExclusions({
        from_date: this.fromDate,
        to_date: this.toDate
      }),
    }).subscribe({
      next: ({ regions, subdivs, states, districts, blocks, stations, exclusions }) => {
        this.excludedSet.clear();
        (exclusions?.exclusions || []).forEach((e: any) => {
          this.excludedSet.add(`${e.entity_type}_${e.entity_code}`);
        });

        this.data['region'] = (regions?.data || []).map((r: any) => ({
          code: r.region_code,
          name: r.region_name,
          extra: '',
          isExcluded: this.excludedSet.has(`region_${r.region_code}`),
          isLoading: false
        }));

        this.data['subdivision'] = (subdivs?.data || []).map((s: any) => ({
          code: s.subdiv_code,
          name: s.subdiv_name,
          extra: s.region_name,
          isExcluded: this.excludedSet.has(`subdivision_${s.subdiv_code}`),
          isLoading: false
        }));

        this.data['state'] = (states?.data || []).map((s: any) => ({
          code: s.state_code,
          name: s.state_name,
          extra: s.region_name,
          isExcluded: this.excludedSet.has(`state_${s.state_code}`),
          isLoading: false
        }));

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
}