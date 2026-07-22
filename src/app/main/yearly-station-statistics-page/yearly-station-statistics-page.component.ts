import { Component, OnInit, ElementRef, ViewChild, ChangeDetectorRef } from "@angular/core";
import { HttpClient } from "@angular/common/http";
// import { environment } from 'src/environment/environment';
// import { RegionService } from 'src/app/services/region/region.service';
import { getRegionService } from "src/app/services/region/getregion.service";
import { CenterService } from "src/app/services/centre/centre.service";
import { getStateService } from "src/app/services/state/getState.service";
import { getDistrictService } from "src/app/services/district/getdistrict.service";
import { DataService } from "../../data.service";
import * as XLSX from "xlsx";
import * as FileSaver from "file-saver";
import { FetchStationDataService } from "src/app/services/station/station.service";
import { DataEntryService } from "src/app/services/dataEntry/dataEntry.service";
import { AllAWSDataService } from "src/app/services/aws/allAWSdata.service";
import { saveAs } from 'file-saver';
import { Chart } from 'angular-highcharts';
import * as Highcharts from 'highcharts';
import Exporting from 'highcharts/modules/exporting';
import ExportData from 'highcharts/modules/export-data';
import FullScreen from 'highcharts/modules/full-screen';
Exporting(Highcharts);
ExportData(Highcharts);
FullScreen(Highcharts);
import * as L from 'leaflet';

@Component({
  selector: "app-yearly-station-statistics-page",
  templateUrl: "./yearly-station-statistics-page.component.html",
  styleUrls: ["./yearly-station-statistics-page.component.css"],
})
export class YearlyStationStatisticsPageComponent {
  selectedOption: any = "UnifiedFile";
  selectedTab: string = "IMD";

  DailyWiseStationcolumns: any;
  DailyWiseStationRows: any;

  govtAwsColumns: any;
  govtAwsRows: any;
  govtAwsIsLoading: boolean = false;
  govtAwsEnteredFromDate: string = '';
  govtAwsEnteredEndDate: string = '';

  // Statistics (in-page map+charts)
  showImdStatistics = false;
  showGovtAwsStatistics = false;
  private imdStatsMap: any = null;
  private govtAwsStatsMap: any = null;

  // IMD Charts
  imdMonsoonChart!: Chart;
  imdAvailabilityChart!: Chart;
  imdTop10Chart!: Chart;
  imdStateChart!: Chart;

  // State Govt AWS Charts
  govtAwsMonsoonChart!: Chart;
  govtAwsAvailabilityChart!: Chart;
  govtAwsTop10Chart!: Chart;
  govtAwsStateChart!: Chart;

  // State Govt AWS Statistics tables
  govtAwsMonsoonTable: { category: string; count: number; pct: number }[] = [];
  govtAwsAvailabilityTable: { status: string; count: number; pct: number }[] = [];
  govtAwsTop10Table: { rank: number; stationName: string; total: number }[] = [];

  private indiaStateGeojson: any = null;
  private indiaCountryGeojson: any = null;

  private readonly imdFixedCols = ['state_name','district_name','block_name','block_code','station_name','station_id','latitude','longitude'];

  districtCodeList: any[] = [];
  selectMode(arg0: string) {
    this.selectedOption = arg0;
  }


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

  showPopup: boolean = false;
  message: string | null = null;
  existingstationdata: any[] = [];

  minDate: string = "";
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
  private allCentersMC: any[] = [];
  centersMC1: any[] = [];
  selectedMC: any;
  private allCentersRMC: any[] = [];
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

  // selectedDistrictData: any[] = [];

  StartDate: any;
  EndDate: any;

  stationData: any; // Variable to hold the fetched data
  isLoading: boolean = false;

  enteredFromDate: string = "";
  enteredEndDate: string = "";

