import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { Chart } from 'angular-highcharts';
import * as Highcharts from 'highcharts';
import { lastValueFrom } from 'rxjs';
import { CountryService } from 'src/app/services/country/country.service';
import { RegionService } from 'src/app/services/region/region.service';
import { StateService } from 'src/app/services/state/state.service';
import { SubdivisionService } from 'src/app/services/subDivision/subDivision.service';
import { DistrictService } from 'src/app/services/district/district.service';
import { BlockService } from 'src/app/services/block/BlockService.service';
import { getRegionService } from 'src/app/services/region/getregion.service';
import { getStateService } from 'src/app/services/state/getState.service';
import { getDistrictService } from 'src/app/services/district/getdistrict.service';
import { getSubDivisionService } from 'src/app/services/subDivision/getsubdivision.service';
import { getBlockService } from 'src/app/services/block/getblock.service';
import Exporting from 'highcharts/modules/exporting';

// Define an interface for the rainfall data structure
interface RainfallData {
  name?: string;
  country_name?: string;
  region_name?: string;
  state_name?: string;
  subdivision_name?: string;
  district_name?: string;
  block_name?: string;
  r_code?: string;
  region_code?: string;
  state_code?: string | number;
  s_code?: string;
  subdivision_code?: string;
  district_code?: string;
  block_code?: string;
  country_id?: string;
  actual_rainfall?: number | string;
  rainfall_normal_value?: number | string;
  normal_rainfall?: number | string;
  departure?: number | string;
  date: string;
  [key: string]: any;
}

// Interface for dropdown place items
interface Place {
  code: string;
  name: string;
}

@Component({
  selector: 'app-map-charts',
  templateUrl: './map-charts.component.html',
  styleUrls: ['./map-charts.component.css']
})
export class MapChartsComponent implements OnInit, OnChanges {
  @Input() selectedLayer: string = 'subdivision';
  @Input() startDate: string = '2025-08-01';
  @Input() endDate: string = '2025-08-12';
  @Input() isActual: boolean = false;
  @Input() selectedPlace: { layer: string; code: string; name: string } = { layer: 'subdivision', code: '401', name: 'ANDAMAN & NICOBAR ISLANDS' };
  @Output() selectedPlaceChange = new EventEmitter<{ layer: string; code: string; name: string }>();

