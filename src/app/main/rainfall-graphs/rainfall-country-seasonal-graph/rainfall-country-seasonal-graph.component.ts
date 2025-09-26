import { Component, OnInit } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { Chart } from 'angular-highcharts';
import * as Highcharts from 'highcharts';
import { EMPTY, concatMap, lastValueFrom } from 'rxjs';
import { DataService } from 'src/app/data.service';
import { Constants } from 'src/app/services/constants';
import { RegionService } from 'src/app/services/region/region.service';
import Exporting from 'highcharts/modules/exporting';
import { NONE_TYPE } from '@angular/compiler';
import { CountryService } from 'src/app/services/country/country.service';

@Component({
  selector: 'app-rainfall-country-seasonal-graph',
  templateUrl: './rainfall-country-seasonal-graph.component.html',
  styleUrls: ['./rainfall-country-seasonal-graph.component.css']
})
export class RainfallCountrySeasonalGraphComponent implements OnInit {

  isLoading = false;
  seasons = ['Winter', 'PreMonsoon', 'Monsoon', 'PostMonsoon'];
  selectedSeason = this.seasons[0];
  selectedYear = new Date().getFullYear();
  years = this.getYears();
  maps = ['Pan India', 'Central India', 'North West India', 'East And North East India', 'South Peninsula'];
  selectedMap = this.maps[1];
  Season = this.seasons[0].toUpperCase();
  Map = this.maps[1].toUpperCase();
  Year: any = this.selectedYear;

  dataRange: { startDate: any; endDate: any; } | undefined;
  chart: any;
  graphaData = { actual: [], normal: [], departure : [], date:[]};
  graphaDataCummulative = { actual: [], normal: [], departure : [], date:[]};
  graphDataNonCummulative = { actual: [], normal: [], departure : [], date:[]};
  dateIntervals: any = [];
  regiondata: any;
  toDate: any;
  fromDate: any;
  selectedMode: any;
  selectedModeCummOrNonCumm: any = 'Non-Cummulative';

  selectCumulativeOrNonCumulative(mode: string) {
    this.selectedModeCummOrNonCumm = mode;
    if(this.selectedModeCummOrNonCumm=='Non-Cummulative'){
      this.graphaData = this.graphDataNonCummulative
    }else{
      this.graphaData = this.graphaDataCummulative
    }
    this.updateCharts()
  }
  
  async ngOnInit() {
    Exporting(Highcharts)
    await this.fetchData()
    this.filterData()
    this.updateCharts();  
  }

