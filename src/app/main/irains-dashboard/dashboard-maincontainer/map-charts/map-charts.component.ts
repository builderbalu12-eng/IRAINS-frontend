import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
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

declare module 'highcharts' {
  interface Chart {
    customData?: {
      departureData: number[];
    };
  }
}

// Define an interface for the rainfall data structure
interface RainfallData {
  name?: string;
  country_name?: string;
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
  country_code?: string;
  actual_rainfall?: number | string;
  actual_state_rainfall?: number | string;
  actual_subdiv_rainfall?: number | string;
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

interface ProcessedChartData {
  actualData: number[];
  normalData: number[];
  departureData: number[];
  highestRecorded: any[];
}

@Component({
  selector: 'app-map-charts',
  templateUrl: './map-charts.component.html',
  styleUrls: ['./map-charts.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapChartsComponent implements OnInit, OnChanges {
  @Input() selectedLayer: string = '';
  @Input() startDate: string = '';
  @Input() endDate: string = '';
  @Input() isActual: boolean = false;
  @Input() selectedPlace: any = {};
  @Output() selectedPlaceChange = new EventEmitter<{ layer: string; code: string; name: string }>();

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
  isDailyStatsLoading: boolean = false;
  isTop5Loading: boolean = false;
  isHighestRecordedLoading: boolean = false;
  availablePlaces: Place[] = [];

  actualData: number[] = [];
  normalData: number[] = [];
  departureData: number[] = [];
  dates: string[] = [];

  // Cache for data
  private dataCache = new Map<string, { data: any; timestamp: number }>();
  // Debounce timeout
  private fetchTimeout: any;
  // Last fetch params for comparison
  private lastFetchParams: any = null;

  chart = new Chart({
    chart: {
      type: 'column',
      height: 400
    },
    title: {
      text: 'Daily Rainfall (Last 30 Days)',
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
        data: [],
        color: 'green',
        dataLabels: {
          enabled: true,
          formatter: function(this: any) {
            // Use chart customData to access departureData
            const chart = this.series.chart;
            const departureData = chart.customData?.departureData || [];
            const index = this.point.index ?? 0;
            const departure = departureData[index]?.toFixed(1) + '%';
            return departure || '';
          },
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
        data: [],
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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('ngOnInit called');
    Exporting(Highcharts);
    const today = new Date();
    this.endDate = this.endDate || this.formatDate(today);
    const start = new Date(today);
    start.setDate(today.getDate() - 29);
    this.startDate = this.startDate || this.formatDate(start);
    this.highestRecordedTitle = `${this.selectedPlace.name || 'India'} Highest Recorded`;
    this.fetchPlaces();
    this.fetchAllDataDebounced();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('ngOnChanges called with changes:', changes);
    // Debounce rapid changes
    clearTimeout(this.fetchTimeout);
    this.fetchTimeout = setTimeout(() => {
      const newParams = {
        layer: this.selectedLayer,
        place: this.selectedPlace?.code,
        startDate: this.startDate,
        endDate: this.endDate,
        isActual: this.isActual
      };

      if (this.areParamsDifferent(newParams)) {
        this.lastFetchParams = newParams;
        this.highestRecordedTitle = `${this.selectedPlace.name || 'India'} Highest Recorded`;
        if (changes['selectedLayer'] || changes['selectedPlace']) {
          this.fetchPlaces();
        }
        this.fetchAllDataDebounced();
      }
    }, 300); // 300ms debounce
  }

  private areParamsDifferent(newParams: any): boolean {
    return !this.lastFetchParams || 
           this.lastFetchParams.layer !== newParams.layer ||
           this.lastFetchParams.place !== newParams.place ||
           this.lastFetchParams.startDate !== newParams.startDate ||
           this.lastFetchParams.endDate !== newParams.endDate ||
           this.lastFetchParams.isActual !== newParams.isActual;
  }

  private async fetchAllDataDebounced(): Promise<void> {
    // Priority: Chart data first
    await this.fetchChartData();
    
    // Then parallel non-critical data
    Promise.allSettled([
      this.fetchDailyStatsData(),
      this.fetchTop5Data()
    ]).then(results => {
      // Handle individual failures gracefully
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(`Failed to fetch data ${index}:`, result.reason);
        }
      });
    });
  }

  onPlaceChange(): void {
    console.log('Place changed to:', this.selectedPlace.code);
    const selectedPlace = this.availablePlaces.find(place => place.code === this.selectedPlace.code);
    if (selectedPlace) {
      this.selectedPlace = {
        layer: this.selectedLayer,
        code: selectedPlace.code,
        name: selectedPlace.name
      };
      this.highestRecordedTitle = `${this.selectedPlace.name} Highest Recorded`;
      this.selectedPlaceChange.emit(this.selectedPlace);
      this.fetchAllDataDebounced();
    }
  }

  private fetchPlaces(): void {
    this.availablePlaces = [];
    if (this.selectedLayer === 'country') {
      this.availablePlaces = [{ code: 'INDIA', name: 'India' }];
      this.selectedPlace = { layer: 'country', code: 'INDIA', name: 'India' };
      console.log('Fetched places for country:', this.availablePlaces);
      this.cdr.markForCheck();
      return;
    }

    const service = this.getServiceForDropdown(this.selectedLayer);
    if (!service) {
      console.error(`No service available for layer: ${this.selectedLayer}`);
      this.availablePlaces = [];
      this.cdr.markForCheck();
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
          this.selectedPlaceChange.emit(this.selectedPlace);
        }
        console.log('Available places after mapping:', this.availablePlaces);
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error(`Error fetching places for ${this.selectedLayer}:`, err);
        this.availablePlaces = [];
        this.cdr.markForCheck();
      }
    });
  }

