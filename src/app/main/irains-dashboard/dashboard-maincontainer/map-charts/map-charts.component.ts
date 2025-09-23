// import { Component } from '@angular/core';
// import { Chart } from 'angular-highcharts';

// @Component({
//   selector: 'app-map-charts',
//   templateUrl: './map-charts.component.html',
//   styleUrls: ['./map-charts.component.css']
// })
// export class MapChartsComponent {

//   chart = new Chart({
//     chart: {
//       type: 'line',
//       height: 300
//     },
//     title: {
//       text: 'Daily (7 Days)'
//     },
//     xAxis: {
//       categories: ['2025-08-05', '2025-08-06', '2025-08-07', '2025-08-08', '2025-08-09', '2025-08-10', '2025-08-11'],
//       title: { text: 'Date' }
//     },
//     yAxis: {
//       title: { text: 'Value' },
//       min: -10
//     },
//     credits: { enabled: false },
//     legend: { enabled: true },
//     tooltip: { shared: true },
//     series: [
//       {
//         name: 'Actual',
//         type: 'line',
//         data: [75, 70, 65, 60, 55, 50, 45],
//         color: 'blue'
//       },
//       {
//         name: 'Normal',
//         type: 'line',
//         data: [70, 68, 66, 64, 62, 60, 58],
//         color: 'green'
//       },
//       {
//         name: 'Departure',
//         type: 'line',
//         data: [5, 2, -1, -4, -7, -10, -13],
//         color: 'red',
//         dashStyle: 'ShortDot'
//       }
//     ],
//     exporting: { enabled: true }
//   });

// }


// import { Component } from '@angular/core';
// import { Chart } from 'angular-highcharts';

// @Component({
//   selector: 'app-map-charts',
//   templateUrl: './map-charts.component.html',
//   styleUrls: ['./map-charts.component.css']
// })
// export class MapChartsComponent {
//   // Define damages array to resolve TS2339 error, mimicking reference code structure
//   damages = [
//     {
//       type: 'Flood Damage',
//       desc: 'Infrastructure',
//       amount: '₹5.2 Cr',
//       detail: 'Estimated',
//       color: 'green'
//     },
//     {
//       type: 'Crop Loss',
//       desc: 'Agriculture',
//       amount: '₹3.8 Cr',
//       detail: 'Reported',
//       color: 'teal'
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


import { Component } from '@angular/core';
import { Chart } from 'angular-highcharts';

@Component({
  selector: 'app-map-charts',
  templateUrl: './map-charts.component.html',
  styleUrls: ['./map-charts.component.css']
})
export class MapChartsComponent {
  // Generate last 30 days dates dynamically (oldest to newest, current at right end)
  private getLast30Days(): string[] {
    const dates: string[] = [];
    const today = new Date('2025-09-23');
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }

  // Generate random data for chart
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
            return function() {
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
}