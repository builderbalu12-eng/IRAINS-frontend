import { Component } from '@angular/core';
import { Chart } from 'angular-highcharts';

@Component({
  selector: 'app-map-charts',
  templateUrl: './map-charts.component.html',
  styleUrls: ['./map-charts.component.css']
})
export class MapChartsComponent {

  chart = new Chart({
    chart: {
      type: 'line',
      height: 300
    },
    title: {
      text: 'Daily (7 Days)'
    },
    xAxis: {
      categories: ['2025-08-05', '2025-08-06', '2025-08-07', '2025-08-08', '2025-08-09', '2025-08-10', '2025-08-11'],
      title: { text: 'Date' }
    },
    yAxis: {
      title: { text: 'Value' },
      min: -10
    },
    credits: { enabled: false },
    legend: { enabled: true },
    tooltip: { shared: true },
    series: [
      {
        name: 'Actual',
        type: 'line',
        data: [75, 70, 65, 60, 55, 50, 45],
        color: 'blue'
      },
      {
        name: 'Normal',
        type: 'line',
        data: [70, 68, 66, 64, 62, 60, 58],
        color: 'green'
      },
      {
        name: 'Departure',
        type: 'line',
        data: [5, 2, -1, -4, -7, -10, -13],
        color: 'red',
        dashStyle: 'ShortDot'
      }
    ],
    exporting: { enabled: true }
  });

}