  constructor(
    private dataService: DataService,
    private regionService: getRegionService,
    private centerService: CenterService,
    private getStateService: getStateService,
    private getDistrictService: getDistrictService,
    private fetchStationDataService: FetchStationDataService,
    private stationService: FetchStationDataService,
    private dataEntryService: DataEntryService,
    private allAwsDataService: AllAWSDataService,
    private cdr: ChangeDetectorRef
  ) {
    let loggedInUser: any = localStorage.getItem("isAuthorised");
    this.loggedInUserObject = JSON.parse(loggedInUser);
    this.currentUserType = this.loggedInUserObject.data[0].mcorhq;
    this.currentUserName = this.loggedInUserObject.data[0].name.replace(
      /^\S+\s/,
      ""
    );

    // console.log('this.currentUserName', this.currentUserName);
    if (this.currentUserType == "mc" || this.currentUserType == "rmc") {
      console.log(this.currentUserType, this.currentUserName);
      const regex = /^(RMC|MC)\s(\w+)/;
      const match = this.loggedInUserObject.data[0].name.match(regex);
      const extractedValue = match ? match[1] : ""; // extractedValue will be "RMC" if matched

      // console.log(extractedValue); // Output: "RMC"

      this.centerService.fetchData(extractedValue).subscribe(
        (response) => {
          console.log("center detail", response);
          const regionCode = response.data.filter(
            (it: any) => it.centre_name == this.currentUserName.toUpperCase()
          );
          // console.log(regionCode);
          // this.onRegionChange();

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

    if (this.loggedInUserObject.data[0].mcorhq == "mc") {
      const todayDate = new Date();
      todayDate.setDate(todayDate.getDate() - 29);
      this.minDate = this.formatDate(todayDate);
    }

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();

    this.todayDate = yyyy + "-" + mm + "-" + dd;
    // this.fetchRegionData();
  }

  ngOnInit(): void {
    this.loggedInUser = localStorage.getItem("isAuthorised");
    const obj = JSON.parse(this.loggedInUser);
    this.currentUserType = obj.data[0].mcorhq;
    console.log("currentUserType", this.currentUserType);

    const today = this.getCurrentDateFormatted();
    this.govtAwsEnteredFromDate = today;
    this.govtAwsEnteredEndDate = today;
    this.enteredFromDate = today;
    this.enteredEndDate = today;

    this.fetchRegionData();
    this.getAllMCData();
    this.getAllRMCData();
    this.getAllStates();
    this.getAllDistricts();

    // this.fetchDataFromBackend();
    this.dataService.getEmailGroup().subscribe((res) => {
      this.emailGroups = res;
      this.emailGroups.forEach((x) => {
        JSON.parse(x.emails).forEach((j: any) => {
          this.emails.push(j);
        });
      });
    });
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
        this.filteredMcs.push({ name: m });
      }
    });

    this.filteredRMcs = [];
    tempfilteredMcs.forEach((m) => {
      if (m.split(" ")[0] == "RMC") {
        this.filteredRMcs.push({ name: m });
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
      return { name: a };
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
      return { name: a };
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
      return { name: a };
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

  fetchDataFromBackend(): void {
    this.dataService.existingstationdata().subscribe({
      next: (value) => {
        this.existingstationdata = value;
        this.regionList = Array.from(
          new Set(this.existingstationdata.map((a) => a.region))
        );
        let regionList = Array.from(
          new Set(this.existingstationdata.map((a) => a.region))
        );
        this.regionList = regionList.map((x) => {
          return { name: x };
        });
        if (this.currentUserType == "mc") {
          const obj = JSON.parse(this.loggedInUser);
          const mcOrRmc = obj.data[0].name;
          let region = "";
          for (let i = 0; i < this.existingstationdata.length; i++) {
            if (
              this.existingstationdata[i].rmc_mc.toLowerCase() ==
              mcOrRmc.toLowerCase()
            ) {
              region = this.existingstationdata[i].region;
            }
          }
          this.selectedRegions = [{ name: region }];
          this.onChangeRegion();
          this.currentUserMCorRMCregion = region.toUpperCase();
          if (mcOrRmc.startsWith("MC")) {
            const some = { name: mcOrRmc.toUpperCase() };
            this.selectedMcs.push(some);
            this.onChangeMc();
            this.currentUserMCorRMC = mcOrRmc.toUpperCase();
          } else if (mcOrRmc.startsWith("RMC")) {
            const some = { name: mcOrRmc.toUpperCase() };
            this.selectedRMcs = [some];
            this.onChangeRMc();
            this.currentUserMCorRMC = mcOrRmc.toUpperCase();
          }
          console.log(mcOrRmc, obj, this.existingstationdata);
        }
        this.filterByDate();
      },
      error: (err) => console.error("Error fetching data:", err),
    });
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

  submit() {
    let data = {
      date: this.dateCalculation(),
      updatedstationdata: this.filteredStations,
    };
    this.dataService.updateRainFallData(data).subscribe((res) => {
      alert("Updated");
      this.fetchDataFromBackend();
    });
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
    this.filteredStations.forEach((x) => {
      let station: any = {
        stationname: x.stationname,
        rmc_mc: x.rmc_mc,
        stationid: x.stationid,
      };
      station[this.dateCalculation()] = x[this.dateCalculation()];
      data.push(station);
    });
    return data;
  }

  downloadRainfallSampleFile() {
    this.exportAsExcelFile(this.sampleFile(), "export-to-excel");
    // window.open('/assets/rainfall_sample_file.xlsx', '_blank');
  }

  exportAsExcelFile(json: any[], excelFileName: string): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);
    console.log("worksheet", worksheet);
    const workbook: XLSX.WorkBook = {
      Sheets: { data: worksheet },
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
        result.push({ rmc_mc: rmc_mc, mc: groups[rmc_mc] });
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
          // Auto-select all regions by default
          this.selectedRegion = this.regions.map((r: any) => r.value);
          this.onRegionChange();
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
    if (this.selectedRegion && this.selectedRegion.length > 0) {
      console.log("selectedRegion",this.selectedRegion);

      this.centersMC1 = this.allCentersMC.filter((center: any) =>
        this.selectedRegion.includes(center.region_code)
      );
      console.log("this.centersMC1", this.centersMC1);

      // <- RMC ->
      this.centersRMC1 = this.allCentersRMC.filter((center: any) =>
        this.selectedRegion.includes(center.region_code)
      );
      console.log("centersRMC1", this.centersRMC1);

      // Get district codes for all districts under the selected state_code(s)
      // (districts may not have loaded yet — getAllDistricts() re-runs this once they do)
      if (this.districts[0]?.data) {
        this.districtCodeList = this.districts[0].data
        .filter((district: any) =>
          this.selectedRegion.some((region: any) => region === district.region_code)
        )
        .map((district: any) => district.district_code);
      }
    }

    console.log('region districts', this.districts, this.selectedRegion,this.districtCodeList)
  }

  // onMcChange(event: any): void {
  //   this.selectedMCData = event.value;

  //   this.rmcDisabled = this.selectedMC.length > 0;

  //   console.log("selectedMC", this.selectedMC);
  //   console.log("centersMC1", this.centersMC1);
  //   console.log(this.states[0].data);

  //   // const filteredStates = this.states[0].data.filter((center: any) => this.selectedMC.includes(center.centre_name));
  //   // console.log('filteredStates', filteredStates);

  //   // this.states.push(filteredStates);
  //   // console.log('states', this.states);

  //   const filteredStates = this.states[0].data.filter((state: any) => {
  //     return this.selectedMC.some(
  //       (mc: any) => mc.centre_name == state.centre_name
  //     );
  //   });

  //   console.log("Filtered states:", filteredStates);
  //   this.filterStates = filteredStates;
  // }

  onMcChange(event: any): void {
    this.selectedMCData = Array.isArray(event) ? event : event.value;
    this.rmcDisabled = this.selectedMC.length > 0;
  
    console.log("selectedMC", this.selectedMC);
    console.log("centersMC1", this.centersMC1);
    console.log(this.states[0].data);
  
    // Filter states based on selected MC
    const filteredStates = this.states[0].data.filter((state: any) => {
      return this.selectedMC.some(
        (mc: any) => mc.centre_name == state.centre_name
      );
    });
  
    console.log("Filtered states:", filteredStates);
    this.filterStates = filteredStates;
  
    // Get district codes for all districts under the selected state_code(s)
    this.districtCodeList = this.districts[0].data
      .filter((district: any) =>
        this.filterStates.some((state: any) => state.state_code === district.state_code)
      )
      .map((district: any) => district.district_code);
  
    console.log("Filtered district codes at onMCChange", this.districtCodeList);
  }

  onRMcChange(event: any): void {
    this.selectedRMCData = Array.isArray(event) ? event : event.value;

    this.mcDisabled = this.selectedRMC.length > 0;

    const filterStatesRMC = this.states[0].data.filter((state: any) => {
      return this.selectedRMC.some(
        (rmc: any) => rmc.centre_name == state.centre_name
      );
    });

    console.log("Filtered RMC States:", filterStatesRMC);
    this.filterStates = filterStatesRMC;

    // Get district codes for all districts under the selected state_code(s)
    this.districtCodeList = this.districts[0].data
      .filter((district: any) =>
        this.filterStates.some((state: any) => state.state_code === district.state_code)
      )
      .map((district: any) => district.district_code);
  
    console.log("Filtered district codes:", this.districtCodeList);
  }

  // onStateChange(event: any): void {
  //   this.selectedStateData = event.value;
  //   console.log("selectedStateData", this.selectedStateData);

  //   console.log("selectedState", this.selectedState);
  //   // console.log("districts", this.districts);

  //   const filteredDistricts = this.districts[0].data.filter((dist: any) => {
  //     return this.selectedState.some(
  //       (mc: any) => mc.state_code == dist.state_code
  //     );
  //   });
  //   console.log("Filtered district", filteredDistricts);
  //   this.filterDistrict = filteredDistricts;
  // }

  onStateChange(event: any): void {
    this.selectedStateData = event.value;
    console.log("selectedStateData", this.selectedStateData);
  
    // Filter districts based on selected state
    const filteredDistricts = this.districts[0].data.filter((dist: any) => {
      return this.selectedState.some(
        (mc: any) => mc.state_code == dist.state_code
      );
    });
    console.log("Filtered district", filteredDistricts);
  
    // Extract district codes directly
    this.districtCodeList = filteredDistricts.map((dist: any) => dist.district_code);
    console.log("districtCodeList", this.districtCodeList);
  
    this.filterDistrict = filteredDistricts;
  }

  // onDistrictChange(event: any): void {
  //   console.log("District change", event.value);
  //   this.selectedDistrictData = event.value;
  //   console.log("selectedDistrictData =>", this.selectedDistrictData);
  // }

  onDistrictChange(event: any): void {
    console.log("District change", event.value);
    this.selectedDistrictData = event.value;
    console.log("selectedDistrictData =>", this.selectedDistrictData);
  
    // Filter `filterDistrict` to only include selected districts
    const filteredDistricts = this.filterDistrict.filter((dist: any) =>
      this.selectedDistrictData.some((selected: any) => selected.district_code === dist.district_code)
    );
    
    console.log("Filtered districts by selected district(s):", filteredDistricts);
  
    // Update districtCodeList for backend API call with selected `district_code`s
    this.districtCodeList = filteredDistricts.map((dist: any) => dist.district_code);
    console.log("districtCodeList", this.districtCodeList);
  }
  

  getCurrentDateFormatted(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0"); // Months are zero-based
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  async fetchStationData(
    enteredFromDate: string,
    enteredEndDate: string
  ): Promise<void> {
    this.isLoading = true; // Set loading to true before starting the API call

    if (enteredFromDate === "" || enteredEndDate === "") {
      const currentDate = this.getCurrentDateFormatted();
      enteredFromDate = currentDate;
      enteredEndDate = currentDate;
    }

    try {
      const response: any = await this.fetchStationDataService
        .fetchInRangeStationdata(enteredFromDate, enteredEndDate)
        .toPromise();
      this.stationData = response?.data; // Store the fetched data
      console.log("Data fetched successfully:", this.stationData);
      console.log(this.enteredFromDate, this.enteredEndDate);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      this.isLoading = false; // Set loading to false once data is fetched or in case of error
    }
  }

  onDateChangeFromDate(event: any): void {
    console.log("event.target.value", event.target.value);
    this.enteredFromDate = event.target.value;

    // this.fetchStationData(this.enteredFromDate);
  }
  onDateChangeEndDate(event: any): void {
    console.log("event.target.value", event.target.value);
    this.enteredEndDate = event.target.value;

    // this.fetchStationData(this.enteredEndDate);
  }

  async filterStationData(): Promise<void> {
    await this.fetchStationData(this.enteredFromDate, this.enteredEndDate);

    this.filteredData = this.stationData;
    console.log("sd data ->", this.stationData);
    console.log("fl data ->", this.filteredData);

    if (this.selectedRegion && this.selectedRegion.length > 0) {
      this.filteredData = this.filteredData.filter((station: any) =>
        this.selectedRegion.includes(station.region_code)
      );
    }

    if (this.selectedMCData && this.selectedMCData.length > 0) {
      const selectedMCNames = this.selectedMCData.map((mc) => mc.centre_name);
      this.filteredData = this.filteredData.filter((station: any) =>
        selectedMCNames.includes(station.centre_name)
      );
      console.log("filteredData after rmc:", this.filteredData);
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

    await this.fetchUnifiedFileFromBackend();
  }

  // New functions are below to get the data on ng init
  // MC Data
  getAllMCData(): void {
    this.centerService.fetchData("MC").subscribe(
      (response) => {
        console.log("getAllMCData", response);
        this.allCentersMC = response.data;
        // Regions may have already auto-selected and run onRegionChange()
        // before this MC data arrived — recompute centersMC1 now.
        if (this.selectedRegion && this.selectedRegion.length > 0) {
          this.onRegionChange();
        }
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
        this.allCentersRMC = response.data;
        // Regions may have already auto-selected and run onRegionChange()
        // before this RMC data arrived — recompute centersRMC1 now.
        if (this.selectedRegion && this.selectedRegion.length > 0) {
          this.onRegionChange();
        }
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
        // Regions may have loaded before districts — recompute districtCodeList now
        if (this.selectedRegion && this.selectedRegion.length > 0) {
          this.onRegionChange();
        }
        // Auto-load IMD data on page open once districts are ready
        this.filterStationData();
      },
      (error) => {
        console.error("Error fetching center details:", error);
      }
    );
  }

  groupByDates(data: any): any {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return { columns: [], rows: [] };
    }
    const uniqueDates = Array.from(
      new Set(
        data.map(
          (entry: any) =>
            new Date(entry.collection_date).toISOString().split("T")[0]
        )
      )
    );
    uniqueDates.sort();

    const stationMap: any = {};

    data.forEach((entry: any) => {
      const date = new Date(entry.collection_date).toISOString().split("T")[0];

      if (!stationMap[entry.station_id]) {
        stationMap[entry.station_id] = {
          state_name: entry.state_name,
          district_name: entry.district_name,
          block_name: entry.block_name,
          block_code: entry.block_code,
          station_name: entry.station_name,
          station_id: entry.station_id,
          latitude: Number(parseFloat(entry.latitude).toFixed(4)),
          longitude: Number(parseFloat(entry.longitude).toFixed(4))
        };
        uniqueDates.forEach((d: any) => {
          stationMap[entry.station_id][d] = null;
        });
      }

      stationMap[entry.station_id][date] = entry.data;
    });

    return {
      columns: ["state_name", "district_name", "block_name", "station_name", "station_id", "latitude", "longitude", ...uniqueDates],
      rows: Object.values(stationMap),
    };
  }


  // async fetchUnifiedFileFromBackend() {
  //   this.isLoading = true; // Set loading to true before starting the API call
  //   const districtCodesSet = new Set<any>();
  //   this.filteredData.forEach((item: { district_code: string }) => {
  //     if (item.district_code) {
  //       districtCodesSet.add(item.district_code);
  //     }
  //   });

  //   const districtCodesList = this.selectedDistrictData.map(
  //     (item: any) => item.district_code
  //   );

  //   // const districtCodesList: string[] = Array.from(districtCodesSet);
  //   console.log("selectedDistrictCodes---->", districtCodesList);
  //   try {
  //     const response: any = await this.fetchStationDataService
  //       .fetchFilteredStationUnifiedFile(
  //         this.enteredFromDate,
  //         this.enteredEndDate,
  //         districtCodesList
  //       )
  //       .toPromise();
  //     this.stationData = response?.data; // Store the fetched data
  //     console.log(
  //       "Data fetched successfully from fetchUnifiedFileFromBackend:",
  //       this.stationData
  //     );
  //     console.log(this.enteredFromDate, this.enteredEndDate);
  //     const result = this.groupByDates(this.stationData);
  //     this.DailyWiseStationcolumns = result.columns;
  //     this.DailyWiseStationRows = result.rows;
  //   } catch (error) {
  //     console.error("Error fetching data:", error);
  //   } finally {
  //     this.isLoading = false; // Set loading to false once data is fetched or in case of error
  //   }
  // }


// Fetch data using the districtCodeList directly
async fetchUnifiedFileFromBackend() {
  this.isLoading = true; // Set loading to true before starting the API call

  console.log("selectedDistrictCodes---->", this.districtCodeList, this.districtCodeList?.length);
  try {
    const response: any = await this.fetchStationDataService
      .fetchFilteredStationUnifiedFileFTP(
        this.enteredFromDate,
        this.enteredEndDate,
        this.districtCodeList
      )
      .toPromise();
    this.stationData = response?.data; // Store the fetched data
    console.log(
      "Data fetched successfully from fetchUnifiedFileFromBackend:",
      this.stationData
    );
    console.log(this.enteredFromDate, this.enteredEndDate);
    const result = this.groupByDates(this.stationData);
    this.DailyWiseStationcolumns = result.columns;
    this.DailyWiseStationRows = result.rows;
    console.log('result.rows', result.rows);
    this.cdr.detectChanges();
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    this.isLoading = false;
  }
}

onTabChange(tab: string): void {
  this.selectedTab = tab;
  if (tab === 'StateGovtAWS' && (!this.govtAwsRows || this.govtAwsRows.length === 0)) {
    this.fetchGovtAwsStationData();
  }
}

async fetchGovtAwsStationData(): Promise<void> {
  this.govtAwsIsLoading = true;

  try {
    const response: any = await this.allAwsDataService
      .fetchGovtAwsUnifiedFile(this.govtAwsEnteredFromDate, this.govtAwsEnteredEndDate, this.districtCodeList)
      .toPromise();
    const result = this.groupByDates(response?.data);
    this.govtAwsColumns = result.columns;
    this.govtAwsRows = result.rows;
    this.cdr.detectChanges();
  } catch (error) {
    console.error("Error fetching State Govt AWS data:", error);
  } finally {
    this.govtAwsIsLoading = false;
    this.cdr.detectChanges();
  }
}

formatDateToDDMMYYYY(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    // If it's not a valid date, return the original string
    return dateString;
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}


onDownload() {
  if (!this.DailyWiseStationcolumns || !this.DailyWiseStationRows) {
    console.error("No data available for download.");
    return;
  }

  // Format dates for display
  const fromDateFormatted = this.formatDateToDDMMYYYY(this.enteredFromDate || this.getCurrentDateFormatted());
  const toDateFormatted = this.formatDateToDDMMYYYY(this.enteredEndDate || this.getCurrentDateFormatted());
  
  // Create dynamic title based on selections
  let titleParts = [];
  
  if (this.selectedRegion && this.selectedRegion.length > 0) {
    const regionNames = this.regions
      .filter(r => this.selectedRegion.includes(r.value))
      .map(r => r.label)
      .join(', ');
    titleParts.push(`Region: ${regionNames}`);
  }
  
  if (this.selectedMCData && this.selectedMCData.length > 0) {
    const mcNames = this.selectedMCData.map(mc => mc.centre_name).join(', ');
    titleParts.push(`MC: ${mcNames}`);
  }
  
  if (this.selectedRMCData && this.selectedRMCData.length > 0) {
    const rmcNames = this.selectedRMCData.map(rmc => rmc.centre_name).join(', ');
    titleParts.push(`RMC: ${rmcNames}`);
  }
  
  if (this.selectedStateData && this.selectedStateData.length > 0) {
    const stateNames = this.selectedStateData.map(state => state.state_name).join(', ');
    titleParts.push(`States: ${stateNames}`);
  }
  
  if (this.selectedDistrictData && this.selectedDistrictData.length > 0) {
    const districtNames = this.selectedDistrictData.map(district => district.district_name).join(', ');
    titleParts.push(`Districts: ${districtNames}`);
  }

  const titleRow = titleParts.length > 0 ? titleParts.join(' | ') : 'All Stations';
  const dateRange = `Period: ${fromDateFormatted} to ${toDateFormatted}`;
  
  // Create header information
  const headerInfo = [
    ['IMD Rainfall Information System - Daily Station Data'],
    [''], // Empty row
    [titleRow],
    [dateRange],
    ['Generated on: ' + new Date().toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })],
    [''], // Empty row
    ['IMPORTANT NOTES:'],
    ['• All rainfall values are in millimeters (mm)'],
    ['• "-999.9" indicates no data available or not entered data'],
    ['• Data source: India Meteorological Department (IMD)'],
    [''], // Empty row before data table
  ];

  // Ensure rows are in array format
  const formattedRows = this.DailyWiseStationRows.map((row: any) => {
    if (Array.isArray(row)) {
      return row;
    } else {
      return this.DailyWiseStationcolumns.map((col: string | number) => row[col]);
    }
  });

  // Combine header info, column headers, and data rows
  const worksheetData = [
    ...headerInfo,
    this.DailyWiseStationcolumns, // Column headers
    ...formattedRows // Data rows
  ];

  try {
    // Create a worksheet
    const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Calculate optimal column widths
    const columnWidths: any[] = [];
    const dataStartRow = headerInfo.length; // Row where actual data starts
    
    // Calculate width for each column
    this.DailyWiseStationcolumns.forEach((header: string, colIndex: number) => {
      let maxWidth = header.length; // Start with header length
      
      // Check all data rows for this column
      formattedRows.forEach((row: any[]) => {
        const cellValue = row[colIndex];
        if (cellValue !== null && cellValue !== undefined) {
          const cellLength = cellValue.toString().length;
          maxWidth = Math.max(maxWidth, cellLength);
        }
      });
      
      // Set minimum width of 15 and maximum of 30, add padding
      const adjustedWidth = Math.min(Math.max(maxWidth + 3, 15), 30);
      columnWidths.push({ wch: adjustedWidth });
    });

    // Apply column widths (extend to cover header info rows)
    const maxColumns = Math.max(this.DailyWiseStationcolumns.length, 1);
    worksheet['!cols'] = Array.from({ length: maxColumns }, (_, i) => 
      columnWidths[i] || { wch: 20 }
    );

    // Style the main title (Row 1)
    const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
    if (worksheet[titleCell]) {
      worksheet[titleCell].s = {
        font: { 
          bold: true, 
          italic: true,
          sz: 16, 
          color: { rgb: "FFFFFF" },
          name: "Calibri"
        },
        fill: { fgColor: { rgb: "1F4E79" } }, // Deep blue
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    // Style the selection info (Row 3)
    const selectionCell = XLSX.utils.encode_cell({ r: 2, c: 0 });
    if (worksheet[selectionCell]) {
      worksheet[selectionCell].s = {
        font: { 
          bold: true, 
          italic: true,
          sz: 12,
          color: { rgb: "1F4E79" },
          name: "Calibri"
        },
        fill: { fgColor: { rgb: "E7F3FF" } }, // Light blue
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    // Style the date range (Row 4)
    const dateCell = XLSX.utils.encode_cell({ r: 3, c: 0 });
    if (worksheet[dateCell]) {
      worksheet[dateCell].s = {
        font: { 
          bold: true, 
          italic: true,
          sz: 11,
          color: { rgb: "1F4E79" },
          name: "Calibri"
        },
        fill: { fgColor: { rgb: "E7F3FF" } }, // Light blue
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    // Style the generation date (Row 5)
    const genCell = XLSX.utils.encode_cell({ r: 4, c: 0 });
    if (worksheet[genCell]) {
      worksheet[genCell].s = {
        font: { 
          italic: true,
          sz: 10,
          color: { rgb: "666666" },
          name: "Calibri"
        },
        fill: { fgColor: { rgb: "F8F9FA" } }, // Very light gray
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    // Style the "IMPORTANT NOTES:" header (Row 7)
    const notesHeaderCell = XLSX.utils.encode_cell({ r: 6, c: 0 });
    if (worksheet[notesHeaderCell]) {
      worksheet[notesHeaderCell].s = {
        font: { 
          bold: true, 
          sz: 12,
          color: { rgb: "B91C1C" }, // Red color for emphasis
          name: "Calibri"
        },
        fill: { fgColor: { rgb: "FEF3C7" } }, // Light yellow
        alignment: { horizontal: "left", vertical: "center" }
      };
    }

    // Style the notes bullets (Rows 8-10)
    for (let row = 7; row <= 9; row++) {
      const noteCell = XLSX.utils.encode_cell({ r: row, c: 0 });
      if (worksheet[noteCell]) {
        worksheet[noteCell].s = {
          font: { 
            italic: true,
            sz: 10,
            color: { rgb: "374151" }, // Dark gray
            name: "Calibri"
          },
          fill: { fgColor: { rgb: "FFFBEB" } }, // Very light yellow
          alignment: { horizontal: "left", vertical: "center" }
        };
      }
    }

    // Style the data headers with enhanced bold formatting
    for (let col = 0; col < this.DailyWiseStationcolumns.length; col++) {
      const headerCell = XLSX.utils.encode_cell({ r: dataStartRow, c: col });
      if (worksheet[headerCell]) {
        worksheet[headerCell].s = {
          font: { 
            bold: true,
            b: true,  // Additional bold property for better compatibility
            color: { rgb: "FFFFFF" },
            sz: 12,   // Increased font size for better visibility
            name: "Calibri"
          },
          fill: { fgColor: { rgb: "4A90A4" } }, // Your IMD blue color
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "FFFFFF" } },
            bottom: { style: "thin", color: { rgb: "FFFFFF" } },
            left: { style: "thin", color: { rgb: "FFFFFF" } },
            right: { style: "thin", color: { rgb: "FFFFFF" } }
          }
        };
      }
    }

    // Style data cells with conditional formatting for -999.9 values
    for (let row = dataStartRow + 1; row < worksheetData.length; row++) {
      for (let col = 0; col < this.DailyWiseStationcolumns.length; col++) {
        const dataCell = XLSX.utils.encode_cell({ r: row, c: col });
        if (worksheet[dataCell]) {
          const cellValue = worksheet[dataCell].v;
          
          // Highlight missing data values
          if (cellValue === -999.9 || cellValue === "-999.9") {
            worksheet[dataCell].s = {
              font: { 
                color: { rgb: "B91C1C" }, // Red text for missing data
                sz: 10,
                name: "Calibri"
              },
              fill: { fgColor: { rgb: "FEE2E2" } }, // Light red background
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "E5E7EB" } },
                bottom: { style: "thin", color: { rgb: "E5E7EB" } },
                left: { style: "thin", color: { rgb: "E5E7EB" } },
                right: { style: "thin", color: { rgb: "E5E7EB" } }
              }
            };
          } else {
            // Regular data cells with alternating row colors
            const isEvenRow = (row - dataStartRow) % 2 === 0;
            worksheet[dataCell].s = {
              font: { 
                color: { rgb: "374151" },
                sz: 10,
                name: "Calibri"
              },
              fill: { fgColor: { rgb: isEvenRow ? "F9FAFB" : "FFFFFF" } }, // Alternating row colors
              alignment: { 
                horizontal: this.isNumeric(cellValue) ? "right" : "left", 
                vertical: "center" 
              },
              border: {
                top: { style: "thin", color: { rgb: "E5E7EB" } },
                bottom: { style: "thin", color: { rgb: "E5E7EB" } },
                left: { style: "thin", color: { rgb: "E5E7EB" } },
                right: { style: "thin", color: { rgb: "E5E7EB" } }
              }
            };
          }
        }
      }
    }

    // Set merge ranges for header info
    const lastCol = Math.max(this.DailyWiseStationcolumns.length - 1, 4);
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } }, // Main title
      { s: { r: 2, c: 0 }, e: { r: 2, c: lastCol } }, // Selection info
      { s: { r: 3, c: 0 }, e: { r: 3, c: lastCol } }, // Date range
      { s: { r: 4, c: 0 }, e: { r: 4, c: lastCol } }, // Generation date
      { s: { r: 6, c: 0 }, e: { r: 6, c: lastCol } }, // Notes header
      { s: { r: 7, c: 0 }, e: { r: 7, c: lastCol } }, // Note 1
      { s: { r: 8, c: 0 }, e: { r: 8, c: lastCol } }, // Note 2
      { s: { r: 9, c: 0 }, e: { r: 9, c: lastCol } }, // Note 3
    ];

    // Create a workbook and append the worksheet
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Station Data");

    // Generate Excel file and trigger download
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array"
    });

    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

    // Generate descriptive filename
    const currentDate = new Date().toISOString().split('T')[0];
    const filenamePrefix = titleParts.length > 0 ? 
      titleParts[0].replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20) : 
      'AllStations';
    const filename = `IMD_Station_Data_${filenamePrefix}_${fromDateFormatted.replace(/-/g, '')}_to_${toDateFormatted.replace(/-/g, '')}.xlsx`;

    // Save the file using FileSaver
    saveAs(blob, filename);
    
    console.log("Excel file downloaded successfully with enhanced header styling.");
  } catch (error) {
    console.error("Error generating Excel file:", error);
  }
}





