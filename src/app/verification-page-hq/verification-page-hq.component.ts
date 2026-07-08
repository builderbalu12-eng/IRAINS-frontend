import { Component } from '@angular/core';
import { DataService } from '../data.service';
import { VerificationHq } from '../services/verification/verificationHq.service';
import { DataEntryService } from '../services/dataEntry/dataEntry.service';
import { DataEntryLockService } from '../services/dataEntryLock.service';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

@Component({
  selector: 'app-verification-page-hq',
  templateUrl: './verification-page-hq.component.html',
  styleUrls: ['./verification-page-hq.component.css']
})
export class VerificationPageHQComponent {
  // === CORE STATE ===
  isLoading: boolean = false;
  filteredMCorRMCSArray: any[] = [];
  filteredMCorRMCS: any = {};
  dataToDisplay: any[] = [];
  filteredStations: any[] = [];
  selectedDate: string = this.formatDate(new Date());
  showIsUpdatesTable: boolean = false;
  showIsNotUpdatesTable: boolean = false;
  showIsVerifiedTable: boolean = false;
  showIsNotVerifiedTable: boolean = false;
  showTotalStationsTable: boolean = false;
  todayDate: string;
  existingstationdata: any[] = [];
  bottom_section: boolean = false;
  SortOrder: boolean = false;
  masterStationIds: any = {};
  currentSubmitType: string = '';
  currentSubmitMCorRMCName: string = '';
  fetcheddata: any;
  loggedInUser: any;
  currentUserType: any;
  devationStatus: any;
  isVerificationLoading: boolean = false;
  isVerifiactionButtonClicked: boolean = false;
  EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
  isDataEntryLocked: boolean = false;

  // === TABS & CUMULATIVE ===
  activeTab: 'daily' | 'cumulative' = 'daily';
  cumulativeData: any[] = [];
  cumulativeStartDate: string = this.formatDate(new Date());
  cumulativeEndDate: string = this.formatDate(new Date());

  // === TRANSPOSED DATA ===
  transposedCumulativeData: any[] = [];
  dateHeaders: string[] = [];

  // === COLUMN VISIBILITY (NEW) ===
  visibleColumns: ('updated' | 'notUpdated' | 'verified' | 'notVerified')[] = [
    'updated', 'notUpdated', 'verified', 'notVerified'
  ];

  constructor(
    private dataService: DataService,
    private verificationhq: VerificationHq,
    private dataEntryService: DataEntryService,
    private dataEntryLockService: DataEntryLockService
  ) {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    this.todayDate = `${yyyy}-${mm}-${dd}`;

    this.loggedInUser = localStorage.getItem("isAuthorised");
    const obj = JSON.parse(this.loggedInUser);
    this.currentUserType = obj.data[0].userid;
  }

  ngOnInit(): void {
    this.loadDailyData();
    this.dataEntryLockService.loadLock().subscribe({
      next: (res) => { this.isDataEntryLocked = res.is_locked === 1; },
      error: () => { this.isDataEntryLocked = false; }
    });
  }

  // === UTILITIES ===
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  get grandTotal() {
    return this.filteredMCorRMCSArray.reduce((acc, item) => ({
      Total_Stations: acc.Total_Stations + item.data.Total_Stations,
      isUpdated:      acc.isUpdated      + item.data.isUpdated,
      isNotUpdated:   acc.isNotUpdated   + item.data.isNotUpdated,
      isVerified:     acc.isVerified     + item.data.isVerified,
      isNotVerified:  acc.isNotVerified  + item.data.isNotVerified,
    }), { Total_Stations: 0, isUpdated: 0, isNotUpdated: 0, isVerified: 0, isNotVerified: 0 });
  }

  // === trackBy for *ngFor performance ===
  trackByMc(index: number, row: any): string {
    return row.mc;
  }

  // === TAB: DAILY ===
  loadDailyData() {
    this.activeTab = 'daily';
    this.selectedDate = this.formatDate(new Date());
    this.backend();
  }