  regions: any[] = [];
  top5: any[] = [];
  top5Title: string = 'Top 5 Blocks - Current Day';
  highestRecorded: any[] = [];
  highestRecordedTitle: string = 'Chhattisgarh Highest Recorded';
  countryData: RainfallData[] = [];
  regionData: RainfallData[] = [];
  stateData: RainfallData[] = [];
  subdivisionData: RainfallData[] = [];
  districtData: RainfallData[] = [];
  blockData: RainfallData[] = [];
  isChartLoading: boolean = false;
  isDailyStatsLoading: boolean = false;
  isTop5Loading: boolean = false;
  isHighestRecordedLoading: boolean = false;
  availablePlaces: Place[] = [];

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
      text: `Daily Rainfall (Last 12 Days) - ${this.selectedPlace.name}`,
      style: {
        color: '#333',
        fontSize: '15px',
        fontWeight: 'normal',
        fontFamily: 'Arial, sans-serif'
      }
    },
    xAxis: {
      categories: [],
      title: {
        text: 'Date',
        style: { fontSize: '12px' }
      },
      labels: {
        rotation: -45,
        step: 1,
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
    private blockService: BlockService,
    private getRegionService: getRegionService,
    private getStateService: getStateService,
    private getDistrictService: getDistrictService,
    private getSubDivisionService: getSubDivisionService,
    private getBlockService: getBlockService,
    private cdr: ChangeDetectorRef // Added for change detection
  ) {}

  ngOnInit(): void {
    console.log('ngOnInit called at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    Exporting(Highcharts);
    this.highestRecordedTitle = `${this.selectedPlace.name} Highest Recorded`;
    this.fetchPlaces();
    this.fetchDailyStatsData();
    this.fetchTop5Data();
    this.fetchChartData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('ngOnChanges called with changes:', changes, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    if (changes['selectedLayer'] || changes['selectedPlace']) {
      this.highestRecordedTitle = `${this.selectedPlace.name} Highest Recorded`;
      this.fetchPlaces();
      this.fetchDailyStatsData();
      this.fetchTop5Data();
      this.fetchChartData();
    } else if (changes['startDate'] || changes['endDate'] || changes['isActual']) {
      this.highestRecordedTitle = `${this.selectedPlace.name} Highest Recorded`;
      this.fetchDailyStatsData();
      this.fetchTop5Data();
      this.fetchChartData();
    }
  }

  onPlaceChange(): void {
    console.log('Place changed to:', this.selectedPlace.code, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    const selectedPlace = this.availablePlaces.find(place => place.code === this.selectedPlace.code);
    if (selectedPlace) {
      this.selectedPlace = {
        layer: this.selectedLayer,
        code: selectedPlace.code,
        name: selectedPlace.name
      };
      this.highestRecordedTitle = `${this.selectedPlace.name} Highest Recorded`;
      this.selectedPlaceChange.emit(this.selectedPlace);
      this.fetchDailyStatsData();
      this.fetchTop5Data();
      this.fetchChartData();
    }
  }

  private fetchPlaces(): void {
    this.availablePlaces = [];
    if (this.selectedLayer === 'country') {
      this.availablePlaces = [{ code: '1', name: 'India' }];
      this.selectedPlace = { layer: 'country', code: '1', name: 'India' };
      console.log('Fetched places for country:', this.availablePlaces);
      return;
    }

    const service = this.getServiceForDropdown(this.selectedLayer);
    if (!service) {
      console.error(`No service available for layer: ${this.selectedLayer} at`, new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
      this.availablePlaces = [];
      return;
    }

    service.fetchData().subscribe({
      next: (res: any) => {
        const data = res.data || [];
        console.log(`Fetched places for ${this.selectedLayer}:`, data);
        this.availablePlaces = this.mapPlaces(this.selectedLayer, data);
        if (this.availablePlaces.length > 0 && (!this.selectedPlace.code || !this.availablePlaces.some(p => p.code === this.selectedPlace.code))) {
          this.selectedPlace = {
            layer: this.selectedLayer,
            code: this.availablePlaces[0].code,
            name: this.availablePlaces[0].name
          };
          this.highestRecordedTitle = `${this.selectedPlace.name} Highest Recorded`;
          this.fetchDailyStatsData();
          this.fetchTop5Data();
          this.fetchChartData();
        }
        console.log('Available places after mapping:', this.availablePlaces);
      },
      error: (err: any) => {
        console.error(`Error fetching places for ${this.selectedLayer}:`, err, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
        this.availablePlaces = [];
      }
    });
  }

  private mapPlaces(layer: string, data: any[]): Place[] {
    switch (layer) {
      case 'region':
        return data.map(item => ({
          code: item.region_code || '',
          name: item.region_name || 'Unknown'
        }));
      case 'state':
        return data.map(item => ({
          code: String(item.state_code) || '',
          name: item.state_name || 'Unknown'
        }));
      case 'subdivision':
        return data.map(item => ({
          code: item.subdiv_code || item.subdivision_code || '',
          name: item.subdiv_name || item.subdivision_name || 'Unknown'
        }));
      case 'district':
        return data.map(item => ({
          code: item.district_code || '',
          name: item.district_name || 'Unknown'
        }));
      case 'block':
        return data.map(item => ({
          code: item.block_code || '',
          name: item.block_name || 'Unknown'
        }));
      case 'country':
        return [{ code: '1', name: 'India' }];
      default:
        return [];
    }
  }

  private getServiceForDropdown(layer: string): any {
    switch (layer) {
      case 'region': return this.getRegionService;
      case 'state': return this.getStateService;
      case 'subdivision': return this.getSubDivisionService;
      case 'district': return this.getDistrictService;
      case 'block': return this.getBlockService;
      default: return null;
    }
  }

  private getLast12Days(): string[] {
    const dates: string[] = [];
    const endDate = new Date(this.endDate || '2025-08-12');
    for (let i = 11; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(endDate.getDate() - i);
      dates.push(this.formatDate(date));
    }
    console.log('Generated dates for chart:', dates);
    return dates;
  }

  private async fetchChartData(): Promise<void> {
    this.isChartLoading = true;
    this.isHighestRecordedLoading = true;
    this.dates = this.getLast12Days();
    const service = this.getServiceForLayer(this.selectedPlace.layer);
    const method = this.getFetchMethodName(this.selectedPlace.layer);
    if (!service || !method) {
      console.error(`No service or method available for layer: ${this.selectedPlace.layer} at`, new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
      this.isChartLoading = false;
      this.isHighestRecordedLoading = false;
      this.highestRecorded = [];
      return;
    }

    try {
      const params = {
        startDate: this.dates[0],
        endDate: this.dates[this.dates.length - 1],
        mode: this.isActual ? 'Actual' : 'Departure'
      };
      console.log(`Fetching chart data for ${this.selectedPlace.layer} with params:`, params);

      const res = await lastValueFrom((service as any)[method](params)) as { success: boolean; message: string; data: RainfallData[] };
      console.log(`Chart data response for ${this.selectedPlace.layer}:`, res);

      if (!res.success || !res.data) {
        console.warn(`No valid data received for ${this.selectedPlace.layer}:`, res.message);
        this.isChartLoading = false;
        this.isHighestRecordedLoading = false;
        this.actualData = Array(this.dates.length).fill(0);
        this.normalData = Array(this.dates.length).fill(0);
        this.departureData = Array(this.dates.length).fill(0);
        this.highestRecorded = [];
        this.updateChart();
        return;
      }

      const uniqueData = Array.from(new Map(res.data.map(item => [item.date + item[this.getDataCodeKey(this.selectedPlace.layer)], item])).values());
      console.log('Deduplicated chart data:', uniqueData);

      this.actualData = [];
      this.normalData = [];
      this.departureData = [];

      this.dates.forEach(date => {
        const item = this.findItemForPlaceByDate(uniqueData, this.selectedPlace.layer, this.selectedPlace.code, date);
        if (item) {
          const actualValue = parseFloat(item.actual_rainfall as string ?? '0');
          const normalValue = parseFloat(item.normal_rainfall as string ?? '0');
          const departureValue = parseFloat(item.departure as string ?? '0');
          this.actualData.push(actualValue);
          this.normalData.push(normalValue);
          this.departureData.push(departureValue);
        } else {
          console.warn(`No data found for date ${date} and code ${this.selectedPlace.code} in layer ${this.selectedPlace.layer}`);
          this.actualData.push(0);
          this.normalData.push(0);
          this.departureData.push(0);
        }
      });

      const topNService = this.getServiceForLayer(this.selectedPlace.layer);
      const topNMethod = this.getTopNMethodName(this.selectedPlace.layer);
      if (topNService && topNMethod) {
        const codeKey = this.getTopNCodeKey(this.selectedPlace.layer);
        const codeValue = this.selectedPlace.layer === 'country' ? '1' : this.selectedPlace.code;
        const topNParams = { [codeKey]: codeValue, startDate: this.startDate, endDate: this.endDate };

        try {
          const topNRes = await lastValueFrom((topNService as any)[topNMethod](topNParams)) as {
            success: boolean;
            message: string;
            data: RainfallData[];
          };
          console.log(`Highest recorded data response for ${this.selectedPlace.layer}:`, topNRes);

          if (topNRes.success && topNRes.data) {
            this.highestRecorded = topNRes.data
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
          } else {
            console.warn(`No valid highest recorded data for ${this.selectedPlace.layer}:`, topNRes.message);
            this.highestRecorded = [];
          }
        } catch (error) {
          console.error(`Error fetching highest recorded data for ${this.selectedPlace.layer}:`, error);
          this.highestRecorded = [];
        }
      } else {
        console.warn(`No topN method available for layer: ${this.selectedPlace.layer}`);
        this.highestRecorded = [];
      }

      this.updateChart();
      this.isChartLoading = false;
      this.isHighestRecordedLoading = false;
    } catch (error) {
      console.error('Error fetching chart data:', error, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
      this.isChartLoading = false;
      this.isHighestRecordedLoading = false;
      this.actualData = Array(this.dates.length).fill(0);
      this.normalData = Array(this.dates.length).fill(0);
      this.departureData = Array(this.dates.length).fill(0);
      this.highestRecorded = [];
      this.updateChart();
    }
  }

  private formatDateToDDMMYYYY(dateStr: string): string {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      console.warn(`Invalid date format: ${dateStr} at`, new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
      return 'Invalid Date';
    }
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  }

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

  private getTopNCodeKey(layer: string): string {
    switch (layer) {
      case 'country': return 'country_id';
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
    console.log(`Searching for code ${code} and date ${date} with key ${codeKey} in`, data);
    return data.find(d => d.date === date && String(d[codeKey] ?? '').trim() === String(code).trim());
  }

  private getDataCodeKey(layer: string): string {
    switch (layer) {
      case 'country': return 'country_id';
      case 'region': return 'region_code';
      case 'state': return 'state_code';
      case 'subdivision': return 'subdivision_code';
      case 'district': return 'district_code';
      case 'block': return 'block_code';
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
          text: `Daily Rainfall (Last 12 Days) - ${this.selectedPlace.name || 'India'}`,
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
            step: 1,
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
      console.log('Chart updated with data:', { actualData: this.actualData, normalData: this.normalData, dates: formattedDates });
    });
  }

  private fetchDailyStatsData() {
    this.isDailyStatsLoading = true;
    const params = {
      startDate: this.startDate,
      endDate: this.endDate,
      mode: this.isActual ? 'Actual' : 'Departure'
    };
    console.log('Fetching daily stats with params:', params);

    this.countryService.fetchData(params).subscribe({
      next: (countryRes: any) => {
        this.countryData = countryRes.data || [];
        console.log('Country data fetched:', this.countryData);
        this.regionService.fetchData(params).subscribe({
          next: (regionRes: any) => {
            this.regionData = regionRes.data || [];
            console.log('Region data fetched:', this.regionData);
            this.updateRegions();
            this.isDailyStatsLoading = false;
          },
          error: (err: any) => {
            console.error('Error fetching region data:', err);
            this.regionData = [];
            this.updateRegions();
            this.isDailyStatsLoading = false;
          }
        });
      },
      error: (err: any) => {
        console.error('Error fetching country data:', err);
        this.countryData = [];
        this.regionData = [];
        this.updateRegions();
        this.isDailyStatsLoading = false;
      }
    });
  }

  private updateRegions() {
    const country = this.countryData[0] as RainfallData || {
      name: 'India',
      actual_rainfall: '0',
      normal_rainfall: '0',
      departure: '0'
    };

    const countryItem = {
      name: country.name || 'India',
      actual: parseFloat(country.actual_rainfall as string ?? '0').toFixed(1),
      normal: parseFloat(country.normal_rainfall as string ?? '0').toFixed(1),
      departure: parseFloat(country.departure as string ?? '0').toFixed(1) + '%'
    };

    const regionsItems = this.regionData.map((r: any) => ({
      name: r.region_name || 'Unknown',
      actual: parseFloat(r.actual_rainfall as string ?? '0').toFixed(1),
      normal: parseFloat(r.normal_rainfall as string ?? '0').toFixed(1),
      departure: parseFloat(r.departure as string ?? '0').toFixed(1) + '%'
    }));

    this.regions = [countryItem, ...regionsItems];
    console.log('Updated regions:', this.regions);
  }

  private fetchTop5Data() {
    this.isTop5Loading = true;
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
        this.isTop5Loading = false;
        return;
    }

    this.top5Title = `Top 5 ${layerLabel} - Current Day`;

    service.fetchData(params).subscribe({
      next: res => {
        console.log('Raw top 5 data:', res.data);
        let data: RainfallData[] = res.data || [];
        data = data
          .filter((d: RainfallData) => d[actualKey] != null && !isNaN(parseFloat(d[actualKey] as string)))
          .sort((a: RainfallData, b: RainfallData) => parseFloat(b[actualKey] as string) - parseFloat(a[actualKey] as string))
          .slice(0, 5);
        console.log('Sorted and sliced top 5:', data);

        this.top5 = data.map((d: RainfallData) => ({
          name: this.toCamelCase(d[nameKey] || 'Unknown'),
          actual: parseFloat(d[actualKey] as string ?? '0').toFixed(1)
        }));
        this.isTop5Loading = false;
        this.cdr.detectChanges(); // Force change detection
      },
      error: err => {
        console.error('Error fetching top 5 data:', err);
        this.top5 = [];
        this.isTop5Loading = false;
      }
    });
  }

  private toCamelCase(name: string | null): string {
    if (!name) return 'Unknown';
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}