onDownloadGovtAws(): void {
  if (!this.govtAwsColumns || !this.govtAwsRows || this.govtAwsRows.length === 0) return;

  const fromFormatted = this.formatDateToDDMMYYYY(this.govtAwsEnteredFromDate);
  const toFormatted = this.formatDateToDDMMYYYY(this.govtAwsEnteredEndDate);

  const headerInfo = [
    ['IRAINS - State Govt AWS Daily Station Data'],
    [''],
    [`Period: ${fromFormatted} to ${toFormatted}`],
    ['Generated on: ' + new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })],
    [''],
    ['IMPORTANT NOTES:'],
    ['• All rainfall values are in millimeters (mm)'],
    ['• "-999.9" indicates no data available or not entered data'],
    ['• Data source: State Govt AWS network'],
    [''],
  ];

  const formattedRows = this.govtAwsRows.map((row: any) =>
    this.govtAwsColumns.map((col: string) => row[col])
  );

  const worksheetData = [...headerInfo, this.govtAwsColumns, ...formattedRows];
  const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(worksheetData);

  const lastCol = Math.max(this.govtAwsColumns.length - 1, 4);
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: lastCol } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: lastCol } },
    { s: { r: 5, c: 0 }, e: { r: 5, c: lastCol } },
    { s: { r: 6, c: 0 }, e: { r: 6, c: lastCol } },
    { s: { r: 7, c: 0 }, e: { r: 7, c: lastCol } },
    { s: { r: 8, c: 0 }, e: { r: 8, c: lastCol } },
  ];

  const workbook: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'State Govt AWS Data');

  const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  const filename = `StateGovtAWS_Station_Data_${fromFormatted.replace(/-/g, '')}_to_${toFormatted.replace(/-/g, '')}.xlsx`;
  saveAs(blob, filename);
}