  // === TAB: CUMULATIVE ===
  async loadCumulativeData() {
    if (!this.cumulativeStartDate || !this.cumulativeEndDate) {
      alert("Please select both start and end date");
      return;
    }
    if (this.cumulativeStartDate > this.cumulativeEndDate) {
      alert("Start date cannot be after end date");
      return;
    }

    this.activeTab = 'cumulative';
    this.isLoading = true;
    try {
      const response = await this.verificationhq
        .fetchCentreStationSummary(this.cumulativeStartDate, this.cumulativeEndDate)
        .toPromise();

      this.cumulativeData = response.data || [];
      this.transformCumulativeData();
    } catch (err) {
      console.error("Cumulative API Error:", err);
      alert("Failed to load cumulative data");
      this.cumulativeData = [];
      this.transposedCumulativeData = [];
      this.dateHeaders = [];
    } finally {
      this.isLoading = false;
    }
  }

  // === TRANSPOSE CUMULATIVE DATA (NO ROW FILTERING) ===
  transformCumulativeData() {
    const map = new Map<string, any>();

    this.cumulativeData.forEach(item => {
      const mc = item['MC or RMC'];
      const date = item['DATE'];

      if (!map.has(mc)) {
        map.set(mc, { mc, total: item['TOTAL STATIONS'] });
      }

      const obj = map.get(mc);
      obj[date] = {
        updated: item['UPDATED STATIONS'],
        notUpdated: item['NOT UPDATED STATIONS'],
        verified: item['VERIFIED STATIONS'],
        notVerified: item['NOT VERIFIED STATIONS']
      };
    });

    this.transposedCumulativeData = Array.from(map.values());
    this.dateHeaders = [...new Set(this.cumulativeData.map(d => d['DATE']))].sort();

    // Reset to show all columns initially
    this.visibleColumns = ['updated', 'notUpdated', 'verified', 'notVerified'];
  }

  // === COLUMN FILTER (NEW) ===
  setCumulativeFilter(filter: 'all' | 'updated' | 'notUpdated' | 'verified' | 'notVerified') {
    if (filter === 'all') {
      this.visibleColumns = ['updated', 'notUpdated', 'verified', 'notVerified'];
    } else {
      this.visibleColumns = [filter];
    }
  }

  // Helper to get column label
  getColumnLabel(col: string): string {
    const labels: { [key: string]: string } = {
      updated: 'Updated',
      notUpdated: 'Not Updated',
      verified: 'Verified',
      notVerified: 'Not Verified'
    };
    return labels[col];
  }

  // === DAILY DATA LOGIC ===
  backend(): Promise<void> {
    this.filteredMCorRMCS = {};
    this.filteredStations = [];
    this.filteredMCorRMCSArray = [];
    this.isLoading = true;

    return new Promise((resolve, reject) => {
      this.verificationhq.fetchStationDataForDataEntry(this.selectedDate).subscribe(
        (response) => {
          this.fetcheddata = response.data || [];
          this.buildMCSummary();
          this.filteredMCorRMCSArray = Object.keys(this.filteredMCorRMCS).map(key => ({
            name: key,
            data: this.filteredMCorRMCS[key]
          }));
          this.isLoading = false;
          resolve();
        },
        (err) => {
          console.error(err);
          this.isLoading = false;
          reject(err);
        }
      );
    });
  }

  private buildMCSummary() {
    for (let i = 0; i < this.fetcheddata.length; i++) {
      const mc = this.fetcheddata[i]['centre_type'] + ' ' + this.fetcheddata[i]['centre_name'];
      if (!this.filteredMCorRMCS[mc]) {
        this.filteredMCorRMCS[mc] = {
          Total_Stations: 0,
          isUpdated: 0,
          isNotUpdated: 0,
          isVerified: 0,
          isNotVerified: 0
        };
      }
      this.filteredMCorRMCS[mc]['Total_Stations'] += 1;

      const isUpdated = this.fetcheddata[i].data !== -999.9;
      const isVerified = isUpdated && this.fetcheddata[i].is_verified === 1;

      if (isUpdated) {
        this.filteredMCorRMCS[mc]['isUpdated'] += 1;
        if (isVerified) {
          this.filteredMCorRMCS[mc]['isVerified'] += 1;
        } else {
          this.filteredMCorRMCS[mc]['isNotVerified'] += 1;
        }
      } else {
        this.filteredMCorRMCS[mc]['isNotUpdated'] += 1;
      }
    }
  }

