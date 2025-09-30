// import { Component, OnInit, OnChanges, SimpleChanges, Input } from '@angular/core';
// import { MatSelectChange } from '@angular/material/select';
// import { Chart } from 'angular-highcharts';
// import * as Highcharts from 'highcharts';
// import { forkJoin, Observable, lastValueFrom } from 'rxjs'; // Added lastValueFrom import
// import { CountryService } from 'src/app/services/country/country.service';
// import { RegionService } from 'src/app/services/region/region.service';
// import { StateService } from 'src/app/services/state/state.service';
// import { SubdivisionService } from 'src/app/services/subDivision/subDivision.service';
// import { DistrictService } from 'src/app/services/district/district.service';
// import { BlockService } from 'src/app/services/block/BlockService.service';
// import { Constants } from 'src/app/services/constants';
// import Exporting from 'highcharts/modules/exporting';

// interface RainfallData {
//   name?: string;
//   region_name?: string;
//   state_name?: string;
//   subdiv_name?: string;
//   district_name?: string;
//   block_name?: string;
//   r_code?: string;
//   state_code?: string | number;
//   s_code?: string;
//   district_code?: string;
//   block_code?: string;
//   actual_rainfall?: number | string;
//   actual_state_rainfall?: number | string;
//   actual_subdiv_rainfall?: number | string;
//   rainfall_normal_value?: number | string;
//   normal_rainfall?: number | string;
//   departure?: number | string;
//   date: string;
//   [key: string]: any;
// }

// @Component({
//   selector: 'main-charts',
//   templateUrl: './main-charts.html',
//   styleUrls: ['./main-charts.css']
// })
// export class MainChartsComponent implements OnInit, OnChanges {
//   @Input() selectedLayer: string = 'country';
//   @Input() selectedPlace: { layer: string; code: string; name: string } = { layer: 'country', code: 'INDIA', name: 'India' };

//   isLoading = false;
//   noDataMessage: string | null = null;

//   seasons = ['Winter', 'PreMonsoon', 'Monsoon', 'PostMonsoon'];
//   selectedSeason = this.seasons[0];
//   selectedYear = new Date().getFullYear();
//   years = this.getYears();

//   chart: Chart | null = null;
//   graphData: { actual: number[]; normal: number[]; departure: (number | undefined)[]; date: string[] } = {
//     actual: [],
//     normal: [],
//     departure: [],
//     date: []
//   };
//   fromDate: string = '';
//   toDate: string = '';

//   constructor(
//     private countryService: CountryService,
//     private regionService: RegionService,
//     private stateService: StateService,
//     private subdivisionService: SubdivisionService,
//     private districtService: DistrictService,
//     private blockService: BlockService,
//     private constants: Constants
//   ) {
//     this.selectedSeason = this.constants.getCurrentSeason(new Date());
//   }