// ─── Chart helpers ────────────────────────────────────────────────────────────

private getDateCols(columns: string[]): string[] {
  return (columns || []).filter(c => !this.imdFixedCols.includes(c));
}

private monsoonCategory(val: any): string {
  const v = parseFloat(val);
  if (val === null || val === undefined || isNaN(v)) return 'No Data';
  if (v === -999.9) return 'No Data';
  if (v === 0)      return 'Zero Rain';
  if (v <= 2.4)     return 'Very Light Rain';
  if (v <= 15.5)    return 'Light Rain';
  if (v <= 64.4)    return 'Moderate Rain';
  if (v <= 115.5)   return 'Heavy Rain';
  if (v <= 204.4)   return 'Very Heavy Rain';
  return 'Extremely Heavy';
}

private readonly imdColorMap: Record<string, string> = {
  'Zero Rain':       '#FFFFFF',
  'Very Light Rain': '#AAF200',
  'Light Rain':      '#00FF00',
  'Moderate Rain':   '#00FFFF',
  'Heavy Rain':      '#FFFF00',
  'Very Heavy Rain': '#FF8C00',
  'Extremely Heavy': '#FF0000',
  'No Data':         '#c0c0c0',
};

private computeMonsoon(rows: any[], dateCols: string[]): { name: string; y: number; color: string }[] {
  const lastDate = dateCols[dateCols.length - 1];
  const counts: Record<string, number> = {
    'Zero Rain':0,'Very Light Rain':0,'Light Rain':0,'Moderate Rain':0,
    'Heavy Rain':0,'Very Heavy Rain':0,'Extremely Heavy':0,'No Data':0
  };
  rows.forEach(r => counts[this.monsoonCategory(r[lastDate])]++);
  return Object.entries(counts).filter(([,y]) => y > 0).map(([name, y]) => ({ name, y, color: this.imdColorMap[name] }));
}