  private mapPlaces(layer: string, data: any[]): Place[] {
    let places: Place[] = [];
    switch (layer) {
      case 'region':
        places = data.map(item => ({
          code: item.region_code || '',
          name: item.region_name || item.name || 'Unknown'
        }));
        break;
      case 'state':
        places = data.map(item => ({
          code: String(item.state_code) || '',
          name: item.state_name || 'Unknown'
        }));
        break;
      case 'subdivision':
        places = data.map(item => ({
          code: item.subdiv_code || item.subdivision_code || '',
          name: item.subdiv_name || item.subdivision_name || 'Unknown'
        }));
        break;
      case 'district':
        places = data.map(item => ({
          code: item.district_code || '',
          name: item.district_name || 'Unknown'
        }));
        break;
      case 'block':
        places = data.map(item => ({
          code: item.block_code || '',
          name: item.block_name || 'Unknown'
        }));
        break;
      default:
        return [];
    }
    return places.sort((a, b) => a.name.localeCompare(b.name));
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

  private getLast30Days(): string[] {
    const dates: string[] = [];
    const today = new Date(this.endDate || new Date().toISOString().split('T')[0]);
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(this.formatDate(date));
    }
    console.log('Generated dates for chart:', dates);
    return dates;
  }

  private async fetchChartData(): Promise<void> {
    const cacheKey = `${this.selectedLayer}_${this.selectedPlace.code}_${this.startDate}_${this.endDate}_${this.isActual}`;
    
    // Check cache first
    if (this.dataCache.has(cacheKey)) {
      const cached = this.dataCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 min cache
        const processed = this.processRainfallData(cached.data.mainData, cached.data.highestRecordedData);
        this.actualData = processed.actualData;
        this.normalData = processed.normalData;
        this.departureData = processed.departureData;
        this.highestRecorded = processed.highestRecorded;
        this.dates = this.getLast30Days();
        this.updateChart();
        this.isChartLoading = false;
        this.isHighestRecordedLoading = false;
        this.cdr.markForCheck();
        return;
      }
    }

    this.isChartLoading = true;
    this.isHighestRecordedLoading = true;
    this.dates = this.getLast30Days();
    const service = this.getServiceForLayer(this.selectedPlace.layer);
    const method = this.getFetchMethodName(this.selectedPlace.layer);
    if (!service || !method) {
      console.error(`No service or method available for layer: ${this.selectedPlace.layer}`);
      this.showFallbackData();
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
        this.showFallbackData();
        return;
      }

      let highestRecordedData: RainfallData[] = [];
      const topNService = this.getServiceForLayer(this.selectedPlace.layer);
      const topNMethod = this.getTopNMethodName(this.selectedPlace.layer);
      if (topNService && topNMethod) {
        const codeKey = this.getTopNCodeKey(this.selectedPlace.layer);
        const codeValue = this.selectedPlace.layer === 'country' ? 'INDIA' : this.selectedPlace.code;
        const topNParams = { [codeKey]: codeValue };
        console.log(`Fetching highest recorded data with params for ${this.selectedPlace.layer} (${codeValue}):`, topNParams);

        try {
          const topNRes = await lastValueFrom((topNService as any)[topNMethod](topNParams)) as {
            success: boolean;
            message: string;
            data: RainfallData[];
          };
          console.log(`Highest recorded data response for ${this.selectedPlace.layer}:`, topNRes);

          if (topNRes.success && topNRes.data) {
            highestRecordedData = topNRes.data;
          }
        } catch (error) {
          console.error(`Error fetching highest recorded data for ${this.selectedPlace.layer}:`, error);
        }
      }

      // Cache the result
      this.dataCache.set(cacheKey, {
        data: { mainData: res.data, highestRecordedData },
        timestamp: Date.now()
      });

      const processed = this.processRainfallData(res.data, highestRecordedData);
      this.actualData = processed.actualData;
      this.normalData = processed.normalData;
      this.departureData = processed.departureData;
      this.highestRecorded = processed.highestRecorded;

