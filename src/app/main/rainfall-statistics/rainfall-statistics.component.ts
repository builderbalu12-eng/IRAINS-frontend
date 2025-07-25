import { Component, Input, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { DataService } from "src/app/data.service";
import { CountryDownloadStatistics } from "src/app/services/country/pdfStatisticsDownloadCountry.service";
import { DownloadPdf } from "src/app/services/district/pdfdownload.service";
import { RegionDownloadStatistics } from "src/app/services/region/downloadStatisticsRegion.service";
import { StateDownloadStatistics } from "src/app/services/state/statisticsdownload.service";
import { SubdivDownloadStatistics } from "src/app/services/subDivision/statisticsdownload.service";

@Component({
  selector: "app-rainfall-statistics",
  templateUrl: "./rainfall-statistics.component.html",
  styleUrls: ["./rainfall-statistics.component.css"],
})
export class RainfallStatisticsComponent implements OnInit {
  @Input() category: any;
  fromDate: Date = new Date();
  toDate: Date = new Date();
  loading: boolean = false; // Variable to track loading st ate

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private stateStatisticsService: StateDownloadStatistics,
    private districtsStatisticsService: DownloadPdf,
    private subdivisionStatisticsService: SubdivDownloadStatistics,
    private countryStatisticsService: CountryDownloadStatistics,
    private regionStatisticsService: RegionDownloadStatistics
  ) {}

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      this.category = data["category"];
    });
  }

  async setFromAndToDateAndView() {
    let data = {
      fromDate: this.fromDate,
      toDate: this.toDate,
    };

    this.dataService.setfromAndToDate(
      JSON.stringify({
        fromDate: this.fromDate,
        toDate: this.toDate,
      })
    );

    this.loading = true; // Start loading
    // console.log("line 47 called", this.fromDate, this.toDate);

    if (this.category == "STATE") {
      await this.stateStatisticsService.updateandViewpdfFromDataEntry();
      this.loading = false; // Stop loading when data is loaded
    } else if (this.category == "SUBDIVISION") {
      await this.subdivisionStatisticsService.updateandViewpdfFromDataEntry();
      this.loading = false; // Stop loading when data is loaded
      // Handle other categories
    } else if (this.category == "DISTRICT") {
      await this.districtsStatisticsService.updateandViewpdfFromDataEntry();
      this.loading = false; // Stop loading when data is loaded
      // Handle other categories
    } else if (this.category == "COUNTRY") {
      await this.countryStatisticsService.updateandViewpdfFromDataEntry();
      this.loading = false; // Stop loading when data is loaded
      // Handle other categories
    } else if (this.category == "REGION") {
      this.regionStatisticsService.updateandViewpdfFromDataEntry();
      this.loading = false; // Stop loading when data is loaded
    }
  }

  validateDateRange() {
    var fromDate = this.fromDate;
    var toDate = this.toDate;

    if (fromDate > toDate) {
      alert("From date cannot be greater than To date");
      this.fromDate = toDate;
    }
  }
}
