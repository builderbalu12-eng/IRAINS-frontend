import {
  Component,
  Input,
  Renderer2,
  ElementRef,
  AfterViewInit,
  HostListener,
} from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { DataService } from "src/app/data.service";
import { SubdivisionService } from "src/app/services/subDivision/subDivision.service";
import { SubdivDownloadStatistics } from "src/app/services/subDivision/statisticsdownload.service";
import { CountryService } from "src/app/services/country/country.service";
import { StateService } from "src/app/services/state/state.service";
import { Constants } from "src/app/services/constants";
import { SubdivRainFallDeparture } from "src/app/services/subDivision/rainfalldeparturedownload.service";
import { style } from "@angular/animations";
import { DistrictRainFallDeparture } from "src/app/services/district/rainfalldeparturedownload.service";
import { PdfMakeService } from "src/app/services/pdfMake.service.ts/pdfFromHTML.service";
import { getStateService } from "src/app/services/state/getState.service";
import { lastValueFrom } from "rxjs";

@Component({
  selector: 'app-rainfall-departures-section',
  templateUrl: './rainfall-departures-section.component.html',
  styleUrls: ['./rainfall-departures-section.component.css']
})
export class RainfallDeparturesSectionComponent {

  sortColumn: number | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';
  years: any[] = [];
  selectedYear: any;
  loading: boolean = false; // Add this line
  selectedModeUnifiedOrDataEntry: any;
  fromDate: any;
  enddate: any;
  title : any;
  periodTitle : any;
  // District row -> state_code, used to group districts under their state
  districtRowStateCode = new Map<any, any>();
  // state_code -> state_name (loaded once)
  stateNames = new Map<string, string>();
  // What the table and the PDF show: `rows`, with District rows grouped under state names
  displayRows: any[] = [];



  // Sorting function
  sortTable(colIndex: number): void {
    if (this.sortColumn === colIndex) {
      // If clicking the same column, toggle the sorting direction
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Set the new column as the sorting column
      this.sortColumn = colIndex;
      this.sortDirection = 'asc'; // Default to ascending order
    }

    this.rows.sort((a : any, b : any) => {
      const valueA = a[colIndex].content;
      const valueB = b[colIndex].content;

      // Handle numbers, strings, or any data type
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return this.sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      } else if (typeof valueA === 'string' && typeof valueB === 'string') {
        return this.sortDirection === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      return 0;
    });
    // For District, this sorts the districts within each state
    this.displayRows = this.buildDisplayRows();
  }


  
    async onSubmitButton() {
      this.loading = true
      try {
      this.rows = []
      this.displayRows = []
      this.districtRowStateCode.clear()
      const date = new Date()
      let listofdata : any[] = []
      const {
        startDate,
        endDate
      } = this.constants.getCurrentMonthSeasonFromAndToCurrentDate(new Date())

      this.fromDate = startDate.split('-').reverse().join('-')
      this.enddate = endDate.split('-').reverse().join('-')



      this.title = `${ this.selectedMap } - Week By Week Departures (${ this.selectedMode })`
      this.periodTitle = `Period: ${this.fromDate} To ${this.enddate}`



      if(this.selectedMode == 'Weekly'){
        console.log('year......', date.getFullYear(), this.selectedYear)
        listofdata = this.constants.getWeeklyIntervals(this.selectedSeason.toLowerCase(), this.selectedYear)

      }else{
       listofdata = this.constants.getWeeklyByCummulative(this.selectedSeason.toLowerCase(),this.selectedYear)
      }

      // When the season starts on a Thursday, the first "week" comes back inverted
      // (e.g. 2026-10-01 to 2026-09-30) and the API rejects it with a 400 — drop it
      listofdata = listofdata.filter((week: any) => week.startDate <= week.endDate)

      this.columns = [
        { header: 'S.NO', style: 'border: 1px solid black' },
        { header: this.selectedMap, style: 'border: 1px solid black' },
      ];

      for(let i=0; i<listofdata.length; i++){
        this.columns.push(
           { header : listofdata[i].endDate.split('-').reverse().join('-'), style: 'border: 1px solid black'}
        )
      }

      if(this.selectedMap == 'Subdivision'){
        this.rows = []

        if(this.selectedModeUnifiedOrDataEntry.selectedMode=='Unified'){
          this.rows = await this.subDivRainFallDep.updateAndShowFromFTP(listofdata)

        }else{
          this.rows = await this.subDivRainFallDep.updateAndShowFromDataEnrty(listofdata)
        }
      }
      else{
        this.rows = []

        if(this.selectedModeUnifiedOrDataEntry.selectedMode=='Unified'){
          this.rows = await this.districtRainfallDep.updateAndShowFromFTP(listofdata)

        }else{
          this.rows = await this.districtRainfallDep.updateAndShowFromDataEntry(listofdata)
        }

        // Rows are built in the same order as the first week's district list
        const districts = this.districtRainfallDep.allData[0] || []
        this.rows.forEach((row: any, i: number) => this.districtRowStateCode.set(row, districts[i]?.state_code))
        await this.loadStateNames()
      }
      this.displayRows = this.buildDisplayRows()
      } catch (error) {
        console.error('Error loading rainfall departures:', error)
      } finally {
        // Always stop the spinner, even if a week's fetch/row build fails
        this.loading = false
      }
    }

