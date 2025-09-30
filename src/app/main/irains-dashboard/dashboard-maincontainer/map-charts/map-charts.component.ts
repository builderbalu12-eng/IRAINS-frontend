// import { Component } from '@angular/core';
// import { Chart } from 'angular-highcharts';

// @Component({
//   selector: 'app-map-charts',
//   templateUrl: './map-charts.component.html',
//   styleUrls: ['./map-charts.component.css']
// })
// export class MapChartsComponent {
//   // Dummy data for Daily Statistics regions
//   regions = [
//     {
//       name: 'Country',
//       actual: 120.5,
//       normal: 100.0,
//       departure: '-9.3%'
//     },
//     {
//       name: 'North West India',
//       actual: 120.5,
//       normal: 130.0,
//       departure: '-7.3%'
//     },
//     {
//       name: 'Central India',
//       actual: 110.2,
//       normal: 115.5,
//       departure: '-4.6%'
//     },
//     {
//       name: 'South Peninsula',
//       actual: 135.8,
//       normal: 140.0,
//       departure: '-3.0%'
//     },
//     {
//       name: 'East and North East India',
//       actual: 145.3,
//       normal: 150.0,
//       departure: '-3.2%'
//     }
//   ];

//   // Generate last 30 days dates dynamically (oldest to newest, current at right end)
//   private getLast30Days(): string[] {
//     const dates: string[] = [];
//     const today = new Date('2025-09-23');
//     for (let i = 29; i >= 0; i--) {
//       const date = new Date(today);
//       date.setDate(today.getDate() - i);
//       dates.push(date.toISOString().split('T')[0]);
//     }
//     return dates;
//   }

//   // Generate random data for chart
//   private actualData: number[] = Array.from({ length: 30 }, () => Math.random() * 50 + 20); // 20 to 70
//   private normalData: number[] = Array.from({ length: 30 }, () => Math.random() * 30); // 0 to 30

//   chart = new Chart({
//     chart: {
//       type: 'line',
//       height: 400
//     },
//     title: {
//       text: 'Daily Rainfall (Last 30 Days)',
//       style: {
//         fontSize: '14px'
//       }
//     },
//     xAxis: {
//       categories: this.getLast30Days(),
//       title: {
//         text: 'Date',
//         style: { fontSize: '12px' }
//       },
//       labels: {
//         rotation: -45,
//         step: 2,
//         style: {
//           fontSize: '10px'
//         }
//       }
//     },
//     yAxis: {
//       title: {
//         text: 'Rainfall (mm)',
//         style: { fontSize: '12px' }
//       },
//       min: 0,
//       max: undefined
//     },
//     credits: { enabled: false },
//     legend: {
//       itemStyle: {
//         fontSize: '10px',
//         fontWeight: '400'
//       },
//       margin: 5
//     },
//     tooltip: { shared: true },
//     series: [
//       {
//         name: 'Actual',
//         type: 'column',
//         data: this.actualData,
//         color: '#007bff',
//         dataLabels: {
//           enabled: true,
//           formatter: (function(component) {
//             return function() {
//               const index = this.point.index ?? 0;
//               const departure = ((this.y ?? 0) - component.normalData[index]).toFixed(1);
//               return departure;
//             };
//           })(this),
//           style: {
//             color: '#adb5bd',
//             fontSize: '10px',
//             fontWeight: '400',
//             textOutline: '1px contrast'
//           },
//           verticalAlign: 'top',
//           y: -10
//         }
//       },
//       {
//         name: 'Normal',
//         type: 'line',
//         data: this.normalData,
//         color: '#28a745'
//       }
//     ],
//     exporting: { enabled: true }
//   });
// }


// import { Component, OnInit, OnChanges, SimpleChanges, Input } from '@angular/core';
// import { Chart } from 'angular-highcharts';
// import { CountryService } from 'src/app/services/country/country.service';
// import { RegionService } from 'src/app/services/region/region.service';
// import { StateService } from 'src/app/services/state/state.service';
// import { SubdivisionService } from 'src/app/services/subDivision/subDivision.service';
// import { DistrictService } from 'src/app/services/district/district.service';
// import { BlockService } from 'src/app/services/block/BlockService.service';
// import { forkJoin } from 'rxjs';

// // Define an interface for the rainfall data structure
// interface RainfallData {
//   name?: string;
//   region_name?: string;
//   state_name?: string;
//   subdivision?: string;
//   district?: string;
//   block_name?: string;
//   actual_rainfall?: number | string;
//   actual_state_rainfall?: number | string;
//   actual_subdiv_rainfall?: number | string;
//   rainfall_normal_value?: number | string;
//   normal_rainfall?: number | string;
//   departure?: number | string;
//   [key: string]: any; // Allow for additional properties
// }

// @Component({
//   selector: 'app-map-charts',
//   templateUrl: './map-charts.component.html',
//   styleUrls: ['./map-charts.component.css']
// })
// export class MapChartsComponent implements OnInit, OnChanges {
//   @Input() selectedLayer: string = 'country';
//   @Input() selectedDate: string = '';
//   @Input() isActual: boolean = false;

//   regions: any[] = [];
//   top5: any[] = [];
//   top5Title: string = 'Top 5 Blocks - Current Day';
//   countryData: RainfallData[] = [];
//   regionData: RainfallData[] = [];
//   stateData: RainfallData[] = [];
//   subdivisionData: RainfallData[] = [];
//   districtData: RainfallData[] = [];
//   blockData: RainfallData[] = [];

//   // Generate last 30 days dates dynamically (oldest to newest, current at right end)
//   private getLast30Days(): string[] {
//     const dates: string[] = [];
//     const today = new Date('2025-09-23');
//     for (let i = 29; i >= 0; i--) {
//       const date = new Date(today);
//       date.setDate(today.getDate() - i);
//       dates.push(date.toISOString().split('T')[0]);
//     }
//     return dates;
//   }

//   // Generate random data for chart
//   private actualData: number[] = Array.from({ length: 30 }, () => Math.random() * 50 + 20); // 20 to 70
//   private normalData: number[] = Array.from({ length: 30 }, () => Math.random() * 30); // 0 to 30

//   chart = new Chart({
//     chart: {
//       type: 'line',
//       height: 400
//     },
//     title: {
//       text: 'Daily Rainfall (Last 30 Days)',
//       style: {
//         fontSize: '14px'
//       }
//     },
//     xAxis: {
//       categories: this.getLast30Days(),
//       title: {
//         text: 'Date',
//         style: { fontSize: '12px' }
//       },
//       labels: {
//         rotation: -45,
//         step: 2,
//         style: {
//           fontSize: '10px'
//         }
//       }
//     },
//     yAxis: {
//       title: {
//         text: 'Rainfall (mm)',
//         style: { fontSize: '12px' }
//       },
//       min: 0,
//       max: undefined
//     },
//     credits: { enabled: false },
//     legend: {
//       itemStyle: {
//         fontSize: '10px',
//         fontWeight: '400'
//       },
//       margin: 5
//     },
//     tooltip: { shared: true },
//     series: [
//       {
//         name: 'Actual',
//         type: 'column',
//         data: this.actualData,
//         color: '#007bff',
//         dataLabels: {
//           enabled: true,
//           formatter: (function(component) {
//             return function(this: any) {
//               const index = this.point.index ?? 0;
//               const departure = ((this.y ?? 0) - component.normalData[index]).toFixed(1);
//               return departure;
//             };
//           })(this),
//           style: {
//             color: '#adb5bd',
//             fontSize: '10px',
//             fontWeight: '400',
//             textOutline: '1px contrast'
//           },
//           verticalAlign: 'top',
//           y: -10
//         }
//       },
//       {
//         name: 'Normal',
//         type: 'line',
//         data: this.normalData,
//         color: '#28a745'
//       }
//     ],
//     exporting: { enabled: true }
//   });

//   constructor(
//     private countryService: CountryService,
//     private regionService: RegionService,
//     private stateService: StateService,
//     private subdivisionService: SubdivisionService,
//     private districtService: DistrictService,
//     private blockService: BlockService
//   ) {}

