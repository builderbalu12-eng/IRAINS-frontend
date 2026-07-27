import { Component, OnInit, ElementRef, ViewChild } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { MatSnackBar, MatSnackBarConfig } from "@angular/material/snack-bar";
import { getRegionService } from "src/app/services/region/getregion.service";
import { CenterService } from "src/app/services/centre/centre.service";
import { getStateService } from "src/app/services/state/getState.service";
import { getDistrictService } from "src/app/services/district/getdistrict.service";
import { DataService } from "../../data.service";
import * as XLSX from "xlsx";
import * as FileSaver from "file-saver";
import { FetchStationDataService } from "src/app/services/station/station.service";
import { DataEntryService } from "src/app/services/dataEntry/dataEntry.service";
import { DataEntryLockService } from "src/app/services/dataEntryLock.service";
import { MapDataScheduleService } from "src/app/services/mapDataSchedule.service";
import * as e from "express";

interface Region {
  region_name: string;
  region_code: string;
  label: string;
  value: string;
}

@Component({
  selector: "app-data-entry",
  templateUrl: "./data-entry.component.html",
  styleUrls: ["./data-entry.component.css"],
})
export class DataEntryComponent implements OnInit {
  @ViewChild("fileInput") fileInput!: ElementRef;
  @ViewChild("rainfallFileInput") rainfallFileInput!: ElementRef;
  selectedRegions: any[] = [];
  selectedStates: any[] = [];
  selectedMcs: any[] = [];
  selectedRMcs: any[] = [];
  selectedDistricts: any[] = [];
  tempfilteredStations: any[] = [];
  regionList: any[] = [];
  filteredMcs: any[] = [];
  filteredRMcs: any[] = [];
  filteredStates: any[] = [];
  filteredDistricts: any[] = [];
  filteredStations: any[] = [];
  selectedDate: Date = new Date();
  selectedFile: File | null = null;
  selectedRainfallFile: File | null = null;
  rainFallInMM: number = 0;
  todayDate: string;
  showEditPopup: boolean = false;
  showdeletePopup: boolean = false;
  previousstationid: any;
  editData: any = {
    stationname: "",
    stationid: "",

    center_type: "",
    center_name: "",

    dateTime: "",
    stationType: "",
    newOrOld: "",
    lat: "",
    lng: "",
    activationDate: "",
    editIndex: null,
    previousstationid: null,
  };
  deleteData: any = {
    stationname: "",
    stationid: "",
    editIndex: null,
  };
  mcdata = [
    {
      id: 101,
      name: "mc1",
    },
    {
      id: 101,
      name: "mc1",
    },
    {
      id: 101,
      name: "mc1",
    },
    {
      id: 101,
      name: "mc1",
    },
    {
      id: 101,
      name: "mc1",
    },
  ];

  showPopup: boolean = false;
  message: string | null = null;
  existingstationdata: any[] = [];
  data = {
    stationName: "",
    stationId: "",

    center_type: "",
    center_name: "",

    dateTime: new Date(),
    stationType: "aws",
    newOrOld: "new",
    lat: "",
    lng: "",
    activationDate: this.selectedDate,
  };
  minDate: string = "";
  isDataEntryLocked: boolean = false;
  restrictDays: number | null = null;
  showUploadResultPopup: boolean = false;
  uploadResultOk: boolean = true;
  uploadResultMessage: string = '';
  uploadResultUploadedDates: string[] = [];
  uploadResultSkippedDates: string[] = [];

  // ── Pre-upload confirmation (highest rainfall per date) ─────────────────
  private readonly rainfallSkipColumns = ["station_name", "centre_type", "station_id"];
  showPreUploadConfirmPopup: boolean = false;
  preUploadHighestByDate: { date: string; stationName: string; stationId: string; rainfall: number; hasData: boolean }[] = [];
  private pendingUploadJsonData: any[] = [];
  private pendingUploadedDateCols: string[] = [];
  private pendingSkippedDateCols: string[] = [];
  loggedInUserObject: any;
  emailGroups: any[] = [];
  emails: any[] = [];
  loggedInUser: any;
  currentUserType: any;
  currentUserName: any;
  regionName: any;
  currentUserMCorRMC: any;
  currentUserMCorRMCregion: any;

  // currentUserType:any;
  // loggedInUser: any;
  regions: any[] = []; // Array to hold region data fetched from API
  selectedRegion: any;
  centersMC: any[] = [];
  centersMC1: any[] = [];
  selectedMC: any;
  centersRMC: any[] = [];
  selectedRMC: any;
  centersRMC1: any[] = [];
  states: any[] = [];
  filterStates: any;
  selectedState: any;
  districts: any[] = [];
  filterDistrict: any;
  mcDisabled: boolean = false;
  rmcDisabled: boolean = false;

  selectedMCData: any[] = [];
  selectedRMCData: any[] = [];
  selectedStateData: any[] = [];
  selectedDistrictData: any[] = [];
  filteredData: any[] = [];

  StartDate: any;
  EndDate: any;

  stationData: any; // Variable to hold the fetched data
  isLoading: boolean = false;

  enteredDate: any;

  // Month view + edit (last 30 days from today are editable)
  viewMode: 'daily' | 'range' = 'daily';
  selectedMonth: string = '';
  maxMonth: string = '';
  rangeToDate: string = '';
  dateColumns: string[] = [];
  pivotedData: any[] = [];

  isEditing: boolean = false;
  currentItem: any = null; // To hold the item currently being edited
  successMessage: string | null = null; // Add this line to declare the success message variable
  originalValue: string = "";
  isUploading = false;
  isUpdating = false;
  officerId: any;
  isTableEmpty: boolean = true;
  currentUsernameToDisplay: any;
  maxDate: any;
  isSorting: boolean = false;

  constructor(
    private dataService: DataService,
    private regionService: getRegionService,
    private centerService: CenterService,
    private getStateService: getStateService,
    private getDistrictService: getDistrictService,
    private fetchStationDataService: FetchStationDataService,
    private stationService: FetchStationDataService,
    private dataEntryService: DataEntryService,
    private dataEntryLockService: DataEntryLockService,
    private mapDataScheduleService: MapDataScheduleService,
    private snackBar: MatSnackBar
  ) {
    let loggedInUser: any = localStorage.getItem("isAuthorised");
    this.loggedInUserObject = JSON.parse(loggedInUser);
    this.currentUserType = this.loggedInUserObject.data[0].mcorhq;
    this.currentUserName = this.loggedInUserObject.data[0].name.replace(
      /^\S+\s/,
      ""
    );
    this.currentUsernameToDisplay = this.currentUserName.toUpperCase()
    this.enteredDate = this.formatDate(new Date())

    if (this.currentUserType == "mc" || this.currentUserType == "rmc") {
      console.log('this.currentUserType, this.currentUserName',this.currentUserType, this.currentUserName);
      const regex = /^(RMC|MC)\s(\w+)/;
      const match = this.loggedInUserObject.data[0].name.match(regex);
      const extractedValue = match ? match[1] : ""; 


      this.centerService.fetchData(extractedValue).subscribe(
        (response) => {
          console.log("center detail", response);
          const regionCode = response.data.filter(
            (it: any) => it.centre_name == this.currentUserName.toUpperCase()
          );

          this.regionService.fetchData().subscribe(
            (response) => {
              this.regionName = response.data.filter(
                (it: any) => it.region_code == regionCode[0].region_code
              );
              this.regionName = this.regionName[0]?.region_name;
              // console.log('regionName', this.regionName)
            },
            (error) => {
              console.error("Error fetching region data:", error);
              alert("Data is not coming");
            }
          );

          this.getStateService.fetchData().subscribe((response) => {
            const filterState = response.data.filter(
              (id: any) => id.centre_name === this.currentUserName.toUpperCase()
            );
            console.log("filterState", filterState);
            this.filterStates = filterState.map((state: any) => ({
              state_name: state.state_name,
              state_code: state.state_code,
            }));

            console.log("filterStates", this.filterStates);

          });
        },
        (error) => {
          console.error("Error fetching center details:", error);
        }
      );
    }

    this.maxDate = this.formatDate(new Date());
    this.maxMonth = this.maxDate.slice(0, 7);
    this.selectedMonth = this.maxMonth;

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();

    this.todayDate = yyyy + "-" + mm + "-" + dd;
    // this.fetchRegionData();
  }