    modes: string[] = [
      "Weekly",
      "Cummulative"
    ];
    maps: string[] = ["Subdivision", "District"];
    seasons : any [] = [
      "Winter",
      "PreMonsoon",
      "Monsoon",
      "PostMonsoon",
    ]
    
    selectedSeason: string = "Winter";
    selectedMode : string = "Weekly"
    selectedMap: string = "Subdivision"; 
    mapData: any = null; 
    filteredData: any;
    rows: any = [];
    columns: any[] = [];
  
    constructor(
      private http: HttpClient,
      private dataService: DataService,
      private renderer: Renderer2,
      private elRef: ElementRef,
      private subdivisionService: SubdivisionService,
      private downlaodStatistics: SubdivDownloadStatistics,
      private countryService: CountryService,
      private stateService: StateService, // Injecting the StateService
      private constants : Constants,
      private subDivRainFallDep : SubdivRainFallDeparture,
      private districtRainfallDep : DistrictRainFallDeparture,
      private pdfService : PdfMakeService,
      private getStateService : getStateService

    ) {
      const currentYear = new Date().getFullYear();
      this.selectedYear = currentYear

      for (let year = 1700; year <= currentYear; year++) {
        this.years.push(year);
      }


      let selectedMode: any = localStorage.getItem("selectedMode");
      this.selectedModeUnifiedOrDataEntry = JSON.parse(selectedMode);
      console.log('this.selected mOde', this.selectedMode)


      this.selectedSeason = this.constants.getCurrentSeason(new Date())

      this.onSubmitButton()
    }
  
    // Add this method in your NormalRainfallComponent class
  
    getDateRange(season: string) {
      const dateRanges: any = {
        Winter: "Jan - Feb",
        "Pre Monsoon": "Mar - May",
        Monsoon: "Jun - Sep",
        "Post Monsoon": "Oct - Dec",
        Annual: "Jan - Dec",
      };
  
      return dateRanges[season] || "";
    }

    
    async onDownload() {
      const title = `${this.selectedMap} - ${this.selectedMode} in ${this.selectedSeason}`;
      this.pdfService.generatePdf(this.columns, this.displayRows, this.title, this.periodTitle);
    }

    async loadStateNames() {
      if (this.stateNames.size) return
      try {
        const response = await lastValueFrom(this.getStateService.fetchData())
        for (const state of response?.data || []) {
          this.stateNames.set(String(state.state_code), state.state_name)
        }
      } catch (error) {
        console.error('Could not load state names, showing districts without state grouping:', error)
      }
    }

    // District: a state name row followed by that state's districts, states A–Z,
    // districts in the current `rows` order, S.NO renumbered top to bottom.
    // Subdivision (or no state names): `rows` as is.
    buildDisplayRows(): any[] {
      if (!this.districtRowStateCode.size || !this.stateNames.size) return this.rows

      const groups = new Map<string, any[]>()
      for (const row of this.rows) {
        const code = String(this.districtRowStateCode.get(row))
        if (!groups.has(code)) groups.set(code, [])
        groups.get(code)!.push(row)
      }

      const stateName = (code: string) => this.stateNames.get(code) || `State ${code}`
      const stateCodes = [...groups.keys()].sort((a, b) => stateName(a).localeCompare(stateName(b)))

      const grouped: any[] = []
      let sno = 1
      for (const code of stateCodes) {
        grouped.push([{
          content: stateName(code),
          colSpan: this.columns.length,
          styles: { fillColor: '#EE82EE', halign: 'left', fontStyle: 'bold' },
        }])
        for (const row of groups.get(code)!) {
          grouped.push([{ ...row[0], content: sno++ }, ...row.slice(1)])
        }
      }
      return grouped
    }

  }