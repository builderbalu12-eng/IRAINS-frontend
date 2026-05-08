import { Component } from '@angular/core';
import { DataService } from 'src/app/data.service';
import { Chart } from 'angular-highcharts';
import { DistrictService } from 'src/app/services/district/district.service';
import { StateService } from 'src/app/services/state/state.service';
import { SubdivisionService } from 'src/app/services/subDivision/subDivision.service';
import { RegionService } from 'src/app/services/region/region.service';

type PanelType = 'district' | 'state' | 'subdivision' | 'region';

const REGION_COLORS: string[] = [
  '#0096ff', '#00cd5b', '#ff9900', '#ff2700', '#9b59b6',
  '#1abc9c', '#e74c3c', '#f39c12', '#3498db', '#2ecc71'
];

@Component({
  selector: 'app-all-maps',
  templateUrl: './all-maps.component.html',
  styleUrls: ['./all-maps.component.css'],
})
export class AllMapsComponent {
  previousWeekWeeklyStartDate: any;
  previousWeekWeeklyendDate: any;
  loggedInUserObject: any;
  selecteddatamode: any;

  // Coverage panel state
  activePanelType: PanelType | null = null;
  coverageTableData: any[] = [];
  coverageChart: Chart | null = null;
  isCoverageLoading = false;
  coveragePanelTitle = '';

  constructor(
    private dataService: DataService,
    private districtService: DistrictService,
    private stateService: StateService,
    private subdivisionService: SubdivisionService,
    private regionService: RegionService,
  ) {
    let loggedInUser: any = localStorage.getItem('isAuthorised');
    this.loggedInUserObject = JSON.parse(loggedInUser);

    this.dataService.fromAndToDate$.subscribe((value) => {
      if (value) {
        let fromAndToDates = JSON.parse(value);
        this.previousWeekWeeklyStartDate = fromAndToDates.fromDate;
        this.previousWeekWeeklyendDate = fromAndToDates.toDate;
      }
    });

    this.dataService.selectdatamode$.subscribe((value) => {
      if (value) {
        let mode = JSON.parse(value);
        this.selecteddatamode = mode.selecteddatamode;
      }
    });
  }

  // ─── Panel helpers ───────────────────────────────────────────────────────────

  private getTodayStr(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  openCoveragePanel(type: PanelType): void {
    const titles: Record<PanelType, string> = {
      district: 'District — Station Coverage',
      state:    'State — District Coverage',
      subdivision: 'Subdivision — District Coverage',
      region:   'Region — Coverage Summary',
    };
    this.activePanelType = type;
    this.coveragePanelTitle = titles[type];
    this.coverageTableData = [];
    this.coverageChart = null;
    this.fetchCoverageData(type);
  }

  closeCoveragePanel(): void {
    this.activePanelType = null;
    this.coverageTableData = [];
    this.coverageChart = null;
  }

  async fetchCoverageData(type: PanelType): Promise<void> {
    this.isCoverageLoading = true;
    const today = this.getTodayStr();
    const payload = {
      startDate: this.previousWeekWeeklyStartDate || today,
      endDate:   this.previousWeekWeeklyendDate   || today,
    };

    try {
      let response: any;
      switch (type) {
        case 'district':
          response = await this.districtService.fetchDistrictStationCount(payload).toPromise();
          break;
        case 'state':
          response = await this.stateService.fetchStateDistrictCount(payload).toPromise();
          break;
        case 'subdivision':
          response = await this.subdivisionService.fetchSubDivisionDistrictCount(payload).toPromise();
          break;
        case 'region':
          response = await this.regionService.fetchRegionCoverageCount(payload).toPromise();
          break;
      }

      if (response?.success && response.data) {
        this.coverageTableData = Array.isArray(response.data) ? response.data : [response.data];
        this.buildCoverageChart(type);
      } else {
        this.coverageTableData = [];
      }
    } catch (err) {
      console.error('Coverage fetch error:', err);
      this.coverageTableData = [];
    } finally {
      this.isCoverageLoading = false;
    }
  }

  buildCoverageChart(type: PanelType): void {
    const data = this.coverageTableData;
    if (!data || data.length === 0) return;

    let pieData: { name: string; y: number; color: string }[] = [];
    let chartTitle = '';

    if (type === 'district') {
      // Group by region_name, sum station_count
      const regionMap: Record<string, number> = {};
      for (const row of data) {
        const key = row.region_name || 'Unknown';
        regionMap[key] = (regionMap[key] || 0) + Number(row.station_count || 0);
      }
      pieData = Object.entries(regionMap).map(([name, y], i) => ({
        name, y, color: REGION_COLORS[i % REGION_COLORS.length]
      }));
      chartTitle = 'Stations by Region';
    } else if (type === 'state') {
      // One slice per state sized by district_count
      pieData = data.map((row: any, i: number) => ({
        name: row.state_name || 'Unknown',
        y: Number(row.district_count || 0),
        color: REGION_COLORS[i % REGION_COLORS.length],
      }));
      chartTitle = 'Districts Covered by State';
    } else if (type === 'subdivision') {
      // Group by region_name, sum district_count
      const regionMap: Record<string, number> = {};
      for (const row of data) {
        const key = row.region_name || 'Unknown';
        regionMap[key] = (regionMap[key] || 0) + Number(row.district_count || 0);
      }
      pieData = Object.entries(regionMap).map(([name, y], i) => ({
        name, y, color: REGION_COLORS[i % REGION_COLORS.length]
      }));
      chartTitle = 'Districts Covered by Region';
    } else if (type === 'region') {
      // One slice per region sized by district_count
      pieData = data.map((row: any, i: number) => ({
        name: row.region_name || 'Unknown',
        y: Number(row.district_count || 0),
        color: REGION_COLORS[i % REGION_COLORS.length],
      }));
      chartTitle = 'Districts Covered by Region';
    }

    pieData = pieData.filter(d => d.y > 0);
    if (pieData.length === 0) return;

    this.coverageChart = new Chart({
      chart: { type: 'pie', height: 280 },
      title: {
        text: chartTitle,
        style: { fontSize: '13px', color: '#002467', fontWeight: '700' }
      },
      tooltip: {
        pointFormat: '<b>{point.name}</b>: {point.y} ({point.percentage:.1f}%)'
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: { enabled: true, format: '<b>{point.name}</b>: {point.y}', style: { fontSize: '10px' } }
        }
      },
      credits: { enabled: false },
      series: [{ type: 'pie', name: 'Count', data: pieData }]
    } as any);
  }
}