  showDialog() {
    const dialog = document.getElementById('dialogOverlay');
    if (dialog) {
      dialog.style.display = 'flex'; // Show the dialog box
    }
  }

  // Function to handle form submission
  submitOfficerId() {
    const officerIdInput = (document.getElementById('officerId') as HTMLInputElement).value.trim();
    if (officerIdInput) {
      this.officerId = officerIdInput;
      const dialog = document.getElementById('dialogOverlay');
      if (dialog) {
        dialog.style.display = 'none'; // Hide the dialog box
      }
    } else {
      alert('Please enter a valid Officer ID.');
    }
  }




  ngOnInit(): void {
    this.showDialog()
    this.dataEntryLockService.loadLock().subscribe({
      next: (res) => { this.isDataEntryLocked = res.is_locked === 1; },
      error: () => { this.isDataEntryLocked = false; }
    });
    this.enteredDate = new Date();
    this.loggedInUser = localStorage.getItem("isAuthorised");
    const obj = JSON.parse(this.loggedInUser);
    this.currentUserType = obj.data[0].mcorhq;
    console.log("currentUserType", this.currentUserType);
    // this.isInputDisabled = this.stationService.isAfterElevenAM();

    this.mapDataScheduleService.getSchedule(this.currentUserType).subscribe({
      next: (res) => {
        this.restrictDays = res.restrict_days;
        if (this.restrictDays != null) {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - this.restrictDays);
          this.minDate = this.formatDate(cutoff);
        } else {
          this.minDate = "";
        }
      },
      error: () => { this.restrictDays = null; }
    });

    this.fetchRegionData();
    this.getAllMCData();
    this.getAllRMCData();
    this.getAllStates();
    this.getAllDistricts();

