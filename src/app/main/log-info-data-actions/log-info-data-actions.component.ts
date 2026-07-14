
import { Component, OnInit } from '@angular/core';
import { FetchStationDataService } from 'src/app/services/station/station.service';
@Component({
  selector: 'app-log-info-data-actions',
  templateUrl: './log-info-data-actions.component.html',
  styleUrls: ['./log-info-data-actions.component.css']
})
export class LogInfoDataActionsComponent implements OnInit {
  stationData: any[] = [];
  today = new Date().toISOString().slice(0, 10);
  fromDate = this.today;
  loading = false;
  error = '';

  constructor(
    private fetchStationDataService: FetchStationDataService,
  ) {}

  ngOnInit(): void {
    this.fetchActionData();
  }

  setFromAndToDate(): void {
    this.fetchActionData();
  }

  fetchActionData(): void {
    this.loading = true;
    this.error = '';
    this.fetchStationDataService.fetchActionData(this.fromDate).subscribe({
      next: (response) => {
        this.stationData = response?.data ?? [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load action logs. Please try again.';
        this.stationData = [];
        this.loading = false;
      },
    });
  }

  goBack() {
    window.history.back();
  }

}