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

import { Component, OnInit, OnChanges, SimpleChanges, Input } from '@angular/core';
import { Chart } from 'angular-highcharts';
import { CountryService } from 'src/app/services/country/country.service';
import { RegionService } from 'src/app/services/region/region.service';
import { StateService } from 'src/app/services/state/state.service';
import { SubdivisionService } from 'src/app/services/subDivision/subDivision.service';
import { DistrictService } from 'src/app/services/district/district.service';
import { BlockService } from 'src/app/services/block/BlockService.service';
import { forkJoin } from 'rxjs';

// Define an interface for the rainfall data structure
interface RainfallData {
  name?: string;
  region_name?: string;
  state_name?: string;
  subdivision?: string;
  district?: string;
  block_name?: string;
  actual_rainfall?: number | string;
  actual_state_rainfall?: number | string;
  actual_subdiv_rainfall?: number | string;
  rainfall_normal_value?: number | string;
  normal_rainfall?: number | string;
  departure?: number | string;
  [key: string]: any; // Allow for additional properties
}

@Component({
  selector: 'app-map-charts',
  templateUrl: './map-charts.component.html',
  styleUrls: ['./map-charts.component.css']
})
export class MapChartsComponent implements OnInit, OnChanges {
  @Input() selectedLayer: string = 'country';
  @Input() startDate: string = ''; // Changed from selectedDate to startDate
  @Input() endDate: string = ''; // Added endDate
  @Input() isActual: boolean = false;

  regions: any[] = [];
  top5: any[] = [];
  top5Title: string = 'Top 5 Blocks - Current Day';
  countryData: RainfallData[] = [];
  regionData: RainfallData[] = [];
  stateData: RainfallData[] = [];
  subdivisionData: RainfallData[] = [];
  districtData: RainfallData[] = [];
  blockData: RainfallData[] = [];

  // Generate last 30 days dates dynamically (oldest to newest, current at right end)
  private getLast30Days(): string[] {
    const dates: string[] = [];
    const today = new Date(this.endDate || '2025-09-23');
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }

  // Generate random data for chart (for demo purposes; replace with actual API data if available)
  private actualData: number[] = Array.from({ length: 30 }, () => Math.random() * 50 + 20); // 20 to 70
  private normalData: number[] = Array.from({ length: 30 }, () => Math.random() * 30); // 0 to 30

  chart = new Chart({
    chart: {
      type: 'line',
      height: 400
    },
    title: {
      text: 'Daily Rainfall (Last 30 Days)',
      style: {
        fontSize: '14px'
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
        color: '#007bff',
        dataLabels: {
          enabled: true,
          formatter: (function(component) {
            return function(this: any) {
              const index = this.point.index ?? 0;
              const departure = ((this.y ?? 0) - component.normalData[index]).toFixed(1);
              return departure;
            };
          })(this),
          style: {
            color: '#adb5bd',
            fontSize: '10px',
            fontWeight: '400',
            textOutline: '1px contrast'
          },
          verticalAlign: 'top',
          y: -10
        }
      },
      {
        name: 'Normal',
        type: 'line',
        data: this.normalData,
        color: '#28a745'
      }
    ],
    exporting: { enabled: true }
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
    const today = new Date().toISOString().split('T')[0];
    this.startDate = this.startDate || today;
    this.endDate = this.endDate || today;
    this.fetchDailyStatsData();
    this.fetchTop5Data();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['startDate'] || changes['endDate'] || changes['isActual'] || changes['selectedLayer']) {
      // Update chart x-axis categories when date changes
      if (changes['endDate'] && this.endDate) {
        this.chart.ref$.subscribe(chart => {
          chart.update({
            xAxis: {
              categories: this.getLast30Days()
            }
          });
        });
      }
      this.fetchDailyStatsData();
      this.fetchTop5Data();
    }
  }

  private fetchDailyStatsData() {
    const params = {
      startDate: this.startDate,
      endDate: this.endDate,
      mode: this.isActual ? 'Actual' : 'Departure'
    };

    // Fetch country data first
    this.countryService.fetchData(params).subscribe({
      next: countryRes => {
        this.countryData = countryRes.data || [];
        // Then fetch region data
        this.regionService.fetchData(params).subscribe({
          next: regionRes => {
            this.regionData = regionRes.data || [];
            this.updateRegions();
          },
          error: err => console.error('Error fetching region data:', err)
        });
      },
      error: err => console.error('Error fetching country data:', err)
    });
  }

  private updateRegions() {
    const country = this.countryData[0] || {};
    const countryItem = {
      name: country.name || 'Country',
      actual: parseFloat(country.actual_rainfall as string ?? '0').toFixed(1),
      normal: parseFloat(country.rainfall_normal_value as string ?? '0').toFixed(1),
      departure: parseFloat(country.departure as string ?? '0').toFixed(1) + '%'
    };

    const regionsItems = this.regionData.map(r => ({
      name: r.region_name || r.name || 'Unknown',
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
        layerLabel = 'Block';
        break;
      case 'state':
        service = this.stateService;
        nameKey = 'state_name';
        actualKey = 'actual_state_rainfall';
        layerLabel = 'State';
        break;
      case 'subdivision':
        service = this.subdivisionService;
        nameKey = 'subdiv_name';
        actualKey = 'actual_subdiv_rainfall';
        layerLabel = 'Sub Division';
        break;
      case 'district':
        service = this.districtService;
        nameKey = 'district_name';
        actualKey = 'actual_rainfall';
        layerLabel = 'District';
        break;
      default:
        return;
    }

    this.top5Title = `Top 5 ${layerLabel}s`;

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

        const classes = ['text-primary', 'text-success', 'text-warning', 'text-info', 'text-danger'];
        this.top5.forEach((item, idx) => {
          item.colorClass = classes[idx];
        });
      },
      error: err => console.error('Error fetching top 5 data:', err)
    });
  }

  private toCamelCase(name: string | null): string {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}