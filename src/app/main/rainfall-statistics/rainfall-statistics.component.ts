import { Component, Input, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { DataService } from "src/app/data.service";
import { CountryDownloadStatistics } from "src/app/services/country/pdfStatisticsDownloadCountry.service";
import { DownloadPdf } from "src/app/services/district/pdfdownload.service";
import { RegionDownloadStatistics } from "src/app/services/region/downloadStatisticsRegion.service";
import { StateDownloadStatistics } from "src/app/services/state/statisticsdownload.service";
import { SubdivDownloadStatistics } from "src/app/services/subDivision/statisticsdownload.service";
import { MapDataScheduleService } from "src/app/services/mapDataSchedule.service";

@Component({
  selector: "app-rainfall-statistics",
  templateUrl: "./rainfall-statistics.component.html",
  styleUrls: ["./rainfall-statistics.component.css"],
})
export class RainfallStatisticsComponent implements OnInit {
  @Input() category: any;
  today: string = this.todayStr();
  fromDate: string = this.todayStr();
  toDate: string = this.todayStr();
  loading: boolean = false; // Variable to track loading state
  downloading: boolean = false;

  showTable: boolean = false;
  tableRows: any[][] = [];
  tableEntityLabel: string = 'Meteorological States';
  dayLabel: string = '';
  periodLabel: string = '';
  categoryStats: { day: Record<string, { count: number; area: number }>; period: Record<string, { count: number; area: number }> } | null = null;
  readonly categoryOrder = ['LE', 'E', 'N', 'D', 'LD', 'NR'];
  readonly categoryLabels: Record<string, string> = {
    LE: 'Large Excess', E: 'Excess', N: 'Normal',
    D: 'Deficient', LD: 'Large Deficient', NR: 'No Rain',
  };

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private stateStatisticsService: StateDownloadStatistics,
    private districtsStatisticsService: DownloadPdf,
    private subdivisionStatisticsService: SubdivDownloadStatistics,
    private countryStatisticsService: CountryDownloadStatistics,
    private regionStatisticsService: RegionDownloadStatistics,
    private mapDataScheduleService: MapDataScheduleService
  ) {}

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      this.category = data["category"];
    });
    this.initEffectiveDateAndLoad();
  }

  // Effective latest date: today if this role's data is published,
  // otherwise yesterday (today's data held back until published) —
  // same rule /all-maps uses (front-page.component.ts ngOnInit).
  private initEffectiveDateAndLoad(): void {
    const applyDate = (effectiveDate: Date, reason: string) => {
      const ds = this.todayStr(effectiveDate);
      console.log(`[rainfall-statistics] effective date = ${ds} (${reason})`);
      this.today = ds;
      this.fromDate = ds;
      this.toDate = ds;
      this.submit();
    };

    const loggedInUser: any = localStorage.getItem("isAuthorised");
    const loggedInUserObject = loggedInUser ? JSON.parse(loggedInUser) : null;
    const role = loggedInUserObject?.data?.[0]?.mcorhq;
    console.log(`[rainfall-statistics] resolved role = ${role ?? '(none — no isAuthorised.data[0].mcorhq)'}`);

    if (role) {
      this.mapDataScheduleService.getSchedule(role).subscribe({
        next: (res) => {
          console.log('[rainfall-statistics] map-data-schedule response:', res);
          const published = res?.publish === 1;
          const effective = new Date();
          if (!published) {
            effective.setDate(effective.getDate() - 1);
          }
          applyDate(effective, published ? 'published' : 'held back — not yet published');
        },
        // Schedule lookup failed — treat conservatively as held back rather
        // than silently showing today's (possibly unpublished) data.
        error: (err) => {
          console.error('[rainfall-statistics] map-data-schedule lookup failed, defaulting to held-back (yesterday):', err);
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          applyDate(yesterday, 'schedule lookup failed');
        },
      });
    } else {
      applyDate(new Date(), 'no role found — showing today');
    }
  }

  private todayStr(date: Date = new Date()): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  private syncSelectedDates() {
    this.dataService.setfromAndToDate(
      JSON.stringify({
        fromDate: this.fromDate,
        toDate: this.toDate,
      })
    );
  }

  async submit() {
    this.syncSelectedDates();

    this.loading = true; // Start loading
    this.showTable = false;

    if (this.category == "STATE") {
      await this.stateStatisticsService.updateandViewpdfFromDataEntry();
      this.populateTable('Meteorological States', this.stateStatisticsService, this.stateStatisticsService.buildCategoryStats());
    } else if (this.category == "SUBDIVISION") {
      await this.subdivisionStatisticsService.updateandViewpdfFromDataEntry();
      this.populateTable('Meteorological Subdivisions', this.subdivisionStatisticsService, this.subdivisionStatisticsService.buildCategoryStats());
    } else if (this.category == "DISTRICT") {
      await this.districtsStatisticsService.updateandViewpdfFromDataEntry();
      this.populateTable('Subdivision / UT / State / District', this.districtsStatisticsService, null);
    } else if (this.category == "COUNTRY") {
      await this.countryStatisticsService.updateandViewpdfFromDataEntry();
      this.populateTable('Country', this.countryStatisticsService, null);
    } else if (this.category == "REGION") {
      await this.regionStatisticsService.updateandViewpdfFromDataEntry();
      this.populateTable('Region', this.regionStatisticsService, null);
    }

    this.loading = false; // Stop loading when data is loaded
  }

  async downloadReport() {
    this.syncSelectedDates();
    this.downloading = true;

    if (this.category == "STATE") {
      await this.stateStatisticsService.updateanddownloadpdfFromDataEntry();
    } else if (this.category == "SUBDIVISION") {
      await this.subdivisionStatisticsService.updateanddownloadpdfFromDataEntry();
    } else if (this.category == "DISTRICT") {
      await this.districtsStatisticsService.updateanddownloadpdfFromDataEntry();
    } else if (this.category == "COUNTRY") {
      await this.countryStatisticsService.updateanddownloadpdfFromDataEntry();
    } else if (this.category == "REGION") {
      await this.regionStatisticsService.updateanddownloadpdfFromDataEntry();
    }

    this.downloading = false;
  }

  private populateTable(
    entityLabel: string,
    svc: { rows: any[][]; data: { startDate: string; endDate: string }; seasonPeriodDate: { startDate: string; endDate: string }; convertToIndianDateFormat: (dateString: string) => string },
    categoryStats: { day: Record<string, { count: number; area: number }>; period: Record<string, { count: number; area: number }> } | null
  ) {
    const convert = svc.convertToIndianDateFormat;
    this.tableEntityLabel = entityLabel;
    this.dayLabel = `${convert(svc.data.startDate)} to ${convert(svc.data.endDate)}`;
    this.periodLabel = `${convert(svc.seasonPeriodDate.startDate)} to ${convert(svc.seasonPeriodDate.endDate)}`;
    this.tableRows = svc.rows;
    this.categoryStats = categoryStats;
    this.showTable = this.tableRows.length > 0;
  }

  cellContent(cell: any): any {
    return cell && typeof cell === 'object' && 'content' in cell ? cell.content : cell;
  }

  cellStyle(cell: any): { [key: string]: string } {
    const fill = cell?.styles?.fillColor;
    if (Array.isArray(fill)) {
      return { 'background-color': `rgb(${fill[0]}, ${fill[1]}, ${fill[2]})` };
    }
    if (typeof fill === 'string') {
      return { 'background-color': fill };
    }
    return {};
  }

  validateDateRange() {
    if (this.fromDate > this.toDate) {
      alert("From date cannot be greater than To date");
      this.fromDate = this.toDate;
    }
  }
}