private computeAvailability(rows: any[], dateCols: string[]): { name: string; y: number; color: string }[] {
  let actual = 0, missing = 0, noEntry = 0;
  rows.forEach(r => dateCols.forEach(d => {
    const v = r[d];
    if (v === null || v === undefined) noEntry++;
    else if (parseFloat(v) === -999.9) missing++;
    else actual++;
  }));
  return [
    { name: 'Has Data',    y: actual,  color: '#4CAF50' },
    { name: 'No Data (-999.9)', y: missing, color: '#F44336' },
    { name: 'Not Entered', y: noEntry, color: '#9E9E9E' }
  ].filter(d => d.y > 0);
}

private computeTop10(rows: any[], dateCols: string[]): { names: string[]; totals: number[] } {
  const totals = rows.map(r => ({
    name: r.station_name || r.station_id || 'Unknown',
    total: parseFloat(dateCols.reduce((s,d) => { const v = parseFloat(r[d]); return s + (!isNaN(v) && v !== -999.9 ? v : 0); }, 0).toFixed(2))
  }));
  totals.sort((a,b) => b.total - a.total);
  const top10 = totals.slice(0, 10);
  return { names: top10.map(t => t.name), totals: top10.map(t => t.total) };
}

private computeStateAvg(rows: any[], dateCols: string[]): { states: string[]; avgs: number[] } {
  const map: Record<string, number[]> = {};
  rows.forEach(r => {
    const s = r.state_name || 'Unknown';
    if (!map[s]) map[s] = [];
    dateCols.forEach(d => { const v = parseFloat(r[d]); if (!isNaN(v) && v !== -999.9) map[s].push(v); });
  });
  const states = Object.keys(map).sort();
  return { states, avgs: states.map(s => map[s].length ? parseFloat((map[s].reduce((a,b)=>a+b,0)/map[s].length).toFixed(2)) : 0) };
}