  // === TABLE DISPLAY LOGIC ===
  submit(type: string, MCorRMCName: string) {
    this.isVerifiactionButtonClicked = true;
    this.currentSubmitType = type;
    this.currentSubmitMCorRMCName = MCorRMCName;

    this.showIsUpdatesTable = type === 'isUpdated';
    this.showIsNotUpdatesTable = type === 'isNotUpdated';
    this.showIsVerifiedTable = type === 'isVerified';
    this.showIsNotVerifiedTable = type === 'isNotVerified';
    this.showTotalStationsTable = type === 'totalStations';

    this.dataToDisplay = [];

    if (type === 'isUpdated') this.onIsUpdatedSubmit(MCorRMCName);
    if (type === 'isNotUpdated') this.onIsNotUpdatedSubmit(MCorRMCName);
    if (type === 'isVerified') this.onIsVerifiedSubmit(MCorRMCName);
    if (type === 'isNotVerified') this.onIsNotVerifiedSubmit(MCorRMCName);
    if (type === 'totalStations') this.onTotalStationsSubmit(MCorRMCName);

    this.bottom_section = true;
  }

  onIsUpdatedSubmit(MCorRMCName: string) {
    let index = 1;
    for (let i = 0; i < this.fetcheddata.length; i++) {
      const mc = this.fetcheddata[i]['centre_type'] + ' ' + this.fetcheddata[i]['centre_name'];
      if (mc === MCorRMCName && this.fetcheddata[i].data !== -999.9) {
        this.dataToDisplay.push({
          SNo: index++,
          district: this.fetcheddata[i].district_name,
          stationname: this.fetcheddata[i].station_name,
          stationid: this.fetcheddata[i].station_code,
          rainfall: this.fetcheddata[i].data,
          status: 'Updated'
        });
      }
    }
  }

  onIsNotUpdatedSubmit(MCorRMCName: string) {
    let index = 1;
    for (let i = 0; i < this.fetcheddata.length; i++) {
      const mc = this.fetcheddata[i]['centre_type'] + ' ' + this.fetcheddata[i]['centre_name'];
      if (mc === MCorRMCName && this.fetcheddata[i].data === -999.9) {
        this.dataToDisplay.push({
          SNo: index++,
          statename: this.fetcheddata[i].state_name,
          district: this.fetcheddata[i].district_name,
          stationname: this.fetcheddata[i].station_name,
          stationid: this.fetcheddata[i].station_code,
          rainfall: this.fetcheddata[i].data,
          status: 'Not Updated'
        });
      }
    }
  }

  onIsVerifiedSubmit(MCorRMCName: string) {
    let index = 1;
    for (let i = 0; i < this.fetcheddata.length; i++) {
      const mc = this.fetcheddata[i]['centre_type'] + ' ' + this.fetcheddata[i]['centre_name'];
      if (
        mc === MCorRMCName &&
        this.fetcheddata[i].is_verified === 1 &&
        this.fetcheddata[i].data !== -999.9
      ) {
        this.dataToDisplay.push({
          SNo: index++,
          district: this.fetcheddata[i].district_name,
          stationname: this.fetcheddata[i].station_name,
          stationid: this.fetcheddata[i].station_code,
          rainfall: this.fetcheddata[i].data,
          verifiedTime: this.formatDate(new Date(this.fetcheddata[i].verified_at)),
          status: 'Verified'
        });
      }
    }
  }

  onIsNotVerifiedSubmit(MCorRMCName: string) {
    let index = 1;
    for (let i = 0; i < this.fetcheddata.length; i++) {
      const mc = this.fetcheddata[i]['centre_type'] + ' ' + this.fetcheddata[i]['centre_name'];
      if (
        mc === MCorRMCName &&
        this.fetcheddata[i].is_verified === 0 &&
        this.fetcheddata[i].data !== -999.9
      ) {
        this.dataToDisplay.push({
          SNo: index++,
          district: this.fetcheddata[i].district_name,
          stationname: this.fetcheddata[i].station_name,
          stationid: this.fetcheddata[i].station_code,
          rainfall: this.fetcheddata[i].data,
          status: 'Not Verified'
        });
      }
    }
  }

