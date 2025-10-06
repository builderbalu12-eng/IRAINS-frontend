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
  country_code?: string; // Added for new API
  actual_rainfall?: number | string;
  actual_state_rainfall?: number | string;
  actual_subdiv_rainfall?: number | string;
  rainfall_normal_value?: number | string; // Used for dailyergens
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
  isDailyStatsLoading: boolean = false; // Added for Daily Statistics loading state
  isTop5Loading: boolean = false; // Added for Top 5 loading state
  isHighestRecordedLoading: boolean = false; // Added for Highest Recorded loading state

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
      console.log('Selected Place updated:', this.selectedPlace); // Debug selectedPlace
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
    this.isHighestRecordedLoading = true; // Set loading state for Highest Recorded
    this.dates = this.getLast30Days();
    const service = this.getServiceForLayer(this.selectedPlace.layer);
    const method = this.getFetchMethodName(this.selectedPlace.layer);
    if (!service || !method) {
      console.error(`No service or method available for layer: ${this.selectedPlace.layer}`);
      this.isChartLoading = false;
      this.isHighestRecordedLoading = false;
      this.highestRecorded = [];
      return;
    }

    try {
      // Fetch chart data
      const res = await lastValueFrom((service as any)[method]({
        startDate: this.dates[0],
        endDate: this.dates[this.dates.length - 1],
        mode: this.isActual ? 'Actual' : 'Departure'
      })) as { success: boolean; message: string; data: RainfallData[] };
      const data: RainfallData[] = res.data || [];

      // Debugging: Log the fetched chart data
      console.log(`Fetched chart data for ${this.selectedPlace.layer} (${this.selectedPlace.code}):`, data);

      this.actualData = [];
      this.normalData = [];
      this.departureData = [];
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
          console.warn(`No chart data found for date ${date} and code ${this.selectedPlace.code} in layer ${this.selectedPlace.layer}`);
          this.actualData.push(0);
          this.normalData.push(0);
          this.departureData.push(0);
          rainfallData.push({ date, actual: 0 });
        }
      });

      // Fetch highest recorded data using new APIs
      const topNService = this.getServiceForLayer(this.selectedPlace.layer);
      const topNMethod = this.getTopNMethodName(this.selectedPlace.layer);
      if (!topNService || !topNMethod) {
        console.error(`No service or topN method available for layer: ${this.selectedPlace.layer}`);
        this.highestRecorded = [];
      } else {
        const codeKey = this.getTopNCodeKey(this.selectedPlace.layer);
        const codeValue = this.selectedPlace.layer === 'country' ? '1' : this.selectedPlace.code;

        try {
          // Log API call parameters
          const params = {
            [codeKey]: codeValue
          };
          console.log(`Fetching highest recorded data with params for ${this.selectedPlace.layer} (${codeValue}):`, params);

          const topNRes = await lastValueFrom((topNService as any)[topNMethod](params)) as {
            success: boolean;
            message: string;
            data: RainfallData[];
          };

          // Log full API response
          console.log(`Full API response for ${topNMethod}:`, topNRes);

          // Use the data array directly
          const topNData = topNRes.data || [];

          // Debugging: Log the raw highest recorded data
          console.log(`Raw highest recorded data for ${this.selectedPlace.layer} (${codeValue}):`, topNData);

          // Process the topNData to extract date and actual_rainfall
          this.highestRecorded = topNData
            .filter(item => {
              const actual = parseFloat(item.actual_rainfall as string ?? '0');
              return !isNaN(actual) && actual < 999 && item.date;
            })
            .sort((a, b) => parseFloat(b.actual_rainfall as string ?? '0') - parseFloat(a.actual_rainfall as string ?? '0'))
            .slice(0, 5)
            .map(item => ({
              date: this.formatDateToDDMMYYYY(item.date),
              actual: parseFloat(item.actual_rainfall as string ?? '0').toFixed(1)
            }));

          // Debugging: Log the filtered and mapped highest recorded data
          console.log(`Filtered highest recorded data for ${this.selectedPlace.layer} (${codeValue}):`, this.highestRecorded);

          // If no data is found, log a warning
          if (this.highestRecorded.length === 0) {
            console.warn(`No valid highest recorded data found for ${this.selectedPlace.layer} (${codeValue})`);
          }
        } catch (error) {
          console.error(`Error fetching highest recorded data for ${this.selectedPlace.layer} (${codeValue}):`, error);
          this.highestRecorded = [];
        }
      }

      this.updateChart();
      this.isChartLoading = false;
      this.isHighestRecordedLoading = false; // Clear loading state
    } catch (error) {
      console.error('Error fetching chart data:', error);
      this.isChartLoading = false;
      this.isHighestRecordedLoading = false;
      this.actualData = Array(this.dates.length).fill(0);
      this.normalData = Array(this.dates.length).fill(0);
      this.departureData = Array(this.dates.length).fill(0);
      this.highestRecorded = [];
      this.updateChart();
    }
  }

  // Helper method to format date to DD-MM-YYYY
  private formatDateToDDMMYYYY(dateStr: string): string {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      console.warn(`Invalid date format: ${dateStr}`);
      return 'Invalid Date';
    }
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  }

  // Helper method to get the topN fetch method name
  private getTopNMethodName(layer: string): string {
    switch (layer) {
      case 'country': return 'fetchTopNCountries';
      case 'region': return 'fetchTopNRegions';
      case 'state': return 'fetchTopNStates';
      case 'subdivision': return 'fetchTopNSubdivisions';
      case 'district': return 'fetchTopNDistricts';
      case 'block': return 'fetchTopNBlocks';
      default: return '';
    }
  }

  // Helper method for topN code key
  private getTopNCodeKey(layer: string): string {
    switch (layer) {
      case 'country': return 'country_code';
      case 'region': return 'region_code';
      case 'state': return 'state_code';
      case 'subdivision': return 'subdivision_code';
      case 'district': return 'district_code';
      case 'block': return 'block_code';
      default: return '';
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
    this.isDailyStatsLoading = true; // Set loading state
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
            this.isDailyStatsLoading = false; // Clear loading state
          },
          error: err => {
            console.error('Error fetching region data:', err);
            this.regionData = [];
            this.updateRegions();
            this.isDailyStatsLoading = false; // Clear loading state
          }
        });
      },
      error: err => {
        console.error('Error fetching country data:', err);
        this.countryData = [];
        this.regionData = [];
        this.updateRegions();
        this.isDailyStatsLoading = false; // Clear loading state
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
    this.isTop5Loading = true; // Set loading state
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
        this.isTop5Loading = false; // Clear loading state
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
        this.isTop5Loading = false; // Clear loading state
      },
      error: err => {
        console.error('Error fetching top 5 data:', err);
        this.top5 = [];
        this.isTop5Loading = false; // Clear loading state
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