//   ngOnInit(): void {
//     Exporting(Highcharts);
//     this.fetchData().then(() => {
//       this.updateCharts();
//     });
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (changes['selectedLayer'] || changes['selectedPlace']) {
//       this.fetchData().then(() => {
//         this.updateCharts();
//       });
//     }
//   }

//   getYears(): number[] {
//     const currentYear = new Date().getFullYear();
//     const years: number[] = [];
//     for (let year = 1700; year <= currentYear; year++) {
//       years.push(year);
//     }
//     return years;
//   }

//   onSeasonChange(event: MatSelectChange): void {
//     this.selectedSeason = event.value;
//     this.fetchData().then(() => {
//       this.updateCharts();
//     });
//   }

//   onYearChange(event: MatSelectChange): void {
//     this.selectedYear = event.value;
//     this.fetchData().then(() => {
//       this.updateCharts();
//     });
//   }

//   async fetchData(): Promise<void> {
//     this.isLoading = true;
//     this.noDataMessage = null;

//     const { start, end } = this.constants.getSeasonDatesUptoCurrentDate(this.selectedSeason.toLowerCase(), this.selectedYear);
//     if (start > end) {
//       this.noDataMessage = 'No data is available for the selected season and year';
//       this.graphData = { actual: [], normal: [], departure: [], date: [] };
//       this.isLoading = false;
//       return;
//     }

//     this.fromDate = this.formatDate(start).split('-').reverse().join('-');
//     this.toDate = this.formatDate(end).split('-').reverse().join('-');

//     const dates = this.getDateRange(start, end);
//     const service = this.getServiceForLayer(this.selectedLayer);
//     if (!service) {
//       this.noDataMessage = `No service available for layer: ${this.selectedLayer}`;
//       this.isLoading = false;
//       return;
//     }

//     const observables: Observable<any>[] = dates.map(date =>
//       service.fetchData({
//         startDate: date,
//         endDate: date,
//         mode: 'Actual'
//       })
//     );

//     try {
//       const responses = await lastValueFrom(forkJoin(observables));
//       this.graphData = { actual: [], normal: [], departure: [], date: [] };

//       responses.forEach((res: any, index: number) => {
//         const data = res.data || [];
//         const item = this.findItemForPlace(data, this.selectedLayer, this.selectedPlace.code);
//         if (item) {
//           const actualKey = this.getActualKey(this.selectedLayer);
//           const normalKey = this.getNormalKey(this.selectedLayer);
//           const actualValue = parseFloat(item[actualKey] as string ?? '0');
//           const normalValue = parseFloat(item[normalKey] as string ?? '0');
//           const departureValue = parseFloat(item.departure as string ?? '0');
//           this.graphData.actual.push(this.constants.trimToOneDecimals(actualValue));
//           this.graphData.normal.push(this.constants.trimToOneDecimals(normalValue));
//           this.graphData.departure.push(new Date(dates[index]).getDay() === 3 ? this.constants.trimToZeroDecimals(departureValue) : undefined);
//           this.graphData.date.push(dates[index]);
//         } else {
//           this.graphData.actual.push(0);
//           this.graphData.normal.push(0);
//           this.graphData.departure.push(undefined);
//           this.graphData.date.push(dates[index]);
//         }
//       });

//       if (this.graphData.actual.every(val => val === 0)) {
//         this.noDataMessage = 'No data is available for the selected place and date range.';
//       }
//     } catch (error) {
//       console.error('Error fetching data:', error);
//       this.noDataMessage = 'Error fetching data. Please try again.';
//       this.graphData = { actual: [], normal: [], departure: [], date: [] };
//     } finally {
//       this.isLoading = false;
//     }
//   }

//   updateCharts(): void {
//     if (this.noDataMessage || this.graphData.date.length === 0) {
//       this.chart = null;
//       return;
//     }

//     const titleStyle = {
//       color: '#333',
//       fontSize: '15px',
//       fontWeight: 'normal',
//       fontFamily: 'Arial, sans-serif'
//     };

//     const maxActual = Math.max(...this.graphData.actual, 0);
//     const maxNormal = Math.max(...this.graphData.normal, 0);
//     const maxValue = Math.max(maxActual, maxNormal);
//     const roundedMax = Math.ceil(maxValue) || 1;
//     const tickInterval = roundedMax / 5;

//     const formattedDates = this.formatDates(this.graphData.date);

//     this.chart = new Chart({
//       chart: {
//         type: 'column',
//         height: 600
//       },
//       title: {
//         style: titleStyle,
//         text: `Actual and Normal for the period ${this.fromDate} to ${this.toDate} for ${this.selectedPlace.name} in ${this.selectedYear} ${this.selectedSeason}`
//       },
//       credits: { enabled: false },
//       xAxis: {
//         categories: formattedDates,
//         title: { text: 'Period' },
//         labels: {
//           rotation: -45,
//           step: Math.ceil(formattedDates.length / 10),
//           style: { fontSize: '10px' }
//         }
//       },
//       yAxis: {
//         min: 0,
//         max: roundedMax,
//         tickInterval: tickInterval,
//         title: { text: 'Rainfall [mm]' }
//       },
//       series: [
//         {
//           name: 'Actual',
//           type: 'column',
//           data: this.graphData.actual,
//           color: 'green',
//           dataLabels: {
//             enabled: true,
//             formatter: (function(component) {
//               return function(this: any) {
//                 const index = this.point.index ?? 0;
//                 const departure = component.graphData.departure[index];
//                 return departure !== undefined ? `${departure}%` : '';
//               };
//             })(this),
//             style: {
//               color: 'black',
//               fontSize: '10px',
//               fontWeight: '400',
//               textOutline: '1px contrast'
//             },
//             verticalAlign: 'top',
//             inside: false,
//             y: -10
//           }
//         },
//         {
//           name: 'Normal',
//           type: 'line',
//           data: this.graphData.normal,
//           color: 'darkblue'
//         },
//         {
//           name: 'Departure',
//           type: 'line',
//           data: [],
//           color: 'black',
//           showInLegend: true,
//           marker: { enabled: false },
//           enableMouseTracking: false,
//           events: {
//             legendItemClick: function () {
//               const chart = this.chart;
//               const actualSeries = chart.series[0];
//               const visible = this.visible;
//               actualSeries.update({
//                 dataLabels: { enabled: !visible },
//                 type: 'column'
//               });
//               return true;
//             }
//           }
//         }
//       ],
//       exporting: {
//         enabled: true,
//         buttons: {
//           contextButton: {
//             menuItems: ['viewFullscreen', 'printChart']
//           }
//         }
//       }
//     });
//   }

//   getDateRange(start: Date, end: Date): string[] {
//     const dates: string[] = [];
//     const currentDate = new Date(start);
//     while (currentDate <= end) {
//       dates.push(this.formatDate(currentDate));
//       currentDate.setDate(currentDate.getDate() + 1);
//     }
//     return dates;
//   }

//   formatDate(date: Date): string {
//     const year = date.getFullYear();
//     const month = (date.getMonth() + 1).toString().padStart(2, '0');
//     const day = date.getDate().toString().padStart(2, '0');
//     return `${year}-${month}-${day}`;
//   }

//   formatDates(dates: string[]): string[] {
//     return dates.map(date => {
//       const [year, month, day] = date.split('-');
//       return `${day}-${month}-${year}`;
//     });
//   }

//   getServiceForLayer(layer: string): any {
//     switch (layer) {
//       case 'country': return this.countryService;
//       case 'region': return this.regionService;
//       case 'state': return this.stateService;
//       case 'subdivision': return this.subdivisionService;
//       case 'district': return this.districtService;
//       case 'block': return this.blockService;
//       default: return null;
//     }
//   }

//   findItemForPlace(data: RainfallData[], layer: string, code: string): RainfallData | undefined {
//     const codeKey = this.getDataCodeKey(layer);
//     return data.find(d => String(d[codeKey] ?? '').trim() === String(code).trim());
//   }

//   getDataCodeKey(layer: string): string {
//     switch (layer) {
//       case 'country': return 'name';
//       case 'region': return 'r_code';
//       case 'state': return 'state_code';
//       case 'subdivision': return 's_code';
//       case 'district': return 'district_code';
//       case 'block': return 'block_code';
//       default: return '';
//     }
//   }

//   getActualKey(layer: string): string {
//     switch (layer) {
//       case 'country': return 'actual_rainfall';
//       case 'region': return 'actual_rainfall';
//       case 'state': return 'actual_state_rainfall';
//       case 'subdivision': return 'actual_subdiv_rainfall';
//       case 'district': return 'actual_rainfall';
//       case 'block': return 'actual_rainfall';
//       default: return '';
//     }
//   }

//   getNormalKey(layer: string): string {
//     switch (layer) {
//       case 'country': return 'rainfall_normal_value';
//       case 'region': return 'rainfall_normal_value';
//       case 'state': return 'rainfall_normal_value';
//       case 'subdivision': return 'rainfall_normal_value';
//       case 'district': return 'normal_rainfall';
//       case 'block': return 'normal_rainfall';
//       default: return '';
//     }
//   }
// }


// import { Component, OnInit, OnChanges, SimpleChanges, Input } from '@angular/core';
// import { MatSelectChange } from '@angular/material/select';
// import { Chart } from 'angular-highcharts';
// import * as Highcharts from 'highcharts';
// import { forkJoin, Observable, lastValueFrom } from 'rxjs';
// import { CountryService } from 'src/app/services/country/country.service';
// import { RegionService } from 'src/app/services/region/region.service';
// import { StateService } from 'src/app/services/state/state.service';
// import { SubdivisionService } from 'src/app/services/subDivision/subDivision.service';
// import { DistrictService } from 'src/app/services/district/district.service';
// import { BlockService } from 'src/app/services/block/BlockService.service';
// import { Constants } from 'src/app/services/constants';
// import Exporting from 'highcharts/modules/exporting';

// interface RainfallData {
//   name?: string;
//   region_name?: string;
//   state_name?: string;
//   subdiv_name?: string;
//   district_name?: string;
//   block_name?: string;
//   r_code?: string;
//   state_code?: string | number;
//   s_code?: string;
//   district_code?: string;
//   block_code?: string;
//   actual_rainfall?: number | string;
//   actual_state_rainfall?: number | string;
//   actual_subdiv_rainfall?: number | string;
//   rainfall_normal_value?: number | string;
//   normal_rainfall?: number | string;
//   departure?: number | string;
//   date: string;
//   [key: string]: any;
// }

// @Component({
//   selector: 'main-charts',
//   templateUrl: './main-charts.html',
//   styleUrls: ['./main-charts.css']
// })
// export class MainChartsComponent implements OnInit, OnChanges {
//   @Input() selectedLayer: string = 'country';
//   @Input() selectedPlace: { layer: string; code: string; name: string } = { layer: 'country', code: 'INDIA', name: 'India' };

//   isLoading = false;
//   noDataMessage: string | null = null;

//   seasons = ['Winter', 'PreMonsoon', 'Monsoon', 'PostMonsoon'];
//   selectedSeason = this.seasons[0];
//   selectedYear = new Date().getFullYear();
//   years = this.getYears();

//   rainfallFilters = [
//     { label: '10mm', min: 0, max: 10 },
//     { label: '50mm', min: 11, max: 50 },
//     { label: '100mm', min: 51, max: 100 },
//     { label: '200mm', min: 101, max: 200 },
//     { label: '>300mm', min: 301, max: Infinity }
//   ];
//   selectedRainfallFilter: { label: string; min: number; max: number } | null = null;

//   chart: Chart | null = null;
//   graphData: { actual: number[]; normal: number[]; departure: (number | undefined)[]; date: string[] } = {
//     actual: [],
//     normal: [],
//     departure: [],
//     date: []
//   };
//   filteredGraphData: { actual: number[], normal: number[], departure: (number | undefined)[], date: string[] } = {
//     actual: [],
//     normal: [],
//     departure: [],
//     date: []
//   };
//   fromDate: string = '';
//   toDate: string = '';

//   constructor(
//     private countryService: CountryService,
//     private regionService: RegionService,
//     private stateService: StateService,
//     private subdivisionService: SubdivisionService,
//     private districtService: DistrictService,
//     private blockService: BlockService,
//     private constants: Constants
//   ) {
//     this.selectedSeason = this.constants.getCurrentSeason(new Date());
//   }

//   ngOnInit(): void {
//     Exporting(Highcharts);
//     this.fetchData().then(() => {
//       this.applyRainfallFilterAndUpdateChart();
//     });
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (changes['selectedLayer'] || changes['selectedPlace']) {
//       this.fetchData().then(() => {
//         this.applyRainfallFilterAndUpdateChart();
//       });
//     }
//   }

//   getYears(): number[] {
//     const currentYear = new Date().getFullYear();
//     const years: number[] = [];
//     for (let year = 1700; year <= currentYear; year++) {
//       years.push(year);
//     }
//     return years;
//   }

//   onSeasonChange(event: MatSelectChange): void {
//     this.selectedSeason = event.value;
//     this.fetchData().then(() => {
//       this.applyRainfallFilterAndUpdateChart();
//     });
//   }

//   onYearChange(event: MatSelectChange): void {
//     this.selectedYear = event.value;
//     this.fetchData().then(() => {
//       this.applyRainfallFilterAndUpdateChart();
//     });
//   }

//   onRainfallFilterChange(filter: { label: string; min: number; max: number }): void {
//     if (this.selectedRainfallFilter === filter) {
//       // Clicking the active filter again disables filtering:
//       this.selectedRainfallFilter = null;
//     } else {
//       this.selectedRainfallFilter = filter;
//     }
//     this.applyRainfallFilterAndUpdateChart();
//   }

//   async fetchData(): Promise<void> {
//     this.isLoading = true;
//     this.noDataMessage = null;

//     const { start, end } = this.constants.getSeasonDatesUptoCurrentDate(this.selectedSeason.toLowerCase(), this.selectedYear);
//     if (start > end) {
//       this.noDataMessage = 'No data is available for the selected season and year';
//       this.graphData = { actual: [], normal: [], departure: [], date: [] };
//       this.isLoading = false;
//       return;
//     }

//     this.fromDate = this.formatDate(start).split('-').reverse().join('-');
//     this.toDate = this.formatDate(end).split('-').reverse().join('-');

//     const dates = this.getDateRange(start, end);
//     const service = this.getServiceForLayer(this.selectedLayer);
//     if (!service) {
//       this.noDataMessage = `No service available for layer: ${this.selectedLayer}`;
//       this.isLoading = false;
//       return;
//     }

//     const observables: Observable<any>[] = dates.map(date =>
//       service.fetchData({
//         startDate: date,
//         endDate: date,
//         mode: 'Actual'
//       })
//     );

//     try {
//       const responses = await lastValueFrom(forkJoin(observables));
//       this.graphData = { actual: [], normal: [], departure: [], date: [] };

//       responses.forEach((res: any, index: number) => {
//         const data = res.data || [];
//         const item = this.findItemForPlace(data, this.selectedLayer, this.selectedPlace.code);
//         if (item) {
//           const actualKey = this.getActualKey(this.selectedLayer);
//           const normalKey = this.getNormalKey(this.selectedLayer);
//           const actualValue = parseFloat(item[actualKey] as string ?? '0');
//           const normalValue = parseFloat(item[normalKey] as string ?? '0');
//           const departureValue = parseFloat(item.departure as string ?? '0');
//           this.graphData.actual.push(this.constants.trimToOneDecimals(actualValue));
//           this.graphData.normal.push(this.constants.trimToOneDecimals(normalValue));
//           this.graphData.departure.push(new Date(dates[index]).getDay() === 3 ? this.constants.trimToZeroDecimals(departureValue) : undefined);
//           this.graphData.date.push(dates[index]);
//         } else {
//           this.graphData.actual.push(0);
//           this.graphData.normal.push(0);
//           this.graphData.departure.push(undefined);
//           this.graphData.date.push(dates[index]);
//         }
//       });

//       if (this.graphData.actual.every(val => val === 0)) {
//         this.noDataMessage = 'No data is available for the selected place and date range.';
//       }
//     } catch (error) {
//       console.error('Error fetching data:', error);
//       this.noDataMessage = 'Error fetching data. Please try again.';
//       this.graphData = { actual: [], normal: [], departure: [], date: [] };
//     } finally {
//       this.isLoading = false;
//     }
//   }

//   applyRainfallFilterAndUpdateChart(): void {
//     if (!this.graphData || this.graphData.actual.length === 0) {
//       this.filteredGraphData = { actual: [], normal: [], departure: [], date: [] };
//       this.chart = null;
//       return;
//     }

//     if (!this.selectedRainfallFilter) {
//       // No filter selected: show all data
//       this.noDataMessage = null;
//       this.filteredGraphData = { ...this.graphData };
//       this.updateCharts(this.filteredGraphData);
//       return;
//     }

//     const { min, max } = this.selectedRainfallFilter;

//     const filteredActual: number[] = [];
//     const filteredNormal: number[] = [];
//     const filteredDeparture: (number | undefined)[] = [];
//     const filteredDates: string[] = [];

//     for (let i = 0; i < this.graphData.actual.length; i++) {
//       const actualVal = this.graphData.actual[i];
//       if (actualVal >= min && actualVal <= max) {
//         filteredActual.push(actualVal);
//         filteredNormal.push(this.graphData.normal[i]);
//         filteredDeparture.push(this.graphData.departure[i]);
//         filteredDates.push(this.graphData.date[i]);
//       }
//     }

//     if (filteredActual.length === 0) {
//       this.noDataMessage = `No data available for actual rainfall in the range ${min}mm to ${
//         max === Infinity ? 'above' : max + 'mm'
//       }.`;
//       this.filteredGraphData = { actual: [], normal: [], departure: [], date: [] };
//       this.chart = null;
//       return;
//     } else {
//       this.noDataMessage = null;
//     }

//     this.filteredGraphData = {
//       actual: filteredActual,
//       normal: filteredNormal,
//       departure: filteredDeparture,
//       date: filteredDates
//     };

//     this.updateCharts(this.filteredGraphData);
//   }

//   updateCharts(data: { actual: number[]; normal: number[]; departure: (number | undefined)[]; date: string[] }): void {
//     if (this.noDataMessage || data.date.length === 0) {
//       this.chart = null;
//       return;
//     }

//     const titleStyle = {
//       color: '#333',
//       fontSize: '15px',
//       fontWeight: 'normal',
//       fontFamily: 'Arial, sans-serif'
//     };

//     const maxActual = Math.max(...data.actual, 0);
//     const maxNormal = Math.max(...data.normal, 0);
//     const maxValue = Math.max(maxActual, maxNormal);
//     const roundedMax = Math.ceil(maxValue) || 1;
//     const tickInterval = roundedMax / 5;

//     const formattedDates = this.formatDates(data.date);

//     this.chart = new Chart({
//       chart: {
//         type: 'column',
//         height: 600
//       },
//       title: {
//         style: titleStyle,
//         text: `Actual and Normal for the period ${this.fromDate} to ${this.toDate} for ${this.selectedPlace.name} in ${
//           this.selectedYear
//         } ${this.selectedSeason} ${this.selectedRainfallFilter ? `(Filtered: ${this.selectedRainfallFilter.label})` : '(No Filter)'}`
//       },
//       credits: { enabled: false },
//       xAxis: {
//         categories: formattedDates,
//         title: { text: 'Period' },
//         labels: {
//           rotation: -45,
//           step: Math.ceil(formattedDates.length / 10),
//           style: { fontSize: '10px' }
//         }
//       },
//       yAxis: {
//         min: 0,
//         max: roundedMax,
//         tickInterval: tickInterval,
//         title: { text: 'Rainfall [mm]' }
//       },
//       series: [
//         {
//           name: 'Actual',
//           type: 'column',
//           data: data.actual,
//           color: 'green',
//           dataLabels: {
//             enabled: true,
//             formatter: (function (component) {
//               return function (this: any) {
//                 const index = this.point.index ?? 0;
//                 const departure = component.filteredGraphData.departure[index];
//                 return departure !== undefined ? `${departure}%` : '';
//               };
//             })(this),
//             style: {
//               color: 'black',
//               fontSize: '10px',
//               fontWeight: '400',
//               textOutline: '1px contrast'
//             },
//             verticalAlign: 'top',
//             inside: false,
//             y: -10
//           }
//         },
//         {
//           name: 'Normal',
//           type: 'line',
//           data: data.normal,
//           color: 'darkblue'
//         },
//         {
//           name: 'Departure',
//           type: 'line',
//           data: [],
//           color: 'black',
//           showInLegend: true,
//           marker: { enabled: false },
//           enableMouseTracking: false,
//           events: {
//             legendItemClick: function () {
//               const chart = this.chart;
//               const actualSeries = chart.series[0];
//               const visible = this.visible;
//               actualSeries.update({
//                 dataLabels: { enabled: !visible },
//                 type: 'column'
//               });
//               return true;
//             }
//           }
//         }
//       ],
//       exporting: {
//         enabled: true,
//         buttons: {
//           contextButton: {
//             menuItems: ['viewFullscreen', 'printChart']
//           }
//         }
//       }
//     });
//   }

//   getDateRange(start: Date, end: Date): string[] {
//     const dates: string[] = [];
//     const currentDate = new Date(start);
//     while (currentDate <= end) {
//       dates.push(this.formatDate(currentDate));
//       currentDate.setDate(currentDate.getDate() + 1);
//     }
//     return dates;
//   }

//   formatDate(date: Date): string {
//     const year = date.getFullYear();
//     const month = (date.getMonth() + 1).toString().padStart(2, '0');
//     const day = date.getDate().toString().padStart(2, '0');
//     return `${year}-${month}-${day}`;
//   }

//   formatDates(dates: string[]): string[] {
//     return dates.map(date => {
//       const [year, month, day] = date.split('-');
//       return `${day}-${month}-${year}`;
//     });
//   }

//   getServiceForLayer(layer: string): any {
//     switch (layer) {
//       case 'country':
//         return this.countryService;
//       case 'region':
//         return this.regionService;
//       case 'state':
//         return this.stateService;
//       case 'subdivision':
//         return this.subdivisionService;
//       case 'district':
//         return this.districtService;
//       case 'block':
//         return this.blockService;
//       default:
//         return null;
//     }
//   }

//   findItemForPlace(data: RainfallData[], layer: string, code: string): RainfallData | undefined {
//     const codeKey = this.getDataCodeKey(layer);
//     return data.find(d => String(d[codeKey] ?? '').trim() === String(code).trim());
//   }

//   getDataCodeKey(layer: string): string {
//     switch (layer) {
//       case 'country':
//         return 'name';
//       case 'region':
//         return 'r_code';
//       case 'state':
//         return 'state_code';
//       case 'subdivision':
//         return 's_code';
//       case 'district':
//         return 'district_code';
//       case 'block':
//         return 'block_code';
//       default:
//         return '';
//     }
//   }

//   getActualKey(layer: string): string {
//     switch (layer) {
//       case 'country':
//         return 'actual_rainfall';
//       case 'region':
//         return 'actual_rainfall';
//       case 'state':
//         return 'actual_state_rainfall';
//       case 'subdivision':
//         return 'actual_subdiv_rainfall';
//       case 'district':
//         return 'actual_rainfall';
//       case 'block':
//         return 'actual_rainfall';
//       default:
//         return '';
//     }
//   }

//   getNormalKey(layer: string): string {
//     switch (layer) {
//       case 'country':
//         return 'rainfall_normal_value';
//       case 'region':
//         return 'rainfall_normal_value';
//       case 'state':
//         return 'rainfall_normal_value';
//       case 'subdivision':
//         return 'rainfall_normal_value';
//       case 'district':
//         return 'normal_rainfall';
//       case 'block':
//         return 'normal_rainfall';
//       default:
//         return '';
//     }
//   }
// }



// import { Component, OnInit, OnChanges, SimpleChanges, Input } from '@angular/core';
// import { Chart } from 'angular-highcharts';
// import * as Highcharts from 'highcharts';
// import { lastValueFrom } from 'rxjs';
// import { CountryService } from 'src/app/services/country/country.service';
// import { RegionService } from 'src/app/services/region/region.service';
// import { StateService } from 'src/app/services/state/state.service';
// import { SubdivisionService } from 'src/app/services/subDivision/subDivision.service';
// import { DistrictService } from 'src/app/services/district/district.service';
// import { BlockService } from 'src/app/services/block/BlockService.service';
// import { Constants } from 'src/app/services/constants';
// import Exporting from 'highcharts/modules/exporting';

// interface RainfallData {
//   country_name?: string;
//   region_name?: string;
//   state_name?: string;
//   subdiv_name?: string;
//   district_name?: string;
//   block_name?: string;
//   r_code?: string;
//   state_code?: string | number;
//   s_code?: string;
//   district_code?: string;
//   block_code?: string;
//   actual_rainfall?: number | string;
//   actual_state_rainfall?: number | string;
//   actual_subdiv_rainfall?: number | string;
//   normal_rainfall?: number | string;
//   rainfall_normal_value?: number | string;
//   departure?: number | string;
//   date: string;
//   [key: string]: any;
// }

// @Component({
//   selector: 'main-charts',
//   templateUrl: './main-charts.html',
//   styleUrls: ['./main-charts.css']
// })
// export class MainChartsComponent implements OnInit, OnChanges {
//   @Input() selectedLayer: string = 'country';
//   @Input() selectedPlace: { layer: string; code: string; name: string } = { layer: 'country', code: 'INDIA', name: 'India' };

//   isLoading = false;
//   noDataMessage: string | null = null;

//   rainfallFilters = [
//     { label: '10mm', min: 0, max: 10 },
//     { label: '50mm', min: 11, max: 50 },
//     { label: '100mm', min: 51, max: 100 },
//     { label: '200mm', min: 101, max: 200 },
//     { label: '>300mm', min: 301, max: Infinity }
//   ];
//   selectedRainfallFilter: { label: string; min: number; max: number } | null = null;

//   chart: Chart | null = null;
//   graphData: { actual: number[]; normal: number[]; departure: (number | undefined)[]; date: string[] } = {
//     actual: [],
//     normal: [],
//     departure: [],
//     date: []
//   };
//   filteredGraphData: { actual: number[], normal: number[], departure: (number | undefined)[], date: string[] } = {
//     actual: [],
//     normal: [],
//     departure: [],
//     date: []
//   };
//   fromDate: string = '';
//   toDate: string = '';
//   startDate: string = '';
//   endDate: string = '';

//   constructor(
//     private countryService: CountryService,
//     private regionService: RegionService,
//     private stateService: StateService,
//     private subdivisionService: SubdivisionService,
//     private districtService: DistrictService,
//     private blockService: BlockService,
//     private constants: Constants
//   ) { }

//   ngOnInit(): void {
//     Exporting(Highcharts);
//     const end = new Date();
//     this.endDate = this.formatDate(end);
//     const start = new Date(end);
//     start.setDate(start.getDate() - 89); // 90 days including start and end
//     this.startDate = this.formatDate(start);
//     this.fetchData().then(() => {
//       this.applyRainfallFilterAndUpdateChart();
//     });
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (changes['selectedLayer'] || changes['selectedPlace']) {
//       this.fetchData().then(() => {
//         this.applyRainfallFilterAndUpdateChart();
//       });
//     }
//   }

//   onRainfallFilterChange(filter: { label: string; min: number; max: number }): void {
//     if (this.selectedRainfallFilter === filter) {
//       // Clicking the active filter again disables filtering:
//       this.selectedRainfallFilter = null;
//     } else {
//       this.selectedRainfallFilter = filter;
//     }
//     this.applyRainfallFilterAndUpdateChart();
//   }

//   // async fetchData(): Promise<void> {
//   //   this.isLoading = true;
//   //   this.noDataMessage = null;

//   //   const start = new Date(this.startDate);
//   //   const end = new Date(this.endDate);
//   //   if (start > end) {
//   //     this.noDataMessage = 'No data is available for the selected date range';
//   //     this.graphData = { actual: [], normal: [], departure: [], date: [] };
//   //     this.isLoading = false;
//   //     return;
//   //   }

//   //   this.fromDate = this.formatDate(start).split('-').reverse().join('-');
//   //   this.toDate = this.formatDate(end).split('-').reverse().join('-');

//   //   const service = this.getServiceForLayer(this.selectedLayer);
//   //   const method = this.getFetchMethodName(this.selectedLayer);
//   //   if (!service || !method) {
//   //     this.noDataMessage = `No service available for layer: ${this.selectedLayer}`;
//   //     this.isLoading = false;
//   //     return;
//   //   }

//   //   try {
//   //     const res = await lastValueFrom((service as any)[method]({
//   //       startDate: this.startDate,
//   //       endDate: this.endDate,
//   //       mode: 'Actual'
//   //     }));
//   //     const data: RainfallData[] = res.data || [];
//   //     this.graphData = { actual: [], normal: [], departure: [], date: [] };

//   //     const dates = this.getDateRange(start, end);
//   //     dates.forEach(dateStr => {
//   //       const item = this.findItemForPlaceByDate(data, this.selectedLayer, this.selectedPlace.code, dateStr);
//   //       if (item) {
//   //         const actualKey = this.getActualKey(this.selectedLayer);
//   //         const normalKey = this.getNormalKey(this.selectedLayer);
//   //         const actualValue = parseFloat(item[actualKey] as string ?? '0');
//   //         const normalValue = parseFloat(item[normalKey] as string ?? '0');
//   //         const departureValue = parseFloat(item.departure as string ?? '0');
//   //         this.graphData.actual.push(this.constants.trimToOneDecimals(actualValue));
//   //         this.graphData.normal.push(this.constants.trimToOneDecimals(normalValue));
//   //         const dep = new Date(dateStr).getDay() === 3 ? this.constants.trimToZeroDecimals(departureValue) : undefined;
//   //         this.graphData.departure.push(dep);
//   //         this.graphData.date.push(dateStr);
//   //       } else {
//   //         this.graphData.actual.push(0);
//   //         this.graphData.normal.push(0);
//   //         this.graphData.departure.push(undefined);
//   //         this.graphData.date.push(dateStr);
//   //       }
//   //     });

//   //     if (this.graphData.actual.every(val => val === 0)) {
//   //       this.noDataMessage = 'No data is available for the selected place and date range.';
//   //     }
//   //   } catch (error) {
//   //     console.error('Error fetching data:', error);
//   //     this.noDataMessage = 'Error fetching data. Please try again.';
//   //     this.graphData = { actual: [], normal: [], departure: [], date: [] };
//   //   } finally {
//   //     this.isLoading = false;
//   //   }
//   // }

//   async fetchData(): Promise<void> {
//   this.isLoading = true;
//   this.noDataMessage = null;

//   const start = new Date(this.startDate);
//   const end = new Date(this.endDate);
//   if (start > end) {
//     this.noDataMessage = 'No data is available for the selected date range';
//     this.graphData = { actual: [], normal: [], departure: [], date: [] };
//     this.isLoading = false;
//     return;
//   }

//   this.fromDate = this.formatDate(start).split('-').reverse().join('-');
//   this.toDate = this.formatDate(end).split('-').reverse().join('-');

//   const service = this.getServiceForLayer(this.selectedLayer);
//   const method = this.getFetchMethodName(this.selectedLayer);
//   if (!service || !method) {
//     this.noDataMessage = `No service available for layer: ${this.selectedLayer}`;
//     this.isLoading = false;
//     return;
//   }

//   try {
//     // Type assertion for the response
//     const res = await lastValueFrom((service as any)[method]({
//       startDate: this.startDate,
//       endDate: this.endDate,
//       mode: 'Actual'
//     })) as { success: boolean; message: string; data: RainfallData[] };
//     const data: RainfallData[] = res.data || [];

//     this.graphData = { actual: [], normal: [], departure: [], date: [] };

//     const dates = this.getDateRange(start, end);
//     dates.forEach(dateStr => {
//       const item = this.findItemForPlaceByDate(data, this.selectedLayer, this.selectedPlace.code, dateStr);
//       if (item) {
//         const actualKey = this.getActualKey(this.selectedLayer);
//         const normalKey = this.getNormalKey(this.selectedLayer);
//         const actualValue = parseFloat(item[actualKey] as string ?? '0');
//         const normalValue = parseFloat(item[normalKey] as string ?? '0');
//         const departureValue = parseFloat(item.departure as string ?? '0');
//         this.graphData.actual.push(this.constants.trimToOneDecimals(actualValue));
//         this.graphData.normal.push(this.constants.trimToOneDecimals(normalValue));
//         const dep = new Date(dateStr).getDay() === 3 ? this.constants.trimToZeroDecimals(departureValue) : undefined;
//         this.graphData.departure.push(dep);
//         this.graphData.date.push(dateStr);
//       } else {
//         this.graphData.actual.push(0);
//         this.graphData.normal.push(0);
//         this.graphData.departure.push(undefined);
//         this.graphData.date.push(dateStr);
//       }
//     });

//     if (this.graphData.actual.every(val => val === 0)) {
//       this.noDataMessage = 'No data is available for the selected place and date range.';
//     }
//   } catch (error) {
//     console.error('Error fetching data:', error);
//     this.noDataMessage = 'Error fetching data. Please try again.';
//     this.graphData = { actual: [], normal: [], departure: [], date: [] };
//   } finally {
//     this.isLoading = false;
//   }
// }

//   getFetchMethodName(layer: string): string {
//     switch (layer) {
//       case 'country':
//         return 'fetchCountryRangeStatistics';
//       case 'region':
//         return 'fetchRegionRangeStatistics';
//       case 'state':
//         return 'fetchStateRangeStatistics';
//       case 'subdivision':
//         return 'fetchSubdivisionRangeStatistics';
//       case 'district':
//         return 'fetchDistrictRangeStatistics';
//       case 'block':
//         return 'fetchBlockRangeStatistics';
//       default:
//         return '';
//     }
//   }

//   applyRainfallFilterAndUpdateChart(): void {
//     if (!this.graphData || this.graphData.actual.length === 0) {
//       this.filteredGraphData = { actual: [], normal: [], departure: [], date: [] };
//       this.chart = null;
//       return;
//     }

//     if (!this.selectedRainfallFilter) {
//       // No filter selected: show all data
//       this.noDataMessage = null;
//       this.filteredGraphData = { ...this.graphData };
//       this.updateCharts(this.filteredGraphData);
//       return;
//     }

//     const { min, max } = this.selectedRainfallFilter;

//     const filteredActual: number[] = [];
//     const filteredNormal: number[] = [];
//     const filteredDeparture: (number | undefined)[] = [];
//     const filteredDates: string[] = [];

//     for (let i = 0; i < this.graphData.actual.length; i++) {
//       const actualVal = this.graphData.actual[i];
//       if (actualVal >= min && actualVal <= max) {
//         filteredActual.push(actualVal);
//         filteredNormal.push(this.graphData.normal[i]);
//         filteredDeparture.push(this.graphData.departure[i]);
//         filteredDates.push(this.graphData.date[i]);
//       }
//     }

//     if (filteredActual.length === 0) {
//       this.noDataMessage = `No data available for actual rainfall in the range ${min}mm to ${
//         max === Infinity ? 'above' : max + 'mm'
//       }.`;
//       this.filteredGraphData = { actual: [], normal: [], departure: [], date: [] };
//       this.chart = null;
//       return;
//     } else {
//       this.noDataMessage = null;
//     }

//     this.filteredGraphData = {
//       actual: filteredActual,
//       normal: filteredNormal,
//       departure: filteredDeparture,
//       date: filteredDates
//     };

//     this.updateCharts(this.filteredGraphData);
//   }

//   updateCharts(data: { actual: number[]; normal: number[]; departure: (number | undefined)[]; date: string[] }): void {
//     if (this.noDataMessage || data.date.length === 0) {
//       this.chart = null;
//       return;
//     }

//     const titleStyle = {
//       color: '#333',
//       fontSize: '15px',
//       fontWeight: 'normal',
//       fontFamily: 'Arial, sans-serif'
//     };

//     const maxActual = Math.max(...data.actual, 0);
//     const maxNormal = Math.max(...data.normal, 0);
//     const maxValue = Math.max(maxActual, maxNormal);
//     const roundedMax = Math.ceil(maxValue) || 1;
//     const tickInterval = roundedMax / 5;

//     const formattedDates = this.formatDates(data.date);

//     this.chart = new Chart({
//       chart: {
//         type: 'column',
//         height: 600
//       },
//       title: {
//         style: titleStyle,
//         text: `Actual and Normal for the period ${this.fromDate} to ${this.toDate} for ${this.selectedPlace.name} ${this.selectedRainfallFilter ? `(Filtered: ${this.selectedRainfallFilter.label})` : '(No Filter)'}`
//       },
//       credits: { enabled: false },
//       xAxis: {
//         categories: formattedDates,
//         title: { text: 'Period' },
//         labels: {
//           rotation: -45,
//           step: Math.ceil(formattedDates.length / 10),
//           style: { fontSize: '10px' }
//         }
//       },
//       yAxis: {
//         min: 0,
//         max: roundedMax,
//         tickInterval: tickInterval,
//         title: { text: 'Rainfall [mm]' }
//       },
//       series: [
//         {
//           name: 'Actual',
//           type: 'column',
//           data: data.actual,
//           color: 'green',
//           dataLabels: {
//             enabled: true,
//             formatter: (function (component) {
//               return function (this: any) {
//                 const index = this.point.index ?? 0;
//                 const departure = component.filteredGraphData.departure[index];
//                 return departure !== undefined ? `${departure}%` : '';
//               };
//             })(this),
//             style: {
//               color: 'black',
//               fontSize: '10px',
//               fontWeight: '400',
//               textOutline: '1px contrast'
//             },
//             verticalAlign: 'top',
//             inside: false,
//             y: -10
//           }
//         },
//         {
//           name: 'Normal',
//           type: 'line',
//           data: data.normal,
//           color: 'darkblue'
//         },
//         {
//           name: 'Departure',
//           type: 'line',
//           data: [],
//           color: 'black',
//           showInLegend: true,
//           marker: { enabled: false },
//           enableMouseTracking: false,
//           events: {
//             legendItemClick: function () {
//               const chart = this.chart;
//               const actualSeries = chart.series[0];
//               const visible = this.visible;
//               actualSeries.update({
//                 dataLabels: { enabled: !visible },
//                 type: 'column'
//               });
//               return true;
//             }
//           }
//         }
//       ],
//       exporting: {
//         enabled: true,
//         buttons: {
//           contextButton: {
//             menuItems: ['viewFullscreen', 'printChart']
//           }
//         }
//       }
//     });
//   }

//   getDateRange(start: Date, end: Date): string[] {
//     const dates: string[] = [];
//     const currentDate = new Date(start);
//     while (currentDate <= end) {
//       dates.push(this.formatDate(currentDate));
//       currentDate.setDate(currentDate.getDate() + 1);
//     }
//     return dates;
//   }

//   formatDate(date: Date): string {
//     const year = date.getFullYear();
//     const month = (date.getMonth() + 1).toString().padStart(2, '0');
//     const day = date.getDate().toString().padStart(2, '0');
//     return `${year}-${month}-${day}`;
//   }

//   formatDates(dates: string[]): string[] {
//     return dates.map(date => {
//       const [year, month, day] = date.split('-');
//       return `${day}-${month}-${year}`;
//     });
//   }

//   getServiceForLayer(layer: string): any {
//     switch (layer) {
//       case 'country':
//         return this.countryService;
//       case 'region':
//         return this.regionService;
//       case 'state':
//         return this.stateService;
//       case 'subdivision':
//         return this.subdivisionService;
//       case 'district':
//         return this.districtService;
//       case 'block':
//         return this.blockService;
//       default:
//         return null;
//     }
//   }

//   findItemForPlaceByDate(data: RainfallData[], layer: string, code: string, date: string): RainfallData | undefined {
//     const codeKey = this.getDataCodeKey(layer);
//     return data.find(d => d.date === date && (
//       layer === 'country' ? (d.country_name?.trim() === code.trim()) : String(d[codeKey] ?? '').trim() === String(code).trim()
//     ));
//   }

//   getDataCodeKey(layer: string): string {
//     switch (layer) {
//       case 'country':
//         return 'country_name';
//       case 'region':
//         return 'r_code';
//       case 'state':
//         return 'state_code';
//       case 'subdivision':
//         return 's_code';
//       case 'district':
//         return 'district_code';
//       case 'block':
//         return 'block_code';
//       default:
//         return '';
//     }
//   }

//   getActualKey(layer: string): string {
//     return 'actual_rainfall';
//   }

//   getNormalKey(layer: string): string {
//     return 'normal_rainfall';
//   }
// }


// import { Component, OnInit, OnChanges, SimpleChanges, Input } from '@angular/core';
// import { Chart } from 'angular-highcharts';
// import * as Highcharts from 'highcharts';
// import { lastValueFrom } from 'rxjs';
// import { CountryService } from 'src/app/services/country/country.service';
// import { RegionService } from 'src/app/services/region/region.service';
// import { StateService } from 'src/app/services/state/state.service';
// import { SubdivisionService } from 'src/app/services/subDivision/subDivision.service';
// import { DistrictService } from 'src/app/services/district/district.service';
// import { BlockService } from 'src/app/services/block/BlockService.service';
// import { Constants } from 'src/app/services/constants';
// import Exporting from 'highcharts/modules/exporting';
// import { MatDatepickerInputEvent } from '@angular/material/datepicker';

// interface RainfallData {
//   country_name?: string;
//   region_name?: string;
//   state_name?: string;
//   subdiv_name?: string;
//   district_name?: string;
//   block_name?: string;
//   r_code?: string;
//   state_code?: string | number;
//   s_code?: string;
//   district_code?: string;
//   block_code?: string;
//   actual_rainfall?: number | string;
//   actual_state_rainfall?: number | string;
//   actual_subdiv_rainfall?: number | string;
//   normal_rainfall?: number | string;
//   rainfall_normal_value?: number | string;
//   departure?: number | string;
//   date: string;
//   [key: string]: any;
// }

// @Component({
//   selector: 'main-charts',
//   templateUrl: './main-charts.html',
//   styleUrls: ['./main-charts.css']
// })
// export class MainChartsComponent implements OnInit, OnChanges {
//   @Input() selectedLayer: string = 'country';
//   @Input() selectedPlace: { layer: string; code: string; name: string } = { layer: 'country', code: 'INDIA', name: 'India' };

//   isLoading = false;
//   noDataMessage: string | null = null;

//   rainfallFilters = [
//     { label: '10mm', min: 0, max: 10 },
//     { label: '50mm', min: 11, max: 50 },
//     { label: '100mm', min: 51, max: 100 },
//     { label: '200mm', min: 101, max: 200 },
//     { label: '>300mm', min: 301, max: Infinity }
//   ];
//   selectedRainfallFilter: { label: string; min: number; max: number } | null = null;

//   chart: Chart | null = null;
//   graphData: { actual: number[]; normal: number[]; departure: (number | undefined)[]; date: string[] } = {
//     actual: [],
//     normal: [],
//     departure: [],
//     date: []
//   };
//   filteredGraphData: { actual: number[], normal: number[], departure: (number | undefined)[], date: string[] } = {
//     actual: [],
//     normal: [],
//     departure: [],
//     date: []
//   };
//   fromDate: string = '';
//   toDate: string = '';
//   startDate: string = '';
//   endDate: string = '';
//   startDateModel: Date | null = null;
//   endDateModel: Date | null = null;
//   maxDate: Date = new Date();

//   constructor(
//     private countryService: CountryService,
//     private regionService: RegionService,
//     private stateService: StateService,
//     private subdivisionService: SubdivisionService,
//     private districtService: DistrictService,
//     private blockService: BlockService,
//     private constants: Constants
//   ) { }

//   ngOnInit(): void {
//     Exporting(Highcharts);
//     // Initialize with default range: last 90 days
//     const end = new Date();
//     this.endDate = this.formatDate(end);
//     this.endDateModel = end;
//     const start = new Date(end);
//     start.setDate(start.getDate() - 89); // 90 days including start and end
//     this.startDate = this.formatDate(start);
//     this.startDateModel = start;
//     this.fetchData().then(() => {
//       this.applyRainfallFilterAndUpdateChart();
//     });
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (changes['selectedLayer'] || changes['selectedPlace']) {
//       this.fetchData().then(() => {
//         this.applyRainfallFilterAndUpdateChart();
//       });
//     }
//   }

//   onStartDateChange(event: MatDatepickerInputEvent<Date>): void {
//     if (event.value) {
//       this.startDate = this.formatDate(event.value);
//       this.fetchData().then(() => {
//         this.applyRainfallFilterAndUpdateChart();
//       });
//     }
//   }

//   onEndDateChange(event: MatDatepickerInputEvent<Date>): void {
//     if (event.value) {
//       this.endDate = this.formatDate(event.value);
//       this.fetchData().then(() => {
//         this.applyRainfallFilterAndUpdateChart();
//       });
//     }
//   }

//   onRainfallFilterChange(filter: { label: string; min: number; max: number }): void {
//     if (this.selectedRainfallFilter === filter) {
//       // Clicking the active filter again disables filtering:
//       this.selectedRainfallFilter = null;
//     } else {
//       this.selectedRainfallFilter = filter;
//     }
//     this.applyRainfallFilterAndUpdateChart();
//   }

//   async fetchData(): Promise<void> {
//     this.isLoading = true;
//     this.noDataMessage = null;

//     const start = new Date(this.startDate);
//     const end = new Date(this.endDate);
//     if (start > end) {
//       this.noDataMessage = 'Start date cannot be after end date';
//       this.graphData = { actual: [], normal: [], departure: [], date: [] };
//       this.isLoading = false;
//       return;
//     }

//     this.fromDate = this.formatDate(start).split('-').reverse().join('-');
//     this.toDate = this.formatDate(end).split('-').reverse().join('-');

//     const service = this.getServiceForLayer(this.selectedLayer);
//     const method = this.getFetchMethodName(this.selectedLayer);
//     if (!service || !method) {
//       this.noDataMessage = `No service available for layer: ${this.selectedLayer}`;
//       this.isLoading = false;
//       return;
//     }

//     try {
//       const res = await lastValueFrom((service as any)[method]({
//         startDate: this.startDate,
//         endDate: this.endDate,
//         mode: 'Actual'
//       })) as { success: boolean; message: string; data: RainfallData[] };
//       const data: RainfallData[] = res.data || [];

//       this.graphData = { actual: [], normal: [], departure: [], date: [] };

//       const dates = this.getDateRange(start, end);
//       dates.forEach(dateStr => {
//         const item = this.findItemForPlaceByDate(data, this.selectedLayer, this.selectedPlace.code, dateStr);
//         if (item) {
//           const actualKey = this.getActualKey(this.selectedLayer);
//           const normalKey = this.getNormalKey(this.selectedLayer);
//           const actualValue = parseFloat(item[actualKey] as string ?? '0');
//           const normalValue = parseFloat(item[normalKey] as string ?? '0');
//           const departureValue = parseFloat(item.departure as string ?? '0');
//           this.graphData.actual.push(this.constants.trimToOneDecimals(actualValue));
//           this.graphData.normal.push(this.constants.trimToOneDecimals(normalValue));
//           const dep = new Date(dateStr).getDay() === 3 ? this.constants.trimToZeroDecimals(departureValue) : undefined;
//           this.graphData.departure.push(dep);
//           this.graphData.date.push(dateStr);
//         } else {
//           this.graphData.actual.push(0);
//           this.graphData.normal.push(0);
//           this.graphData.departure.push(undefined);
//           this.graphData.date.push(dateStr);
//         }
//       });

//       if (this.graphData.actual.every(val => val === 0)) {
//         this.noDataMessage = 'No data is available for the selected place and date range.';
//       }
//     } catch (error) {
//       console.error('Error fetching data:', error);
//       this.noDataMessage = 'Error fetching data. Please try again.';
//       this.graphData = { actual: [], normal: [], departure: [], date: [] };
//     } finally {
//       this.isLoading = false;
//     }
//   }

//   getFetchMethodName(layer: string): string {
//     switch (layer) {
//       case 'country':
//         return 'fetchCountryRangeStatistics';
//       case 'region':
//         return 'fetchRegionRangeStatistics';
//       case 'state':
//         return 'fetchStateRangeStatistics';
//       case 'subdivision':
//         return 'fetchSubdivisionRangeStatistics';
//       case 'district':
//         return 'fetchDistrictRangeStatistics';
//       case 'block':
//         return 'fetchBlockRangeStatistics';
//       default:
//         return '';
//     }
//   }

//   applyRainfallFilterAndUpdateChart(): void {
//     if (!this.graphData || this.graphData.actual.length === 0) {
//       this.filteredGraphData = { actual: [], normal: [], departure: [], date: [] };
//       this.chart = null;
//       return;
//     }

//     if (!this.selectedRainfallFilter) {
//       // No filter selected: show all data
//       this.noDataMessage = null;
//       this.filteredGraphData = { ...this.graphData };
//       this.updateCharts(this.filteredGraphData);
//       return;
//     }

//     const { min, max } = this.selectedRainfallFilter;

//     const filteredActual: number[] = [];
//     const filteredNormal: number[] = [];
//     const filteredDeparture: (number | undefined)[] = [];
//     const filteredDates: string[] = [];

//     for (let i = 0; i < this.graphData.actual.length; i++) {
//       const actualVal = this.graphData.actual[i];
//       if (actualVal >= min && actualVal <= max) {
//         filteredActual.push(actualVal);
//         filteredNormal.push(this.graphData.normal[i]);
//         filteredDeparture.push(this.graphData.departure[i]);
//         filteredDates.push(this.graphData.date[i]);
//       }
//     }

//     if (filteredActual.length === 0) {
//       this.noDataMessage = `No data available for actual rainfall in the range ${min}mm to ${
//         max === Infinity ? 'above' : max + 'mm'
//       }.`;
//       this.filteredGraphData = { actual: [], normal: [], departure: [], date: [] };
//       this.chart = null;
//       return;
//     } else {
//       this.noDataMessage = null;
//     }

//     this.filteredGraphData = {
//       actual: filteredActual,
//       normal: filteredNormal,
//       departure: filteredDeparture,
//       date: filteredDates
//     };

//     this.updateCharts(this.filteredGraphData);
//   }

//   updateCharts(data: { actual: number[]; normal: number[]; departure: (number | undefined)[]; date: string[] }): void {
//     if (this.noDataMessage || data.date.length === 0) {
//       this.chart = null;
//       return;
//     }

//     const titleStyle = {
//       color: '#333',
//       fontSize: '15px',
//       fontWeight: 'normal',
//       fontFamily: 'Arial, sans-serif'
//     };

//     const maxActual = Math.max(...data.actual, 0);
//     const maxNormal = Math.max(...data.normal, 0);
//     const maxValue = Math.max(maxActual, maxNormal);
//     const roundedMax = Math.ceil(maxValue) || 1;
//     const tickInterval = roundedMax / 5;

//     const formattedDates = this.formatDates(data.date);

//     this.chart = new Chart({
//       chart: {
//         type: 'column',
//         height: 600
//       },
//       title: {
//         style: titleStyle,
//         text: `Actual and Normal for the period ${this.fromDate} to ${this.toDate} for ${this.selectedPlace.name} ${this.selectedRainfallFilter ? `(Filtered: ${this.selectedRainfallFilter.label})` : '(No Filter)'}`
//       },
//       credits: { enabled: false },
//       xAxis: {
//         categories: formattedDates,
//         title: { text: 'Period' },
//         labels: {
//           rotation: -45,
//           step: Math.ceil(formattedDates.length / 10),
//           style: { fontSize: '10px' }
//         }
//       },
//       yAxis: {
//         min: 0,
//         max: roundedMax,
//         tickInterval: tickInterval,
//         title: { text: 'Rainfall [mm]' }
//       },
//       series: [
//         {
//           name: 'Actual',
//           type: 'column',
//           data: data.actual,
//           color: 'green',
//           dataLabels: {
//             enabled: true,
//             formatter: (function (component) {
//               return function (this: any) {
//                 const index = this.point.index ?? 0;
//                 const departure = component.filteredGraphData.departure[index];
//                 return departure !== undefined ? `${departure}%` : '';
//               };
//             })(this),
//             style: {
//               color: 'black',
//               fontSize: '10px',
//               fontWeight: '400',
//               textOutline: '1px contrast'
//             },
//             verticalAlign: 'top',
//             inside: false,
//             y: -10
//           }
//         },
//         {
//           name: 'Normal',
//           type: 'line',
//           data: data.normal,
//           color: 'darkblue'
//         },
//         {
//           name: 'Departure',
//           type: 'line',
//           data: [],
//           color: 'black',
//           showInLegend: true,
//           marker: { enabled: false },
//           enableMouseTracking: false,
//           events: {
//             legendItemClick: function () {
//               const chart = this.chart;
//               const actualSeries = chart.series[0];
//               const visible = this.visible;
//               actualSeries.update({
//                 dataLabels: { enabled: !visible },
//                 type: 'column'
//               });
//               return true;
//             }
//           }
//         }
//       ],
//       exporting: {
//         enabled: true,
//         buttons: {
//           contextButton: {
//             menuItems: ['viewFullscreen', 'printChart']
//           }
//         }
//       }
//     });
//   }

//   getDateRange(start: Date, end: Date): string[] {
//     const dates: string[] = [];
//     const currentDate = new Date(start);
//     while (currentDate <= end) {
//       dates.push(this.formatDate(currentDate));
//       currentDate.setDate(currentDate.getDate() + 1);
//     }
//     return dates;
//   }

//   formatDate(date: Date): string {
//     const year = date.getFullYear();
//     const month = (date.getMonth() + 1).toString().padStart(2, '0');
//     const day = date.getDate().toString().padStart(2, '0');
//     return `${year}-${month}-${day}`;
//   }

//   formatDates(dates: string[]): string[] {
//     return dates.map(date => {
//       const [year, month, day] = date.split('-');
//       return `${day}-${month}-${year}`;
//     });
//   }

//   getServiceForLayer(layer: string): any {
//     switch (layer) {
//       case 'country':
//         return this.countryService;
//       case 'region':
//         return this.regionService;
//       case 'state':
//         return this.stateService;
//       case 'subdivision':
//         return this.subdivisionService;
//       case 'district':
//         return this.districtService;
//       case 'block':
//         return this.blockService;
//       default:
//         return null;
//     }
//   }

//   findItemForPlaceByDate(data: RainfallData[], layer: string, code: string, date: string): RainfallData | undefined {
//     const codeKey = this.getDataCodeKey(layer);
//     return data.find(d => d.date === date && (
//       layer === 'country' ? (d.country_name?.trim() === code.trim()) : String(d[codeKey] ?? '').trim() === String(code).trim()
//     ));
//   }

//   getDataCodeKey(layer: string): string {
//     switch (layer) {
//       case 'country':
//         return 'country_name';
//       case 'region':
//         return 'region_code';
//       case 'state':
//         return 'state_code';
//       case 'subdivision':
//         return 'subdivision_code';
//       case 'district':
//         return 'district_code';
//       case 'block':
//         return 'block_code';
//       default:
//         return '';
//     }
//   }

//   getActualKey(layer: string): string {
//     return 'actual_rainfall';
//   }

//   getNormalKey(layer: string): string {
//     return 'normal_rainfall';
//   }
// }


import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter } from '@angular/core';
import { Chart } from 'angular-highcharts';
import * as Highcharts from 'highcharts';
import { lastValueFrom } from 'rxjs';
import { CountryService } from 'src/app/services/country/country.service';
import { RegionService } from 'src/app/services/region/region.service';
import { StateService } from 'src/app/services/state/state.service';
import { SubdivisionService } from 'src/app/services/subDivision/subDivision.service';
import { DistrictService } from 'src/app/services/district/district.service';
import { BlockService } from 'src/app/services/block/BlockService.service';
import { Constants } from 'src/app/services/constants';
import Exporting from 'highcharts/modules/exporting';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';

interface RainfallData {
  country_name?: string;
  region_name?: string;
  state_name?: string;
  subdiv_name?: string;
  district_name?: string;
  block_name?: string;
  r_code?: string;
  state_code?: string | number;
  s_code?: string;
  district_code?: string;
  block_code?: string;
  actual_rainfall?: number | string;
  actual_state_rainfall?: number | string;
  actual_subdiv_rainfall?: number | string;
  normal_rainfall?: number | string;
  rainfall_normal_value?: number | string;
  departure?: number | string;
  date: string;
  [key: string]: any;
}

interface RainfallFilter {
  label: string;
  min: number;
  max: number;
  count: number;
}

@Component({
  selector: 'main-charts',
  templateUrl: './main-charts.html',
  styleUrls: ['./main-charts.css']
})
export class MainChartsComponent implements OnInit, OnChanges {
  @Input() selectedLayer: string = 'country';
  @Input() selectedPlace: { layer: string; code: string; name: string } = { layer: 'country', code: 'INDIA', name: 'India' };
  @Output() filterDatesChange = new EventEmitter<string[]>();

  isLoading = false;
  noDataMessage: string | null = null;

  rainfallFilters: RainfallFilter[] = [
    { label: '10mm', min: 0, max: 10, count: 0 },
    { label: '50mm', min: 11, max: 50, count: 0 },
    { label: '100mm', min: 51, max: 100, count: 0 },
    { label: '200mm', min: 101, max: 200, count: 0 },
    { label: '>300mm', min: 301, max: Infinity, count: 0 }
  ];
  selectedRainfallFilter: RainfallFilter | null = null;

  chart: Chart | null = null;
  graphData: { actual: number[]; normal: number[]; departure: (number | undefined)[]; date: string[] } = {
    actual: [],
    normal: [],
    departure: [],
    date: []
  };
  filteredGraphData: { actual: number[], normal: number[], departure: (number | undefined)[], date: string[] } = {
    actual: [],
    normal: [],
    departure: [],
    date: []
  };
  fromDate: string = '';
  toDate: string = '';
  startDate: string = '';
  endDate: string = '';
  startDateModel: Date | null = null;
  endDateModel: Date | null = null;
  maxDate: Date = new Date();

  constructor(
    private countryService: CountryService,
    private regionService: RegionService,
    private stateService: StateService,
    private subdivisionService: SubdivisionService,
    private districtService: DistrictService,
    private blockService: BlockService,
    private constants: Constants
  ) { }

  ngOnInit(): void {
    Exporting(Highcharts);
    // Initialize with default range: last 90 days
    const end = new Date();
    this.endDate = this.formatDate(end);
    this.endDateModel = end;
    const start = new Date(end);
    start.setDate(start.getDate() - 89); // 90 days including start and end
    this.startDate = this.formatDate(start);
    this.startDateModel = start;
    this.fetchData().then(() => {
      this.updateFilterCounts();
      this.applyRainfallFilterAndUpdateChart();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedLayer'] || changes['selectedPlace']) {
      this.fetchData().then(() => {
        this.updateFilterCounts();
        this.applyRainfallFilterAndUpdateChart();
      });
    }
  }

  onStartDateChange(event: MatDatepickerInputEvent<Date>): void {
    if (event.value) {
      this.startDate = this.formatDate(event.value);
      this.fetchData().then(() => {
        this.updateFilterCounts();
        this.applyRainfallFilterAndUpdateChart();
      });
    }
  }

  onEndDateChange(event: MatDatepickerInputEvent<Date>): void {
    if (event.value) {
      this.endDate = this.formatDate(event.value);
      this.fetchData().then(() => {
        this.updateFilterCounts();
        this.applyRainfallFilterAndUpdateChart();
      });
    }
  }

  onRainfallFilterChange(filter: RainfallFilter): void {
    if (this.selectedRainfallFilter === filter) {
      // Clicking the active filter again disables filtering
      this.selectedRainfallFilter = null;
      this.filterDatesChange.emit(this.graphData.date); // Emit all dates when filter is cleared
    } else {
      this.selectedRainfallFilter = filter;
      const filteredDates = this.getFilteredDates();
      this.filterDatesChange.emit(filteredDates);
    }
    this.applyRainfallFilterAndUpdateChart();
  }

  updateFilterCounts(): void {
    this.rainfallFilters.forEach(filter => {
      filter.count = this.graphData.actual.reduce((count, actual, index) => {
        return actual >= filter.min && actual <= filter.max ? count + 1 : count;
      }, 0);
    });
  }

  getFilteredDates(): string[] {
    if (!this.selectedRainfallFilter) {
      return this.graphData.date;
    }
    const { min, max } = this.selectedRainfallFilter;
    const filteredDates: string[] = [];
    for (let i = 0; i < this.graphData.actual.length; i++) {
      const actualVal = this.graphData.actual[i];
      if (actualVal >= min && actualVal <= max) {
        filteredDates.push(this.graphData.date[i]);
      }
    }
    return filteredDates;
  }

  async fetchData(): Promise<void> {
    this.isLoading = true;
    this.noDataMessage = null;

    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    if (start > end) {
      this.noDataMessage = 'Start date cannot be after end date';
      this.graphData = { actual: [], normal: [], departure: [], date: [] };
      this.isLoading = false;
      return;
    }

    this.fromDate = this.formatDate(start).split('-').reverse().join('-');
    this.toDate = this.formatDate(end).split('-').reverse().join('-');

    const service = this.getServiceForLayer(this.selectedLayer);
    const method = this.getFetchMethodName(this.selectedLayer);
    if (!service || !method) {
      this.noDataMessage = `No service available for layer: ${this.selectedLayer}`;
      this.isLoading = false;
      return;
    }

    try {
      const res = await lastValueFrom((service as any)[method]({
        startDate: this.startDate,
        endDate: this.endDate,
        mode: 'Actual'
      })) as { success: boolean; message: string; data: RainfallData[] };
      const data: RainfallData[] = res.data || [];

      this.graphData = { actual: [], normal: [], departure: [], date: [] };

      const dates = this.getDateRange(start, end);
      dates.forEach(dateStr => {
        const item = this.findItemForPlaceByDate(data, this.selectedLayer, this.selectedPlace.code, dateStr);
        if (item) {
          const actualKey = this.getActualKey(this.selectedLayer);
          const normalKey = this.getNormalKey(this.selectedLayer);
          const actualValue = parseFloat(item[actualKey] as string ?? '0');
          const normalValue = parseFloat(item[normalKey] as string ?? '0');
          const departureValue = parseFloat(item.departure as string ?? '0');
          this.graphData.actual.push(this.constants.trimToOneDecimals(actualValue));
          this.graphData.normal.push(this.constants.trimToOneDecimals(normalValue));
          const dep = new Date(dateStr).getDay() === 3 ? this.constants.trimToZeroDecimals(departureValue) : undefined;
          this.graphData.departure.push(dep);
          this.graphData.date.push(dateStr);
        } else {
          this.graphData.actual.push(0);
          this.graphData.normal.push(0);
          this.graphData.departure.push(undefined);
          this.graphData.date.push(dateStr);
        }
      });

      if (this.graphData.actual.every(val => val === 0)) {
        this.noDataMessage = 'No data is available for the selected place and date range.';
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      this.noDataMessage = 'Error fetching data. Please try again.';
      this.graphData = { actual: [], normal: [], departure: [], date: [] };
    } finally {
      this.isLoading = false;
    }
  }

  getFetchMethodName(layer: string): string {
    switch (layer) {
      case 'country':
        return 'fetchCountryRangeStatistics';
      case 'region':
        return 'fetchRegionRangeStatistics';
      case 'state':
        return 'fetchStateRangeStatistics';
      case 'subdivision':
        return 'fetchSubdivisionRangeStatistics';
      case 'district':
        return 'fetchDistrictRangeStatistics';
      case 'block':
        return 'fetchBlockRangeStatistics';
      default:
        return '';
    }
  }

  applyRainfallFilterAndUpdateChart(): void {
    if (!this.graphData || this.graphData.actual.length === 0) {
      this.filteredGraphData = { actual: [], normal: [], departure: [], date: [] };
      this.chart = null;
      return;
    }

    if (!this.selectedRainfallFilter) {
      // No filter selected: show all data
      this.noDataMessage = null;
      this.filteredGraphData = { ...this.graphData };
      this.updateCharts(this.filteredGraphData);
      return;
    }

    const { min, max } = this.selectedRainfallFilter;

    const filteredActual: number[] = [];
    const filteredNormal: number[] = [];
    const filteredDeparture: (number | undefined)[] = [];
    const filteredDates: string[] = [];

    for (let i = 0; i < this.graphData.actual.length; i++) {
      const actualVal = this.graphData.actual[i];
      if (actualVal >= min && actualVal <= max) {
        filteredActual.push(actualVal);
        filteredNormal.push(this.graphData.normal[i]);
        filteredDeparture.push(this.graphData.departure[i]);
        filteredDates.push(this.graphData.date[i]);
      }
    }

    if (filteredActual.length === 0) {
      this.noDataMessage = `No data available for actual rainfall in the range ${min}mm to ${
        max === Infinity ? 'above' : max + 'mm'
      }.`;
      this.filteredGraphData = { actual: [], normal: [], departure: [], date: [] };
      this.chart = null;
      return;
    } else {
      this.noDataMessage = null;
    }

    this.filteredGraphData = {
      actual: filteredActual,
      normal: filteredNormal,
      departure: filteredDeparture,
      date: filteredDates
    };

    this.updateCharts(this.filteredGraphData);
  }

  updateCharts(data: { actual: number[]; normal: number[]; departure: (number | undefined)[]; date: string[] }): void {
    if (this.noDataMessage || data.date.length === 0) {
      this.chart = null;
      return;
    }

    const titleStyle = {
      color: '#333',
      fontSize: '15px',
      fontWeight: 'normal',
      fontFamily: 'Arial, sans-serif'
    };

    const maxActual = Math.max(...data.actual, 0);
    const maxNormal = Math.max(...data.normal, 0);
    const maxValue = Math.max(maxActual, maxNormal);
    const roundedMax = Math.ceil(maxValue) || 1;
    const tickInterval = roundedMax / 5;

    const formattedDates = this.formatDates(data.date);

    this.chart = new Chart({
      chart: {
        type: 'column',
        height: 600
      },
      title: {
        style: titleStyle,
        text: `Actual and Normal for the period ${this.fromDate} to ${this.toDate} for ${this.selectedPlace.name} ${this.selectedRainfallFilter ? `(Filtered: ${this.selectedRainfallFilter.label})` : '(No Filter)'}`
      },
      credits: { enabled: false },
      xAxis: {
        categories: formattedDates,
        title: { text: 'Period' },
        labels: {
          rotation: -45,
          step: Math.ceil(formattedDates.length / 10),
          style: { fontSize: '10px' }
        }
      },
      yAxis: {
        min: 0,
        max: roundedMax,
        tickInterval: tickInterval,
        title: { text: 'Rainfall [mm]' }
      },
      series: [
        {
          name: 'Actual',
          type: 'column',
          data: data.actual,
          color: 'green',
          dataLabels: {
            enabled: true,
            formatter: (function (component) {
              return function (this: any) {
                const index = this.point.index ?? 0;
                const departure = component.filteredGraphData.departure[index];
                return departure !== undefined ? `${departure}%` : '';
              };
            })(this),
            style: {
              color: 'black',
              fontSize: '10px',
              fontWeight: '400',
              textOutline: '1px contrast'
            },
            verticalAlign: 'top',
            inside: false,
            y: -10
          }
        },
        {
          name: 'Normal',
          type: 'line',
          data: data.normal,
          color: 'darkblue'
        },
        {
          name: 'Departure',
          type: 'line',
          data: [],
          color: 'black',
          showInLegend: true,
          marker: { enabled: false },
          enableMouseTracking: false,
          events: {
            legendItemClick: function () {
              const chart = this.chart;
              const actualSeries = chart.series[0];
              const visible = this.visible;
              actualSeries.update({
                dataLabels: { enabled: !visible },
                type: 'column'
              });
              return true;
            }
          }
        }
      ],
      exporting: {
        enabled: true,
        buttons: {
          contextButton: {
            menuItems: ['viewFullscreen', 'printChart']
          }
        }
      }
    });
  }

  getDateRange(start: Date, end: Date): string[] {
    const dates: string[] = [];
    const currentDate = new Date(start);
    while (currentDate <= end) {
      dates.push(this.formatDate(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDates(dates: string[]): string[] {
    return dates.map(date => {
      const [year, month, day] = date.split('-');
      return `${day}-${month}-${year}`;
    });
  }

  getServiceForLayer(layer: string): any {
    switch (layer) {
      case 'country':
        return this.countryService;
      case 'region':
        return this.regionService;
      case 'state':
        return this.stateService;
      case 'subdivision':
        return this.subdivisionService;
      case 'district':
        return this.districtService;
      case 'block':
        return this.blockService;
      default:
        return null;
    }
  }

  findItemForPlaceByDate(data: RainfallData[], layer: string, code: string, date: string): RainfallData | undefined {
    const codeKey = this.getDataCodeKey(layer);
    return data.find(d => d.date === date && (
      layer === 'country' ? (d.country_name?.trim() === code.trim()) : String(d[codeKey] ?? '').trim() === String(code).trim()
    ));
  }

  getDataCodeKey(layer: string): string {
    switch (layer) {
      case 'country':
        return 'country_name';
      case 'region':
        return 'region_code';
      case 'state':
        return 'state_code';
      case 'subdivision':
        return 'subdivision_code';
      case 'district':
        return 'district_code';
      case 'block':
        return 'block_code';
      default:
        return '';
    }
  }

  getActualKey(layer: string): string {
    return 'actual_rainfall';
  }

  getNormalKey(layer: string): string {
    return 'normal_rainfall';
  }
}