      this.updateChart();
      this.isChartLoading = false;
      this.isHighestRecordedLoading = false;
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error fetching chart data:', error);
      this.showFallbackData();
    }
  }

  private processRainfallData(data: RainfallData[], highestData: RainfallData[]): ProcessedChartData {
    // Optimized data processing with Map for O(1) lookups
    const dataMap = new Map<string, RainfallData>();
    data.forEach(item => {
      const key = `${item.date}_${item[this.getDataCodeKey(this.selectedPlace.layer)]}`;
      dataMap.set(key, item);
    });

    const codeKey = this.getDataCodeKey(this.selectedPlace.layer);
    const codeValue = this.selectedPlace.layer === 'country' ? this.selectedPlace.code : this.selectedPlace.code;
    const actualKey = this.getActualKey(this.selectedPlace.layer);
    const normalKey = this.getNormalKey(this.selectedPlace.layer);

    const actualData: number[] = [];
    const normalData: number[] = [];
    const departureData: number[] = [];

    this.dates.forEach(date => {
      const item = dataMap.get(`${date}_${codeValue}`);
      if (item) {
        actualData.push(parseFloat(item[actualKey] as string ?? '0'));
        normalData.push(parseFloat(item[normalKey] as string ?? '0'));
        departureData.push(parseFloat(item.departure as string ?? '0'));
      } else {
        actualData.push(0);
        normalData.push(0);
        departureData.push(0);
      }
    });

    const highestRecorded = highestData
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

    return { actualData, normalData, departureData, highestRecorded };
  }

  private showFallbackData() {
    this.isChartLoading = false;
    this.isHighestRecordedLoading = false;
    this.actualData = Array(this.dates.length).fill(0);
    this.normalData = Array(this.dates.length).fill(0);
    this.departureData = Array(this.dates.length).fill(0);
    this.highestRecorded = [];
    this.updateChart();
    this.cdr.markForCheck();
  }

  private formatDateToDDMMYYYY(dateStr: string): string {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      console.warn(`Invalid date format: ${dateStr}`);
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
      // Update title
      chart.setTitle({
        text: `Daily Rainfall (Last 30 Days) - ${this.selectedPlace.name || 'India'}`,
        style: {
          color: '#333',
          fontSize: '15px',
          fontWeight: 'normal',
          fontFamily: 'Arial, sans-serif'
        }
      }, undefined, false);

      // Update xAxis categories
      chart.xAxis[0].setCategories(formattedDates, false);

      // Update yAxis
      chart.yAxis[0].update({
        min: 0,
        max: roundedMax,
        tickInterval: tickInterval
      }, false);

      // Store custom data for formatter
      chart.customData = {
        departureData: this.departureData
      };

      // Update series data incrementally
      chart.series[0].setData(this.actualData, false);
      chart.series[1].setData(this.normalData, false);
      chart.series[2].setData([], false); // Departure is empty

      chart.redraw();
      console.log('Chart updated with data:', { actualData: this.actualData, normalData: this.normalData, dates: formattedDates });
    });
    this.cdr.markForCheck();
  }

  private fetchDailyStatsData() {
    this.isDailyStatsLoading = true;
    const params = {
      startDate: this.startDate,
      endDate: this.endDate,
      mode: this.isActual ? 'Actual' : 'Departure',
      country_code: '1' // Add country_code for India
    };
  
    this.countryService.fetchData(params).subscribe({
      next: countryRes => {
        this.countryData = countryRes.data || [];
        console.log('Country data fetched:', this.countryData);
        this.regionService.fetchData({
          startDate: this.startDate,
          endDate: this.endDate,
          mode: this.isActual ? 'Actual' : 'Departure'
        }).subscribe({
          next: regionRes => {
            this.regionData = regionRes.data || [];
            console.log('Region data fetched:', this.regionData);
            this.updateRegions();
            this.isDailyStatsLoading = false;
            this.cdr.markForCheck();
          },
          error: err => {
            console.error('Error fetching region data:', err);
            this.regionData = [];
            this.updateRegions();
            this.isDailyStatsLoading = false;
            this.cdr.markForCheck();
          }
        });
      },
      error: err => {
        console.error('Error fetching country data:', err);
        this.countryData = [];
        this.regionData = [];
        this.updateRegions();
        this.isDailyStatsLoading = false;
        this.cdr.markForCheck();
      }
    });
  }
  
  private updateRegions() {
    // Ensure country data is processed correctly
    const country = this.countryData.find(d => d.country_code === '1') as RainfallData || {
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
  
    this.regions = [...regionsItems];
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
        this.cdr.markForCheck();
        return;
    }

    this.top5Title = `Top 5 ${layerLabel} - ${this.formatDateToDDMMYYYY(this.startDate)}`

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
        this.cdr.markForCheck();
      },
      error: err => {
        console.error('Error fetching top 5 data:', err);
        this.top5 = [];
        this.isTop5Loading = false;
        this.cdr.markForCheck();
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