  getYears() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 1700; year <= currentYear; year++) {
      years.push(year);
    }
    return years;
  }

  async onSubmit() {
    this.Season = this.selectedSeason.toUpperCase();
    this.Year = this.selectedYear.toString();
    this.Map = this.selectedMap.toUpperCase();
    await this.fetchData()
    this.filterData()
    this.updateCharts();
  }

  async onMapChange(event: MatSelectChange) {
    this.selectedMap = event.value;
    // Map change logic (optional caching) as needed
  }

  async fetchData() {
    this.isLoading = true;
    const { start, end } = this.constants.getSeasonDatesUptoCurrentDate(this.selectedSeason.toLowerCase(), this.selectedYear);
    if(start>end){
      this.regiondata = []
      this.isLoading = false;
      alert('No data is available for the selected season and year')
      return
    }
    const data = {
      startDate: this.formatDate(start),
      endDate: this.formatDate(end)
    };
    this.fromDate = data.startDate.split('-').reverse().join('-')
    this.toDate = data.endDate.split('-').reverse().join('-')

    try {
      if (this.selectedMap === 'Pan India') {
        if(this.selectedMode.selectedMode == 'Unified'){
          this.regiondata = await lastValueFrom(
            this.countryService.fetchDataCummulativeFtp(data).pipe(
              concatMap((p:any) => {
                this.regiondata = p.data
                return EMPTY;
              })
            )
          );
        }else{
          this.regiondata = await lastValueFrom(
            this.countryService.fetchDataCummulative(data).pipe(
              concatMap((p:any) => {
                this.regiondata = p.data
                return EMPTY;
              })
            )
          );
        }
      } else {
        if(this.selectedMode.selectedMode == 'Unified'){
          this.regiondata = await lastValueFrom(
            this.regionService.fetchCummulativeDataFtp(data).pipe(
              concatMap((region) => {
                this.regiondata = region.data;
                return EMPTY;
              })
            )
          );          
        }
        this.regiondata = await lastValueFrom(
          this.regionService.fetchCummulativeData(data).pipe(
            concatMap((region) => {
              this.regiondata = region.data;
              return EMPTY;
            })
          )
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      this.isLoading = false;
    }
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  filterData(){
    let filteredData = this.regiondata.filter((data: any) => data.name === this.selectedMap.toUpperCase());
    if(this.selectedMap.toLowerCase()=="pan india"){
      filteredData = this.regiondata
    }
    if (filteredData.length === 0) {
      alert('No data is available for the selected date range.');
    }

    // No rounding when populating array for graphs
    this.graphaDataCummulative.actual = filteredData.map((data: { actual_rainfall: any; }) => data.actual_rainfall);
    this.graphDataNonCummulative.actual = filteredData.map((data: { actual_rainfall: any }, index: number, arr: any[]) => {
      const current = data.actual_rainfall;
      const previous = index === 0 ? 0 : arr[index - 1].actual_rainfall;
      return current - previous;
    });

    this.graphaDataCummulative.normal = filteredData.map((data: { rainfall_normal_value: string; }) => parseFloat(data.rainfall_normal_value));
    this.graphDataNonCummulative.normal = filteredData.map((data: { rainfall_normal_value: string }, index: number, arr: any[]) => {
      const current = parseFloat(data.rainfall_normal_value);
      const previous = index === 0 ? 0 : parseFloat(arr[index - 1].rainfall_normal_value);
      return current - previous;
    });

    this.graphaDataCummulative.departure = filteredData.map((data: any) => {
      const date = new Date(data.date)
      if(date.getDay() === 3 ){
        return data.departure;
      }
      return undefined;
    });

    this.graphDataNonCummulative.departure = filteredData.map((data: any) => {
      const date = new Date(data.date)
      if(date.getDay() === 3 ){
        return data.departure;
      }
      return undefined;
    });

    this.graphaDataCummulative.date = filteredData.map((data: { date: string | number | Date; }) => new Date(data.date).toLocaleDateString());
    this.graphDataNonCummulative.date = filteredData.map((data: { date: string | number | Date; }) => new Date(data.date).toLocaleDateString());

    this.graphaData = this.selectedModeCummOrNonCumm=='Non-Cummulative'
      ? this.graphDataNonCummulative
      : this.graphaDataCummulative;
  }

  formatDates(dates: string[]): string[] {
    return dates.map((date) => {
      const [month, day, year] = date.split('/');
      return `${day}-${month}-${year}`;
    });
  }

  formatDisplay(value: number|undefined|null): string {
    return typeof value === 'number' ? value.toFixed(1) : '0.0';
  }

  updateCharts() {
    const titleStyle = {
      color: '#333',
      fontSize: '15px',
      fontWeight: 'normal',
      fontFamily: 'Arial, sans-serif'
    };

    const departureData = this.graphaData.departure;
    const formattedDates = this.formatDates(this.graphaData.date);

    const maxActual = Math.max(...this.graphaData.actual);
    const maxNormal = Math.max(...this.graphaData.normal);
    const maxValue = Math.max(maxActual, maxNormal);
    const roundedMax = Math.ceil(maxValue);
    const tickInterval = roundedMax / 5;

    const chart = new Chart({
      chart: {
        type: 'column',
        height: 600,
      },
      title: {
        style: titleStyle,
        text: `Actual and Normal for the period ${this.fromDate} to ${this.toDate} for ${this.selectedMap} in ${this.selectedYear} ${this.selectedSeason}`
      },
      credits: { enabled: false },
      xAxis: {
        categories: formattedDates,
        title: { text: 'Period' }
      },
      yAxis: {
        max: roundedMax,
        tickInterval: tickInterval,
        title: { text: 'Rainfall [mm]' }
      },
      tooltip: {
        formatter: function () {
          let points = this.points || [];
          let tooltipText = `<b>${this.x}</b><br/>`;
          points.forEach(point => {
            let val = typeof point.y === 'number' ? point.y.toFixed(1) : 'N/A';
            tooltipText += `<span style="color:${point.color}">\u25CF</span> ${point.series.name}: <b>${val}</b><br/>`;
          });
          return tooltipText;
        },
        shared: true
      },
      series: [
        {
          name: 'Actual',
          type: 'column',
          data: this.graphaData.actual,
          color: 'green',
          // dataLabels: {
          //   enabled: true,
          //   formatter: function () {
          //     // Get the index and value; protect against undefined/null
          //     const index = this.point && typeof this.point.index === 'number' ? this.point.index : -1;
          //     const value = typeof this.y === 'number' ? this.y : null;
          //     // const valText = value !== null ? value.toFixed(1) : '';
          
          //     // Access departure from chart's closure; check validity
          //     const departureVal = Array.isArray(departureData) && index >= 0 ? departureData[index] : null;
          //     const depText = (departureVal as number | null | undefined) ? (departureVal as unknown as number).toFixed(2) : '';
          
          //     // Output: show both if departure exists; else just the value
          //     // if (depText) {
          //     //   return `${valText} (${depText}%)`;
          //     // }
          //     // return valText;
          //   },
          //   style: {
          //     color: 'black',
          //   },
          //   inside: false,
          //   y: -10
          // }
          
        },
        {
          name: 'Normal',
          type: 'line',
          data: this.graphaData.normal,
          color:'darkblue'
        },
        {
          name: 'Departure',
          type: 'line',
          data: [], // Departure is shown via label, not as series
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

    this.chart = chart;
  }

  constructor(
    private regionService : RegionService,
    private countryService : CountryService,
    private constants : Constants
  ) {
    let selectedMode: any = localStorage.getItem("selectedMode");
    this.selectedMode = JSON.parse(selectedMode);
    this.selectedSeason = this.constants.getCurrentSeason(new Date())
  }
}