// ─── Chart builders ───────────────────────────────────────────────────────────

buildImdCharts(): void {
  if (!this.DailyWiseStationRows?.length) return;
  const dateCols = this.getDateCols(this.DailyWiseStationcolumns);
  if (!dateCols.length) return;

  const monsoonData    = this.computeMonsoon(this.DailyWiseStationRows, dateCols);
  const availData      = this.computeAvailability(this.DailyWiseStationRows, dateCols);
  const { names, totals } = this.computeTop10(this.DailyWiseStationRows, dateCols);
  const { states, avgs: stateAvgs } = this.computeStateAvg(this.DailyWiseStationRows, dateCols);

  const pieLabels = { enabled: true, format: '<b>{point.name}</b><br/>{point.percentage:.1f}%', style: { fontSize: '11px' } };
  const pieLegend = { enabled: true, layout: 'horizontal' as const, align: 'center' as const, verticalAlign: 'bottom' as const, itemStyle: { fontSize: '10px', fontWeight: 'normal' } };

  this.imdMonsoonChart = new Chart({
    chart: { type: 'pie', height: 320, backgroundColor: '#f0f0f0' },
    title: { text: `Rainfall Received (${dateCols[dateCols.length-1]})`, style: { fontSize: '13px', fontWeight: '600' } },
    tooltip: { pointFormat: '<span style="color:{point.color}">●</span> {point.name}: <b>{point.y} stations ({point.percentage:.1f}%)</b>' },
    legend: pieLegend,
    plotOptions: { pie: { showInLegend: true, dataLabels: pieLabels, allowPointSelect: true, cursor: 'pointer', borderWidth: 0 } },
    series: [{ type: 'pie', name: 'Stations', data: monsoonData }],
    credits: { enabled: false },
    exporting: { enabled: true, buttons: { contextButton: { menuItems: ['viewFullscreen', 'separator', 'downloadPNG', 'downloadJPEG', 'downloadSVG'] } } }
  });

  this.imdAvailabilityChart = new Chart({
    chart: { type: 'pie', height: 320 },
    title: { text: 'Data Availability', style: { fontSize: '13px', fontWeight: '600' } },
    tooltip: { pointFormat: '<span style="color:{point.color}">●</span> {point.name}: <b>{point.y} ({point.percentage:.1f}%)</b>' },
    legend: pieLegend,
    plotOptions: { pie: { innerSize: '50%', showInLegend: true, dataLabels: pieLabels, allowPointSelect: true, cursor: 'pointer', borderWidth: 0 } },
    series: [{ type: 'pie', name: 'Records', data: availData }],
    credits: { enabled: false },
    exporting: { enabled: true, buttons: { contextButton: { menuItems: ['viewFullscreen', 'separator', 'downloadPNG', 'downloadJPEG', 'downloadSVG'] } } }
  });

  this.imdTop10Chart = new Chart({
    chart: { type: 'bar', height: 320 },
    title: { text: 'Top 10 Stations by Total Rainfall', style: { fontSize: '13px', fontWeight: '600' } },
    xAxis: { categories: names, labels: { style: { fontSize: '10px' } } },
    yAxis: { title: { text: 'Total Rainfall (mm)' } },
    tooltip: { valueSuffix: ' mm' },
    legend: { enabled: true },
    plotOptions: { bar: { dataLabels: { enabled: true, format: '{y:.1f} mm', style: { fontSize: '10px' } } } },
    series: [{ type: 'bar', name: 'Total Rainfall (mm)', data: totals, color: '#4A90A4' }],
    credits: { enabled: false },
    exporting: { enabled: true, buttons: { contextButton: { menuItems: ['viewFullscreen', 'separator', 'downloadPNG', 'downloadJPEG', 'downloadSVG'] } } }
  });

  this.imdStateChart = new Chart({
    chart: { type: 'column', height: 320 },
    title: { text: 'State-wise Average Rainfall', style: { fontSize: '13px', fontWeight: '600' } },
    xAxis: { categories: states, labels: { rotation: -45, style: { fontSize: '10px' } } },
    yAxis: { title: { text: 'Avg Rainfall (mm)' } },
    tooltip: { valueSuffix: ' mm' },
    legend: { enabled: true },
    plotOptions: { column: { dataLabels: { enabled: true, format: '{y:.1f}', style: { fontSize: '10px' } } } },
    series: [{ type: 'column', name: 'Avg Rainfall (mm)', data: stateAvgs, color: '#1F4E79' }],
    credits: { enabled: false },
    exporting: { enabled: true, buttons: { contextButton: { menuItems: ['viewFullscreen', 'separator', 'downloadPNG', 'downloadJPEG', 'downloadSVG'] } } }
  });

  this.cdr.detectChanges();
}