    this.fetchStationData("");


  }

  getCurrentDate(): string {
    const currentDate = new Date();
    // Format date as yyyy-MM-dd (assuming you need it in this format)
    const formattedDate = currentDate.toISOString().slice(0, 10);
    return formattedDate;
  }

  onChangeDate(value: any) {
    this.selectedDate = value;
    this.clearRainfallFileInput();
  }

  onChangeRegion() {
    let tempMcs = this.existingstationdata.filter((item) => {
      return this.selectedRegions.some((value: any) => {
        return item.region == value.name;
      });
    });
    let tempfilteredMcs = Array.from(new Set(tempMcs.map((a) => a.rmc_mc)));
    this.selectedMcs = [];
    this.selectedRMcs = [];
    this.selectedStates = [];
    this.selectedDistricts = [];
    this.filteredMcs = [];
    tempfilteredMcs.forEach((m) => {
      if (m.split(" ")[0] == "MC") {
        this.filteredMcs.push({
          name: m,
        });
      }
    });

    this.filteredRMcs = [];
    tempfilteredMcs.forEach((m) => {
      if (m.split(" ")[0] == "RMC") {
        this.filteredRMcs.push({
          name: m,
        });
      }
    });
  }

  onChangeMc() {
    let tempStates = this.existingstationdata.filter((item) => {
      return this.selectedMcs.some((value: any) => {
        return item.rmc_mc == value.name;
      });
    });
    let tempfilteredStates = Array.from(
      new Set(tempStates.map((a) => a.state))
    );
    this.selectedStates = [];
    this.selectedDistricts = [];
    this.filteredStates = tempfilteredStates.map((a) => {
      return {
        name: a,
      };
    });
  }

  onChangeRMc() {
    let tempStates = this.existingstationdata.filter((item) => {
      return this.selectedRMcs.some((value: any) => {
        return item.rmc_mc == value.name;
      });
    });
    let tempfilteredStates = Array.from(
      new Set(tempStates.map((a) => a.state))
    );
    this.selectedStates = [];
    this.selectedDistricts = [];
    this.filteredStates = tempfilteredStates.map((a) => {
      return {
        name: a,
      };
    });
  }

  onChangeState() {
    let tempDistricts = this.existingstationdata.filter((item) => {
      return this.selectedStates.some((value: any) => {
        return item.state == value.name;
      });
    });
    let tempfilteredDistricts = Array.from(
      new Set(tempDistricts.map((a) => a.district))
    );
    this.selectedDistricts = [];
    this.filteredDistricts = tempfilteredDistricts.map((a) => {
      return {
        name: a,
      };
    });
  }

  onChangeDistrict() {
    let tempStations = this.existingstationdata.filter((item) => {
      return this.selectedDistricts.some((value: any) => {
        return item.district == value.name;
      });
    });
    this.tempfilteredStations = Array.from(
      new Set(tempStations.map((a) => a.station))
    );
  }

  shareCheckedList(item: any[]) {
    console.log(item);
  }
  shareIndividualCheckedList(item: any) {
    console.log(item);
  }

  goBack() {
    window.history.back();
  }

  dateCalculation() {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    let newDate = new Date(this.selectedDate);
    let dd = String(newDate.getDate());
    const year = newDate.getFullYear();
    const currmonth = months[newDate.getMonth()];
    const selectedYear = String(year).slice(-2);
    return `${dd.padStart(2, "0")}_${currmonth}_${selectedYear}`;
  }


  filterByDate() {
    console.log(
      this.selectedRegions,
      this.selectedMcs,
      this.selectedRMcs,
      this.selectedStates,
      this.selectedDistricts
    );
    if (this.tempfilteredStations && this.tempfilteredStations.length > 0) {
      this.filteredStations = this.existingstationdata.filter((item) => {
        return this.tempfilteredStations.some((value: any) => {
          return item.station == value;
        });
      });
    } else if (this.selectedStates && this.selectedStates.length > 0) {
      this.filteredStations = this.existingstationdata.filter((item) => {
        return this.selectedStates.some((value: any) => {
          return item.state == value.name;
        });
      });
    } else if (this.selectedMcs && this.selectedMcs.length > 0) {
      this.filteredStations = this.existingstationdata.filter((item) => {
        return this.selectedMcs.some((value: any) => {
          return item.rmc_mc == value.name;
        });
      });
    } else if (this.selectedRegions && this.selectedRegions.length > 0) {
      this.filteredStations = this.existingstationdata.filter((item) => {
        return this.selectedRegions.some((value: any) => {
          return item.region == value.name;
        });
      });
    }
    this.filteredStations.map((x) => {
      return (x.RainFall = x[this.dateCalculation()]);
    });
    // if(this.filteredStations.length > 0){
    // setTimeout(() => {
    // this.sendEmail();
    // }, 1000);
    // }
  }

  // editStation(station: any) {
  // this.showEditPopup = true;
  // this.editData.stationname = station.stationname,
  // this.editData.stationid = station.stationid,
  // this.editData.dateTime = this.selectedDate,
  // this.editData.stationType = station.stationtype,
  // this.editData.newOrOld = station.neworold,
  // this.editData.lat = station.lat,
  // this.editData.lng = station.lng,
  // this.editData.activationDate = station.activationdate,
  // this.editData.previousstationid = station.stationid
  // }
  editStation(station: any) {
    console.log(station);
    console.log(station.state_name);
    this.showEditPopup = true;

    (this.editData.stationname = station.station_name),
      (this.editData.stationid = station.station_code),
      (this.editData.center_name = station.centre_name),
      (this.editData.center_type = station.centre_type),
      (this.editData.dateTime = this.selectedDate),
      (this.editData.stationType = station.station_type),
      (this.editData.newOrOld = station.is_new_station.toString()),
      (this.editData.lat = station.latitude),
      (this.editData.lng = station.longitude),
      (this.editData.activationDate = station.activationdate),
      (this.editData.previousstationid = station.stationid);
    console.log("editStation clg", this.editData);
  }

  deleteStationdata(index: number): void {
    this.showdeletePopup = true;
    this.deleteData = {
      ...this.existingstationdata[index],
    };
  }

  // updateData() {
  // this.dataService.updateData(this.editData).subscribe({
  // next: response => {
  // this.fetchDataFromBackend();
  // console.log('Data updated successfully:', response);
  // },
  // error: err => console.error('Error updating data. Please check the console for details.', err)
  // });
  // this.showEditPopup = false;
  // }

  // deletestation() {
  // this.deleteData = {
  // stationname: this.deleteData.stationname,
  // stationid: this.deleteData.stationid,
  // editIndex: this.deleteData.editIndex,
  // };
  // this.dataService.deletestation(this.deleteData.stationid).subscribe({
  // next: response => {
  // let loggedInUser: any = localStorage.getItem("isAuthorised");
  // let parseloggedInUser = JSON.parse(loggedInUser);
  // let data = {
  // stationName: this.deleteData.stationname,
  // stationId: this.deleteData.stationid,
  // dateTime: new Date(),
  // userName: parseloggedInUser.data[0].name,
  // type: "Deleted"
  // }
  // this.dataService.addDeletedAndCreatedStationLogData(data).subscribe(res => {
  // console.log('Log created successfully:', response);
  // })
  // console.log('Data deleted successfully:', response);
  // },
  // error: err => console.error('Error deleted data. Please check the console for details.', err)
  // });
  // this.showdeletePopup = false;
  // }

  cancelEdit() {
    this.editData = {
      stationname: this.editData.stationname,
      stationid: this.editData.stationid,
      editIndex: this.editData.editIndex,
      previousstationid: this.editData.previousstationid,
    };
    this.showEditPopup = false;
  }
  canceldelete() {
    this.showdeletePopup = false;
  }
  Addstation() {
    this.showPopup = true;
  }
  cancelAddStation() {
    this.showPopup = false;
  }
  // addData() {
  // this.dataService.addData(this.data).subscribe({
  // next: response => {
  // let loggedInUser: any = localStorage.getItem("isAuthorised");
  // let parseloggedInUser = JSON.parse(loggedInUser);
  // let data = {
  // stationName: this.data.stationName,
  // stationId: this.data.stationId,
  // dateTime: new Date(),
  // userName: parseloggedInUser.data[0].name,
  // type: "Added"
  // }
  // this.dataService.addDeletedAndCreatedStationLogData(data).subscribe(res => {
  // console.log('Log created successfully:', response);
  // })
  // console.log('Data deleted successfully:', response);
  // this.message = response.message;
  // alert("Station added successfully");
  // },
  // error: err => console.error('Error adding data. Please check the console for details.', err)
  // });
  // this.showPopup = false;
  // }

  showMessage(elementRef: any) {
    const value = elementRef.value.trim();
    const regex = /^\d+(\.\d)?$|^\d+(\.\d)?$/;
    if (regex.test(value)) {
      elementRef.style.background = "";
    } else {
      elementRef.style.background = "red";
      // alert("Please enter a valid number with only one decimal place");
    }
    if (Number(elementRef.value) > 300) {
      elementRef.style.background = "red";
      alert("Rainfall is greater than 100mm");
    } else {
      elementRef.style.background = "";
    }
  }

  // submit() {
  // let data = {
  // date: this.dateCalculation(),
  // updatedstationdata: this.filteredStations
  // }
  // this.dataService.updateRainFallData(data).subscribe(res => {
  // alert("Updated")
  // this.fetchDataFromBackend();
  // })
  // }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  // uploadFile() {
  // if (this.selectedFile) {
  // this.dataService.uploadStationDataFile(this.selectedFile).subscribe(
  // (response: any) => {
  // alert('File uploaded successfully');
  // this.clearFileInput();
  // this.filterByDate();
  // },
  // (error: any) => {
  // alert('Error uploading file:' + error);
  // }
  // );
  // }else{
  // alert('Please choose file:');
  // }
  // }

  // clearFileInput(): void {
  // // Reset the value of the file input element
  // if (this.fileInput) {
  // this.fileInput.nativeElement.value = '';
  // }
  // }

  onRainfallFileSelected(event: any) {
    this.selectedRainfallFile = event.target.files[0];
    // this.readExcel();
  }

  readExcel(): void {
    if (this.selectedRainfallFile) {
      const fileReader = new FileReader();
      fileReader.onload = (e: any) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {
          type: "array",
        });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any = XLSX.utils.sheet_to_json(worksheet, {
          raw: true,
        });
        if (!jsonData[0].hasOwnProperty(this.dateCalculation())) {
          alert("Please select correct date");
          this.clearRainfallFileInput();
        }
      };
      fileReader.readAsArrayBuffer(this.selectedRainfallFile);
    }
  }


  private openUploadResultPopup(ok: boolean, message: string, uploaded: string[] = [], skipped: string[] = []): void {
    this.uploadResultOk = ok;
    this.uploadResultMessage = message;
    this.uploadResultUploadedDates = uploaded;
    this.uploadResultSkippedDates = skipped;
    this.showUploadResultPopup = true;
  }

  private readonly excelMonthAbbrevs = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  /** Parses a "dd_Mon_yy" excel column header (e.g. "12_Sep_24") into a Date, or null if not a date column. */
  private parseExcelDateColumn(key: string): Date | null {
    const parts = key.split('_');
    if (parts.length !== 3) return null;
    const [ddStr, monStr, yyStr] = parts;
    const dd = parseInt(ddStr, 10);
    const monIdx = this.excelMonthAbbrevs.indexOf(monStr);
    const yy = parseInt(yyStr, 10);
    if (isNaN(dd) || monIdx === -1 || isNaN(yy) || yyStr.length !== 2) return null;
    const d = new Date(2000 + yy, monIdx, dd);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /** For each date column, finds the station with the highest rainfall value (excluding the -999.9 "no data" sentinel). */
  private computeHighestRainfallByDate(
    jsonData: any[],
    dateCols: string[]
  ): { date: string; stationName: string; stationId: string; rainfall: number; hasData: boolean }[] {
    return dateCols.map((k) => {
      let best: { stationName: string; stationId: string; rainfall: number } | null = null;
      for (const row of jsonData) {
        const raw = row[k];
        if (raw === null || raw === "" || raw === undefined) continue;
        const num = typeof raw === "number" ? raw : parseFloat(raw);
        if (isNaN(num) || num === -999.9) continue;
        if (!best || num > best.rainfall) {
          best = { stationName: row.station_name, stationId: row.station_id, rainfall: num };
        }
      }
      return best
        ? { date: k, stationName: best.stationName, stationId: best.stationId, rainfall: best.rainfall, hasData: true }
        : { date: k, stationName: '—', stationId: '—', rainfall: 0, hasData: false };
    });
  }

  async uploadRainFallFile() {
    if (this.selectedFile) {
      console.log(this.selectedFile);

      this.isUploading = true; // start loader
      try {
        const fileReader = new FileReader();

        fileReader.onload = async (e: any) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });

            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
              defval: null,
            });

            const skipColumns = this.rainfallSkipColumns;

            // Dates within restrictDays get uploaded as usual; anything older
            // is dropped from the upload (not blocked) and reported to the user.
            let uploadedDateCols: string[] = [];
            let skippedDateCols: string[] = [];

            if (jsonData.length > 0) {
              const dateCols = Object.keys(jsonData[0]).filter(
                (k) => !skipColumns.includes(k) && this.parseExcelDateColumn(k) !== null
              );

              // Future dates can never have real rainfall data — reject the
              // whole upload instead of silently dropping the column.
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const futureDateCols = dateCols.filter((k) => this.parseExcelDateColumn(k)! > today);
              if (futureDateCols.length > 0) {
                this.openUploadResultPopup(
                  false,
                  `Future dates are not allowed. Please remove or correct these column(s): ${futureDateCols.join(", ")}.`
                );
                this.clearRainfallFileInput();
                this.isUploading = false;
                return;
              }

              if (this.restrictDays != null) {
                const cutoff = new Date();
                cutoff.setHours(0, 0, 0, 0);
                cutoff.setDate(cutoff.getDate() - this.restrictDays);

                dateCols.forEach((k) => {
                  const d = this.parseExcelDateColumn(k)!;
                  (d < cutoff ? skippedDateCols : uploadedDateCols).push(k);
                });

                if (skippedDateCols.length > 0) {
                  jsonData.forEach((row: any) => skippedDateCols.forEach((k) => delete row[k]));
                }
              } else {
                uploadedDateCols = dateCols;
              }
            }

            if (uploadedDateCols.length === 0 && skippedDateCols.length > 0) {
              this.openUploadResultPopup(
                false,
                `Nothing uploaded — every date in this file is older than the ${this.restrictDays}-day limit.`,
                [],
                skippedDateCols
              );
              this.clearRainfallFileInput();
              this.isUploading = false;
              return;
            }

            // Negative values are not allowed, except the -999.9 "no data" sentinel.
            const invalidNegativeCols = new Set<string>();
            jsonData.forEach((row: any) => {
              uploadedDateCols.forEach((k) => {
                const raw = row[k];
                if (raw === null || raw === "" || raw === undefined) return;
                const num = typeof raw === "number" ? raw : parseFloat(raw);
                if (!isNaN(num) && num < 0 && num !== -999.9) {
                  invalidNegativeCols.add(k);
                }
              });
            });

            if (invalidNegativeCols.size > 0) {
              this.openUploadResultPopup(
                false,
                `Negative values are not allowed, except -999.9 (used to indicate no data). Please check the values under: ${Array.from(invalidNegativeCols).join(", ")}.`
              );
              this.clearRainfallFileInput();
              this.isUploading = false;
              return;
            }

            // Validation passed — show the highest-rainfall-per-date summary
            // and wait for the user to confirm before actually uploading.
            this.pendingUploadJsonData = jsonData;
            this.pendingUploadedDateCols = uploadedDateCols;
            this.pendingSkippedDateCols = skippedDateCols;
            this.preUploadHighestByDate = this.computeHighestRainfallByDate(jsonData, uploadedDateCols);
            this.showPreUploadConfirmPopup = true;
          } catch (error) {
            console.error("Error inside onload:", error);
            alert("Error uploading file: Please check the excel format and ensure no non-numeric characters in dates field");
          } finally {
            this.isUploading = false; // always stop loader
          }
        };

        fileReader.readAsArrayBuffer(this.selectedFile);
      } catch (error) {
        console.error("Outer error:", error);
        alert("Unexpected error: " + (error));
        this.isUploading = false;
      }
    } else {
      alert("Please choose a file:");
    }
  }

  /** Called from the pre-upload confirmation popup's "Confirm & Upload" button. */
  async confirmAndUploadRainfall() {
    this.showPreUploadConfirmPopup = false;
    const jsonData = this.pendingUploadJsonData;
    const uploadedDateCols = this.pendingUploadedDateCols;
    const skippedDateCols = this.pendingSkippedDateCols;
    const skipColumns = this.rainfallSkipColumns;

    this.isUploading = true;
    try {
      const processedData = jsonData.map((row: any) => {
        for (const key in row) {
          if (
            (row[key] === null || row[key] === "") &&
            !skipColumns.includes(key)
          ) {
            row[key] = -999.9;
          }
        }
        return row;
      });

      const newWorksheet = XLSX.utils.json_to_sheet(processedData);
      const newWorkbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "ProcessedData");

      const csv = XLSX.write(newWorkbook, {
        bookType: "csv",
        type: "array",
      });

      const processedFile = new File([csv], "processed_rainfall_data.csv", {
        type: "text/csv",
      });

      const response = await this.stationService
        .uploadRainfallDataFile(processedFile)
        .toPromise();

      await this.fetchStationData(this.enteredDate);

      this.openUploadResultPopup(true, "File uploaded successfully.", uploadedDateCols, skippedDateCols);

      this.clearFileInput();
      this.filterStationData();
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file: Please check the excel format and ensure no non-numeric characters in dates field");
    } finally {
      this.isUploading = false;
      this.pendingUploadJsonData = [];
      this.pendingUploadedDateCols = [];
      this.pendingSkippedDateCols = [];
      this.preUploadHighestByDate = [];
    }
  }

  /** Called from the pre-upload confirmation popup's "Cancel" button. */
  cancelPreUpload() {
    this.showPreUploadConfirmPopup = false;
    this.preUploadHighestByDate = [];
    this.pendingUploadJsonData = [];
    this.pendingUploadedDateCols = [];
    this.pendingSkippedDateCols = [];
    this.clearRainfallFileInput();
  }


  sortDirection: { [key: string]: 'asc' | 'desc' } = {};
  activeSortColumn: string = '';

  sortTable(column: string): void {
    this.isSorting = true;
    this.activeSortColumn = column;

    setTimeout(() => {
      const direction = this.sortDirection[column] === 'asc' ? 'desc' : 'asc';
      this.sortDirection[column] = direction;
  
      this.filteredData.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];
  
        // Handle null or undefined
        if (valA == null) valA = '';
        if (valB == null) valB = '';
  
        // If both are numbers
        if (!isNaN(Number(valA)) && !isNaN(Number(valB))) {
          return direction === 'asc'
            ? Number(valA) - Number(valB)
            : Number(valB) - Number(valA);
        }
  
        // Else treat as strings (case-insensitive)
        valA = valA.toString().toLowerCase();
        valB = valB.toString().toLowerCase();
  
        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
      });
  
      this.isSorting = false; // Hide loader after sorting
    }, 100); // Brief delay to let UI show spinner
  }

  rangeSortDirection: { [key: string]: 'asc' | 'desc' } = {};
  rangeActiveSortColumn: string = '';

  sortRangeTable(column: string): void {
    this.isSorting = true;
    this.rangeActiveSortColumn = column;

    setTimeout(() => {
      const direction = this.rangeSortDirection[column] === 'asc' ? 'desc' : 'asc';
      this.rangeSortDirection[column] = direction;

      this.pivotedData.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];

        if (valA == null) valA = '';
        if (valB == null) valB = '';

        if (!isNaN(Number(valA)) && !isNaN(Number(valB)) && valA !== '' && valB !== '') {
          return direction === 'asc'
            ? Number(valA) - Number(valB)
            : Number(valB) - Number(valA);
        }

        valA = valA.toString().toLowerCase();
        valB = valB.toString().toLowerCase();

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
      });

      this.isSorting = false;
    }, 100);
  }




  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  clearRainfallFileInput(): void {
    // Reset the value of the file input element
    if (this.rainfallFileInput) {
      this.rainfallFileInput.nativeElement.value = "";
    }
  }



  sampleFile() {
    let data: any[] = [];
    let currentDate = new Date(this.enteredDate);

    // let formattedDate = currentDate.toLocaleString('en-US', {
    // day: '2-digit',
    // month: 'short',
    // year: '2-digit',
    // }).replace(',', '').split(' ').join('_');

    let formattedDate = currentDate
      .toLocaleString("en-US", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      })
      .replace(",", ""); // Step 1: Remove the comma

    // Step 2: Split the string and rearrange it to "12_Sep_24"
    let dateParts = formattedDate.split(" "); // ["Sep", "12", "24"]
    formattedDate = `${dateParts[1]}_${dateParts[0]}_${dateParts[2]}`;

    console.log("balu", this.filteredData);
    this.filteredData.forEach((x) => {
      let station: any = {
        district_name : x.district_name,
        station_name: x.station_name,
        centre_type: x.centre_type + " " + x.centre_name,
        station_id: x.station_code,
        [formattedDate]: x.data, // Use today's date as the key
      };
      data.push(station);
    });

    console.log("data display", data);
    return data;
  }


  sampleFileRange() {
    let data: any[] = [];

    const formattedDates = this.dateColumns.map((date) => {
      const [y, m, d] = date.split('-').map(Number);
      let formatted = new Date(y, m - 1, d)
        .toLocaleString("en-US", {
          day: "2-digit",
          month: "short",
          year: "2-digit",
        })
        .replace(",", "");

      const dateParts = formatted.split(" "); // ["Sep", "12", "24"]
      return `${dateParts[1]}_${dateParts[0]}_${dateParts[2]}`;
    });

    this.pivotedData.forEach((x) => {
      let station: any = {
        district_name: x.district_name,
        station_name: x.station_name,
        centre_type: x.centre_type + " " + x.centre_name,
        station_id: x.station_code,
      };

      this.dateColumns.forEach((date, idx) => {
        station[formattedDates[idx]] = x.values[date];
      });

      data.push(station);
    });

    console.log("data display range", data);
    return data;
  }


  sampleFileEditFile() {
    let data: any[] = [];
    let currentDate = new Date(this.enteredDate);
  
    let formattedDate = currentDate
      .toLocaleString("en-US", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      })
      .replace(",", ""); // Remove the comma
  
    console.log("balu", this.filteredData);
    this.filteredData.forEach((x) => {
      let station: any = {
        district_name: x.district_name,
        station_name: x.station_name,
        station_id: x.station_code,
        centre_type: x.centre_type + " " + x.centre_name,
        station_type : x.station_type,
        latitude: x.latitude,
        longitude: x.longitude,
        activationdate : x.activationdate?.split('T')[0]
      };
      data.push(station);
    });
  
    return data;
  }


  

  downloadRainfallSampleFile() {
    // this.exportAsExcelFile(this.sampleFile(), 'export-to-excel');
    window.open("/assets/rainfall_sample_file.pdf", "_blank");
  }

  downloadStationSampleFile() {
    window.open("/assets/station_sample_file.pdf", "_blank");
  }


  downloadEditStationSampleFile() {
    window.open("/assets/station_sample_file.pdf", "_blank");
  }

  downloadStationInstructionFile() {
    window.open("/assets/Instruction for adding new station.docx", "_blank");
  }

  updateTableData(data: any[]): void {
  this.isTableEmpty = data.length === 0; // Set to true if no data, false otherwise.
}

  exportAsXLSX(): void {
    if (this.viewMode === 'range') {
      this.exportAsExcelFile(this.sampleFileRange(), "export-to-excel-range");
    } else {
      this.exportAsExcelFile(this.sampleFile(), "export-to-excel");
    }
    // this.exportAsExcelFile(this.filteredStations, 'export-to-excel');
  }

  exportAsXLSXforEditStations(): void {
    this.exportAsExcelFile(this.sampleFileEditFile(), "Edit needed stations");
  }

  // exportAsExcelFileforEditSample(json: any[], excelFileName: string): void {
  //   const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);
  //   console.log("worksheet", worksheet);
  
  //   // Define the columns to freeze (make non-editable and grey)
  //   const columnsToFreeze = ['district_name'];
  //   const columnIndices = columnsToFreeze.map(col => {
  //     const headerIndex = Object.keys(json[0] || {}).indexOf(col);
  //     return String.fromCharCode(65 + headerIndex); // Convert to column letter (A, B, C, etc.)
  //   });
  
  //   // Apply styling and protection to the specified columns
  //   const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  //   for (let row = range.s.r; row <= range.e.r; row++) {
  //     for (let col of columnIndices) {
  //       const cellAddress = `${col}${row + 1}`;
  //       if (!worksheet[cellAddress]) continue;
  
  //       // Apply grey background
  //       worksheet[cellAddress].s = {
  //         fill: {
  //           type: 'pattern',
  //           pattern: 'solid',
  //           fgColor: { rgb: 'D3D3D3' } // Light grey color
  //         },
  //         // Lock the cell
  //         protection: {
  //           locked: true
  //         }
  //       };
  //     }
  //   }
  
  //   // Enable sheet protection
  //   worksheet['!protect'] = {
  //     password: undefined, // Optional: Add a password if needed
  //     objects: true,
  //     scenarios: true
  //   };
  
  //   // Set column widths (optional, for better readability)
  //   worksheet['!cols'] = columnsToFreeze.map(() => ({ wch: 20 }));
  
  //   const workbook: XLSX.WorkBook = {
  //     Sheets: {
  //       data: worksheet,
  //     },
  //     SheetNames: ["data"],
  //   };
  
  //   const excelBuffer: any = XLSX.write(workbook, {
  //     bookType: "xlsx",
  //     type: "array",
  //   });
  
  //   this.saveAsExcelFile(excelBuffer, excelFileName);
  // }

  

  exportAsExcelFile(json: any[], excelFileName: string): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);
    console.log("worksheet", worksheet);
  
    // Set column width to 20 for all columns
    const columnCount = Object.keys(json[0] || {}).length; // Get number of columns from first row
    worksheet['!cols'] = Array(columnCount).fill({ wch: 20 }); // Set width to 20 for each column
  
    const workbook: XLSX.WorkBook = {
      Sheets: {
        data: worksheet,
      },
      SheetNames: ["data"],
    };
  
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
  
    this.saveAsExcelFile(excelBuffer, excelFileName);
  }
  saveAsExcelFile(buffer: any, fileName: string): void {
    const EXCEL_TYPE =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    const EXCEL_EXTENSION = ".xlsx";
    const data: Blob = new Blob([buffer], {
      type: EXCEL_TYPE,
    });
    FileSaver.saveAs(
      data,
      fileName + "export" + new Date().getTime() + EXCEL_EXTENSION
    );
  }

  generateTextFormat(data: any): string {
    let text = "";
    for (let entry of data) {
      text += `${entry["station"]}: ${entry["rainfall"]}mm\n`;
    }
    return text;
  }

  groupByMc(mc: any) {
    const groups: any = {};
    mc.forEach((station: any) => {
      const rmc_mc: any = station.rmc_mc;
      if (!groups[rmc_mc]) {
        groups[rmc_mc] = [];
      }
      groups[rmc_mc].push(station);
    });
    const result = [];
    for (const rmc_mc in groups) {
      if (rmc_mc == this.selectedMcs[0]) {
        result.push({
          rmc_mc: rmc_mc,
          mc: groups[rmc_mc],
        });
      }
    }
    return result;
  }

  sendEmail() {
    // if (confirm("Do want to send email") == true) {
    // let emails = ["saurav97531@gmail.com", "tarakesh@rimes.int"];
    let emails = ["saurav97531@gmail.com"];

    let resdata = this.groupByMc(this.existingstationdata);
    let emaildata: any[] = [];
    resdata.forEach((stn) => {
      stn.mc.forEach((s: any) => {
        if (s[this.dateCalculation()] == -999.9) {
          emaildata.push({
            station: s.station,
            rainfall: s[this.dateCalculation()],
          });
        }
      });
    });

    emails.forEach((email) => {
      let data = {
        to: email,
        subject: `Rainfall data not received - ${new Date().toDateString()}`,
        text: `Hello,\n\n Rainfall data not received for these stations:-\n\n ${this.generateTextFormat(
          emaildata
        )}`,
      };
      this.dataService.sendEmail(data).subscribe((res) => {
        console.log("Email Sent Successfully");
      });
    });
    // }
  }

  scheduleFunction() {
    // Get current time
    var now = new Date();
    // Set desired time (in this case, 11:00 AM)
    var desiredTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      12,
      0,
      0,
      0
    );
    var delay = desiredTime.getTime() - now.getTime();

    if (delay < 0) {
      // If it's already past the desired time, schedule it for tomorrow
      desiredTime.setDate(desiredTime.getDate() + 1);
      delay = desiredTime.getTime() - now.getTime();
    }

    setTimeout(() => {
      let autoEmailOnOff = JSON.parse(localStorage.getItem("autoEmail") as any);
      if (autoEmailOnOff == true) {
        this.sendEmail();
      }
      // Reschedule function for the next day
      this.scheduleFunction();
    }, delay);
  }

  fetchRegionData() {
    this.regionService.fetchData().subscribe(
      (response) => {
        console.log("Region data:", response);
        // Ensure response.data contains the expected array structure
        if (response && response.data) {
          this.regions = response.data.map((region: any) => ({
            label: region.region_name,
            value: region.region_code,
          }));
          // console.log('Formatted regions:', this.regions);
        } else {
          console.error("Unexpected response format:", response);
          alert("Data is not coming in the expected format");
        }
      },
      (error) => {
        console.error("Error fetching region data:", error);
        alert("Data is not coming");
      }
    );
  }

  onRegionChange(): void {
    console.log("balu", this.selectedRegion);
    if (this.selectedRegion && this.selectedRegion.length > 0) {
      // console.log("here",this.selectedRegion);
      // console.log(this.centersMC[0]);

      const filteredCenters = this.centersMC[0]?.filter((center: any) =>
        this.selectedRegion.includes(center.region_code)
      );
      // console.log('Filtered centers:', filteredCenters);

      this.centersMC.push(filteredCenters);
      // console.log('centersMC', this.centersMC);

      let lenOfCenterMC = this.centersMC.length;
      // console.log('lenOfCenterMC', lenOfCenterMC)
      this.centersMC1 = this.centersMC[lenOfCenterMC - 1];
      console.log("this.centersMC1", this.centersMC1);

      // <- RMC ->
      const filteredCentersRMC = this.centersRMC[0]?.filter((center: any) =>
        this.selectedRegion.includes(center.region_code)
      );
      console.log("filteredCentersRMC", filteredCentersRMC);

      this.centersRMC.push(filteredCentersRMC);

      let lenOfCenterRMC = this.centersRMC.length;
      this.centersRMC1 = this.centersRMC[lenOfCenterRMC - 1];
      console.log("centersRMC1", this.centersRMC1);
    }
  }

  onMcChange(event: any): void {
    this.selectedMCData = event.value;

    console.log("event.value for MC", event.value);

    this.rmcDisabled = this.selectedMC.length > 0;

    const filteredStates = this.states[0].data.filter((state: any) => {
      return this.selectedMC.some(
        (mc: any) => mc.centre_name == state.centre_name
      );
    });

    console.log("Filtered states:", filteredStates);
    this.filterStates = filteredStates;
  }

  onRMcChange(event: any): void {
    this.selectedRMCData = event.value;
    // console.log('selectedRMCData ', this.selectedRMCData );
    this.mcDisabled = this.selectedRMC.length > 0;

    const filterStatesRMC = this.states[0].data.filter((state: any) => {
      return this.selectedRMC.some(
        (rmc: any) => rmc.centre_name == state.centre_name
      );
    });

    console.log("Filtered RMC States:", filterStatesRMC);
    this.filterStates = filterStatesRMC;

    // this.selectedRegion.forEach((code:string)=>{
    // this.getStateService.fetchData().subscribe(
    // response => {
    // console.log('State Data RMC', response);
    // const filterStateRMC = response.data.filter((id: any)=> id.region_code === code);

    // // this.states.push(...filterStateRMC);

    // // Add only unique states based on state_name
    // filterStateRMC.forEach((state: any) => {
    // if (!this.states.some(existingState => existingState.state_name === state.state_name)) {
    // this.states.push(state);
    // }
    // });

    // console.log('filterStateByRMC', filterStateRMC);
    // console.log('state by RMC', this.states);
    // }
    // )
    // })
  }

  onStateChange(event: any): void {
    this.selectedStateData = event.value;
    // console.log('selectedStateData', this.selectedStateData)

    // console.log('selectedState', this.selectedState);
    // console.log('districts', this.districts);

    const filteredDistricts = this.districts[0].data.filter((dist: any) => {
      return this.selectedState.some(
        (mc: any) => mc.state_code == dist.state_code
      );
    });
    console.log("Filtered district", filteredDistricts);
    this.filterDistrict = filteredDistricts;

    // if (this.selectedState && this.selectedState.length > 0) {
    // const selectedStateCodes = this.selectedState.map((state: any) => state.state_code);
    // console.log('selectedStateCodes', selectedStateCodes);

    // // Fetch districts based on selected states' state_code
    // this.getDistrictService.fetchData().subscribe(
    // (response : any) => {
    // console.log('District Response', response);

    // selectedStateCodes.forEach((code: any) => {
    // const filterDistrict = response.data.filter((district: any) => district.state_code === code);
    // console.log('filterDistrict', filterDistrict);
    // this.districts.push(...filterDistrict);
    // });

    // console.log('Filtered districts:', this.districts);
    // },
    // (error : any) => {
    // console.error('Error fetching district data:', error);
    // }
    // );
    // } else {
    // console.log('No states selected');
    // }
  }

  onDistrictChange(event: any): void {
    console.log("District change", event.value);
    this.selectedDistrictData = event.value;
    console.log("selectedDistrictData =>", this.selectedDistrictData);
  }

  // fetchStationData(date: any): void {
  // this.isLoading = true; // Set loading to true before starting the API call
  // this.fetchStationDataService.fetchStationData(date ?? "")
  // .subscribe(
  // (response: any) => {
  // this.stationData = response?.data; // Store the fetched data
  // if(this.currentUserType == "mc" || this.currentUserType == "rmc"){
  // this.stationData.filter((x:any) => {
  // // console.log(x.centre_name.toUpperCase(), this.currentUserName.toUpperCase())

  // return x.center_name !=null ? x.centre_name.toUpperCase() == this.currentUserName.toUpperCase() : false
  // })
  // }
  // this.isLoading = false; // Set loading to false once data is fetched
  // console.log('Data fetched successfully:', this.stationData);
  // },
  // (error: any) => {
  // this.isLoading = false; // Set loading to false in case of error
  // console.error('Error fetching data:', error);
  // }
  // );
  // }

  switchToDaily(): void {
    this.viewMode = 'daily';
    this.filterStationData();
  }

  switchToRange(): void {
    this.viewMode = 'range';
    if (this.pivotedData.length === 0) {
      this.fetchRangeStationData();
    }
  }

  async fetchStationData(date: any): Promise<void> {
    this.isLoading = true
    try {
      const response: any = await this.fetchStationDataService
        .fetchStationDataForDataEntry(date ?? "")
        .toPromise();
      this.stationData = response?.data; // Store the fetched data

      console.log("Data fetched successfully:", this.stationData);
      this.filterStationData()
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      this.isLoading = false
    }
  }

  // ── Month view + edit (only last 30 days from today are editable) ──

  private getMonthRange(month: string): { fromDate: string; toDate: string } {
    const [year, mon] = month.split('-').map(Number);
    const firstDay = new Date(year, mon - 1, 1);
    const lastDay = new Date(year, mon, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const toDate = lastDay > today ? today : lastDay;

    // Full month is still fetched/displayed — isDateEditable() locks the
    // out-of-restrictDays columns instead of hiding them.
    return {
      fromDate: this.formatDate(firstDay),
      toDate: this.formatDate(toDate)
    };
  }

  async fetchRangeStationData(): Promise<void> {
    if (!this.selectedMonth) {
      alert("Please select a month");
      return;
    }

    const { fromDate, toDate } = this.getMonthRange(this.selectedMonth);
    this.rangeToDate = toDate;

    this.isLoading = true;
    try {
      const response: any = await this.stationService
        .fetchStationDataEntryRange(fromDate, toDate)
        .toPromise();

      this.buildPivotedData(response?.data || []);
      this.viewMode = 'range';
    } catch (error) {
      console.error("Error fetching range data:", error);
    } finally {
      this.isLoading = false;
    }
  }

  private buildPivotedData(rows: any[]): void {
    const dateSet = new Set<string>();
    const stationsMap = new Map<any, any>();

    rows.forEach((row: any) => {
      dateSet.add(row.collection_date);

      if (!stationsMap.has(row.station_code)) {
        stationsMap.set(row.station_code, {
          region_code: row.region_code,
          region_name: row.region_name,
          state_code: row.state_code,
          state_name: row.state_name,
          district_code: row.district_code,
          district_name: row.district_name,
          station_code: row.station_code,
          station_name: row.station_name,
          station_type: row.station_type,
          centre_type: row.centre_type,
          centre_name: row.centre_name,
          is_new_station: row.is_new_station,
          latitude: row.latitude,
          longitude: row.longitude,
          activationdate: row.activationdate,
          values: {}
        });
      }

      stationsMap.get(row.station_code).values[row.collection_date] = row.data;
    });

    this.dateColumns = Array.from(dateSet).sort();

    let stations = Array.from(stationsMap.values());

    if (this.currentUserType == "mc") {
      stations = stations.filter((station: any) =>
        station.centre_name?.toUpperCase() === this.currentUserName.toUpperCase()
      );
    }

    stations.sort((a: any, b: any) =>
      (a.station_name || "").localeCompare(b.station_name || "")
    );

    this.pivotedData = stations;
    this.updateTableData(this.pivotedData);
  }

  isDateEditable(date: string): boolean {
    if (!this.rangeToDate) return false;

    const toDate = new Date(this.rangeToDate);
    const minEditableDate = new Date(toDate);
    if (this.restrictDays != null) {
      minEditableDate.setDate(minEditableDate.getDate() - (this.restrictDays - 1)); // restrictDays window incl. To Date
    } else {
      minEditableDate.setDate(minEditableDate.getDate() - 29); // no role restriction — fall back to last 30 days incl. To Date
    }

    const d = new Date(date);
    return d >= minEditableDate && d <= toDate;
  }

  updateRangeRainfallValue(stationCode: any, date: string, value: any): void {
    const formattedRainfallValue = parseFloat(value).toFixed(1);

    const data = {
      date: date,
      station_code: +stationCode,
      value: +formattedRainfallValue,
    };

    this.dataEntryService.updateRainfallValue(data).subscribe();
  }

  onDateChange(event: any): void {
    console.log("event.target.value", event.target.value);
    this.enteredDate = event.target.value;
    console.log(this.enteredDate);

    // this.filterStationData();
  }

  filterStationData(): void {


    this.filteredData = this.stationData;



    console.log(this.currentUserName.toUpperCase())

    console.log(this.currentUserName.toUpperCase());

    if (this.currentUserType == 'mc') {
      this.filteredData = this.filteredData.filter((station: any) => {
        return (
          station.centre_name?.toUpperCase() === this.currentUserName.toUpperCase()
        );
      });
    }
    




    this.updateTableData(this.filteredData); 

    console.log("filteredData, check duplicate", this.filteredData);

    // console.log("sd data ->", this.stationData);
    // console.log("fl data ->", this.filteredData);

    if (this.selectedRegion && this.selectedRegion.length > 0) {
      this.filteredData = this.filteredData.filter((station: any) =>
        this.selectedRegion.includes(station.region_code)
      );
    }

    console.log("hello this.selectedMCData", this.selectedMCData);
    if (this.selectedMCData && this.selectedMCData.length > 0) {
      console.log("hi");
      const selectedMCNames = this.selectedMCData.map((mc) => mc.centre_name);
      this.filteredData = this.filteredData.filter((station: any) =>
        selectedMCNames.includes(station.centre_name)
      );
      console.log("filteredData after mc:", this.filteredData);
    }

    if (this.selectedRMCData && this.selectedRMCData.length > 0) {
      const selectedRMCNames = this.selectedRMCData.map(
        (rmc) => rmc.centre_name
      );
      this.filteredData = this.filteredData.filter((station: any) =>
        selectedRMCNames.includes(station.centre_name)
      );
      console.log("filteredData after rmc:", this.filteredData);
    }

    if (this.selectedStateData && this.selectedStateData.length > 0) {
      const selectedStateCodes = this.selectedStateData.map(
        (state: any) => state.state_code
      );
      console.log("selectedStateCodes", selectedStateCodes);
      console.log("selectedStateData:", this.selectedStateData);
      console.log("filteredData", this.filteredData);
      this.filteredData = this.filteredData.filter((item: any) =>
        selectedStateCodes.includes(item.state_code)
      );
      console.log("filteredData after state:", this.filteredData);
    }

    if (this.selectedDistrictData && this.selectedDistrictData.length > 0) {
      const selectedDistrictCodes = this.selectedDistrictData.map(
        (item: any) => item.district_code
      );
      // console.log("selectedStateCodes",selectedDistrictCodes);
      // console.log("selectedStateData:", this.selectedStateData);
      // console.log('filteredData', this.filteredData);
      this.filteredData = this.filteredData.filter((item: any) =>
        selectedDistrictCodes.includes(item.district_code)
      );
      console.log("filteredData after district:", this.filteredData);
    }

    this.filteredData.sort((a: any, b: any) =>
      (a.station_name || '').localeCompare(b.station_name || '')
    );


  }

  // New functions are below to get the data on ng init

  // MC Data
  getAllMCData(): void {
    this.centerService.fetchData("MC").subscribe(
      (response) => {
        console.log("getAllMCData", response);
        this.centersMC.push(response.data);
        console.log("this.centersMC", this.centersMC);
      },
      (error) => {
        console.error("Error fetching center details:", error);
      }
    );
  }

  // RMC Data
  getAllRMCData(): void {
    this.centerService.fetchData("RMC").subscribe(
      (response) => {
        console.log("getAllRMCData", response);
        this.centersRMC.push(response.data);
        console.log("this.centersRMC", this.centersRMC);
      },
      (error) => {
        console.error("Error fetching center details:", error);
      }
    );
  }

  // Get all States
  getAllStates(): void {
    this.getStateService.fetchData().subscribe(
      (response) => {
        console.log("All states", response);
        this.states.push(response);
        console.log("states", this.states);
      },
      (error) => {
        console.error("Error fetching center details:", error);
      }
    );
  }

  getAllDistricts(): void {
    this.getDistrictService.fetchData().subscribe(
      (response) => {
        console.log("All Districts", response);
        this.districts.push(response);
        console.log("Districts", this.districts);
      },
      (error) => {
        console.error("Error fetching center details:", error);
      }
    );
  }

  // <- Balu created fn ->

  // updateRainfallValueData(stationCode :any, stationRainfallValue:any){
  // console.log('efhue',stationCode, stationRainfallValue)

  // const getCurrentDateFormatted = (): string => {
  // const today = new Date();
  // const yyyy = today.getFullYear();
  // const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  // const dd = String(today.getDate()).padStart(2, '0');
  // return `${yyyy}-${mm}-${dd}`;
  // };

  // let dateToUse = this.enteredDate;
  // if (!dateToUse) {
  // dateToUse = getCurrentDateFormatted();
  // }

  // let data = {
  // 'date' : dateToUse,
  // 'station_code' : +stationCode,
  // 'value' : +stationRainfallValue
  // }
  // this.dataEntryService.updateRainfallValue(data).subscribe()
  // }

  updateRainfallValueData(stationCode: any, stationRainfallValue: any) {
    // console.log('efhue', stationCode, stationRainfallValue);

    // Function to get the current date formatted
    const getCurrentDateFormatted = (): string => {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0"); // Months are zero-based
      const dd = String(today.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    let dateToUse = this.enteredDate;
    if (!dateToUse) {
      dateToUse = getCurrentDateFormatted();
    }

    // Format the rainfall value to one decimal place
    const formattedRainfallValue = parseFloat(stationRainfallValue).toFixed(1);

    let data = {
      date: dateToUse,
      station_code: +stationCode,
      value: +formattedRainfallValue, // Store the formatted value
    };

    // if(+formattedRainfallValue<=100){
      this.dataEntryService.updateRainfallValue(data).subscribe();
    // }
  }

  addData() {
    // pendiong check datatypes and reflect the alert

    const body = {
      station_name: this.data.stationName,
      station_id: +this.data.stationId,
      station_type: this.data.stationType,
      centre_type:
        this.currentUserType == "mc"
          ? this.currentUserType.toUpperCase()
          : this.data.center_type.toUpperCase(),
      centre_name:
        this.currentUserType == "mc"
          ? this.currentUserName.toUpperCase()
          : this.data.center_name.toUpperCase(),
      is_new_station: this.data.newOrOld == "new" ? 1 : 0,
      latitude: +this.data.lat,
      longitude: +this.data.lng,
      activation_date: this.data.activationDate,
    };

    this.stationService.addNewStation(body).subscribe();
  }

  // updateData() {
  // // pending : show the data before eidt
  // // reflect changes : call filterbyData() to refelct the update changes in the frontend
  // console.log('ppp', this.editData)
  // const body = {
  // "station_name": this.editData.stationname,
  // "station_id": this.editData.stationid,
  // "station_type": this.editData.stationType,
  // "centre_type": this.currentUserType=='mc'? this.currentUserType.toUpperCase() : this.editData.center_type.toUpperCase(),
  // "centre_name": this.currentUserType=='mc'? this.formatGetMcOrRMCName(this.currentUserName).toUpperCase() : this.editData.center_name.toUpperCase(),
  // "is_new_station": this.editData.newOrOld=='new' ? 1 : 0,
  // "latitude":+this.editData.lat,
  // "longitude":+this.editData.lng,
  // "activation_date":this.editData.activationDate
  // }
  // console.log(this.editData, body)
  // this.stationService.editStation(body).subscribe()
  // }

  // updateData() {
  // const body = {
  // "station_name": this.editData.stationname,
  // "station_id": this.editData.stationid,
  // "station_type": this.editData.stationType,
  // "centre_type": this.currentUserType == 'mc' ? this.currentUserType.toUpperCase() : this.editData.center_type.toUpperCase(),
  // "centre_name": this.currentUserType == 'mc' ? this.formatGetMcOrRMCName(this.currentUserName).toUpperCase() : this.editData.center_name.toUpperCase(),
  // "is_new_station": this.editData.newOrOld == 'new' ? 1 : 0,
  // "latitude": +this.editData.lat,
  // "longitude": +this.editData.lng,
  // "activation_date": this.editData.activationDate
  // };

  // this.stationService.editStation(body).subscribe(
  // response => {
  // this.snackBar.open('Data updated successfully!', 'Close', {
  // duration: 3000,
  // verticalPosition: 'top',
  // horizontalPosition: 'right',
  // });

  // // Reload the page after a short delay to allow the snackbar to display
  // setTimeout(() => {
  // window.location.reload();
  // }, 3000); // Adjust the delay time as needed
  // },
  // error => {
  // console.error('Update failed', error);
  // this.snackBar.open('Update failed. Please try again.', 'Close', {
  // duration: 3000,
  // verticalPosition: 'top',
  // horizontalPosition: 'right',
  // });
  // }
  // );
  // }

  async updateData() {
    console.log(this.editData);
    console.log("Balaaaau");

    console.log(this.currentUserType.toUpperCase(), this.currentUserName);
    // console.log(this.formatGetMcOrRMCName(this.currentUserName).toUpperCase())

    const body = {
      station_name: this.editData.stationname,
      station_id: this.editData.stationid,
      station_type: this.editData.stationType,
      centre_type:
        this.currentUserType == "mc"
          ? this.currentUserType.toUpperCase()
          : this.editData.center_type.toUpperCase(),
      centre_name:
        this.currentUserType == "mc"
          ? this.currentUserName.toUpperCase()
          : this.editData.center_name.toUpperCase(),
      is_new_station: this.editData.newOrOld == "1" ? 1 : 0,
      latitude: +this.editData.lat,
      longitude: +this.editData.lng,
      activation_date: this.editData.activationDate,
    };

    // console.log('Body 1', body);

    // this.stationService.editStation(body).subscribe(
    // (response) => {
    // // Update the editData object directly
    // console.log('Body 2', this.updateEditData(body));
    // this.updateEditData(body);

    // // Show success notification
    // this.snackBar.open("Data updated successfully!", "Close", {
    // duration: 3000,
    // verticalPosition: "top",
    // horizontalPosition: "right",
    // });
    // },
    // (error) => {
    // console.error("Update failed", error);
    // this.snackBar.open("Update failed. Please try again.", "Close", {
    // duration: 3000,
    // verticalPosition: "top",
    // horizontalPosition: "right",
    // });
    // }
    // );
    this.isUpdating = true;

    this.stationService.editStation(body).subscribe(
      (response) => {},
      (error) => {
        console.error("Update failed", error);
        this.snackBar.open("Update failed. Please try again.", "Close", {
          duration: 3000,
          verticalPosition: "top",
          horizontalPosition: "right",
        });
      }
    );

    await this.fetchStationData(this.enteredDate);
    this.filterStationData();
    this.isUpdating = false;

    this.editData = {
      stationname: this.editData.stationname,
      stationid: this.editData.stationid,
      editIndex: this.editData.editIndex,
      previousstationid: this.editData.previousstationid,
    };
    this.showEditPopup = false;
  }

  formatGetMcOrRMCName(name: String) {
    return name.split(" ")[1];
  }

  deletestation() {
    // not checked due to data concerns
    // remove index of the filteredStations and then
    // reflect changes : call filterbyData() to refelct the update changes in the frontend
    const tobeDeletedStation = {
      station_id: this.deleteData.station_code,
    };
    this.stationService.deleteStataion(tobeDeletedStation).subscribe();
    this.showdeletePopup = false;
  }

  uploadFile() {
    if (this.selectedFile) {
      this.stationService.uploadStationDataFile(this.selectedFile).subscribe(
        (response: any) => {
          alert("File uploaded successfully");
          this.clearFileInput();
          this.filterByDate();
        },
        (error: any) => {
          alert("Error uploading file:" + error);
        }
      );
    } else {
      alert("Please choose file:");
    }
  }





  uploadFileforEditStations() {
    if (this.selectedFile) {
      this.stationService.uploadEditStationDataFile(this.selectedFile).subscribe(
        (response: any) => {
          const config: MatSnackBarConfig = {
            panelClass: response.success ? ['success-snackbar'] : ['error-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'top'
          };

          let message: string;
          if (response.success) {
            message = response.message; // e.g., "Station details updated successfully"
          } else {
            // Format error message inline
            message = response.message; // e.g., "Some stations could not be updated"
            if (response.errors && response.errors.length > 0) {
              const maxErrorsToShow = 5;
              const displayedErrors = response.errors.slice(0, maxErrorsToShow);
              const additionalErrorCount = response.errors.length - maxErrorsToShow;

              const errorLines = displayedErrors.map((error: string) => `• ${error}`);
              if (additionalErrorCount > 0) {
                errorLines.push(`• And ${additionalErrorCount} more error${additionalErrorCount > 1 ? 's' : ''}. Check the file for details.`);
              }
              message += ':\n' + errorLines.join('\n');
            }
          }

          this.snackBar.open(message, 'Close', config);

          if (response.success) {
            this.selectedFile = null;
            const fileInput = document.getElementById('fileInput') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
            console.log('Filtering by date:', this.enteredDate); // Replace with filterByDate logic
          }
        },
        (error: any) => {
          const config: MatSnackBarConfig = {
            panelClass: ['error-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'top'
          };

          let message: string;
          if (error.error?.message) {
            message = error.error.message;
            if (error.error.errors && error.error.errors.length > 0) {
              const maxErrorsToShow = 5;
              const displayedErrors = error.error.errors.slice(0, maxErrorsToShow);
              const additionalErrorCount = error.error.errors.length - maxErrorsToShow;

              const errorLines = displayedErrors.map((error: string) => `• ${error}`);
              if (additionalErrorCount > 0) {
                errorLines.push(`• And ${additionalErrorCount} more error${additionalErrorCount > 1 ? 's' : ''}. Check the file for details.`);
              }
              message += ':\n' + errorLines.join('\n');
            }
          } else {
            message = 'Error uploading file: ' + error.message;
          }

          this.snackBar.open(message, 'Close', config);
        }
      );
    } else {
      this.snackBar.open('Please choose a file', 'Close', {
        panelClass: ['error-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    }
  }

  clearFileInput(): void {
    // Reset the value of the file input element
    if (this.fileInput) {
      this.fileInput.nativeElement.value = "";
    }
  }

  formatLatitude(lat: string): string {
    const latitude = parseFloat(lat);
    return isNaN(latitude) ? "Invalid" : latitude.toFixed(4);
  }

  // Method to convert and format longitude
  formatLongitude(lon: string): string {
    const longitude = parseFloat(lon);
    return isNaN(longitude) ? "Invalid" : longitude.toFixed(4);
  }

  // new fn
  storeOriginalValue(element: HTMLInputElement) {
    this.originalValue = element.value;
    element.value = ""; // Clear the field on focus
  }

  restoreOrUpdateRainfallValue(element: HTMLInputElement, stationCode: string) {
    if (!element.value) {
      element.value = this.originalValue; // Restore original value if input is empty
    } else {
      this.updateRainfallValueData(stationCode, element.value); // Update with new value
    }
  }

  moveToNextRow(currentInput: HTMLInputElement, currentIndex: number) {
    // Blur the current input to trigger any blur-related logic
    currentInput.blur();

    // Check if there is a next row
    if (currentIndex + 1 < this.filteredData.length) {
      // Find the next row's input field
      const nextRowInput = document.querySelectorAll('input[name="rainfall"]')[currentIndex + 1] as HTMLInputElement;
      if (nextRowInput) {
        nextRowInput.focus();
      }
    }
  }

  resetRainfallValue(element: HTMLInputElement, stationCode: string) {
    element.value = "-999.9";
    this.updateRainfallValueData(stationCode, element.value); // Ensure it updates the bound data
    this.showMessage(element)
  }

  resetRangeRainfallValue(station: any, date: string): void {
    station.values[date] = "-999.9";
    this.updateRangeRainfallValue(station.station_code, date, station.values[date]);
  }

}