  onTotalStationsSubmit(MCorRMCName: string) {
    let index = 1;
    for (let i = 0; i < this.fetcheddata.length; i++) {
      const mc = this.fetcheddata[i]['centre_type'] + ' ' + this.fetcheddata[i]['centre_name'];
      if (mc === MCorRMCName) {
        const isUpdated = this.fetcheddata[i].data !== -999.9;
        const isVerified = isUpdated && this.fetcheddata[i].is_verified === 1;
        this.dataToDisplay.push({
          SNo: index++,
          statename: this.fetcheddata[i].state_name,
          district: this.fetcheddata[i].district_name,
          stationname: this.fetcheddata[i].station_name,
          stationid: this.fetcheddata[i].station_code,
          rainfall: this.fetcheddata[i].data,
          status: !isUpdated ? 'Not Updated' : isVerified ? 'Verified' : 'Updated'
        });
      }
    }
  }

  resetRainfallInTotal(station: any) {
    station.rainfall = -999.9;
    this.updateRainfallValueData(station.stationid, -999.9, station.SNo);
  }

  // === SORTING ===
  sort(list: any[], key: string) {
    this.SortOrder = !this.SortOrder;
    return list.sort((a, b) => {
      const A = a[key], B = b[key];
      if (typeof A === "number" && typeof B === "number") {
        return this.SortOrder ? B - A : A - B;
      } else {
        return this.SortOrder ? B.localeCompare(A) : A.localeCompare(B);
      }
    });
  }