buildGovtAwsStatsTables(): void {
  if (!this.govtAwsRows?.length) return;
  const dateCols = this.getDateCols(this.govtAwsColumns);
  if (!dateCols.length) return;

  const monsoonData = this.computeMonsoon(this.govtAwsRows, dateCols);
  const availData   = this.computeAvailability(this.govtAwsRows, dateCols);
  const { names, totals } = this.computeTop10(this.govtAwsRows, dateCols);
  const { states, avgs: stateAvgs } = this.computeStateAvg(this.govtAwsRows, dateCols);

  const monsoonTotal = monsoonData.reduce((s, d) => s + d.y, 0);
  this.govtAwsMonsoonTable = monsoonData.map(d => ({
    category: d.name, count: d.y, pct: monsoonTotal ? parseFloat((d.y / monsoonTotal * 100).toFixed(1)) : 0
  }));

  const availTotal = availData.reduce((s, d) => s + d.y, 0);
  this.govtAwsAvailabilityTable = availData.map(d => ({
    status: d.name, count: d.y, pct: availTotal ? parseFloat((d.y / availTotal * 100).toFixed(1)) : 0
  }));

  this.govtAwsTop10Table = names.map((name, i) => ({ rank: i + 1, stationName: name, total: totals[i] }));

  const pieLabels = { enabled: true, format: '<b>{point.name}</b><br/>{point.percentage:.1f}%', style: { fontSize: '11px' } };
  const pieLegend = { enabled: true, layout: 'horizontal' as const, align: 'center' as const, verticalAlign: 'bottom' as const, itemStyle: { fontSize: '10px', fontWeight: 'normal' } };

  this.govtAwsMonsoonChart = new Chart({
    chart: { type: 'pie', height: 320, backgroundColor: '#f0f0f0' },
    title: { text: `Rainfall Received (${dateCols[dateCols.length-1]})`, style: { fontSize: '13px', fontWeight: '600' } },
    tooltip: { pointFormat: '<span style="color:{point.color}">●</span> {point.name}: <b>{point.y} stations ({point.percentage:.1f}%)</b>' },
    legend: pieLegend,
    plotOptions: { pie: { showInLegend: true, dataLabels: pieLabels, allowPointSelect: true, cursor: 'pointer', borderWidth: 0 } },
    series: [{ type: 'pie', name: 'Stations', data: monsoonData }],
    credits: { enabled: false },
    exporting: { enabled: true, buttons: { contextButton: { menuItems: ['viewFullscreen', 'separator', 'downloadPNG', 'downloadJPEG', 'downloadSVG'] } } }
  });

  this.govtAwsAvailabilityChart = new Chart({
    chart: { type: 'pie', height: 320 },
    title: { text: 'Data Availability', style: { fontSize: '13px', fontWeight: '600' } },
    tooltip: { pointFormat: '<span style="color:{point.color}">●</span> {point.name}: <b>{point.y} ({point.percentage:.1f}%)</b>' },
    legend: pieLegend,
    plotOptions: { pie: { innerSize: '50%', showInLegend: true, dataLabels: pieLabels, allowPointSelect: true, cursor: 'pointer', borderWidth: 0 } },
    series: [{ type: 'pie', name: 'Records', data: availData }],
    credits: { enabled: false },
    exporting: { enabled: true, buttons: { contextButton: { menuItems: ['viewFullscreen', 'separator', 'downloadPNG', 'downloadJPEG', 'downloadSVG'] } } }
  });

  this.govtAwsTop10Chart = new Chart({
    chart: { type: 'bar', height: 320 },
    title: { text: 'Top 10 Stations by Total Rainfall', style: { fontSize: '13px', fontWeight: '600' } },
    xAxis: { categories: names, labels: { style: { fontSize: '10px' } } },
    yAxis: { title: { text: 'Total Rainfall (mm)' } },
    tooltip: { valueSuffix: ' mm' },
    legend: { enabled: true },
    plotOptions: { bar: { dataLabels: { enabled: true, format: '{y:.1f} mm', style: { fontSize: '10px' } } } },
    series: [{ type: 'bar', name: 'Total Rainfall (mm)', data: totals, color: '#4A90A4' }],
    credits: { enabled: false },
    exporting: { enabled: true, buttons: { contextButton: { menuItems: ['viewFullscreen', 'separator', 'downloadPNG', 'downloadJPEG', 'downloadSVG'] } } }
  });

  this.govtAwsStateChart = new Chart({
    chart: { type: 'column', height: 320 },
    title: { text: 'State-wise Average Rainfall', style: { fontSize: '13px', fontWeight: '600' } },
    xAxis: { categories: states, labels: { rotation: -45, style: { fontSize: '10px' } } },
    yAxis: { title: { text: 'Avg Rainfall (mm)' } },
    tooltip: { valueSuffix: ' mm' },
    legend: { enabled: true },
    plotOptions: { column: { dataLabels: { enabled: true, format: '{y:.1f}', style: { fontSize: '10px' } } } },
    series: [{ type: 'column', name: 'Avg Rainfall (mm)', data: stateAvgs, color: '#1F4E79' }],
    credits: { enabled: false },
    exporting: { enabled: true, buttons: { contextButton: { menuItems: ['viewFullscreen', 'separator', 'downloadPNG', 'downloadJPEG', 'downloadSVG'] } } }
  });

  this.cdr.detectChanges();
}