//   ngOnInit(): void {
//     const today = new Date().toISOString().split('T')[0];
//     this.selectedDate = this.selectedDate || today;
//     this.fetchDailyStatsData();
//     this.fetchTop5Data();
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (changes['selectedDate'] || changes['isActual'] || changes['selectedLayer']) {
//       this.fetchDailyStatsData();
//       this.fetchTop5Data();
//     }
//   }

//   private fetchDailyStatsData() {
//     const params = {
//       startDate: this.selectedDate,
//       endDate: this.selectedDate,
//       mode: this.isActual ? 'Actual' : 'Departure'
//     };

//     // Fetch country data first
//     this.countryService.fetchData(params).subscribe({
//       next: countryRes => {
//         this.countryData = countryRes.data || [];
//         // Then fetch region data
//         this.regionService.fetchData(params).subscribe({
//           next: regionRes => {
//             this.regionData = regionRes.data || [];
//             this.updateRegions();
//           },
//           error: err => console.error('Error fetching region data:', err)
//         });
//       },
//       error: err => console.error('Error fetching country data:', err)
//     });
//   }

//   private updateRegions() {
//     const country = this.countryData[0] || {};
//     const countryItem = {
//       name: country.name || 'Country',
//       actual: parseFloat(country.actual_rainfall as string ?? '0').toFixed(1),
//       normal: parseFloat(country.rainfall_normal_value as string ?? '0').toFixed(1),
//       departure: parseFloat(country.departure as string ?? '0').toFixed(1) + '%'
//     };

//     const regionsItems = this.regionData.map(r => ({
//       name: r.region_name || r.name || 'Unknown',
//       actual: parseFloat(r.actual_rainfall as string ?? '0').toFixed(1),
//       normal: parseFloat(r.rainfall_normal_value as string ?? '0').toFixed(1),
//       departure: parseFloat(r.departure as string ?? '0').toFixed(1) + '%'
//     }));

//     this.regions = [countryItem, ...regionsItems];
//   }

//   private fetchTop5Data() {
//     const params = {
//       startDate: this.selectedDate,
//       endDate: this.selectedDate,
//       mode: this.isActual ? 'Actual' : 'Departure'
//     };

//     let level = this.selectedLayer;
//     if (['country', 'region', 'block'].includes(level)) {
//       level = 'block';
//     }

//     let service;
//     let nameKey: string;
//     let actualKey: string;

//     switch (level) {
//       case 'block':
//         service = this.blockService;
//         nameKey = 'block_name';
//         actualKey = 'actual_rainfall';
//         break;
//       case 'district':
//         service = this.districtService;
//         nameKey = 'district';
//         actualKey = 'actual_rainfall';
//         break;
//       case 'state':
//         service = this.stateService;
//         nameKey = 'state_name';
//         actualKey = 'actual_state_rainfall';
//         break;
//       case 'subdivision':
//         service = this.subdivisionService;
//         nameKey = 'subdivision';
//         actualKey = 'actual_subdiv_rainfall';
//         break;
//       default:
//         return;
//     }

//     let layerLabel = level.charAt(0).toUpperCase() + level.slice(1);
//     if (level === 'subdivision') {
//       layerLabel = 'Sub Division';
//     }
//     this.top5Title = `Top 5 ${layerLabel}s - Current Day`;

//     service.fetchData(params).subscribe({
//       next: res => {
//         let data: RainfallData[] = res.data || [];
//         data = data
//           .filter((d: RainfallData) => d[actualKey] != null && !isNaN(parseFloat(d[actualKey] as string)))
//           .sort((a: RainfallData, b: RainfallData) => parseFloat(b[actualKey] as string) - parseFloat(a[actualKey] as string))
//           .slice(0, 5);

//         this.top5 = data.map((d: RainfallData) => ({
//           name: this.toCamelCase(d[nameKey] || 'Unknown'),
//           actual: parseFloat(d[actualKey] as string ?? '0').toFixed(1)
//         }));

//         const classes = ['text-primary', 'text-success', 'text-warning', 'text-info', 'text-danger'];
//         this.top5.forEach((item, idx) => {
//           item.colorClass = classes[idx];
//         });
//       },
//       error: err => console.error('Error fetching top 5 data:', err)
//     });
//   }

//   private toCamelCase(name: string | null): string {
//     if (!name) return '';
//     return name
//       .split(' ')
//       .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
//       .join(' ');
//   }
// }

// import { Component, OnInit, OnChanges, SimpleChanges, Input } from '@angular/core';
// import { Chart } from 'angular-highcharts';
// import { CountryService } from 'src/app/services/country/country.service';
// import { RegionService } from 'src/app/services/region/region.service';
// import { StateService } from 'src/app/services/state/state.service';
// import { SubdivisionService } from 'src/app/services/subDivision/subDivision.service';
// import { DistrictService } from 'src/app/services/district/district.service';
// import { BlockService } from 'src/app/services/block/BlockService.service';
// import { forkJoin } from 'rxjs';

// // Define an interface for the rainfall data structure
// interface RainfallData {
//   name?: string;
//   region_name?: string;
//   state_name?: string;
//   subdivision?: string;
//   district?: string;
//   block_name?: string;
//   actual_rainfall?: number | string;
//   actual_state_rainfall?: number | string;
//   actual_subdiv_rainfall?: number | string;
//   rainfall_normal_value?: number | string;
//   normal_rainfall?: number | string;
//   departure?: number | string;
//   [key: string]: any; // Allow for additional properties
// }

// @Component({
//   selector: 'app-map-charts',
//   templateUrl: './map-charts.component.html',
//   styleUrls: ['./map-charts.component.css']
// })
// export class MapChartsComponent implements OnInit, OnChanges {
//   @Input() selectedLayer: string = 'country';
//   @Input() startDate: string = ''; // Changed from selectedDate to startDate
//   @Input() endDate: string = ''; // Added endDate
//   @Input() isActual: boolean = false;

//   regions: any[] = [];
//   top5: any[] = [];
//   top5Title: string = 'Top 5 Blocks - Current Day';
//   countryData: RainfallData[] = [];
//   regionData: RainfallData[] = [];
//   stateData: RainfallData[] = [];
//   subdivisionData: RainfallData[] = [];
//   districtData: RainfallData[] = [];
//   blockData: RainfallData[] = [];

//   // Generate last 30 days dates dynamically (oldest to newest, current at right end)
//   private getLast30Days(): string[] {
//     const dates: string[] = [];
//     const today = new Date(this.endDate || '2025-09-23');
//     for (let i = 29; i >= 0; i--) {
//       const date = new Date(today);
//       date.setDate(today.getDate() - i);
//       dates.push(date.toISOString().split('T')[0]);
//     }
//     return dates;
//   }

//   // Generate random data for chart (for demo purposes; replace with actual API data if available)
//   private actualData: number[] = Array.from({ length: 30 }, () => Math.random() * 50 + 20); // 20 to 70
//   private normalData: number[] = Array.from({ length: 30 }, () => Math.random() * 30); // 0 to 30

//   chart = new Chart({
//     chart: {
//       type: 'line',
//       height: 400
//     },
//     title: {
//       text: 'Daily Rainfall (Last 30 Days)',
//       style: {
//         fontSize: '14px'
//       }
//     },
//     xAxis: {
//       categories: this.getLast30Days(),
//       title: {
//         text: 'Date',
//         style: { fontSize: '12px' }
//       },
//       labels: {
//         rotation: -45,
//         step: 2,
//         style: {
//           fontSize: '10px'
//         }
//       }
//     },
//     yAxis: {
//       title: {
//         text: 'Rainfall (mm)',
//         style: { fontSize: '12px' }
//       },
//       min: 0,
//       max: undefined
//     },
//     credits: { enabled: false },
//     legend: {
//       itemStyle: {
//         fontSize: '10px',
//         fontWeight: '400'
//       },
//       margin: 5
//     },
//     tooltip: { shared: true },
//     series: [
//       {
//         name: 'Actual',
//         type: 'column',
//         data: this.actualData,
//         color: '#007bff',
//         dataLabels: {
//           enabled: true,
//           formatter: (function(component) {
//             return function(this: any) {
//               const index = this.point.index ?? 0;
//               const departure = ((this.y ?? 0) - component.normalData[index]).toFixed(1);
//               return departure;
//             };
//           })(this),
//           style: {
//             color: '#adb5bd',
//             fontSize: '10px',
//             fontWeight: '400',
//             textOutline: '1px contrast'
//           },
//           verticalAlign: 'top',
//           y: -10
//         }
//       },
//       {
//         name: 'Normal',
//         type: 'line',
//         data: this.normalData,
//         color: '#28a745'
//       }
//     ],
//     exporting: { enabled: true }
//   });

//   constructor(
//     private countryService: CountryService,
//     private regionService: RegionService,
//     private stateService: StateService,
//     private subdivisionService: SubdivisionService,
//     private districtService: DistrictService,
//     private blockService: BlockService
//   ) {}

//   ngOnInit(): void {
//     const today = new Date().toISOString().split('T')[0];
//     this.startDate = this.startDate || today;
//     this.endDate = this.endDate || today;
//     this.fetchDailyStatsData();
//     this.fetchTop5Data();
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (changes['startDate'] || changes['endDate'] || changes['isActual'] || changes['selectedLayer']) {
//       // Update chart x-axis categories when date changes
//       if (changes['endDate'] && this.endDate) {
//         this.chart.ref$.subscribe(chart => {
//           chart.update({
//             xAxis: {
//               categories: this.getLast30Days()
//             }
//           });
//         });
//       }
//       this.fetchDailyStatsData();
//       this.fetchTop5Data();
//     }
//   }

//   private fetchDailyStatsData() {
//     const params = {
//       startDate: this.startDate,
//       endDate: this.endDate,
//       mode: this.isActual ? 'Actual' : 'Departure'
//     };

//     // Fetch country data first
//     this.countryService.fetchData(params).subscribe({
//       next: countryRes => {
//         this.countryData = countryRes.data || [];
//         // Then fetch region data
//         this.regionService.fetchData(params).subscribe({
//           next: regionRes => {
//             this.regionData = regionRes.data || [];
//             this.updateRegions();
//           },
//           error: err => console.error('Error fetching region data:', err)
//         });
//       },
//       error: err => console.error('Error fetching country data:', err)
//     });
//   }

//   private updateRegions() {
//     const country = this.countryData[0] || {};
//     const countryItem = {
//       name: country.name || 'Country',
//       actual: parseFloat(country.actual_rainfall as string ?? '0').toFixed(1),
//       normal: parseFloat(country.rainfall_normal_value as string ?? '0').toFixed(1),
//       departure: parseFloat(country.departure as string ?? '0').toFixed(1) + '%'
//     };

//     const regionsItems = this.regionData.map(r => ({
//       name: r.region_name || r.name || 'Unknown',
//       actual: parseFloat(r.actual_rainfall as string ?? '0').toFixed(1),
//       normal: parseFloat(r.rainfall_normal_value as string ?? '0').toFixed(1),
//       departure: parseFloat(r.departure as string ?? '0').toFixed(1) + '%'
//     }));

//     this.regions = [countryItem, ...regionsItems];
//   }

//   private fetchTop5Data() {
//     const params = {
//       startDate: this.startDate,
//       endDate: this.endDate,
//       mode: this.isActual ? 'Actual' : 'Departure'
//     };

//     let service;
//     let nameKey: string;
//     let actualKey: string;
//     let layerLabel: string;

//     switch (this.selectedLayer) {
//       case 'country':
//       case 'region':
//       case 'block':
//         service = this.blockService;
//         nameKey = 'block_name';
//         actualKey = 'actual_rainfall';
//         layerLabel = 'Block';
//         break;
//       case 'state':
//         service = this.stateService;
//         nameKey = 'state_name';
//         actualKey = 'actual_state_rainfall';
//         layerLabel = 'State';
//         break;
//       case 'subdivision':
//         service = this.subdivisionService;
//         nameKey = 'subdiv_name';
//         actualKey = 'actual_subdiv_rainfall';
//         layerLabel = 'Sub Division';
//         break;
//       case 'district':
//         service = this.districtService;
//         nameKey = 'district_name';
//         actualKey = 'actual_rainfall';
//         layerLabel = 'District';
//         break;
//       default:
//         return;
//     }

//     this.top5Title = `Top 5 ${layerLabel}s`;

//     service.fetchData(params).subscribe({
//       next: res => {
//         let data: RainfallData[] = res.data || [];
//         data = data
//           .filter((d: RainfallData) => d[actualKey] != null && !isNaN(parseFloat(d[actualKey] as string)))
//           .sort((a: RainfallData, b: RainfallData) => parseFloat(b[actualKey] as string) - parseFloat(a[actualKey] as string))
//           .slice(0, 5);

//         this.top5 = data.map((d: RainfallData) => ({
//           name: this.toCamelCase(d[nameKey] || 'Unknown'),
//           actual: parseFloat(d[actualKey] as string ?? '0').toFixed(1)
//         }));

//         const classes = ['text-primary', 'text-success', 'text-warning', 'text-info', 'text-danger'];
//         this.top5.forEach((item, idx) => {
//           item.colorClass = classes[idx];
//         });
//       },
//       error: err => console.error('Error fetching top 5 data:', err)
//     });
//   }

//   private toCamelCase(name: string | null): string {
//     if (!name) return '';
//     return name
//       .split(' ')
//       .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
//       .join(' ');
//   }
// }


// import { Component, OnInit, OnChanges, SimpleChanges, Input } from '@angular/core';
// import { Chart } from 'angular-highcharts';
// import { CountryService } from 'src/app/services/country/country.service';
// import { RegionService } from 'src/app/services/region/region.service';
// import { StateService } from 'src/app/services/state/state.service';
// import { SubdivisionService } from 'src/app/services/subDivision/subDivision.service';
// import { DistrictService } from 'src/app/services/district/district.service';
// import { BlockService } from 'src/app/services/block/BlockService.service';
// import { forkJoin } from 'rxjs';

// // Define an interface for the rainfall data structure
// interface RainfallData {
//   name?: string;
//   region_name?: string;
//   state_name?: string;
//   subdivision?: string;
//   district?: string;
//   block_name?: string;
//   actual_rainfall?: number | string;
//   actual_state_rainfall?: number | string;
//   actual_subdiv_rainfall?: number | string;
//   rainfall_normal_value?: number | string;
//   normal_rainfall?: number | string;
//   departure?: number | string;
//   [key: string]: any;
// }

// @Component({
//   selector: 'app-map-charts',
//   templateUrl: './map-charts.component.html',
//   styleUrls: ['./map-charts.component.css']
// })
// export class MapChartsComponent implements OnInit, OnChanges {
//   @Input() selectedLayer: string = 'country';
//   @Input() startDate: string = '';
//   @Input() endDate: string = '';
//   @Input() isActual: boolean = false;
//   @Input() selectedPlace: { layer: string; name: string } = { layer: 'country', name: 'Country' }; // New input for selected place

//   regions: any[] = [];
//   top5: any[] = [];
//   top5Title: string = 'Top 5 Blocks - Current Day';
//   countryData: RainfallData[] = [];
//   regionData: RainfallData[] = [];
//   stateData: RainfallData[] = [];
//   subdivisionData: RainfallData[] = [];
//   districtData: RainfallData[] = [];
//   blockData: RainfallData[] = [];

//   // Generate last 30 days dates dynamically (oldest to newest, current at right end)
//   private getLast30Days(): string[] {
//     const dates: string[] = [];
//     const today = new Date(this.endDate || '2025-09-23');
//     for (let i = 29; i >= 0; i--) {
//       const date = new Date(today);
//       date.setDate(today.getDate() - i);
//       dates.push(date.toISOString().split('T')[0]);
//     }
//     return dates;
//   }

//   // Generate random data for chart
//   private actualData: number[] = Array.from({ length: 30 }, () => Math.random() * 50 + 20); // 20 to 70
//   private normalData: number[] = Array.from({ length: 30 }, () => Math.random() * 30); // 0 to 30

//   chart = new Chart({
//     chart: {
//       type: 'line',
//       height: 400
//     },
//     title: {
//       text: `Daily Rainfall (Last 30 Days) - ${this.selectedPlace.name}`,
//       style: {
//         fontSize: '14px'
//       }
//     },
//     xAxis: {
//       categories: this.getLast30Days(),
//       title: {
//         text: 'Date',
//         style: { fontSize: '12px' }
//       },
//       labels: {
//         rotation: -45,
//         step: 2,
//         style: {
//           fontSize: '10px'
//         }
//       }
//     },
//     yAxis: {
//       title: {
//         text: 'Rainfall (mm)',
//         style: { fontSize: '12px' }
//       },
//       min: 0,
//       max: undefined
//     },
//     credits: { enabled: false },
//     legend: {
//       itemStyle: {
//         fontSize: '10px',
//         fontWeight: '400'
//       },
//       margin: 5
//     },
//     tooltip: { shared: true },
//     series: [
//       {
//         name: 'Actual',
//         type: 'column',
//         data: this.actualData,
//         color: '#007bff',
//         dataLabels: {
//           enabled: true,
//           formatter: (function(component) {
//             return function(this: any) {
//               const index = this.point.index ?? 0;
//               const departure = ((this.y ?? 0) - component.normalData[index]).toFixed(1);
//               return departure;
//             };
//           })(this),
//           style: {
//             color: '#adb5bd',
//             fontSize: '10px',
//             fontWeight: '400',
//             textOutline: '1px contrast'
//           },
//           verticalAlign: 'top',
//           y: -10
//         }
//       },
//       {
//         name: 'Normal',
//         type: 'line',
//         data: this.normalData,
//         color: '#28a745'
//       }
//     ],
//     exporting: { enabled: true }
//   });

//   constructor(
//     private countryService: CountryService,
//     private regionService: RegionService,
//     private stateService: StateService,
//     private subdivisionService: SubdivisionService,
//     private districtService: DistrictService,
//     private blockService: BlockService
//   ) {}

//   ngOnInit(): void {
//     const today = new Date().toISOString().split('T')[0];
//     this.startDate = this.startDate || today;
//     this.endDate = this.endDate || today;
//     this.fetchDailyStatsData();
//     this.fetchTop5Data();
//     this.updateChart(); // Initialize chart with default data
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (changes['startDate'] || changes['endDate'] || changes['isActual'] || changes['selectedLayer'] || changes['selectedPlace']) {
//       // Update chart x-axis and title when date or place changes
//       if (changes['endDate'] || changes['selectedPlace']) {
//         // Regenerate dummy data when place changes
//         if (changes['selectedPlace'] && !changes['selectedPlace'].firstChange) {
//           this.actualData = Array.from({ length: 30 }, () => Math.random() * 50 + 20);
//           this.normalData = Array.from({ length: 30 }, () => Math.random() * 30);
//         }
//         this.updateChart();
//       }
//       this.fetchDailyStatsData();
//       this.fetchTop5Data();
//     }
//   }

//   private updateChart() {
//     this.chart.ref$.subscribe(chart => {
//       chart.update({
//         title: {
//           text: `Daily Rainfall (Last 30 Days) - ${this.selectedPlace.name || 'Country'}`
//         },
//         xAxis: {
//           categories: this.getLast30Days()
//         },
//         series: [
//           {
//             name: 'Actual',
//             type: 'column',
//             data: this.actualData,
//             color: '#007bff',
//             dataLabels: {
//               enabled: true,
//               formatter: (function(component) {
//                 return function(this: any) {
//                   const index = this.point.index ?? 0;
//                   const departure = ((this.y ?? 0) - component.normalData[index]).toFixed(1);
//                   return departure;
//                 };
//               })(this),
//               style: {
//                 color: '#adb5bd',
//                 fontSize: '10px',
//                 fontWeight: '400',
//                 textOutline: '1px contrast'
//               },
//               verticalAlign: 'top',
//               y: -10
//             }
//           },
//           {
//             name: 'Normal',
//             type: 'line',
//             data: this.normalData,
//             color: '#28a745'
//           }
//         ]
//       });
//     });
//   }

//   private fetchDailyStatsData() {
//     const params = {
//       startDate: this.startDate,
//       endDate: this.endDate,
//       mode: this.isActual ? 'Actual' : 'Departure'
//     };

//     this.countryService.fetchData(params).subscribe({
//       next: countryRes => {
//         this.countryData = countryRes.data || [];
//         this.regionService.fetchData(params).subscribe({
//           next: regionRes => {
//             this.regionData = regionRes.data || [];
//             this.updateRegions();
//           },
//           error: err => console.error('Error fetching region data:', err)
//         });
//       },
//       error: err => console.error('Error fetching country data:', err)
//     });
//   }

//   private updateRegions() {
//     const country = this.countryData[0] || {};
//     const countryItem = {
//       name: country.name || 'Country',
//       actual: parseFloat(country.actual_rainfall as string ?? '0').toFixed(1),
//       normal: parseFloat(country.rainfall_normal_value as string ?? '0').toFixed(1),
//       departure: parseFloat(country.departure as string ?? '0').toFixed(1) + '%'
//     };

//     const regionsItems = this.regionData.map(r => ({
//       name: r.region_name || r.name || 'Unknown',
//       actual: parseFloat(r.actual_rainfall as string ?? '0').toFixed(1),
//       normal: parseFloat(r.rainfall_normal_value as string ?? '0').toFixed(1),
//       departure: parseFloat(r.departure as string ?? '0').toFixed(1) + '%'
//     }));

//     this.regions = [countryItem, ...regionsItems];
//   }

//   private fetchTop5Data() {
//     const params = {
//       startDate: this.startDate,
//       endDate: this.endDate,
//       mode: this.isActual ? 'Actual' : 'Departure'
//     };

//     let service;
//     let nameKey: string;
//     let actualKey: string;
//     let layerLabel: string;

//     switch (this.selectedLayer) {
//       case 'country':
//       case 'region':
//       case 'block':
//         service = this.blockService;
//         nameKey = 'block_name';
//         actualKey = 'actual_rainfall';
//         layerLabel = 'Block';
//         break;
//       case 'state':
//         service = this.stateService;
//         nameKey = 'state_name';
//         actualKey = 'actual_state_rainfall';
//         layerLabel = 'State';
//         break;
//       case 'subdivision':
//         service = this.subdivisionService;
//         nameKey = 'subdiv_name';
//         actualKey = 'actual_subdiv_rainfall';
//         layerLabel = 'Sub Division';
//         break;
//       case 'district':
//         service = this.districtService;
//         nameKey = 'district_name';
//         actualKey = 'actual_rainfall';
//         layerLabel = 'District';
//         break;
//       default:
//         return;
//     }

//     this.top5Title = `Top 5 ${layerLabel}s - Current Day`;

//     service.fetchData(params).subscribe({
//       next: res => {
//         let data: RainfallData[] = res.data || [];
//         data = data
//           .filter((d: RainfallData) => d[actualKey] != null && !isNaN(parseFloat(d[actualKey] as string)))
//           .sort((a: RainfallData, b: RainfallData) => parseFloat(b[actualKey] as string) - parseFloat(a[actualKey] as string))
//           .slice(0, 5);

//         this.top5 = data.map((d: RainfallData) => ({
//           name: this.toCamelCase(d[nameKey] || 'Unknown'),
//           actual: parseFloat(d[actualKey] as string ?? '0').toFixed(1)
//         }));

//         const classes = ['text-primary', 'text-success', 'text-warning', 'text-info', 'text-danger'];
//         this.top5.forEach((item, idx) => {
//           item.colorClass = classes[idx];
//         });
//       },
//       error: err => console.error('Error fetching top 5 data:', err)
//     });
//   }

//   private toCamelCase(name: string | null): string {
//     if (!name) return '';
//     return name
//       .split(' ')
//       .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
//       .join(' ');
//   }
// }


// import { Component, OnInit, OnChanges, SimpleChanges, Input } from '@angular/core';
// import { Chart } from 'angular-highcharts';
// import { CountryService } from 'src/app/services/country/country.service';
// import { RegionService } from 'src/app/services/region/region.service';
// import { StateService } from 'src/app/services/state/state.service';
// import { SubdivisionService } from 'src/app/services/subDivision/subDivision.service';
// import { DistrictService } from 'src/app/services/district/district.service';
// import { BlockService } from 'src/app/services/block/BlockService.service';
// import { forkJoin } from 'rxjs';

// // Define an interface for the rainfall data structure
// interface RainfallData {
//   name?: string;
//   region_name?: string;
//   state_name?: string;
//   subdiv_name?: string;
//   district_name?: string;
//   block_name?: string;
//   actual_rainfall?: number | string;
//   actual_state_rainfall?: number | string;
//   actual_subdiv_rainfall?: number | string;
//   rainfall_normal_value?: number | string;
//   normal_rainfall?: number | string;
//   departure?: number | string;
//   [key: string]: any;
// }

// @Component({
//   selector: 'app-map-charts',
//   templateUrl: './map-charts.component.html',
//   styleUrls: ['./map-charts.component.css']
// })
// export class MapChartsComponent implements OnInit, OnChanges {
//   @Input() selectedLayer: string = 'country';
//   @Input() startDate: string = '';
//   @Input() endDate: string = '';
//   @Input() isActual: boolean = false;
//   @Input() selectedPlace: { layer: string; name: string } = { layer: 'country', name: 'India' };

//   regions: any[] = [];
//   top5: any[] = [];
//   top5Title: string = 'Top 5 Blocks - Current Day';
//   highestRecorded: any[] = [];
//   highestRecordedTitle: string = 'India Highest Recorded';
//   countryData: RainfallData[] = [];
//   regionData: RainfallData[] = [];
//   stateData: RainfallData[] = [];
//   subdivisionData: RainfallData[] = [];
//   districtData: RainfallData[] = [];
//   blockData: RainfallData[] = [];
//   isChartLoading: boolean = false;

//   // Chart data
//   actualData: number[] = [];
//   normalData: number[] = [];
//   dates: string[] = [];

//   chart = new Chart({
//     chart: {
//       type: 'line',
//       height: 400
//     },
//     title: {
//       text: `Daily Rainfall (Last 30 Days) - ${this.selectedPlace.name}`,
//       style: {
//         fontSize: '14px'
//       }
//     },
//     xAxis: {
//       categories: this.getLast30Days(),
//       title: {
//         text: 'Date',
//         style: { fontSize: '12px' }
//       },
//       labels: {
//         rotation: -45,
//         step: 2,
//         style: {
//           fontSize: '10px'
//         }
//       }
//     },
//     yAxis: {
//       title: {
//         text: 'Rainfall (mm)',
//         style: { fontSize: '12px' }
//       },
//       min: 0,
//       max: undefined
//     },
//     credits: { enabled: false },
//     legend: {
//       itemStyle: {
//         fontSize: '10px',
//         fontWeight: '400'
//       },
//       margin: 5
//     },
//     tooltip: { shared: true },
//     series: [
//       {
//         name: 'Actual',
//         type: 'column',
//         data: this.actualData,
//         color: '#007bff',
//         dataLabels: {
//           enabled: true,
//           formatter: (function(component) {
//             return function(this: any) {
//               const index = this.point.index ?? 0;
//               const departure = ((this.y ?? 0) - component.normalData[index]).toFixed(1);
//               return departure;
//             };
//           })(this),
//           style: {
//             color: '#adb5bd',
//             fontSize: '10px',
//             fontWeight: '400',
//             textOutline: '1px contrast'
//           },
//           verticalAlign: 'top',
//           y: -10
//         }
//       },
//       {
//         name: 'Normal',
//         type: 'line',
//         data: this.normalData,
//         color: '#28a745'
//       }
//     ],
//     exporting: { enabled: true }
//   });

//   constructor(
//     private countryService: CountryService,
//     private regionService: RegionService,
//     private stateService: StateService,
//     private subdivisionService: SubdivisionService,
//     private districtService: DistrictService,
//     private blockService: BlockService
//   ) {}

//   ngOnInit(): void {
//     const today = new Date().toISOString().split('T')[0];
//     this.startDate = this.startDate || today;
//     this.endDate = this.endDate || today;
//     this.fetchDailyStatsData();
//     this.fetchTop5Data();
//     this.fetchChartData();
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (changes['startDate'] || changes['endDate'] || changes['isActual'] || changes['selectedLayer'] || changes['selectedPlace']) {
//       this.highestRecordedTitle = `${this.selectedPlace.name} Highest Recorded`;
//       this.fetchDailyStatsData();
//       this.fetchTop5Data();
//       if (changes['endDate'] || changes['selectedPlace'] || changes['isActual']) {
//         this.fetchChartData();
//       }
//     }
//   }

//   private getLast30Days(): string[] {
//     const dates: string[] = [];
//     const today = new Date(this.endDate || new Date().toISOString().split('T')[0]);
//     for (let i = 29; i >= 0; i--) {
//       const date = new Date(today);
//       date.setDate(today.getDate() - i);
//       dates.push(date.toISOString().split('T')[0]);
//     }
//     return dates;
//   }

//   private fetchChartData(): void {
//     this.isChartLoading = true;
//     this.dates = this.getLast30Days();
//     const service = this.getServiceForLayer(this.selectedPlace.layer);
//     if (!service) {
//       this.isChartLoading = false;
//       return;
//     }

//     const observables = this.dates.map(date =>
//       service.fetchData({
//         startDate: date,
//         endDate: date,
//         mode: this.isActual ? 'Actual' : 'Departure'
//       })
//     );

//     forkJoin(observables).subscribe({
//       next: (responses: any[]) => {
//         this.actualData = [];
//         this.normalData = [];
//         this.highestRecorded = [];
//         const rainfallData: { date: string; actual: number }[] = [];

//         responses.forEach((res, index) => {
//           const data = res.data || [];
//           const item = this.findItemForPlace(data, this.selectedPlace.layer, this.selectedPlace.name);
//           if (item) {
//             const actualKey = this.getActualKey(this.selectedPlace.layer);
//             const normalKey = this.getNormalKey(this.selectedPlace.layer);
//             const actualValue = parseFloat(item[actualKey] as string ?? '0');
//             this.actualData.push(actualValue);
//             this.normalData.push(parseFloat(item[normalKey] as string ?? '0'));
//             rainfallData.push({ date: this.dates[index], actual: actualValue });
//           } else {
//             this.actualData.push(0);
//             this.normalData.push(0);
//             rainfallData.push({ date: this.dates[index], actual: 0 });
//           }
//         });

//         // Sort and select top 5 highest recorded rainfall values
//         this.highestRecorded = rainfallData
//           .filter(item => item.actual > 0)
//           .sort((a, b) => b.actual - a.actual)
//           .slice(0, 5)
//           .map((item, idx) => ({
//             date: item.date,
//             actual: item.actual.toFixed(1),
//             colorClass: ['text-primary', 'text-success', 'text-warning', 'text-info', 'text-danger'][idx]
//           }));

//         this.updateChart();
//         this.isChartLoading = false;
//       },
//       error: err => {
//         console.error('Error fetching chart data:', err);
//         this.isChartLoading = false;
//       }
//     });
//   }

//   private getServiceForLayer(layer: string): any {
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

//   private findItemForPlace(data: RainfallData[], layer: string, name: string): RainfallData | undefined {
//     const nameKey = this.getDataNameKey(layer);
//     return data.find(d => this.toCamelCase(d[nameKey] as string ?? '') === name);
//   }

//   private getDataNameKey(layer: string): string {
//     switch (layer) {
//       case 'country': return 'name';
//       case 'region': return 'name';
//       case 'state': return 'state_name';
//       case 'subdivision': return 'subdiv_name';
//       case 'district': return 'district_name';
//       case 'block': return 'block_name';
//       default: return '';
//     }
//   }

//   private getActualKey(layer: string): string {
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

//   private getNormalKey(layer: string): string {
//     switch (layer) {
//       case 'country': return 'rainfall_normal_value';
//       case 'region':
//       case 'state':
//       case 'subdivision': return 'rainfall_normal_value';
//       case 'district':
//       case 'block': return 'normal_rainfall';
//       default: return '';
//     }
//   }

//   private updateChart() {
//     this.chart.ref$.subscribe(chart => {
//       chart.update({
//         title: {
//           text: `Daily Rainfall (Last 30 Days) - ${this.selectedPlace.name || 'India'}`
//         },
//         xAxis: {
//           categories: this.dates
//         },
//         series: [
//           {
//             name: 'Actual',
//             type: 'column',
//             data: this.actualData,
//             color: '#007bff',
//             dataLabels: {
//               enabled: true,
//               formatter: (function(component) {
//                 return function(this: any) {
//                   const index = this.point.index ?? 0;
//                   const departure = ((this.y ?? 0) - component.normalData[index]).toFixed(1);
//                   return departure;
//                 };
//               })(this),
//               style: {
//                 color: '#adb5bd',
//                 fontSize: '10px',
//                 fontWeight: '400',
//                 textOutline: '1px contrast'
//               },
//               verticalAlign: 'top',
//               y: -10
//             }
//           },
//           {
//             name: 'Normal',
//             type: 'line',
//             data: this.normalData,
//             color: '#28a745'
//           }
//         ]
//       });
//     });
//   }

//   private fetchDailyStatsData() {
//     const params = {
//       startDate: this.startDate,
//       endDate: this.endDate,
//       mode: this.isActual ? 'Actual' : 'Departure'
//     };

//     this.countryService.fetchData(params).subscribe({
//       next: countryRes => {
//         this.countryData = countryRes.data || [];
//         this.regionService.fetchData(params).subscribe({
//           next: regionRes => {
//             this.regionData = regionRes.data || [];
//             this.updateRegions();
//           },
//           error: err => console.error('Error fetching region data:', err)
//         });
//       },
//       error: err => console.error('Error fetching country data:', err)
//     });
//   }

//   private updateRegions() {
//     const country = this.countryData[0] || {};
//     const countryItem = {
//       name: country.name || 'India',
//       actual: parseFloat(country.actual_rainfall as string ?? '0').toFixed(1),
//       normal: parseFloat(country.rainfall_normal_value as string ?? '0').toFixed(1),
//       departure: parseFloat(country.departure as string ?? '0').toFixed(1) + '%'
//     };

//     const regionsItems = this.regionData.map(r => ({
//       name: r.name || 'Unknown',
//       actual: parseFloat(r.actual_rainfall as string ?? '0').toFixed(1),
//       normal: parseFloat(r.rainfall_normal_value as string ?? '0').toFixed(1),
//       departure: parseFloat(r.departure as string ?? '0').toFixed(1) + '%'
//     }));

//     this.regions = [countryItem, ...regionsItems];
//   }

//   private fetchTop5Data() {
//     const params = {
//       startDate: this.startDate,
//       endDate: this.endDate,
//       mode: this.isActual ? 'Actual' : 'Departure'
//     };

//     let service;
//     let nameKey: string;
//     let actualKey: string;
//     let layerLabel: string;

//     switch (this.selectedLayer) {
//       case 'country':
//       case 'region':
//       case 'block':
//         service = this.blockService;
//         nameKey = 'block_name';
//         actualKey = 'actual_rainfall';
//         layerLabel = 'Blocks';
//         break;
//       case 'state':
//         service = this.stateService;
//         nameKey = 'state_name';
//         actualKey = 'actual_state_rainfall';
//         layerLabel = 'States';
//         break;
//       case 'subdivision':
//         service = this.subdivisionService;
//         nameKey = 'subdiv_name';
//         actualKey = 'actual_subdiv_rainfall';
//         layerLabel = 'Sub Divisions';
//         break;
//       case 'district':
//         service = this.districtService;
//         nameKey = 'district_name';
//         actualKey = 'actual_rainfall';
//         layerLabel = 'Districts';
//         break;
//       default:
//         return;
//     }

//     this.top5Title = `Top 5 ${layerLabel} - Current Day`;

//     service.fetchData(params).subscribe({
//       next: res => {
//         let data: RainfallData[] = res.data || [];
//         data = data
//           .filter((d: RainfallData) => d[actualKey] != null && !isNaN(parseFloat(d[actualKey] as string)))
//           .sort((a: RainfallData, b: RainfallData) => parseFloat(b[actualKey] as string) - parseFloat(a[actualKey] as string))
//           .slice(0, 5);

//         this.top5 = data.map((d: RainfallData) => ({
//           name: this.toCamelCase(d[nameKey] || 'Unknown'),
//           actual: parseFloat(d[actualKey] as string ?? '0').toFixed(1)
//         }));

//         const classes = ['text-primary', 'text-success', 'text-warning', 'text-info', 'text-danger'];
//         this.top5.forEach((item, idx) => {
//           item.colorClass = classes[idx];
//         });
//       },
//       error: err => console.error('Error fetching top 5 data:', err)
//     });
//   }

//   private toCamelCase(name: string | null): string {
//     if (!name) return '';
//     return name
//       .toLowerCase()
//       .split(' ')
//       .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//       .join(' ');
//   }
// }

// import { Component, OnInit, OnChanges, SimpleChanges, Input } from '@angular/core';
// import { Chart } from 'angular-highcharts';
// import { CountryService } from 'src/app/services/country/country.service';
// import { RegionService } from 'src/app/services/region/region.service';
// import { StateService } from 'src/app/services/state/state.service';
// import { SubdivisionService } from 'src/app/services/subDivision/subDivision.service';
// import { DistrictService } from 'src/app/services/district/district.service';
// import { BlockService } from 'src/app/services/block/BlockService.service';
// import { forkJoin } from 'rxjs';
// import * as Highcharts from 'highcharts';
// import Exporting from 'highcharts/modules/exporting';

// // Define an interface for the rainfall data structure
// interface RainfallData {
//   name?: string;
//   region_name?: string;
//   state_name?: string;
//   subdiv_name?: string;
//   district_name?: string;
//   block_name?: string;
//   actual_rainfall?: number | string;
//   actual_state_rainfall?: number | string;
//   actual_subdiv_rainfall?: number | string;
//   rainfall_normal_value?: number | string;
//   normal_rainfall?: number | string;
//   departure?: number | string;
//   [key: string]: any;
// }

// @Component({
//   selector: 'app-map-charts',
//   templateUrl: './map-charts.component.html',
//   styleUrls: ['./map-charts.component.css']
// })
// export class MapChartsComponent implements OnInit, OnChanges {
//   @Input() selectedLayer: string = 'country';
//   @Input() startDate: string = '';
//   @Input() endDate: string = '';
//   @Input() isActual: boolean = false;
//   @Input() selectedPlace: { layer: string; name: string } = { layer: 'country', name: 'India' };

//   regions: any[] = [];
//   top5: any[] = [];
//   top5Title: string = 'Top 5 Blocks - Current Day';
//   highestRecorded: any[] = [];
//   highestRecordedTitle: string = 'India Highest Recorded';
//   countryData: RainfallData[] = [];
//   regionData: RainfallData[] = [];
//   stateData: RainfallData[] = [];
//   subdivisionData: RainfallData[] = [];
//   districtData: RainfallData[] = [];
//   blockData: RainfallData[] = [];
//   isChartLoading: boolean = false;

//   // Chart data
//   actualData: number[] = [];
//   normalData: number[] = [];
//   departureData: number[] = [];
//   dates: string[] = [];

//   chart = new Chart({
//     chart: {
//       type: 'column',
//       height: 400
//     },
//     title: {
//       text: `Daily Rainfall (Last 30 Days) - ${this.selectedPlace.name}`,
//       style: {
//         color: '#333',
//         fontSize: '15px',
//         fontWeight: 'normal',
//         fontFamily: 'Arial, sans-serif'
//       }
//     },
//     xAxis: {
//       categories: this.getLast30Days(),
//       title: {
//         text: 'Date',
//         style: { fontSize: '12px' }
//       },
//       labels: {
//         rotation: -45,
//         step: 2,
//         style: {
//           fontSize: '10px'
//         }
//       }
//     },
//     yAxis: {
//       title: {
//         text: 'Rainfall (mm)',
//         style: { fontSize: '12px' }
//       },
//       min: 0,
//       max: undefined
//     },
//     credits: { enabled: false },
//     legend: {
//       itemStyle: {
//         fontSize: '10px',
//         fontWeight: '400'
//       },
//       margin: 5
//     },
//     tooltip: { shared: true },
//     series: [
//       {
//         name: 'Actual',
//         type: 'column',
//         data: this.actualData,
//         color: 'green',
//         dataLabels: {
//           enabled: true,
//           formatter: (function(component) {
//             return function(this: any) {
//               const index = this.point.index ?? 0;
//               const departure = component.departureData[index].toFixed(1) + '%';
//               return departure;
//             };
//           })(this),
//           style: {
//             color: 'black',
//             fontSize: '10px',
//             fontWeight: '400',
//             textOutline: '1px contrast'
//           },
//           verticalAlign: 'top',
//           inside: false,
//           y: -25
//         }
//       },
//       {
//         name: 'Normal',
//         type: 'line',
//         data: this.normalData,
//         color: 'darkblue'
//       },
//       {
//         name: 'Departure',
//         type: 'line',
//         data: [],
//         color: 'black',
//         showInLegend: true,
//         marker: {
//           enabled: false
//         },
//         enableMouseTracking: false,
//         events: {
//           legendItemClick: function () {
//             const chart = this.chart;
//             const actualSeries = chart.series[0];
//             const visible = this.visible;
//             actualSeries.update({
//               dataLabels: {
//                 enabled: !visible
//               },
//               type: 'column'
//             });
//             return true;
//           }
//         }
//       }
//     ],
//     exporting: {
//       enabled: true,
//       buttons: {
//         contextButton: {
//           menuItems: ['viewFullscreen', 'printChart']
//         }
//       }
//     }
//   });

//   constructor(
//     private countryService: CountryService,
//     private regionService: RegionService,
//     private stateService: StateService,
//     private subdivisionService: SubdivisionService,
//     private districtService: DistrictService,
//     private blockService: BlockService
//   ) {}

//   ngOnInit(): void {
//     Exporting(Highcharts);
//     const today = new Date().toISOString().split('T')[0];
//     this.startDate = this.startDate || today;
//     this.endDate = this.endDate || today;
//     this.fetchDailyStatsData();
//     this.fetchTop5Data();
//     this.fetchChartData();
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (changes['startDate'] || changes['endDate'] || changes['isActual'] || changes['selectedLayer'] || changes['selectedPlace']) {
//       this.highestRecordedTitle = `${this.selectedPlace.name} Highest Recorded`;
//       this.fetchDailyStatsData();
//       this.fetchTop5Data();
//       if (changes['endDate'] || changes['selectedPlace'] || changes['isActual']) {
//         this.fetchChartData();
//       }
//     }
//   }

//   private getLast30Days(): string[] {
//     const dates: string[] = [];
//     const today = new Date(this.endDate || new Date().toISOString().split('T')[0]);
//     for (let i = 29; i >= 0; i--) {
//       const date = new Date(today);
//       date.setDate(today.getDate() - i);
//       dates.push(date.toISOString().split('T')[0]);
//     }
//     return dates;
//   }

//   private fetchChartData(): void {
//     this.isChartLoading = true;
//     this.dates = this.getLast30Days();
//     const service = this.getServiceForLayer(this.selectedPlace.layer);
//     if (!service) {
//       this.isChartLoading = false;
//       return;
//     }

//     const observables = this.dates.map(date =>
//       service.fetchData({
//         startDate: date,
//         endDate: date,
//         mode: this.isActual ? 'Actual' : 'Departure'
//       })
//     );

//     forkJoin(observables).subscribe({
//       next: (responses: any[]) => {
//         this.actualData = [];
//         this.normalData = [];
//         this.departureData = [];
//         this.highestRecorded = [];
//         const rainfallData: { date: string; actual: number }[] = [];

//         responses.forEach((res, index) => {
//           const data = res.data || [];
//           const item = this.findItemForPlace(data, this.selectedPlace.layer, this.selectedPlace.name);
//           if (item) {
//             const actualKey = this.getActualKey(this.selectedPlace.layer);
//             const normalKey = this.getNormalKey(this.selectedPlace.layer);
//             const actualValue = parseFloat(item[actualKey] as string ?? '0');
//             const normalValue = parseFloat(item[normalKey] as string ?? '0');
//             const departureValue = parseFloat(item.departure as string ?? '0');
//             this.actualData.push(actualValue);
//             this.normalData.push(normalValue);
//             this.departureData.push(departureValue);
//             rainfallData.push({ date: this.dates[index], actual: actualValue });
//           } else {
//             this.actualData.push(0);
//             this.normalData.push(0);
//             this.departureData.push(0);
//             rainfallData.push({ date: this.dates[index], actual: 0 });
//           }
//         });

//         // Sort and select top 5 highest recorded rainfall values
//         this.highestRecorded = rainfallData
//           .filter(item => item.actual > 0)
//           .sort((a, b) => b.actual - a.actual)
//           .slice(0, 5)
//           .map((item, idx) => ({
//             date: item.date,
//             actual: item.actual.toFixed(1),
//             colorClass: ['text-primary', 'text-success', 'text-warning', 'text-info', 'text-danger'][idx]
//           }));

//         this.updateChart();
//         this.isChartLoading = false;
//       },
//       error: err => {
//         console.error('Error fetching chart data:', err);
//         this.isChartLoading = false;
//       }
//     });
//   }

//   private getServiceForLayer(layer: string): any {
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

//   private findItemForPlace(data: RainfallData[], layer: string, name: string): RainfallData | undefined {
//     const nameKey = this.getDataNameKey(layer);
//     return data.find(d => this.toCamelCase(d[nameKey] as string ?? '') === name);
//   }

//   private getDataNameKey(layer: string): string {
//     switch (layer) {
//       case 'country': return 'name';
//       case 'region': return 'name';
//       case 'state': return 'state_name';
//       case 'subdivision': return 'subdiv_name';
//       case 'district': return 'district_name';
//       case 'block': return 'block_name';
//       default: return '';
//     }
//   }

//   private getActualKey(layer: string): string {
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

//   private getNormalKey(layer: string): string {
//     switch (layer) {
//       case 'country': return 'rainfall_normal_value';
//       case 'region':
//       case 'state':
//       case 'subdivision': return 'rainfall_normal_value';
//       case 'district':
//       case 'block': return 'normal_rainfall';
//       default: return '';
//     }
//   }

//   private updateChart() {
//     const maxActual = Math.max(...this.actualData, 0);
//     const maxNormal = Math.max(...this.normalData, 0);
//     const maxValue = Math.max(maxActual, maxNormal);
//     let roundedMax = Math.ceil(maxValue);
//     if (roundedMax === 0) roundedMax = 1;
//     const tickInterval = roundedMax / 5;

//     const formattedDates = this.dates.map(date => {
//       const [year, month, day] = date.split('-');
//       return `${day}-${month}-${year}`;
//     });

//     this.chart.ref$.subscribe(chart => {
//       chart.update({
//         title: {
//           text: `Daily Rainfall (Last 30 Days) - ${this.selectedPlace.name || 'India'}`,
//           style: {
//             color: '#333',
//             fontSize: '15px',
//             fontWeight: 'normal',
//             fontFamily: 'Arial, sans-serif'
//           }
//         },
//         xAxis: {
//           categories: formattedDates,
//           title: {
//             text: 'Date',
//             style: { fontSize: '12px' }
//           },
//           labels: {
//             rotation: -45,
//             step: 2,
//             style: {
//               fontSize: '10px'
//             }
//           }
//         },
//         yAxis: {
//           min: 0,
//           max: roundedMax,
//           tickInterval: tickInterval,
//           title: {
//             text: 'Rainfall (mm)',
//             style: { fontSize: '12px' }
//           }
//         },
//         series: [
//           {
//             name: 'Actual',
//             type: 'column',
//             data: this.actualData,
//             color: 'green',
//             dataLabels: {
//               enabled: true,
//               formatter: (function(component) {
//                 return function(this: any) {
//                   const index = this.point.index ?? 0;
//                   const departure = component.departureData[index].toFixed(1) + '%';
//                   return departure;
//                 };
//               })(this),
//               style: {
//                 color: 'black',
//                 fontSize: '10px',
//                 fontWeight: '400',
//                 textOutline: '1px contrast'
//               },
//               verticalAlign: 'top',
//               inside: false,
//               y: -25
//             }
//           },
//           {
//             name: 'Normal',
//             type: 'line',
//             data: this.normalData,
//             color: 'darkblue'
//           },
//           {
//             name: 'Departure',
//             type: 'line',
//             data: [],
//             color: 'black',
//             showInLegend: true,
//             marker: {
//               enabled: false
//             },
//             enableMouseTracking: false,
//             events: {
//               legendItemClick: function () {
//                 const chart = this.chart;
//                 const actualSeries = chart.series[0];
//                 const visible = this.visible;
//                 actualSeries.update({
//                   dataLabels: {
//                     enabled: !visible
//                   },
//                   type: 'column'
//                 });
//                 return true;
//               }
//             }
//           }
//         ]
//       });
//     });
//   }

//   private fetchDailyStatsData() {
//     const params = {
//       startDate: this.startDate,
//       endDate: this.endDate,
//       mode: this.isActual ? 'Actual' : 'Departure'
//     };

//     this.countryService.fetchData(params).subscribe({
//       next: countryRes => {
//         this.countryData = countryRes.data || [];
//         this.regionService.fetchData(params).subscribe({
//           next: regionRes => {
//             this.regionData = regionRes.data || [];
//             this.updateRegions();
//           },
//           error: err => console.error('Error fetching region data:', err)
//         });
//       },
//       error: err => console.error('Error fetching country data:', err)
//     });
//   }

//   private updateRegions() {
//     const country = this.countryData[0] || {};
//     const countryItem = {
//       name: country.name || 'India',
//       actual: parseFloat(country.actual_rainfall as string ?? '0').toFixed(1),
//       normal: parseFloat(country.rainfall_normal_value as string ?? '0').toFixed(1),
//       departure: parseFloat(country.departure as string ?? '0').toFixed(1) + '%'
//     };

//     const regionsItems = this.regionData.map(r => ({
//       name: r.name || 'Unknown',
//       actual: parseFloat(r.actual_rainfall as string ?? '0').toFixed(1),
//       normal: parseFloat(r.rainfall_normal_value as string ?? '0').toFixed(1),
//       departure: parseFloat(r.departure as string ?? '0').toFixed(1) + '%'
//     }));

//     this.regions = [countryItem, ...regionsItems];
//   }

//   private fetchTop5Data() {
//     const params = {
//       startDate: this.startDate,
//       endDate: this.endDate,
//       mode: this.isActual ? 'Actual' : 'Departure'
//     };

//     let service;
//     let nameKey: string;
//     let actualKey: string;
//     let layerLabel: string;

//     switch (this.selectedLayer) {
//       case 'country':
//       case 'region':
//       case 'block':
//         service = this.blockService;
//         nameKey = 'block_name';
//         actualKey = 'actual_rainfall';
//         layerLabel = 'Blocks';
//         break;
//       case 'state':
//         service = this.stateService;
//         nameKey = 'state_name';
//         actualKey = 'actual_state_rainfall';
//         layerLabel = 'States';
//         break;
//       case 'subdivision':
//         service = this.subdivisionService;
//         nameKey = 'subdiv_name';
//         actualKey = 'actual_subdiv_rainfall';
//         layerLabel = 'Sub Divisions';
//         break;
//       case 'district':
//         service = this.districtService;
//         nameKey = 'district_name';
//         actualKey = 'actual_rainfall';
//         layerLabel = 'Districts';
//         break;
//       default:
//         return;
//     }

//     this.top5Title = `Top 5 ${layerLabel} - Current Day`;

//     service.fetchData(params).subscribe({
//       next: res => {
//         let data: RainfallData[] = res.data || [];
//         data = data
//           .filter((d: RainfallData) => d[actualKey] != null && !isNaN(parseFloat(d[actualKey] as string)))
//           .sort((a: RainfallData, b: RainfallData) => parseFloat(b[actualKey] as string) - parseFloat(a[actualKey] as string))
//           .slice(0, 5);

//         this.top5 = data.map((d: RainfallData) => ({
//           name: this.toCamelCase(d[nameKey] || 'Unknown'),
//           actual: parseFloat(d[actualKey] as string ?? '0').toFixed(1)
//         }));

//         const classes = ['text-primary', 'text-success', 'text-warning', 'text-info', 'text-danger'];
//         this.top5.forEach((item, idx) => {
//           item.colorClass = classes[idx];
//         });
//       },
//       error: err => console.error('Error fetching top 5 data:', err)
//     });
//   }

//   private toCamelCase(name: string | null): string {
//     if (!name) return '';
//     return name
//       .toLowerCase()
//       .split(' ')
//       .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//       .join(' ');
//   }
// }


// import { Component, OnInit, OnChanges, SimpleChanges, Input } from '@angular/core';
// import { Chart } from 'angular-highcharts';
// import { CountryService } from 'src/app/services/country/country.service';
// import { RegionService } from 'src/app/services/region/region.service';
// import { StateService } from 'src/app/services/state/state.service';
// import { SubdivisionService } from 'src/app/services/subDivision/subDivision.service';
// import { DistrictService } from 'src/app/services/district/district.service';
// import { BlockService } from 'src/app/services/block/BlockService.service';
// import { forkJoin } from 'rxjs';
// import * as Highcharts from 'highcharts';
// import Exporting from 'highcharts/modules/exporting';

// // Define an interface for the rainfall data structure
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
//   [key: string]: any;
// }

// @Component({
//   selector: 'app-map-charts',
//   templateUrl: './map-charts.component.html',
//   styleUrls: ['./map-charts.component.css']
// })
// export class MapChartsComponent implements OnInit, OnChanges {
//   @Input() selectedLayer: string = 'country';
//   @Input() startDate: string = '';
//   @Input() endDate: string = '';
//   @Input() isActual: boolean = false;
//   @Input() selectedPlace: { layer: string; code: string; name: string } = { layer: 'country', code: 'INDIA', name: 'India' };

//   regions: any[] = [];
//   top5: any[] = [];
//   top5Title: string = 'Top 5 Blocks - Current Day';
//   highestRecorded: any[] = [];
//   highestRecordedTitle: string = 'India Highest Recorded';
//   countryData: RainfallData[] = [];
//   regionData: RainfallData[] = [];
//   stateData: RainfallData[] = [];
//   subdivisionData: RainfallData[] = [];
//   districtData: RainfallData[] = [];
//   blockData: RainfallData[] = [];
//   isChartLoading: boolean = false;

//   // Chart data
//   actualData: number[] = [];
//   normalData: number[] = [];
//   departureData: number[] = [];
//   dates: string[] = [];

//   chart = new Chart({
//     chart: {
//       type: 'column',
//       height: 400
//     },
//     title: {
//       text: `Daily Rainfall (Last 30 Days) - ${this.selectedPlace.name}`,
//       style: {
//         color: '#333',
//         fontSize: '15px',
//         fontWeight: 'normal',
//         fontFamily: 'Arial, sans-serif'
//       }
//     },
//     xAxis: {
//       categories: this.getLast30Days(),
//       title: {
//         text: 'Date',
//         style: { fontSize: '12px' }
//       },
//       labels: {
//         rotation: -45,
//         step: 2,
//         style: {
//           fontSize: '10px'
//         }
//       }
//     },
//     yAxis: {
//       title: {
//         text: 'Rainfall (mm)',
//         style: { fontSize: '12px' }
//       },
//       min: 0,
//       max: undefined
//     },
//     credits: { enabled: false },
//     legend: {
//       itemStyle: {
//         fontSize: '10px',
//         fontWeight: '400'
//       },
//       margin: 5
//     },
//     tooltip: { shared: true },
//     series: [
//       {
//         name: 'Actual',
//         type: 'column',
//         data: this.actualData,
//         color: 'green',
//         dataLabels: {
//           enabled: true,
//           formatter: (function(component) {
//             return function(this: any) {
//               const index = this.point.index ?? 0;
//               const departure = component.departureData[index].toFixed(1) + '%';
//               return departure;
//             };
//           })(this),
//           style: {
//             color: 'black',
//             fontSize: '10px',
//             fontWeight: '400',
//             textOutline: '1px contrast'
//           },
//           verticalAlign: 'top',
//           inside: false,
//           y: -25
//         }
//       },
//       {
//         name: 'Normal',
//         type: 'line',
//         data: this.normalData,
//         color: 'darkblue'
//       },
//       {
//         name: 'Departure',
//         type: 'line',
//         data: [],
//         color: 'black',
//         showInLegend: true,
//         marker: {
//           enabled: false
//         },
//         enableMouseTracking: false,
//         events: {
//           legendItemClick: function () {
//             const chart = this.chart;
//             const actualSeries = chart.series[0];
//             const visible = this.visible;
//             actualSeries.update({
//               dataLabels: {
//                 enabled: !visible
//               },
//               type: 'column'
//             });
//             return true;
//           }
//         }
//       }
//     ],
//     exporting: {
//       enabled: true,
//       buttons: {
//         contextButton: {
//           menuItems: ['viewFullscreen', 'printChart']
//         }
//       }
//     }
//   });

//   constructor(
//     private countryService: CountryService,
//     private regionService: RegionService,
//     private stateService: StateService,
//     private subdivisionService: SubdivisionService,
//     private districtService: DistrictService,
//     private blockService: BlockService
//   ) {}

//   ngOnInit(): void {
//     Exporting(Highcharts);
//     const today = new Date().toISOString().split('T')[0];
//     this.startDate = this.startDate || today;
//     this.endDate = this.endDate || today;
//     this.highestRecordedTitle = `${this.selectedPlace.name} Highest Recorded`;
//     this.fetchDailyStatsData();
//     this.fetchTop5Data();
//     this.fetchChartData();
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (changes['startDate'] || changes['endDate'] || changes['isActual'] || changes['selectedLayer'] || changes['selectedPlace']) {
//       this.highestRecordedTitle = `${this.selectedPlace.name} Highest Recorded`;
//       this.fetchDailyStatsData();
//       this.fetchTop5Data();
//       if (changes['endDate'] || changes['selectedPlace'] || changes['isActual']) {
//         this.fetchChartData();
//       }
//     }
//   }

//   private getLast30Days(): string[] {
//     const dates: string[] = [];
//     const today = new Date(this.endDate || new Date().toISOString().split('T')[0]);
//     for (let i = 29; i >= 0; i--) {
//       const date = new Date(today);
//       date.setDate(today.getDate() - i);
//       dates.push(date.toISOString().split('T')[0]);
//     }
//     return dates;
//   }

//   private fetchChartData(): void {
//     this.isChartLoading = true;
//     this.dates = this.getLast30Days();
//     const service = this.getServiceForLayer(this.selectedPlace.layer);
//     if (!service) {
//       this.isChartLoading = false;
//       return;
//     }

//     const observables = this.dates.map(date =>
//       service.fetchData({
//         startDate: date,
//         endDate: date,
//         mode: this.isActual ? 'Actual' : 'Departure'
//       })
//     );

//     forkJoin(observables).subscribe({
//       next: (responses: any[]) => {
//         this.actualData = [];
//         this.normalData = [];
//         this.departureData = [];
//         this.highestRecorded = [];
//         const rainfallData: { date: string; actual: number }[] = [];

//         responses.forEach((res, index) => {
//           const data = res.data || [];
//           const item = this.findItemForPlace(data, this.selectedPlace.layer, this.selectedPlace.code);
//           if (item) {
//             const actualKey = this.getActualKey(this.selectedPlace.layer);
//             const normalKey = this.getNormalKey(this.selectedPlace.layer);
//             const actualValue = parseFloat(item[actualKey] as string ?? '0');
//             const normalValue = parseFloat(item[normalKey] as string ?? '0');
//             const departureValue = parseFloat(item.departure as string ?? '0');
//             this.actualData.push(actualValue);
//             this.normalData.push(normalValue);
//             this.departureData.push(departureValue);
//             rainfallData.push({ date: this.dates[index], actual: actualValue });
//           } else {
//             this.actualData.push(0);
//             this.normalData.push(0);
//             this.departureData.push(0);
//             rainfallData.push({ date: this.dates[index], actual: 0 });
//           }
//         });

//         // Sort and select top 5 highest recorded rainfall values
//         this.highestRecorded = rainfallData
//           .filter(item => item.actual > 0)
//           .sort((a, b) => b.actual - a.actual)
//           .slice(0, 5)
//           .map((item, idx) => ({
//             date: item.date,
//             actual: item.actual.toFixed(1),
//             colorClass: ['text-primary', 'text-success', 'text-warning', 'text-info', 'text-danger'][idx]
//           }));

//         this.updateChart();
//         this.isChartLoading = false;
//       },
//       error: err => {
//         console.error('Error fetching chart data:', err);
//         this.isChartLoading = false;
//       }
//     });
//   }

//   private getServiceForLayer(layer: string): any {
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

//   private findItemForPlace(data: RainfallData[], layer: string, code: string): RainfallData | undefined {
//     const codeKey = this.getDataCodeKey(layer);
//     return data.find(d => String(d[codeKey] ?? '').trim() === String(code).trim());
//   }

//   private getDataCodeKey(layer: string): string {
//     switch (layer) {
//       case 'country': return 'name'; // Country uses 'name' as the unique identifier
//       case 'region': return 'r_code';
//       case 'state': return 'state_code';
//       case 'subdivision': return 's_code';
//       case 'district': return 'district_code';
//       case 'block': return 'block_code';
//       default: return '';
//     }
//   }

//   private getActualKey(layer: string): string {
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

//   private getNormalKey(layer: string): string {
//     switch (layer) {
//       case 'country': return 'rainfall_normal_value';
//       case 'region':
//       case 'state':
//       case 'subdivision': return 'rainfall_normal_value';
//       case 'district':
//       case 'block': return 'normal_rainfall';
//       default: return '';
//     }
//   }

//   private updateChart() {
//     const maxActual = Math.max(...this.actualData, 0);
//     const maxNormal = Math.max(...this.normalData, 0);
//     const maxValue = Math.max(maxActual, maxNormal);
//     let roundedMax = Math.ceil(maxValue);
//     if (roundedMax === 0) roundedMax = 1;
//     const tickInterval = roundedMax / 5;

//     const formattedDates = this.dates.map(date => {
//       const [year, month, day] = date.split('-');
//       return `${day}-${month}-${year}`;
//     });

//     this.chart.ref$.subscribe(chart => {
//       chart.update({
//         title: {
//           text: `Daily Rainfall (Last 30 Days) - ${this.selectedPlace.name || 'India'}`,
//           style: {
//             color: '#333',
//             fontSize: '15px',
//             fontWeight: 'normal',
//             fontFamily: 'Arial, sans-serif'
//           }
//         },
//         xAxis: {
//           categories: formattedDates,
//           title: {
//             text: 'Date',
//             style: { fontSize: '12px' }
//           },
//           labels: {
//             rotation: -45,
//             step: 2,
//             style: {
//               fontSize: '10px'
//             }
//           }
//         },
//         yAxis: {
//           min: 0,
//           max: roundedMax,
//           tickInterval: tickInterval,
//           title: {
//             text: 'Rainfall (mm)',
//             style: { fontSize: '12px' }
//           }
//         },
//         series: [
//           {
//             name: 'Actual',
//             type: 'column',
//             data: this.actualData,
//             color: 'green',
//             dataLabels: {
//               enabled: true,
//               formatter: (function(component) {
//                 return function(this: any) {
//                   const index = this.point.index ?? 0;
//                   const departure = component.departureData[index].toFixed(1) + '%';
//                   return departure;
//                 };
//               })(this),
//               style: {
//                 color: 'black',
//                 fontSize: '10px',
//                 fontWeight: '400',
//                 textOutline: '1px contrast'
//               },
//               verticalAlign: 'top',
//               inside: false,
//               y: -25
//             }
//           },
//           {
//             name: 'Normal',
//             type: 'line',
//             data: this.normalData,
//             color: 'darkblue'
//           },
//           {
//             name: 'Departure',
//             type: 'line',
//             data: [],
//             color: 'black',
//             showInLegend: true,
//             marker: {
//               enabled: false
//             },
//             enableMouseTracking: false,
//             events: {
//               legendItemClick: function () {
//                 const chart = this.chart;
//                 const actualSeries = chart.series[0];
//                 const visible = this.visible;
//                 actualSeries.update({
//                   dataLabels: {
//                     enabled: !visible
//                   },
//                   type: 'column'
//                 });
//                 return true;
//               }
//             }
//           }
//         ]
//       });
//     });
//   }

//   private fetchDailyStatsData() {
//     const params = {
//       startDate: this.startDate,
//       endDate: this.endDate,
//       mode: this.isActual ? 'Actual' : 'Departure'
//     };

//     this.countryService.fetchData(params).subscribe({
//       next: countryRes => {
//         this.countryData = countryRes.data || [];
//         this.regionService.fetchData(params).subscribe({
//           next: regionRes => {
//             this.regionData = regionRes.data || [];
//             this.updateRegions();
//           },
//           error: err => console.error('Error fetching region data:', err)
//         });
//       },
//       error: err => console.error('Error fetching country data:', err)
//     });
//   }

//   private updateRegions() {
//     const country = this.countryData[0] || {};
//     const countryItem = {
//       name: country.name || 'India',
//       actual: parseFloat(country.actual_rainfall as string ?? '0').toFixed(1),
//       normal: parseFloat(country.rainfall_normal_value as string ?? '0').toFixed(1),
//       departure: parseFloat(country.departure as string ?? '0').toFixed(1) + '%'
//     };

//     const regionsItems = this.regionData.map(r => ({
//       name: r.name || 'Unknown',
//       actual: parseFloat(r.actual_rainfall as string ?? '0').toFixed(1),
//       normal: parseFloat(r.rainfall_normal_value as string ?? '0').toFixed(1),
//       departure: parseFloat(r.departure as string ?? '0').toFixed(1) + '%'
//     }));

//     this.regions = [countryItem, ...regionsItems];
//   }

//   private fetchTop5Data() {
//     const params = {
//       startDate: this.startDate,
//       endDate: this.endDate,
//       mode: this.isActual ? 'Actual' : 'Departure'
//     };

//     let service;
//     let nameKey: string;
//     let actualKey: string;
//     let layerLabel: string;

//     switch (this.selectedLayer) {
//       case 'country':
//       case 'region':
//       case 'block':
//         service = this.blockService;
//         nameKey = 'block_name';
//         actualKey = 'actual_rainfall';
//         layerLabel = 'Blocks';
//         break;
//       case 'state':
//         service = this.stateService;
//         nameKey = 'state_name';
//         actualKey = 'actual_state_rainfall';
//         layerLabel = 'States';
//         break;
//       case 'subdivision':
//         service = this.subdivisionService;
//         nameKey = 'subdiv_name';
//         actualKey = 'actual_subdiv_rainfall';
//         layerLabel = 'Sub Divisions';
//         break;
//       case 'district':
//         service = this.districtService;
//         nameKey = 'district_name';
//         actualKey = 'actual_rainfall';
//         layerLabel = 'Districts';
//         break;
//       default:
//         return;
//     }

//     this.top5Title = `Top 5 ${layerLabel} - Current Day`;

//     service.fetchData(params).subscribe({
//       next: res => {
//         let data: RainfallData[] = res.data || [];
//         data = data
//           .filter((d: RainfallData) => d[actualKey] != null && !isNaN(parseFloat(d[actualKey] as string)))
//           .sort((a: RainfallData, b: RainfallData) => parseFloat(b[actualKey] as string) - parseFloat(a[actualKey] as string))
//           .slice(0, 5);

//         this.top5 = data.map((d: RainfallData) => ({
//           name: this.toCamelCase(d[nameKey] || 'Unknown'),
//           actual: parseFloat(d[actualKey] as string ?? '0').toFixed(1)
//         }));

//         const classes = ['text-primary', 'text-success', 'text-warning', 'text-info', 'text-danger'];
//         this.top5.forEach((item, idx) => {
//           item.colorClass = classes[idx];
//         });
//       },
//       error: err => console.error('Error fetching top 5 data:', err)
//     });
//   }

//   private toCamelCase(name: string | null): string {
//     if (!name) return '';
//     return name
//       .toLowerCase()
//       .split(' ')
//       .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//       .join(' ');
//   }
// }



// import { Component, OnInit, OnChanges, SimpleChanges, Input } from '@angular/core';
// import { Chart } from 'angular-highcharts';
// import { CountryService } from 'src/app/services/country/country.service';
// import { RegionService } from 'src/app/services/region/region.service';
// import { StateService } from 'src/app/services/state/state.service';
// import { SubdivisionService } from 'src/app/services/subDivision/subDivision.service';
// import { DistrictService } from 'src/app/services/district/district.service';
// import { BlockService } from 'src/app/services/block/BlockService.service';
// import { forkJoin } from 'rxjs';
// import * as Highcharts from 'highcharts';
// import Exporting from 'highcharts/modules/exporting';

// // Define an interface for the rainfall data structure
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
//   [key: string]: any;
// }

// @Component({
//   selector: 'app-map-charts',
//   templateUrl: './map-charts.component.html',
//   styleUrls: ['./map-charts.component.css']
// })
// export class MapChartsComponent implements OnInit, OnChanges {
//   @Input() selectedLayer: string = 'country';
//   @Input() startDate: string = '';
//   @Input() endDate: string = '';
//   @Input() isActual: boolean = false;
//   @Input() selectedPlace: { layer: string; code: string; name: string } = { layer: 'country', code: 'INDIA', name: 'India' };

//   regions: any[] = [];
//   top5: any[] = [];
//   top5Title: string = 'Top 5 Blocks - Current Day';
//   highestRecorded: any[] = [];
//   highestRecordedTitle: string = 'India Highest Recorded';
//   countryData: RainfallData[] = [];
//   regionData: RainfallData[] = [];
//   stateData: RainfallData[] = [];
//   subdivisionData: RainfallData[] = [];
//   districtData: RainfallData[] = [];
//   blockData: RainfallData[] = [];
//   isChartLoading: boolean = false;

//   // Chart data
//   actualData: number[] = [];
//   normalData: number[] = [];
//   departureData: number[] = [];
//   dates: string[] = [];

//   chart = new Chart({
//     chart: {
//       type: 'column',
//       height: 400
//     },
//     title: {
//       text: `Daily Rainfall (Last 30 Days) - ${this.selectedPlace.name}`,
//       style: {
//         color: '#333',
//         fontSize: '15px',
//         fontWeight: 'normal',
//         fontFamily: 'Arial, sans-serif'
//       }
//     },
//     xAxis: {
//       categories: this.getLast30Days(),
//       title: {
//         text: 'Date',
//         style: { fontSize: '12px' }
//       },
//       labels: {
//         rotation: -45,
//         step: 2,
//         style: {
//           fontSize: '10px'
//         }
//       }
//     },
//     yAxis: {
//       title: {
//         text: 'Rainfall (mm)',
//         style: { fontSize: '12px' }
//       },
//       min: 0,
//       max: undefined
//     },
//     credits: { enabled: false },
//     legend: {
//       itemStyle: {
//         fontSize: '10px',
//         fontWeight: '400'
//       },
//       margin: 5
//     },
//     tooltip: { shared: true },
//     series: [
//       {
//         name: 'Actual',
//         type: 'column',
//         data: this.actualData,
//         color: 'green',
//         dataLabels: {
//           enabled: true,
//           formatter: (function(component) {
//             return function(this: any) {
//               const index = this.point.index ?? 0;
//               const departure = component.departureData[index].toFixed(1) + '%';
//               return departure;
//             };
//           })(this),
//           style: {
//             color: 'black',
//             fontSize: '10px',
//             fontWeight: '400',
//             textOutline: '1px contrast'
//           },
//           verticalAlign: 'top',
//           inside: false,
//           y: -25
//         }
//       },
//       {
//         name: 'Normal',
//         type: 'line',
//         data: this.normalData,
//         color: 'darkblue'
//       },
//       {
//         name: 'Departure',
//         type: 'line',
//         data: [],
//         color: 'black',
//         showInLegend: true,
//         marker: {
//           enabled: false
//         },
//         enableMouseTracking: false,
//         events: {
//           legendItemClick: function () {
//             const chart = this.chart;
//             const actualSeries = chart.series[0];
//             const visible = this.visible;
//             actualSeries.update({
//               dataLabels: {
//                 enabled: !visible
//               },
//               type: 'column'
//             });
//             return true;
//           }
//         }
//       }
//     ],
//     exporting: {
//       enabled: true,
//       buttons: {
//         contextButton: {
//           menuItems: ['viewFullscreen', 'printChart']
//         }
//       }
//     }
//   });

//   constructor(
//     private countryService: CountryService,
//     private regionService: RegionService,
//     private stateService: StateService,
//     private subdivisionService: SubdivisionService,
//     private districtService: DistrictService,
//     private blockService: BlockService
//   ) {}

//   ngOnInit(): void {
//     Exporting(Highcharts);
//     const today = new Date().toISOString().split('T')[0];
//     this.startDate = this.startDate || today;
//     this.endDate = this.endDate || today;
//     this.highestRecordedTitle = `${this.selectedPlace.name} Highest Recorded`;
//     this.fetchDailyStatsData();
//     this.fetchTop5Data();
//     this.fetchChartData();
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (changes['startDate'] || changes['endDate'] || changes['isActual'] || changes['selectedLayer'] || changes['selectedPlace']) {
//       this.highestRecordedTitle = `${this.selectedPlace.name} Highest Recorded`;
//       this.fetchDailyStatsData();
//       this.fetchTop5Data();
//       if (changes['endDate'] || changes['selectedPlace'] || changes['isActual']) {
//         this.fetchChartData();
//       }
//     }
//   }

//   private getLast30Days(): string[] {
//     const dates: string[] = [];
//     const today = new Date(this.endDate || new Date().toISOString().split('T')[0]);
//     for (let i = 29; i >= 0; i--) {
//       const date = new Date(today);
//       date.setDate(today.getDate() - i);
//       dates.push(date.toISOString().split('T')[0]);
//     }
//     return dates;
//   }

//   private fetchChartData(): void {
//     this.isChartLoading = true;
//     this.dates = this.getLast30Days();
//     const service = this.getServiceForLayer(this.selectedPlace.layer);
//     if (!service) {
//       this.isChartLoading = false;
//       return;
//     }

//     const observables = this.dates.map(date =>
//       service.fetchData({
//         startDate: date,
//         endDate: date,
//         mode: this.isActual ? 'Actual' : 'Departure'
//       })
//     );

//     forkJoin(observables).subscribe({
//       next: (responses: any[]) => {
//         this.actualData = [];
//         this.normalData = [];
//         this.departureData = [];
//         this.highestRecorded = [];
//         const rainfallData: { date: string; actual: number }[] = [];

//         responses.forEach((res, index) => {
//           const data = res.data || [];
//           const item = this.findItemForPlace(data, this.selectedPlace.layer, this.selectedPlace.code);
//           if (item) {
//             const actualKey = this.getActualKey(this.selectedPlace.layer);
//             const normalKey = this.getNormalKey(this.selectedPlace.layer);
//             const actualValue = parseFloat(item[actualKey] as string ?? '0');
//             const normalValue = parseFloat(item[normalKey] as string ?? '0');
//             const departureValue = parseFloat(item.departure as string ?? '0');
//             this.actualData.push(actualValue);
//             this.normalData.push(normalValue);
//             this.departureData.push(departureValue);
//             rainfallData.push({ date: this.dates[index], actual: actualValue });
//           } else {
//             this.actualData.push(0);
//             this.normalData.push(0);
//             this.departureData.push(0);
//             rainfallData.push({ date: this.dates[index], actual: 0 });
//           }
//         });

//         // Sort and select top 5 highest recorded rainfall values
//         this.highestRecorded = rainfallData
//           .filter(item => item.actual > 0)
//           .sort((a, b) => b.actual - a.actual)
//           .slice(0, 5)
//           .map((item) => ({
//             date: item.date,
//             actual: item.actual.toFixed(1)
//           }));

//         this.updateChart();
//         this.isChartLoading = false;
//       },
//       error: err => {
//         console.error('Error fetching chart data:', err);
//         this.isChartLoading = false;
//       }
//     });
//   }

//   private getServiceForLayer(layer: string): any {
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

//   private findItemForPlace(data: RainfallData[], layer: string, code: string): RainfallData | undefined {
//     const codeKey = this.getDataCodeKey(layer);
//     return data.find(d => String(d[codeKey] ?? '').trim() === String(code).trim());
//   }

//   private getDataCodeKey(layer: string): string {
//     switch (layer) {
//       case 'country': return 'name'; // Country uses 'name' as the unique identifier
//       case 'region': return 'r_code';
//       case 'state': return 'state_code';
//       case 'subdivision': return 's_code';
//       case 'district': return 'district_code';
//       case 'block': return 'block_code';
//       default: return '';
//     }
//   }

//   private getActualKey(layer: string): string {
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

//   private getNormalKey(layer: string): string {
//     switch (layer) {
//       case 'country': return 'rainfall_normal_value';
//       case 'region':
//       case 'state':
//       case 'subdivision': return 'rainfall_normal_value';
//       case 'district':
//       case 'block': return 'normal_rainfall';
//       default: return '';
//     }
//   }

//   private updateChart() {
//     const maxActual = Math.max(...this.actualData, 0);
//     const maxNormal = Math.max(...this.normalData, 0);
//     const maxValue = Math.max(maxActual, maxNormal);
//     let roundedMax = Math.ceil(maxValue);
//     if (roundedMax === 0) roundedMax = 1;
//     const tickInterval = roundedMax / 5;

//     const formattedDates = this.dates.map(date => {
//       const [year, month, day] = date.split('-');
//       return `${day}-${month}-${year}`;
//     });

//     this.chart.ref$.subscribe(chart => {
//       chart.update({
//         title: {
//           text: `Daily Rainfall (Last 30 Days) - ${this.selectedPlace.name || 'India'}`,
//           style: {
//             color: '#333',
//             fontSize: '15px',
//             fontWeight: 'normal',
//             fontFamily: 'Arial, sans-serif'
//           }
//         },
//         xAxis: {
//           categories: formattedDates,
//           title: {
//             text: 'Date',
//             style: { fontSize: '12px' }
//           },
//           labels: {
//             rotation: -45,
//             step: 2,
//             style: {
//               fontSize: '10px'
//             }
//           }
//         },
//         yAxis: {
//           min: 0,
//           max: roundedMax,
//           tickInterval: tickInterval,
//           title: {
//             text: 'Rainfall (mm)',
//             style: { fontSize: '12px' }
//           }
//         },
//         series: [
//           {
//             name: 'Actual',
//             type: 'column',
//             data: this.actualData,
//             color: 'green',
//             dataLabels: {
//               enabled: true,
//               formatter: (function(component) {
//                 return function(this: any) {
//                   const index = this.point.index ?? 0;
//                   const departure = component.departureData[index].toFixed(1) + '%';
//                   return departure;
//                 };
//               })(this),
//               style: {
//                 color: 'black',
//                 fontSize: '10px',
//                 fontWeight: '400',
//                 textOutline: '1px contrast'
//               },
//               verticalAlign: 'top',
//               inside: false,
//               y: -25
//             }
//           },
//           {
//             name: 'Normal',
//             type: 'line',
//             data: this.normalData,
//             color: 'darkblue'
//           },
//           {
//             name: 'Departure',
//             type: 'line',
//             data: [],
//             color: 'black',
//             showInLegend: true,
//             marker: {
//               enabled: false
//             },
//             enableMouseTracking: false,
//             events: {
//               legendItemClick: function () {
//                 const chart = this.chart;
//                 const actualSeries = chart.series[0];
//                 const visible = this.visible;
//                 actualSeries.update({
//                   dataLabels: {
//                     enabled: !visible
//                   },
//                   type: 'column'
//                 });
//                 return true;
//               }
//             }
//           }
//         ]
//       });
//     });
//   }

//   private fetchDailyStatsData() {
//     const params = {
//       startDate: this.startDate,
//       endDate: this.endDate,
//       mode: this.isActual ? 'Actual' : 'Departure'
//     };

//     this.countryService.fetchData(params).subscribe({
//       next: countryRes => {
//         this.countryData = countryRes.data || [];
//         this.regionService.fetchData(params).subscribe({
//           next: regionRes => {
//             this.regionData = regionRes.data || [];
//             this.updateRegions();
//           },
//           error: err => console.error('Error fetching region data:', err)
//         });
//       },
//       error: err => console.error('Error fetching country data:', err)
//     });
//   }

//   private updateRegions() {
//     const country = this.countryData[0] || {};
//     const countryItem = {
//       name: country.name || 'India',
//       actual: parseFloat(country.actual_rainfall as string ?? '0').toFixed(1),
//       normal: parseFloat(country.rainfall_normal_value as string ?? '0').toFixed(1),
//       departure: parseFloat(country.departure as string ?? '0').toFixed(1) + '%'
//     };

//     const regionsItems = this.regionData.map(r => ({
//       name: r.name || 'Unknown',
//       actual: parseFloat(r.actual_rainfall as string ?? '0').toFixed(1),
//       normal: parseFloat(r.rainfall_normal_value as string ?? '0').toFixed(1),
//       departure: parseFloat(r.departure as string ?? '0').toFixed(1) + '%'
//     }));

//     this.regions = [countryItem, ...regionsItems];
//   }

//   private fetchTop5Data() {
//     const params = {
//       startDate: this.startDate,
//       endDate: this.endDate,
//       mode: this.isActual ? 'Actual' : 'Departure'
//     };

//     let service;
//     let nameKey: string;
//     let actualKey: string;
//     let layerLabel: string;

//     switch (this.selectedLayer) {
//       case 'country':
//       case 'region':
//       case 'block':
//         service = this.blockService;
//         nameKey = 'block_name';
//         actualKey = 'actual_rainfall';
//         layerLabel = 'Blocks';
//         break;
//       case 'state':
//         service = this.stateService;
//         nameKey = 'state_name';
//         actualKey = 'actual_state_rainfall';
//         layerLabel = 'States';
//         break;
//       case 'subdivision':
//         service = this.subdivisionService;
//         nameKey = 'subdiv_name';
//         actualKey = 'actual_subdiv_rainfall';
//         layerLabel = 'Sub Divisions';
//         break;
//       case 'district':
//         service = this.districtService;
//         nameKey = 'district_name';
//         actualKey = 'actual_rainfall';
//         layerLabel = 'Districts';
//         break;
//       default:
//         return;
//     }

//     this.top5Title = `Top 5 ${layerLabel} - Current Day`;

//     service.fetchData(params).subscribe({
//       next: res => {
//         let data: RainfallData[] = res.data || [];
//         data = data
//           .filter((d: RainfallData) => d[actualKey] != null && !isNaN(parseFloat(d[actualKey] as string)))
//           .sort((a: RainfallData, b: RainfallData) => parseFloat(b[actualKey] as string) - parseFloat(a[actualKey] as string))
//           .slice(0, 5);

//         this.top5 = data.map((d: RainfallData) => ({
//           name: this.toCamelCase(d[nameKey] || 'Unknown'),
//           actual: parseFloat(d[actualKey] as string ?? '0').toFixed(1)
//         }));
//       },
//       error: err => console.error('Error fetching top 5 data:', err)
//     });
//   }

//   private toCamelCase(name: string | null): string {
//     if (!name) return '';
//     return name
//       .toLowerCase()
//       .split(' ')
//       .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//       .join(' ');
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
// import Exporting from 'highcharts/modules/exporting';

// // Define an interface for the rainfall data structure
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
//   selector: 'app-map-charts',
//   templateUrl: './map-charts.component.html',
//   styleUrls: ['./map-charts.component.css']
// })
// export class MapChartsComponent implements OnInit, OnChanges {
//   @Input() selectedLayer: string = 'country';
//   @Input() startDate: string = '';
//   @Input() endDate: string = '';
//   @Input() isActual: boolean = false;
//   @Input() selectedPlace: { layer: string; code: string; name: string } = { layer: 'country', code: 'INDIA', name: 'India' };

//   regions: any[] = [];
//   top5: any[] = [];
//   top5Title: string = 'Top 5 Blocks - Current Day';
//   highestRecorded: any[] = [];
//   highestRecordedTitle: string = 'India Highest Recorded';
//   countryData: RainfallData[] = [];
//   regionData: RainfallData[] = [];
//   stateData: RainfallData[] = [];
//   subdivisionData: RainfallData[] = [];
//   districtData: RainfallData[] = [];
//   blockData: RainfallData[] = [];
//   isChartLoading: boolean = false;

//   // Chart data
//   actualData: number[] = [];
//   normalData: number[] = [];
//   departureData: number[] = [];
//   dates: string[] = [];

//   chart = new Chart({
//     chart: {
//       type: 'column',
//       height: 400
//     },
//     title: {
//       text: `Daily Rainfall (Last 30 Days) - ${this.selectedPlace.name}`,
//       style: {
//         color: '#333',
//         fontSize: '15px',
//         fontWeight: 'normal',
//         fontFamily: 'Arial, sans-serif'
//       }
//     },
//     xAxis: {
//       categories: this.getLast30Days(),
//       title: {
//         text: 'Date',
//         style: { fontSize: '12px' }
//       },
//       labels: {
//         rotation: -45,
//         step: 2,
//         style: {
//           fontSize: '10px'
//         }
//       }
//     },
//     yAxis: {
//       title: {
//         text: 'Rainfall (mm)',
//         style: { fontSize: '12px' }
//       },
//       min: 0,
//       max: undefined
//     },
//     credits: { enabled: false },
//     legend: {
//       itemStyle: {
//         fontSize: '10px',
//         fontWeight: '400'
//       },
//       margin: 5
//     },
//     tooltip: { shared: true },
//     series: [
//       {
//         name: 'Actual',
//         type: 'column',
//         data: this.actualData,
//         color: 'green',
//         dataLabels: {
//           enabled: true,
//           formatter: (function(component) {
//             return function(this: any) {
//               const index = this.point.index ?? 0;
//               const departure = component.departureData[index].toFixed(1) + '%';
//               return departure;
//             };
//           })(this),
//           style: {
//             color: 'black',
//             fontSize: '10px',
//             fontWeight: '400',
//             textOutline: '1px contrast'
//           },
//           verticalAlign: 'top',
//           inside: false,
//           y: -25
//         }
//       },
//       {
//         name: 'Normal',
//         type: 'line',
//         data: this.normalData,
//         color: 'darkblue'
//       },
//       {
//         name: 'Departure',
//         type: 'line',
//         data: [],
//         color: 'black',
//         showInLegend: true,
//         marker: {
//           enabled: false
//         },
//         enableMouseTracking: false,
//         events: {
//           legendItemClick: function () {
//             const chart = this.chart;
//             const actualSeries = chart.series[0];
//             const visible = this.visible;
//             actualSeries.update({
//               dataLabels: {
//                 enabled: !visible
//               },
//               type: 'column'
//             });
//             return true;
//           }
//         }
//       }
//     ],
//     exporting: {
//       enabled: true,
//       buttons: {
//         contextButton: {
//           menuItems: ['viewFullscreen', 'printChart']
//         }
//       }
//     }
//   });

//   constructor(
//     private countryService: CountryService,
//     private regionService: RegionService,
//     private stateService: StateService,
//     private subdivisionService: SubdivisionService,
//     private districtService: DistrictService,
//     private blockService: BlockService
//   ) {}

//   ngOnInit(): void {
//     Exporting(Highcharts);
//     const today = new Date();
//     this.endDate = this.endDate || this.formatDate(today);
//     const start = new Date(today);
//     start.setDate(today.getDate() - 29); // 30 days including start and end
//     this.startDate = this.startDate || this.formatDate(start);
//     this.highestRecordedTitle = `${this.selectedPlace.name} Highest Recorded`;
//     this.fetchDailyStatsData();
//     this.fetchTop5Data();
//     this.fetchChartData();
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (changes['startDate'] || changes['endDate'] || changes['isActual'] || changes['selectedLayer'] || changes['selectedPlace']) {
//       this.highestRecordedTitle = `${this.selectedPlace.name} Highest Recorded`;
//       this.fetchDailyStatsData();
//       this.fetchTop5Data();
//       if (changes['endDate'] || changes['selectedPlace'] || changes['isActual']) {
//         this.fetchChartData();
//       }
//     }
//   }

//   private getLast30Days(): string[] {
//     const dates: string[] = [];
//     const today = new Date(this.endDate || new Date().toISOString().split('T')[0]);
//     for (let i = 29; i >= 0; i--) {
//       const date = new Date(today);
//       date.setDate(today.getDate() - i);
//       dates.push(this.formatDate(date));
//     }
//     return dates;
//   }

//   private async fetchChartData(): Promise<void> {
//     this.isChartLoading = true;
//     this.dates = this.getLast30Days();
//     const service = this.getServiceForLayer(this.selectedPlace.layer);
//     const method = this.getFetchMethodName(this.selectedPlace.layer);
//     if (!service || !method) {
//       this.isChartLoading = false;
//       return;
//     }

//     try {
//       const res = await lastValueFrom((service as any)[method]({
//         startDate: this.dates[0],
//         endDate: this.dates[this.dates.length - 1],
//         mode: this.isActual ? 'Actual' : 'Departure'
//       })) as { success: boolean; message: string; data: RainfallData[] };
//       const data: RainfallData[] = res.data || [];

//       this.actualData = [];
//       this.normalData = [];
//       this.departureData = [];
//       this.highestRecorded = [];
//       const rainfallData: { date: string; actual: number }[] = [];

//       this.dates.forEach(date => {
//         const item = this.findItemForPlaceByDate(data, this.selectedPlace.layer, this.selectedPlace.code, date);
//         if (item) {
//           const actualKey = this.getActualKey(this.selectedPlace.layer);
//           const normalKey = this.getNormalKey(this.selectedPlace.layer);
//           const actualValue = parseFloat(item[actualKey] as string ?? '0');
//           const normalValue = parseFloat(item[normalKey] as string ?? '0');
//           const departureValue = parseFloat(item.departure as string ?? '0');
//           this.actualData.push(actualValue);
//           this.normalData.push(normalValue);
//           this.departureData.push(departureValue);
//           rainfallData.push({ date, actual: actualValue });
//         } else {
//           this.actualData.push(0);
//           this.normalData.push(0);
//           this.departureData.push(0);
//           rainfallData.push({ date, actual: 0 });
//         }
//       });

//       // Sort and select top 5 highest recorded rainfall values
//       this.highestRecorded = rainfallData
//         .filter(item => item.actual > 0)
//         .sort((a, b) => b.actual - a.actual)
//         .slice(0, 5)
//         .map((item) => ({
//           date: item.date,
//           actual: item.actual.toFixed(1)
//         }));

//       this.updateChart();
//       this.isChartLoading = false;
//     } catch (error) {
//       console.error('Error fetching chart data:', error);
//       this.isChartLoading = false;
//     }
//   }

//   private getServiceForLayer(layer: string): any {
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

//   private getFetchMethodName(layer: string): string {
//     switch (layer) {
//       case 'country': return 'fetchCountryRangeStatistics';
//       case 'region': return 'fetchRegionRangeStatistics';
//       case 'state': return 'fetchStateRangeStatistics';
//       case 'subdivision': return 'fetchSubdivisionRangeStatistics';
//       case 'district': return 'fetchDistrictRangeStatistics';
//       case 'block': return 'fetchBlockRangeStatistics';
//       default: return '';
//     }
//   }

//   private findItemForPlaceByDate(data: RainfallData[], layer: string, code: string, date: string): RainfallData | undefined {
//     const codeKey = this.getDataCodeKey(layer);
//     return data.find(d => d.date === date && (
//       layer === 'country' ? (d.name?.trim() === code.trim()) : String(d[codeKey] ?? '').trim() === String(code).trim()
//     ));
//   }

//   private getDataCodeKey(layer: string): string {
//     switch (layer) {
//       case 'country': return 'country_name'; // Country uses 'name' as the unique identifier
//       case 'region': return 'region_code';
//       case 'state': return 'state_code';
//       case 'subdivision': return 'subdivision_code';
//       case 'district': return 'district_code';
//       case 'block': return 'block_code';
//       default: return '';
//     }
//   }

//   private getActualKey(layer: string): string {
//     switch (layer) {
//       case 'country': return 'actual_rainfall';
//       case 'region': return 'actual_rainfall';
//       case 'state': return 'actual_rainfall';
//       case 'subdivision': return 'actual_rainfall';
//       case 'district': return 'actual_rainfall';
//       case 'block': return 'actual_rainfall';
//       default: return '';
//     }
//   }

//   private getNormalKey(layer: string): string {
//     switch (layer) {
//       case 'country': return 'normal_rainfall';
//       case 'region': return 'normal_rainfall'
//       case 'state': return 'normal_rainfall'
//       case 'subdivision': return 'normal_rainfall';
//       case 'district':return 'normal_rainfall'
//       case 'block': return 'normal_rainfall';
//       default: return '';
//     }
//   }

//   private formatDate(date: Date): string {
//     const year = date.getFullYear();
//     const month = (date.getMonth() + 1).toString().padStart(2, '0');
//     const day = date.getDate().toString().padStart(2, '0');
//     return `${year}-${month}-${day}`;
//   }

//   private updateChart() {
//     const maxActual = Math.max(...this.actualData, 0);
//     const maxNormal = Math.max(...this.normalData, 0);
//     const maxValue = Math.max(maxActual, maxNormal);
//     let roundedMax = Math.ceil(maxValue);
//     if (roundedMax === 0) roundedMax = 1;
//     const tickInterval = roundedMax / 5;

//     const formattedDates = this.dates.map(date => {
//       const [year, month, day] = date.split('-');
//       return `${day}-${month}-${year}`;
//     });

//     this.chart.ref$.subscribe(chart => {
//       chart.update({
//         title: {
//           text: `Daily Rainfall (Last 30 Days) - ${this.selectedPlace.name || 'India'}`,
//           style: {
//             color: '#333',
//             fontSize: '15px',
//             fontWeight: 'normal',
//             fontFamily: 'Arial, sans-serif'
//           }
//         },
//         xAxis: {
//           categories: formattedDates,
//           title: {
//             text: 'Date',
//             style: { fontSize: '12px' }
//           },
//           labels: {
//             rotation: -45,
//             step: 2,
//             style: {
//               fontSize: '10px'
//             }
//           }
//         },
//         yAxis: {
//           min: 0,
//           max: roundedMax,
//           tickInterval: tickInterval,
//           title: {
//             text: 'Rainfall (mm)',
//             style: { fontSize: '12px' }
//           }
//         },
//         series: [
//           {
//             name: 'Actual',
//             type: 'column',
//             data: this.actualData,
//             color: 'green',
//             dataLabels: {
//               enabled: true,
//               formatter: (function(component) {
//                 return function(this: any) {
//                   const index = this.point.index ?? 0;
//                   const departure = component.departureData[index].toFixed(1) + '%';
//                   return departure;
//                 };
//               })(this),
//               style: {
//                 color: 'black',
//                 fontSize: '10px',
//                 fontWeight: '400',
//                 textOutline: '1px contrast'
//               },
//               verticalAlign: 'top',
//               inside: false,
//               y: -25
//             }
//           },
//           {
//             name: 'Normal',
//             type: 'line',
//             data: this.normalData,
//             color: 'darkblue'
//           },
//           {
//             name: 'Departure',
//             type: 'line',
//             data: [],
//             color: 'black',
//             showInLegend: true,
//             marker: {
//               enabled: false
//             },
//             enableMouseTracking: false,
//             events: {
//               legendItemClick: function () {
//                 const chart = this.chart;
//                 const actualSeries = chart.series[0];
//                 const visible = this.visible;
//                 actualSeries.update({
//                   dataLabels: {
//                     enabled: !visible
//                   },
//                   type: 'column'
//                 });
//                 return true;
//               }
//             }
//           }
//         ]
//       });
//     });
//   }

//   private fetchDailyStatsData() {
//     const params = {
//       startDate: this.startDate,
//       endDate: this.endDate,
//       mode: this.isActual ? 'Actual' : 'Departure'
//     };

//     this.countryService.fetchData(params).subscribe({
//       next: countryRes => {
//         this.countryData = countryRes.data || [];
//         this.regionService.fetchData(params).subscribe({
//           next: regionRes => {
//             this.regionData = regionRes.data || [];
//             this.updateRegions();
//           },
//           error: err => console.error('Error fetching region data:', err)
//         });
//       },
//       error: err => console.error('Error fetching country data:', err)
//     });
//   }

//   private updateRegions() {
//     const country = this.countryData[0] || {};
//     const countryItem = {
//       name: country.name || 'India',
//       actual: parseFloat(country.actual_rainfall as string ?? '0').toFixed(1),
//       normal: parseFloat(country.rainfall_normal_value as string ?? '0').toFixed(1),
//       departure: parseFloat(country.departure as string ?? '0').toFixed(1) + '%'
//     };

//     const regionsItems = this.regionData.map(r => ({
//       name: r.name || 'Unknown',
//       actual: parseFloat(r.actual_rainfall as string ?? '0').toFixed(1),
//       normal: parseFloat(r.rainfall_normal_value as string ?? '0').toFixed(1),
//       departure: parseFloat(r.departure as string ?? '0').toFixed(1) + '%'
//     }));

//     this.regions = [countryItem, ...regionsItems];
//   }

//   private fetchTop5Data() {
//     const params = {
//       startDate: this.startDate,
//       endDate: this.endDate,
//       mode: this.isActual ? 'Actual' : 'Departure'
//     };

//     let service;
//     let nameKey: string;
//     let actualKey: string;
//     let layerLabel: string;

//     switch (this.selectedLayer) {
//       case 'country':
//       case 'region':
//       case 'block':
//         service = this.blockService;
//         nameKey = 'block_name';
//         actualKey = 'actual_rainfall';
//         layerLabel = 'Blocks';
//         break;
//       case 'state':
//         service = this.stateService;
//         nameKey = 'state_name';
//         actualKey = 'actual_state_rainfall';
//         layerLabel = 'States';
//         break;
//       case 'subdivision':
//         service = this.subdivisionService;
//         nameKey = 'subdiv_name';
//         actualKey = 'actual_subdiv_rainfall';
//         layerLabel = 'Sub Divisions';
//         break;
//       case 'district':
//         service = this.districtService;
//         nameKey = 'district_name';
//         actualKey = 'actual_rainfall';
//         layerLabel = 'Districts';
//         break;
//       default:
//         return;
//     }

//     this.top5Title = `Top 5 ${layerLabel} - Current Day`;

//     service.fetchData(params).subscribe({
//       next: res => {
//         let data: RainfallData[] = res.data || [];
//         data = data
//           .filter((d: RainfallData) => d[actualKey] != null && !isNaN(parseFloat(d[actualKey] as string)))
//           .sort((a: RainfallData, b: RainfallData) => parseFloat(b[actualKey] as string) - parseFloat(a[actualKey] as string))
//           .slice(0, 5);

//         this.top5 = data.map((d: RainfallData) => ({
//           name: this.toCamelCase(d[nameKey] || 'Unknown'),
//           actual: parseFloat(d[actualKey] as string ?? '0').toFixed(1)
//         }));
//       },
//       error: err => console.error('Error fetching top 5 data:', err)
//     });
//   }

//   private toCamelCase(name: string | null): string {
//     if (!name) return '';
//     return name
//       .toLowerCase()
//       .split(' ')
//       .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//       .join(' ');
//   }
// }


import { Component, OnInit, OnChanges, SimpleChanges, Input } from '@angular/core';
import { Chart } from 'angular-highcharts';
import * as Highcharts from 'highcharts';
import { lastValueFrom } from 'rxjs';
import { CountryService } from 'src/app/services/country/country.service';
import { RegionService } from 'src/app/services/region/region.service';
import { StateService } from 'src/app/services/state/state.service';
import { SubdivisionService } from 'src/app/services/subDivision/subDivision.service';
import { DistrictService } from 'src/app/services/district/district.service';
import { BlockService } from 'src/app/services/block/BlockService.service';
import Exporting from 'highcharts/modules/exporting';

// Define an interface for the rainfall data structure
interface RainfallData {
  name?: string; // Used for country in daily stats and top 5
  country_name?: string; // Used for chart
  region_name?: string;
  state_name?: string;
  subdiv_name?: string;
  district_name?: string;
  block_name?: string;
  r_code?: string;
  region_code?: string;
  state_code?: string | number;
  s_code?: string;
  subdivision_code?: string;
  district_code?: string;
  block_code?: string;
  actual_rainfall?: number | string;
  actual_state_rainfall?: number | string;
  actual_subdiv_rainfall?: number | string;
  rainfall_normal_value?: number | string; // Used for daily stats
  normal_rainfall?: number | string; // Used for chart
  departure?: number | string;
  date: string;
  [key: string]: any;
}

@Component({
  selector: 'app-map-charts',
  templateUrl: './map-charts.component.html',
  styleUrls: ['./map-charts.component.css']
})
export class MapChartsComponent implements OnInit, OnChanges {
  @Input() selectedLayer: string = 'country';
  @Input() startDate: string = '';
  @Input() endDate: string = '';
  @Input() isActual: boolean = false;
  @Input() selectedPlace: { layer: string; code: string; name: string } = { layer: 'country', code: 'INDIA', name: 'India' };

  regions: any[] = [];
  top5: any[] = [];
  top5Title: string = 'Top 5 Blocks - Current Day';
  highestRecorded: any[] = [];
  highestRecordedTitle: string = 'India Highest Recorded';
  countryData: RainfallData[] = [];
  regionData: RainfallData[] = [];
  stateData: RainfallData[] = [];
  subdivisionData: RainfallData[] = [];
  districtData: RainfallData[] = [];
  blockData: RainfallData[] = [];
  isChartLoading: boolean = false;

  // Chart data
  actualData: number[] = [];
  normalData: number[] = [];
  departureData: number[] = [];
  dates: string[] = [];

  chart = new Chart({
    chart: {
      type: 'column',
      height: 400
    },
    title: {
      text: `Daily Rainfall (Last 30 Days) - ${this.selectedPlace.name}`,
      style: {
        color: '#333',
        fontSize: '15px',
        fontWeight: 'normal',
        fontFamily: 'Arial, sans-serif'
      }
    },
    xAxis: {
      categories: this.getLast30Days(),
      title: {
        text: 'Date',
        style: { fontSize: '12px' }
      },
      labels: {
        rotation: -45,
        step: 2,
        style: {
          fontSize: '10px'
        }
      }
    },
    yAxis: {
      title: {
        text: 'Rainfall (mm)',
        style: { fontSize: '12px' }
      },
      min: 0,
      max: undefined
    },
    credits: { enabled: false },
    legend: {
      itemStyle: {
        fontSize: '10px',
        fontWeight: '400'
      },
      margin: 5
    },
    tooltip: { shared: true },
    series: [
      {
        name: 'Actual',
        type: 'column',
        data: this.actualData,
        color: 'green',
        dataLabels: {
          enabled: true,
          formatter: (function(component) {
            return function(this: any) {
              const index = this.point.index ?? 0;
              const departure = component.departureData[index].toFixed(1) + '%';
              return departure;
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
          y: -25
        }
      },
      {
        name: 'Normal',
        type: 'line',
        data: this.normalData,
        color: 'darkblue'
      },
      {
        name: 'Departure',
        type: 'line',
        data: [],
        color: 'black',
        showInLegend: true,
        marker: {
          enabled: false
        },
        enableMouseTracking: false,
        events: {
          legendItemClick: function () {
            const chart = this.chart;
            const actualSeries = chart.series[0];
            const visible = this.visible;
            actualSeries.update({
              dataLabels: {
                enabled: !visible
              },
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

  constructor(
    private countryService: CountryService,
    private regionService: RegionService,
    private stateService: StateService,
    private subdivisionService: SubdivisionService,
    private districtService: DistrictService,
    private blockService: BlockService
  ) {}

  ngOnInit(): void {
    Exporting(Highcharts);
    const today = new Date();
    this.endDate = this.endDate || this.formatDate(today);
    const start = new Date(today);
    start.setDate(today.getDate() - 29); // 30 days including start and end
    this.startDate = this.startDate || this.formatDate(start);
    this.highestRecordedTitle = `${this.selectedPlace.name} Highest Recorded`;
    this.fetchDailyStatsData();
    this.fetchTop5Data();
    this.fetchChartData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['startDate'] || changes['endDate'] || changes['isActual'] || changes['selectedLayer'] || changes['selectedPlace']) {
      this.highestRecordedTitle = `${this.selectedPlace.name} Highest Recorded`;
      this.fetchDailyStatsData();
      this.fetchTop5Data();
      if (changes['endDate'] || changes['selectedPlace'] || changes['isActual']) {
        this.fetchChartData();
      }
    }
  }

  private getLast30Days(): string[] {
    const dates: string[] = [];
    const today = new Date(this.endDate || new Date().toISOString().split('T')[0]);
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(this.formatDate(date));
    }
    return dates;
  }

  private async fetchChartData(): Promise<void> {
    this.isChartLoading = true;
    this.dates = this.getLast30Days();
    const service = this.getServiceForLayer(this.selectedPlace.layer);
    const method = this.getFetchMethodName(this.selectedPlace.layer);
    if (!service || !method) {
      console.error(`No service or method available for layer: ${this.selectedPlace.layer}`);
      this.isChartLoading = false;
      return;
    }

    try {
      const res = await lastValueFrom((service as any)[method]({
        startDate: this.dates[0],
        endDate: this.dates[this.dates.length - 1],
        mode: this.isActual ? 'Actual' : 'Departure'
      })) as { success: boolean; message: string; data: RainfallData[] };
      const data: RainfallData[] = res.data || [];

      // Debugging: Log the fetched data
      console.log(`Fetched data for ${this.selectedPlace.layer} (${this.selectedPlace.code}):`, data);

      this.actualData = [];
      this.normalData = [];
      this.departureData = [];
      this.highestRecorded = [];
      const rainfallData: { date: string; actual: number }[] = [];

      this.dates.forEach(date => {
        const item = this.findItemForPlaceByDate(data, this.selectedPlace.layer, this.selectedPlace.code, date);
        if (item) {
          const actualKey = this.getActualKey(this.selectedPlace.layer);
          const normalKey = this.getNormalKey(this.selectedPlace.layer);
          const actualValue = parseFloat(item[actualKey] as string ?? '0');
          const normalValue = parseFloat(item[normalKey] as string ?? '0');
          const departureValue = parseFloat(item.departure as string ?? '0');
          this.actualData.push(actualValue);
          this.normalData.push(normalValue);
          this.departureData.push(departureValue);
          rainfallData.push({ date, actual: actualValue });
        } else {
          console.warn(`No data found for date ${date} and code ${this.selectedPlace.code} in layer ${this.selectedPlace.layer}`);
          this.actualData.push(0);
          this.normalData.push(0);
          this.departureData.push(0);
          rainfallData.push({ date, actual: 0 });
        }
      });

      // Sort and select top 5 highest recorded rainfall values
      this.highestRecorded = rainfallData
        .filter(item => item.actual > 0)
        .sort((a, b) => b.actual - a.actual)
        .slice(0, 5)
        .map((item) => ({
          date: item.date,
          actual: item.actual.toFixed(1)
        }));

      this.updateChart();
      this.isChartLoading = false;
    } catch (error) {
      console.error('Error fetching chart data:', error);
      this.isChartLoading = false;
      this.actualData = Array(this.dates.length).fill(0);
      this.normalData = Array(this.dates.length).fill(0);
      this.departureData = Array(this.dates.length).fill(0);
      this.highestRecorded = [];
      this.updateChart();
    }
  }

  private getServiceForLayer(layer: string): any {
    switch (layer) {
      case 'country': return this.countryService;
      case 'region': return this.regionService;
      case 'state': return this.stateService;
      case 'subdivision': return this.subdivisionService;
      case 'district': return this.districtService;
      case 'block': return this.blockService;
      default: return null;
    }
  }

  private getFetchMethodName(layer: string): string {
    switch (layer) {
      case 'country': return 'fetchCountryRangeStatistics';
      case 'region': return 'fetchRegionRangeStatistics';
      case 'state': return 'fetchStateRangeStatistics';
      case 'subdivision': return 'fetchSubdivisionRangeStatistics';
      case 'district': return 'fetchDistrictRangeStatistics';
      case 'block': return 'fetchBlockRangeStatistics';
      default: return '';
    }
  }

  private findItemForPlaceByDate(data: RainfallData[], layer: string, code: string, date: string): RainfallData | undefined {
    const codeKey = this.getDataCodeKey(layer);
    return data.find(d => d.date === date && (
      layer === 'country' ? (d.country_name?.trim() === code.trim()) : String(d[codeKey] ?? '').trim() === String(code).trim()
    ));
  }

  private getDataCodeKey(layer: string): string {
    switch (layer) {
      case 'country': return 'country_name';
      case 'region': return 'region_code';
      case 'state': return 'state_code';
      case 'subdivision': return 'subdivision_code';
      case 'district': return 'district_code';
      case 'block': return 'block_code';
      default: return '';
    }
  }

  private getActualKey(layer: string): string {
    switch (layer) {
      case 'country': return 'actual_rainfall';
      case 'region': return 'actual_rainfall';
      case 'state': return 'actual_rainfall';
      case 'subdivision': return 'actual_rainfall';
      case 'district': return 'actual_rainfall';
      case 'block': return 'actual_rainfall';
      default: return '';
    }
  }

  private getNormalKey(layer: string): string {
    switch (layer) {
      case 'country': return 'normal_rainfall';
      case 'region': return 'normal_rainfall';
      case 'state': return 'normal_rainfall';
      case 'subdivision': return 'normal_rainfall';
      case 'district': return 'normal_rainfall';
      case 'block': return 'normal_rainfall';
      default: return '';
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private updateChart() {
    const maxActual = Math.max(...this.actualData, 0);
    const maxNormal = Math.max(...this.normalData, 0);
    const maxValue = Math.max(maxActual, maxNormal);
    let roundedMax = Math.ceil(maxValue);
    if (roundedMax === 0) roundedMax = 1;
    const tickInterval = roundedMax / 5;

    const formattedDates = this.dates.map(date => {
      const [year, month, day] = date.split('-');
      return `${day}-${month}-${year}`;
    });

    this.chart.ref$.subscribe(chart => {
      chart.update({
        title: {
          text: `Daily Rainfall (Last 30 Days) - ${this.selectedPlace.name || 'India'}`,
          style: {
            color: '#333',
            fontSize: '15px',
            fontWeight: 'normal',
            fontFamily: 'Arial, sans-serif'
          }
        },
        xAxis: {
          categories: formattedDates,
          title: {
            text: 'Date',
            style: { fontSize: '12px' }
          },
          labels: {
            rotation: -45,
            step: 2,
            style: {
              fontSize: '10px'
            }
          }
        },
        yAxis: {
          min: 0,
          max: roundedMax,
          tickInterval: tickInterval,
          title: {
            text: 'Rainfall (mm)',
            style: { fontSize: '12px' }
          }
        },
        series: [
          {
            name: 'Actual',
            type: 'column',
            data: this.actualData,
            color: 'green',
            dataLabels: {
              enabled: true,
              formatter: (function(component) {
                return function(this: any) {
                  const index = this.point.index ?? 0;
                  const departure = component.departureData[index].toFixed(1) + '%';
                  return departure;
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
              y: -25
            }
          },
          {
            name: 'Normal',
            type: 'line',
            data: this.normalData,
            color: 'darkblue'
          },
          {
            name: 'Departure',
            type: 'line',
            data: [],
            color: 'black',
            showInLegend: true,
            marker: {
              enabled: false
            },
            enableMouseTracking: false,
            events: {
              legendItemClick: function () {
                const chart = this.chart;
                const actualSeries = chart.series[0];
                const visible = this.visible;
                actualSeries.update({
                  dataLabels: {
                    enabled: !visible
                  },
                  type: 'column'
                });
                return true;
              }
            }
          }
        ]
      });
    });
  }

  private fetchDailyStatsData() {
    const params = {
      startDate: this.startDate,
      endDate: this.endDate,
      mode: this.isActual ? 'Actual' : 'Departure'
    };

    this.countryService.fetchData(params).subscribe({
      next: countryRes => {
        this.countryData = countryRes.data || [];
        this.regionService.fetchData(params).subscribe({
          next: regionRes => {
            this.regionData = regionRes.data || [];
            this.updateRegions();
          },
          error: err => {
            console.error('Error fetching region data:', err);
            this.regionData = [];
            this.updateRegions();
          }
        });
      },
      error: err => {
        console.error('Error fetching country data:', err);
        this.countryData = [];
        this.regionData = [];
        this.updateRegions();
      }
    });
  }

  private updateRegions() {
    const country = this.countryData[0] as RainfallData || {
      name: 'India',
      actual_rainfall: '0',
      rainfall_normal_value: '0',
      departure: '0'
    };

    const countryItem = {
      name: country.name || 'India',
      actual: parseFloat(country.actual_rainfall as string ?? '0').toFixed(1),
      normal: parseFloat(country.rainfall_normal_value as string ?? '0').toFixed(1),
      departure: parseFloat(country.departure as string ?? '0').toFixed(1) + '%'
    };

    const regionsItems = this.regionData.map(r => ({
      name: r.name || 'Unknown',
      actual: parseFloat(r.actual_rainfall as string ?? '0').toFixed(1),
      normal: parseFloat(r.rainfall_normal_value as string ?? '0').toFixed(1),
      departure: parseFloat(r.departure as string ?? '0').toFixed(1) + '%'
    }));

    this.regions = [countryItem, ...regionsItems];
  }

  private fetchTop5Data() {
    const params = {
      startDate: this.startDate,
      endDate: this.endDate,
      mode: this.isActual ? 'Actual' : 'Departure'
    };

    let service;
    let nameKey: string;
    let actualKey: string;
    let layerLabel: string;

    switch (this.selectedLayer) {
      case 'country':
      case 'region':
      case 'block':
        service = this.blockService;
        nameKey = 'block_name';
        actualKey = 'actual_rainfall';
        layerLabel = 'Blocks';
        break;
      case 'state':
        service = this.stateService;
        nameKey = 'state_name';
        actualKey = 'actual_state_rainfall';
        layerLabel = 'States';
        break;
      case 'subdivision':
        service = this.subdivisionService;
        nameKey = 'subdiv_name';
        actualKey = 'actual_subdiv_rainfall';
        layerLabel = 'Sub Divisions';
        break;
      case 'district':
        service = this.districtService;
        nameKey = 'district_name';
        actualKey = 'actual_rainfall';
        layerLabel = 'Districts';
        break;
      default:
        console.error('Invalid layer for top 5 data:', this.selectedLayer);
        this.top5 = [];
        return;
    }

    this.top5Title = `Top 5 ${layerLabel} - Current Day`;

    service.fetchData(params).subscribe({
      next: res => {
        let data: RainfallData[] = res.data || [];
        data = data
          .filter((d: RainfallData) => d[actualKey] != null && !isNaN(parseFloat(d[actualKey] as string)))
          .sort((a: RainfallData, b: RainfallData) => parseFloat(b[actualKey] as string) - parseFloat(a[actualKey] as string))
          .slice(0, 5);

        this.top5 = data.map((d: RainfallData) => ({
          name: this.toCamelCase(d[nameKey] || 'Unknown'),
          actual: parseFloat(d[actualKey] as string ?? '0').toFixed(1)
        }));
      },
      error: err => {
        console.error('Error fetching top 5 data:', err);
        this.top5 = [];
      }
    });
  }

  private toCamelCase(name: string | null): string {
    if (!name) return '';
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}