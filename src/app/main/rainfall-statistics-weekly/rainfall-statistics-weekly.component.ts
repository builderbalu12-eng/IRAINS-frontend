import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { DataService } from "src/app/data.service";
import { StateDownloadStatistics } from "src/app/services/state/statisticsdownload.service";
import { DownloadPdf } from "src/app/services/district/pdfdownload.service";
import { SubdivDownloadStatistics } from "src/app/services/subDivision/statisticsdownload.service";
import { CountryDownloadStatistics } from "src/app/services/country/pdfStatisticsDownloadCountry.service";
import { RegionDownloadStatistics } from "src/app/services/region/downloadStatisticsRegion.service";
import { MapDataScheduleService } from "src/app/services/mapDataSchedule.service";

@Component({
  selector: "app-rainfall-statistics-weekly",
  templateUrl: "./rainfall-statistics-weekly.component.html",
  styleUrls: ["./rainfall-statistics-weekly.component.css"],
})
export class RainfallStatisticsWeeklyComponent implements OnInit {
  category: string = "STATE"; // Default category
  selectedCategory: string = "STATE"; // Track selected category
  selectedWeek: string | undefined;
  months: {
    name: string;
    weeks: { label: string; range: string; displayRange: string }[];
  }[] = [];
  loading: boolean = false;
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
    private router: Router, // Inject Router to navigate programmatically
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
      this.selectedCategory = data["category"]; // Ensure dropdown is updated
    });

    this.initEffectiveWeeksAndLoad();
  }

  // Effective "latest completed week" boundary: weeks ending today or later
  // only count as completed once this role's data is published — otherwise
  // the most recent completed week is one week further back. Same held-back
  // rule as the daily rainfall-statistics page (front-page.component.ts).
  private initEffectiveWeeksAndLoad(): void {
    const proceed = (effectiveDate: Date, reason: string) => {
      console.log(`[rainfall-statistics-weekly] effective boundary date = ${this.formatDate(effectiveDate)} (${reason})`);
      this.generateWeeklyOptions(effectiveDate);
      this.selectMostRecentWeek();
      this.submit();
    };

    const loggedInUser: any = localStorage.getItem("isAuthorised");
    const loggedInUserObject = loggedInUser ? JSON.parse(loggedInUser) : null;
    const role = loggedInUserObject?.data?.[0]?.mcorhq;

    if (role) {
      this.mapDataScheduleService.getSchedule(role).subscribe({
        next: (res) => {
          const published = res?.publish === 1;
          const effective = new Date();
          if (!published) {
            effective.setDate(effective.getDate() - 1);
          }
          proceed(effective, published ? 'published' : 'held back — not yet published');
        },
        error: () => {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          proceed(yesterday, 'schedule lookup failed');
        },
      });
    } else {
      proceed(new Date(), 'no role found — showing today');
    }
  }

  private selectMostRecentWeek(): void {
    for (let i = this.months.length - 1; i >= 0; i--) {
      const month = this.months[i];
      if (month?.weeks?.length) {
        this.selectedWeek = month.weeks[month.weeks.length - 1].range;
        return;
      }
    }
    this.selectedWeek = undefined;
  }

  // Method to handle category change
  onCategoryChange(category: string) {
    this.selectedCategory = category;

    // Navigate to the route based on selected category
    switch (category) {
      case "STATE":
        this.router.navigate(["/weekly-state-rf-distribution"]);
        break;
      case "SUBDIVISION":
        this.router.navigate(["/weekly-subdivision-rf-distribution"]);
        break;
      case "DISTRICT":
        this.router.navigate(["/weekly-district-rf-distribution"]);
        break;
      case "REGION":
        this.router.navigate(["/weekly-homogenous-rf-distribution"]);
        break;
      case "COUNTRY":
        this.router.navigate(["/weekly-country-rf-distribution"]);
        break;
      default:
        break;
    }
  }

  generateWeeklyOptions(effectiveDate: Date = new Date()) {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];

    const currentYear = new Date().getFullYear(); // Get the current year
    const startDate = new Date(currentYear, 0, 1); // January 1 of the current year
    const endDate = new Date(currentYear, 11, 31); // December 31 of the current year

    this.months = [];
    let currentDate = startDate;
    while (currentDate <= endDate) {
      if (currentDate.getDay() === 4) {
        // Thursday
        let startOfWeek = new Date(currentDate);
        let endOfWeek = new Date(currentDate);
        endOfWeek.setDate(endOfWeek.getDate() + 6);

        // Only add weeks that are completed as of the effective (held-back-aware) date
        if (endOfWeek <= effectiveDate) {
          let monthIndex = startOfWeek.getMonth();
          let weekRange = `${this.formatDate(startOfWeek)} - ${this.formatDate(
            endOfWeek
          )}`;
          let weekRangeForDisplay = `${this.formatDateForDisplay(
            startOfWeek
          )} - ${this.formatDateForDisplay(endOfWeek)}`;

          if (!this.months[monthIndex]) {
            this.months[monthIndex] = {
              name: monthNames[monthIndex],
              weeks: [],
            };
          }

          let weekNumber = this.months[monthIndex].weeks.length + 1;
          let weekLabel = `Week ${weekNumber}`;
          this.months[monthIndex].weeks.push({
            label: weekLabel,
            range: weekRange,
            displayRange: weekRangeForDisplay,
          });
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero based
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  }

  formatDateForDisplay(date: Date): string {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  async submit() {
    if (!this.selectedWeek) {
      alert("No week selected");
      return;
    }

    this.loading = true;
    this.showTable = false;

    const [fromDate, toDate] = this.selectedWeek.split(" - ");
    this.dataService.setfromAndToDate(JSON.stringify({ fromDate, toDate }));

    try {
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
    } catch (error) {
      console.error("Error fetching statistics", error);
    } finally {
      this.loading = false;
    }
  }

  async downloadReport() {
    if (!this.selectedWeek) {
      alert("No week selected");
      return;
    }

    const [fromDate, toDate] = this.selectedWeek.split(" - ");
    this.dataService.setfromAndToDate(JSON.stringify({ fromDate, toDate }));

    this.downloading = true;
    try {
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
    } catch (error) {
      console.error("Error downloading statistics", error);
    } finally {
      this.downloading = false;
    }
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
}