formatCellValue(value: any): string {
  if (value === null || value === undefined) {
    return '-';
  }
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  return value.toString();
}

isNumeric(value: any): boolean {
  return typeof value === 'number' || (!isNaN(value) && !isNaN(parseFloat(value)));
}

// ─── Station Map ─────────────────────────────────────────────────────────────

private async getIndiaStateGeojson(): Promise<any> {
  if (!this.indiaStateGeojson) {
    const res = await fetch('assets/geojson/INDIA_STATE.json');
    this.indiaStateGeojson = await res.json();
  }
  return this.indiaStateGeojson;
}

private async getIndiaCountryGeojson(): Promise<any> {
  if (!this.indiaCountryGeojson) {
    const res = await fetch('assets/geojson/INDIA_COUNTRY.json');
    this.indiaCountryGeojson = await res.json();
  }
  return this.indiaCountryGeojson;
}

private addIndiaMask(map: any, countryGeoJson: any): void {
  const feature = (countryGeoJson.features || [countryGeoJson])[0];
  const geom = feature.geometry;
  const worldBox: [number, number][] = [[-180,-90],[180,-90],[180,90],[-180,90],[-180,-90]];

  let maskCoords: any[];
  if (geom.type === 'Polygon') {
    maskCoords = [worldBox, ...geom.coordinates];
  } else {
    // MultiPolygon — each polygon's outer ring becomes a hole
    maskCoords = [worldBox, ...geom.coordinates.map((p: any[][]) => p[0])];
  }

  L.geoJSON({ type: 'Feature', geometry: { type: 'Polygon', coordinates: maskCoords }, properties: {} } as any, {
    style: () => ({ stroke: false, fillColor: '#000000', fillOpacity: 0.5, fillRule: 'evenodd' as any })
  }).addTo(map);
}

private async initStationMap(mapId: string, rows: any[], dateCols: string[]): Promise<any> {
  const el = document.getElementById(mapId);
  if (!el || !rows?.length || !dateCols.length) return null;

  const [stateGeojson, countryGeojson] = await Promise.all([
    this.getIndiaStateGeojson(),
    this.getIndiaCountryGeojson()
  ]);
  const lastDate = dateCols[dateCols.length - 1];

  const map = L.map(el, { zoomControl: true }).setView([22, 76], 5);
  setTimeout(() => map.invalidateSize(), 200);

  // Satellite base layer
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri',
    maxZoom: 18
  }).addTo(map);

  // Pale mask over everything outside India
  this.addIndiaMask(map, countryGeojson);

  // White state boundary lines over satellite
  L.geoJSON(stateGeojson, {
    style: () => ({ color: '#ffffff', weight: 1, fillColor: 'transparent', fillOpacity: 0 })
  }).addTo(map);

  rows.forEach((row: any) => {
    const lat = parseFloat(row.latitude);
    const lng = parseFloat(row.longitude);
    if (isNaN(lat) || isNaN(lng)) return;

    const val = row[lastDate];
    const category = this.monsoonCategory(val);
    const color = this.imdColorMap[category] || '#c0c0c0';
    const rainfall = (val === null || val === undefined)
      ? 'N/A'
      : (parseFloat(val) === -999.9 ? 'No Data' : `${val} mm`);

    L.circleMarker([lat, lng] as [number, number], {
      radius: 5, fillColor: color, color: '#444', weight: 0.5, opacity: 1, fillOpacity: 0.9
    })
    .bindPopup(
      `<b>${row.station_name || row.station_id || '—'}</b><br>` +
      `State: ${row.state_name || '—'}<br>` +
      `District: ${row.district_name || '—'}<br>` +
      `${lastDate}: ${rainfall}`
    )
    .addTo(map);
  });

  // Custom legend
  const legend = (L.control as any)({ position: 'bottomright' });
  legend.onAdd = () => {
    const div = L.DomUtil.create('div', '');
    div.style.cssText = 'background:white;padding:8px 12px;border-radius:6px;font-size:11px;line-height:2;box-shadow:0 2px 6px rgba(0,0,0,0.25)';
    div.innerHTML = `<b style="font-size:12px;display:block;margin-bottom:2px">Rainfall (${lastDate})</b>` +
      Object.entries(this.imdColorMap).map(([name, clr]) =>
        `<span style="display:inline-block;width:11px;height:11px;background:${clr};border-radius:50%;` +
        `margin-right:5px;border:1px solid #555;vertical-align:middle;"></span>${name}`
      ).join('<br>');
    return div;
  };
  legend.addTo(map);

  return map;
}

// ─── Statistics: in-page map left + charts right ─────────────────────────────

openImdStatistics(): void {
  this.buildImdCharts();
  this.showImdStatistics = true;
  this.cdr.detectChanges();
  setTimeout(async () => {
    if (this.imdStatsMap) { try { this.imdStatsMap.remove(); } catch(e){} this.imdStatsMap = null; }
    const dateCols = this.getDateCols(this.DailyWiseStationcolumns);
    this.imdStatsMap = await this.initStationMap('imd-stats-map', this.DailyWiseStationRows, dateCols);
  }, 150);
}

closeImdStatistics(): void {
  if (this.imdStatsMap) { try { this.imdStatsMap.remove(); } catch(e){} this.imdStatsMap = null; }
  this.showImdStatistics = false;
}

openGovtAwsStatistics(): void {
  this.buildGovtAwsStatsTables();
  this.showGovtAwsStatistics = true;
  this.cdr.detectChanges();
  setTimeout(async () => {
    if (this.govtAwsStatsMap) { try { this.govtAwsStatsMap.remove(); } catch(e){} this.govtAwsStatsMap = null; }
    const dateCols = this.getDateCols(this.govtAwsColumns);
    this.govtAwsStatsMap = await this.initStationMap('govt-aws-stats-map', this.govtAwsRows, dateCols);
  }, 150);
}

closeGovtAwsStatistics(): void {
  if (this.govtAwsStatsMap) { try { this.govtAwsStatsMap.remove(); } catch(e){} this.govtAwsStatsMap = null; }
  this.showGovtAwsStatistics = false;
}

}