  // === RAINFALL UPDATE ===
  async updateRainfallValueData(stationid: any, rainfall: any, serialNo: any) {
    this.isLoading = true;
    const data = { station_code: +stationid, date: this.selectedDate, value: +rainfall };
    try {
      await this.dataEntryService.updateRainfallValue(data).toPromise();

      // Update fetcheddata in-place — no full page rebuild
      const idx = this.fetcheddata.findIndex((s: any) => +s.station_code === +stationid);
      if (idx !== -1) this.fetcheddata[idx].data = +rainfall;

      // Refresh only the top summary counts
      this.filteredMCorRMCS = {};
      this.buildMCSummary();
      this.filteredMCorRMCSArray = Object.keys(this.filteredMCorRMCS).map(key => ({
        name: key, data: this.filteredMCorRMCS[key]
      }));

      // Update only the edited row's status in the bottom table
      const row = this.dataToDisplay.find((s: any) => +s.stationid === +stationid);
      if (row) {
        row.rainfall = +rainfall;
        const src = idx !== -1 ? this.fetcheddata[idx] : null;
        if (+rainfall === -999.9) {
          row.status = 'Not Updated';
        } else if (src?.is_verified === 1) {
          row.status = 'Verified';
        } else {
          row.status = 'Updated';
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  showMessage(elementRef: any) {
    const value = elementRef.value.trim();
    const regex = /^\d+(\.\d)?$/;
    if (!regex.test(value)) {
      elementRef.style.background = 'red';
    } else if (Number(value) > 400) {
      elementRef.style.background = 'red';
      alert("Rainfall is greater than 400mm");
    } else {
      elementRef.style.background = '';
    }
  }

  // === VERIFICATION ===
  selectedStations: number[] = [];

  toggleSelection(station: any) {
    const id = Number(station.stationid);
    if (station.selected) {
      this.selectedStations.push(id);
    } else {
      this.selectedStations = this.selectedStations.filter(sid => sid !== id);
    }
  }

  async VerifySelected() {
    if (this.selectedStations.length === 0) {
      alert("Please select at least one station to verify.");
      return;
    }
    if (confirm("Do you want to verify the selected stations?")) {
      this.isLoading = true;
      const data = {
        date: this.selectedDate,
        station_ids: this.selectedStations,
        userid: +this.currentUserType
      };
      try {
        await this.verificationhq.verifyAll(data).toPromise();
        alert("Selected stations verified successfully");
        await this.backend();
        this.dataToDisplay.forEach(s => {
          if (this.selectedStations.includes(Number(s.stationid))) s.status = 'Verified';
        });
        this.selectedStations = [];
      } catch (err) {
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    }
  }

  async Verifyall() {
    if (this.dataToDisplay.length === 0) {
      alert("No stations available to verify.");
      return;
    }
    if (confirm("Do you want to verify all stations?")) {
      this.isLoading = true;
      const allIds = this.dataToDisplay.map(s => Number(s.stationid));
      const data = { date: this.selectedDate, station_ids: allIds, userid: +this.currentUserType };
      try {
        await this.verificationhq.verifyAll(data).toPromise();
        alert("All stations verified successfully");
        await this.backend();
        this.dataToDisplay.forEach(s => s.status = 'Verified');
      } catch (err) {
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    }
  }

  // === EXCEL EXPORTS (UPDATED TO RESPECT VISIBLE COLUMNS) ===
  exportToExcel(): void {
    if (!this.filteredMCorRMCSArray || this.filteredMCorRMCSArray.length === 0) {
      alert('No data to export!');
      return;
    }
    const exportData = this.filteredMCorRMCSArray.map((item, index) => ({
      'S. No': index + 1,
      'Date': this.selectedDate,
      'MC or RMC': item.name,
      'Total Stations': item.data.Total_Stations,
      'Updated Stations': item.data.isUpdated,
      'Not Updated Stations': item.data.isNotUpdated,
      'Verified Stations': item.data.isVerified,
      'Not Verified Stations': item.data.isNotVerified
    }));
    this.saveExcel(exportData, 'Daily_Stations_Data');
  }

  exportTransposedToExcel(): void {
    if (!this.transposedCumulativeData || this.transposedCumulativeData.length === 0) {
      alert('No data to export!');
      return;
    }
  
    const wsData: any[][] = [];
  
    // Header Row 1 - Date headers (merged across visible columns)
    const header1 = ['MC / RMC', 'Total'];
    this.dateHeaders.forEach(date => {
      header1.push(this.formatDateForExcel(date));
      // Add (visibleColumns.length - 1) empty cells for merging
      for (let i = 1; i < this.visibleColumns.length; i++) {
        header1.push('');
      }
    });
    wsData.push(header1);
  
    // Header Row 2 - Column type labels
    const header2 = ['', ''];
    this.dateHeaders.forEach(() => {
      this.visibleColumns.forEach(col => {
        header2.push(this.getColumnLabel(col));
      });
    });
    wsData.push(header2);
  
    // Data Rows
    this.transposedCumulativeData.forEach(row => {
      const dataRow = [row.mc, row.total || ''];
      this.dateHeaders.forEach(date => {
        const d = row[date] || {};
        this.visibleColumns.forEach(col => {
          dataRow.push(d[col] || '');
        });
      });
      wsData.push(dataRow);
    });
  
    // Create worksheet with merged cells for date headers
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Initialize !merges array if it doesn't exist (fixes TypeScript error)
    ws['!merges'] = ws['!merges'] || [];
    
    // Add merge ranges for date headers in first row
    this.dateHeaders.forEach((date, index) => {
      const startCol = 2 + (index * this.visibleColumns.length); // Start after MC/RMC and Total columns
      const endCol = startCol + this.visibleColumns.length - 1;
      ws['!merges']!.push({  // Use non-null assertion operator
        s: { r: 0, c: startCol },  // start row, start column
        e: { r: 0, c: endCol }      // end row, end column
      });
    });
  
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cumulative');
    XLSX.writeFile(wb, `Cumulative_Transposed_${this.cumulativeStartDate}_to_${this.cumulativeEndDate}.xlsx`);
  }
  
  

  private formatDateForExcel(dateStr: string): string {
    const [y, m, d] = dateStr.split('-');
    return `${d}-${m}-${y}`;
  }

  exportCumulativeToExcel(): void {
    if (!this.cumulativeData || this.cumulativeData.length === 0) {
      alert('No data to export!');
      return;
    }
    const exportData = this.cumulativeData.map((item, index) => ({
      'S. No': index + 1,
      'MC or RMC': item['MC or RMC'],
      'Date': item['DATE'],
      'Total Stations': item['TOTAL STATIONS'],
      'Updated Stations': item['UPDATED STATIONS'],
      'Not Updated Stations': item['NOT UPDATED STATIONS'],
      'Verified Stations': item['VERIFIED STATIONS'],
      'Not Verified Stations': item['NOT VERIFIED STATIONS']
    }));
    this.saveExcel(exportData, `Cumulative_${this.cumulativeStartDate}_to_${this.cumulativeEndDate}`);
  }

  private saveExcel(data: any[], filename: string) {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = { Sheets: { 'Data': ws }, SheetNames: ['Data'] };
    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: this.EXCEL_TYPE });
    FileSaver.saveAs(blob, `${filename}.xlsx`);
  }

  goBack() {
    window.history.back();
  }
}