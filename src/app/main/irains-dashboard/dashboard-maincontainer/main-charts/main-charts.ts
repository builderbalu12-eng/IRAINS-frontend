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

// Extend Highcharts Point interface to include custom property
declare module 'highcharts' {
  interface Point {
    custom?: {
      departure: number;
    };
  }
}

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

interface DailySeasonData {
  date: string;
  year: number;
  actual: number | null;
  normal: number | null;
  departure: number | null;
}

@Component({
  selector: 'main-charts',
  templateUrl: './main-charts.html',
  styleUrls: ['./main-charts.css']
})
export class MainChartsComponent implements OnInit, OnChanges {
  @Input() selectedLayer: string = 'subdivision';
  @Input() selectedPlace: { layer: string; code: string; name: string } = { layer: 'subdivision', code: '401', name: 'ANDAMAN & NICOBAR ISLANDS' };
  @Output() filterDatesChange = new EventEmitter<string[]>();

  isLoading = false;
  noDataMessage: string | null = null;
  unit: 'mm' | 'cm' = 'mm';
  customMin: number | null = null;
  customMax: number | null = null;

  rainfallFilters: RainfallFilter[] = [
    { label: '10mm', min: 0.1, max: 10, count: 0 },
    { label: '50mm', min: 11, max: 50, count: 0 },
    { label: '100mm', min: 51, max: 100, count: 0 },
    { label: '200mm', min: 101, max: 200, count: 0 },
    { label: '>300mm', min: 301, max: Infinity, count: 0 },
    // { label: 'Custom', min: 0, max: Infinity, count: 0 }
  ];
  selectedRainfallFilter: RainfallFilter | null = null;

  chart: Chart | null = null;
  graphData: { actual: number[]; normal: number[]; departure: number[]; date: string[] } = {
    actual: [],
    normal: [],
    departure: [],
    date: []
  };
  filteredGraphData: { actual: number[]; normal: number[]; departure: number[]; date: string[] } = {
    actual: [],
    normal: [],
    departure: [],
    date: []
  };
  seasonDailyData: DailySeasonData[] = [];
  fromDate: string = '';
  toDate: string = '';
  startDate: string = '';
  endDate: string = '';
  startDateModel: Date | null = null;
  endDateModel: Date | null = null;
  maxDate: Date = new Date();
  mode: 'custom' | 'season' = 'custom';
  selectedSeason: string = 'Monsoon';
  selectedYears: number[] = [];
  availableYears: number[] = [];
  seasons: string[] = ['Winter', 'PreMonsoon', 'Monsoon', 'PostMonsoon'];

  constructor(
    private countryService: CountryService,
    private regionService: RegionService,
    private stateService: StateService,
    private subdivisionService: SubdivisionService,
    private districtService: DistrictService,
    private blockService: BlockService,
    private constants: Constants
  ) {}

  ngOnInit(): void {
    console.log('ngOnInit called at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    Exporting(Highcharts);
    this.initializeDateRange();
    this.initializeAvailableYears();
    console.log('Calling fetchData from ngOnInit');
    this.fetchData().then(() => {
      this.updateFilterCounts();
      this.applyRainfallFilterAndUpdateChart();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('ngOnChanges called with changes:', changes, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    if (changes['selectedLayer'] || changes['selectedPlace']) {
      // Ensure selectedPlace.layer matches selectedLayer
      if (changes['selectedPlace'] && this.selectedPlace.layer !== this.selectedLayer) {
        console.warn(`Mismatch between selectedPlace.layer (${this.selectedPlace.layer}) and selectedLayer (${this.selectedLayer}), updating selectedLayer`);
        this.selectedLayer = this.selectedPlace.layer;
      }
      console.log('Calling fetchData from ngOnChanges due to changes in:', {
        selectedLayer: changes['selectedLayer'],
        selectedPlace: changes['selectedPlace']
      });
      this.fetchData().then(() => {
        this.updateFilterCounts();
        this.applyRainfallFilterAndUpdateChart();
      });
    }
  }

  initializeDateRange(): void {
    const end = new Date();
    this.endDate = this.formatDate(end);
    this.endDateModel = end;
    const start = new Date(end);
    start.setDate(start.getDate() - 89);
    this.startDate = this.formatDate(start);
    this.startDateModel = start;

    this.graphData.date = this.getDateRange(new Date(this.startDate), new Date(this.endDate));
    this.graphData.actual = Array(this.graphData.date.length).fill(0);
    this.graphData.normal = Array(this.graphData.date.length).fill(0);
    this.graphData.departure = Array(this.graphData.date.length).fill(0);
    this.filteredGraphData = { ...this.graphData };
  }

  initializeAvailableYears(): void {
    const currentYear = new Date().getFullYear();
    this.availableYears = Array.from({ length: 10 }, (_, i) => currentYear - i);
    this.selectedYears = [currentYear];
  }

  onModeChange(mode: 'custom' | 'season'): void {
    this.mode = mode;
    this.noDataMessage = null;
    this.chart = null;
    this.selectedRainfallFilter = null;
    this.customMin = null;
    this.customMax = null;
    if (mode === 'season') {
      this.fetchSeasonData().then(() => {
        this.updateSeasonChart();
      });
    } else {
      this.fetchData().then(() => {
        this.updateFilterCounts();
        this.applyRainfallFilterAndUpdateChart();
      });
    }
  }

  onSeasonChange(season: string): void {
    this.selectedSeason = season;
    if (this.mode === 'season') {
      this.fetchSeasonData().then(() => {
        this.updateSeasonChart();
      });
    }
  }

  onYearsChange(years: number[]): void {
    this.selectedYears = years;
    if (this.mode === 'season') {
      this.fetchSeasonData().then(() => {
        this.updateSeasonChart();
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

  onUnitChange(unit: 'mm' | 'cm'): void {
    this.unit = unit;
    this.updateRainfallFilters();

    if (this.selectedRainfallFilter) {
      const targetLabel = this.selectedRainfallFilter.label === 'Custom'
        ? 'Custom'
        : this.convertLabel(this.selectedRainfallFilter.label);
      const index = this.rainfallFilters.findIndex(f => f.label === targetLabel);
      this.selectedRainfallFilter = index !== -1 ? this.rainfallFilters[index] : null;

      if (this.selectedRainfallFilter?.label === 'Custom' && this.customMin !== null && this.customMax !== null) {
        this.selectedRainfallFilter.min = this.unit === 'mm' ? this.customMin * 10 : this.customMin;
        this.selectedRainfallFilter.max = this.unit === 'mm' ? (this.customMax === Infinity ? Infinity : this.customMax * 10) : this.customMax;
      }
    }

    this.updateFilterCounts();
    this.applyRainfallFilterAndUpdateChart();
  }

  onCustomRangeChange(): void {
    if (this.selectedRainfallFilter?.label === 'Custom' && this.customMin !== null && this.customMax !== null) {
      if (this.customMax < this.customMin) {
        this.noDataMessage = 'Maximum value cannot be less than minimum value';
        this.chart = null;
        return;
      }
      this.selectedRainfallFilter.min = this.unit === 'mm' ? this.customMin * 10 : this.customMin;
      this.selectedRainfallFilter.max = this.unit === 'mm' ? (this.customMax === Infinity ? Infinity : this.customMax * 10) : this.customMax;
      const filteredDates = this.getFilteredDates();
      this.filterDatesChange.emit(filteredDates);
      this.applyRainfallFilterAndUpdateChart();
    }
  }

  onRainfallFilterChange(filter: RainfallFilter): void {
    if (this.selectedRainfallFilter === filter) {
      this.selectedRainfallFilter = null;
      this.customMin = null;
      this.customMax = null;
      this.filterDatesChange.emit(this.graphData.date);
    } else {
      this.selectedRainfallFilter = filter;
      if (filter.label !== 'Custom') {
        this.customMin = null;
        this.customMax = null;
      }
      const filteredDates = this.getFilteredDates();
      this.filterDatesChange.emit(filteredDates);
    }
    this.applyRainfallFilterAndUpdateChart();
  }

  updateRainfallFilters(): void {
    const isMm = this.unit === 'mm';
    this.rainfallFilters = [
      { label: isMm ? '10mm' : '1cm', min: isMm ? 0.1 : 0.01, max: isMm ? 10 : 1, count: 0 },
      { label: isMm ? '50mm' : '5cm', min: isMm ? 11 : 1.1, max: isMm ? 50 : 5, count: 0 },
      { label: isMm ? '100mm' : '10cm', min: isMm ? 51 : 5.1, max: isMm ? 100 : 10, count: 0 },
      { label: isMm ? '200mm' : '20cm', min: isMm ? 101 : 10.1, max: isMm ? 200 : 20, count: 0 },
      { label: isMm ? '>300mm' : '>30cm', min: isMm ? 301 : 30.1, max: Infinity, count: 0 },
      { label: 'Custom', min: 0, max: Infinity, count: 0 }
    ];
  }

  convertLabel(label: string): string {
    if (label === 'Custom') return 'Custom';
    const isMm = this.unit === 'mm';
    const value = parseFloat(label);
    if (label.includes('>')) {
      return isMm ? `>${value * 10}mm` : `>${value}cm`;
    }
    return isMm ? `${value * 10}mm` : `${value}cm`;
  }

  updateFilterCounts(): void {
    this.rainfallFilters.forEach(filter => {
      filter.count = this.graphData.actual.reduce((count, actual, index) => {
        const actualInMm = actual; // Data is stored in mm
        return actualInMm >= filter.min && actualInMm <= filter.max ? count + 1 : count;
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
      const actualVal = this.graphData.actual[i]; // Data in mm
      if (actualVal >= min && actualVal <= max) {
        filteredDates.push(this.graphData.date[i]);
      }
    }
    return filteredDates;
  }

  async fetchData(): Promise<void> {
    this.isLoading = true;
    this.noDataMessage = null;
    this.chart = null;

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
    const method = this.fetchMethodName(this.selectedLayer);
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
          this.graphData.departure.push(this.constants.trimToZeroDecimals(departureValue));
          this.graphData.date.push(dateStr);
        } else {
          this.graphData.actual.push(0);
          this.graphData.normal.push(0);
          this.graphData.departure.push(0);
          this.graphData.date.push(dateStr);
        }
      });

      if (this.graphData.actual.every(val => val === 0)) {
        this.noDataMessage = 'No data is available for the selected place and date range.';
      }
    } catch (error) {
      console.error('Error fetching data:', error, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
      this.noDataMessage = 'Error fetching data. Please try again.';
      this.graphData = { actual: [], normal: [], departure: [], date: [] };
    } finally {
      this.isLoading = false;
    }
  }

  async fetchSeasonData(): Promise<void> {
    this.isLoading = true;
    this.noDataMessage = null;
    this.chart = null;
    this.seasonDailyData = [];

    if (this.selectedYears.length === 0) {
      this.noDataMessage = 'Please select at least one year.';
      this.isLoading = false;
      return;
    }

    const service = this.getServiceForLayer(this.selectedLayer);
    const method = this.fetchMethodName(this.selectedLayer);
    if (!service || !method) {
      this.noDataMessage = `No service available for layer: ${this.selectedLayer}`;
      this.isLoading = false;
      return;
    }

    try {
      for (const year of this.selectedYears) {
        const { start, end } = this.getSeasonDateRange(year, this.selectedSeason);
        const res = await lastValueFrom((service as any)[method]({
          startDate: this.formatDate(start),
          endDate: this.formatDate(end),
          mode: 'Actual'
        })) as { success: boolean; message: string; data: RainfallData[] };
        const data: RainfallData[] = res.data || [];

        const dates = this.getDateRange(start, end);
        dates.forEach(dateStr => {
          const item = this.findItemForPlaceByDate(data, this.selectedLayer, this.selectedPlace.code, dateStr);
          let actualValue: number | null = null;
          let normalValue: number | null = null;
          let departureValue: number | null = null;
          if (item) {
            const actualKey = this.getActualKey(this.selectedLayer);
            const normalKey = this.getNormalKey(this.selectedLayer);
            actualValue = parseFloat(item[actualKey] as string ?? '0');
            normalValue = parseFloat(item[normalKey] as string ?? '0');
            departureValue = parseFloat(item.departure as string ?? '0');
          }
          this.seasonDailyData.push({
            date: dateStr,
            year,
            actual: actualValue !== null ? this.constants.trimToOneDecimals(actualValue) : null,
            normal: normalValue !== null ? this.constants.trimToOneDecimals(normalValue) : null,
            departure: departureValue !== null ? this.constants.trimToZeroDecimals(departureValue) : null
          });
        });
        if (year !== this.selectedYears[this.selectedYears.length - 1]) {
          this.seasonDailyData.push({
            date: `gap-${year}`,
            year,
            actual: null,
            normal: null,
            departure: null
          });
        }
      }

      if (this.seasonDailyData.every(data => data.actual === null || data.actual === 0)) {
        this.noDataMessage = `No data available for ${this.selectedSeason} in the selected years.`;
      }
    } catch (error) {
      console.error('Error fetching season data:', error, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
      this.noDataMessage = 'Error fetching season data. Please try again.';
      this.seasonDailyData = [];
    } finally {
      this.isLoading = false;
    }
  }

  fetchMethodName(layer: string): string {
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

  getSeasonDateRange(year: number, season: string): { start: Date; end: Date } {
    let start: Date, end: Date;
    switch (season) {
      case 'Winter':
        start = new Date(year, 0, 1);
        end = new Date(year, 1, this.isLeapYear(year) ? 29 : 28);
        break;
      case 'PreMonsoon':
        start = new Date(year, 2, 1);
        end = new Date(year, 4, 31);
        break;
      case 'Monsoon':
        start = new Date(year, 5, 1);
        end = new Date(year, 8, 30);
        break;
      case 'PostMonsoon':
        start = new Date(year, 9, 1);
        end = new Date(year, 11, 31);
        break;
      default:
        start = new Date(year, 0, 1);
        end = new Date(year, 11, 31);
    }
    return { start, end };
  }

  getCurrentSeason(date: Date): string {
    const year = date.getFullYear();
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const winterStart = new Date(year, 0, 1);
    winterStart.setHours(0, 0, 0, 0);
    const winterEnd = new Date(year, 1, this.isLeapYear(year) ? 29 : 28);
    winterEnd.setHours(23, 59, 59, 999);
    const premonsoonStart = new Date(year, 2, 1);
    premonsoonStart.setHours(0, 0, 0, 0);
    const premonsoonEnd = new Date(year, 4, 31);
    premonsoonEnd.setHours(23, 59, 59, 999);
    const monsoonStart = new Date(year, 5, 1);
    monsoonStart.setHours(0, 0, 0, 0);
    const monsoonEnd = new Date(year, 8, 30);
    monsoonEnd.setHours(23, 59, 59, 999);
    const postmonsoonStart = new Date(year, 9, 1);
    postmonsoonStart.setHours(0, 0, 0, 0);
    const postmonsoonEnd = new Date(year, 11, 31);
    postmonsoonEnd.setHours(23, 59, 59, 999);

    if (normalizedDate >= winterStart && normalizedDate <= winterEnd) {
      return 'Winter';
    } else if (normalizedDate >= premonsoonStart && normalizedDate <= premonsoonEnd) {
      return 'PreMonsoon';
    } else if (normalizedDate >= monsoonStart && normalizedDate <= monsoonEnd) {
      return 'Monsoon';
    } else if (normalizedDate >= postmonsoonStart && normalizedDate <= postmonsoonEnd) {
      return 'PostMonsoon';
    }
    throw new Error('Unable to determine the season for the given date.');
  }

  isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  applyRainfallFilterAndUpdateChart(): void {
    if (!this.graphData || this.graphData.actual.length === 0) {
      this.filteredGraphData = { actual: [], normal: [], departure: [], date: [] };
      this.chart = null;
      return;
    }

    const conversionFactor = this.unit === 'cm' ? 0.1 : 1;
    if (!this.selectedRainfallFilter) {
      this.noDataMessage = null;
      this.filteredGraphData = {
        actual: this.graphData.actual.map(val => this.constants.trimToOneDecimals(val * conversionFactor)),
        normal: this.graphData.normal.map(val => this.constants.trimToOneDecimals(val * conversionFactor)),
        departure: [...this.graphData.departure],
        date: [...this.graphData.date]
      };
      this.updateCharts(this.filteredGraphData);
      return;
    }

    const { min, max } = this.selectedRainfallFilter;
    const filteredActual: number[] = [];
    const filteredNormal: number[] = [];
    const filteredDeparture: number[] = [];
    const filteredDates: string[] = [];

    for (let i = 0; i < this.graphData.actual.length; i++) {
      const actualVal = this.graphData.actual[i]; // Data in mm
      if (actualVal >= min && actualVal <= max) {
        filteredActual.push(this.constants.trimToOneDecimals(actualVal * conversionFactor));
        filteredNormal.push(this.constants.trimToOneDecimals(this.graphData.normal[i] * conversionFactor));
        filteredDeparture.push(this.graphData.departure[i]);
        filteredDates.push(this.graphData.date[i]);
      }
    }

    if (filteredActual.length === 0) {
      this.noDataMessage = `No data available for actual rainfall in the range ${min}${this.unit} to ${max === Infinity ? 'above' : max + this.unit}.`;
      this.filteredGraphData = { actual: [], normal: [], departure: [], date: [] };
      this.chart = null;
      return;
    }

    this.filteredGraphData = {
      actual: filteredActual,
      normal: filteredNormal,
      departure: filteredDeparture,
      date: filteredDates
    };
    this.updateCharts(this.filteredGraphData);
  }

  updateCharts(data: { actual: number[]; normal: number[]; departure: number[]; date: string[] }): void {
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
    const maxLeft = Math.max(maxActual, maxNormal);
    const roundedLeft = Math.ceil(maxLeft) || 1;
    const tickLeft = roundedLeft / 5;

    const formattedDates = this.formatDates(data.date);

    const plotLines: Highcharts.XAxisPlotLinesOptions[] = [];
    const countLabels: Highcharts.XAxisPlotLinesOptions[] = [];
    let currentMonth = '';
    let monthGroup = { month: '', startIndex: 0, count: 0 };
    for (let i = 0; i < data.date.length; i++) {
      const month = data.date[i].slice(0, 7);
      if (month !== currentMonth) {
        if (currentMonth) {
          monthGroup.count = i - monthGroup.startIndex;
          const middle = monthGroup.startIndex + monthGroup.count / 2;
          plotLines.push({
            color: '#000000',
            dashStyle: 'Dot' as Highcharts.DashStyleValue,
            width: 1,
            value: i - 0.5,
            zIndex: 5
          });
          if (this.selectedRainfallFilter) {
            countLabels.push({
              color: 'transparent',
              width: 0,
              value: middle,
              zIndex: 6,
              label: {
                text: `${monthGroup.count} times`,
                align: 'center',
                style: { fontSize: '12px', color: '#000000', fontWeight: 'bold' },
                rotation: 0,
                y: -20
              }
            });
          }
        }
        currentMonth = month;
        monthGroup = { month, startIndex: i, count: 0 };
      }
    }
    if (currentMonth) {
      monthGroup.count = data.date.length - monthGroup.startIndex;
      const middle = monthGroup.startIndex + monthGroup.count / 2;
      if (this.selectedRainfallFilter) {
        countLabels.push({
          color: 'transparent',
          width: 0,
          value: middle,
          zIndex: 6,
          label: {
            text: `${monthGroup.count} times`,
            align: 'center',
            style: { fontSize: '12px', color: '#000000', fontWeight: 'bold' },
            rotation: 0,
            y: -20
          }
        });
      }
    }

    const currentUnit = this.unit; // Capture unit for use in formatter

    this.chart = new Chart({
      chart: {
        type: 'line',
        height: 600,
        marginTop: 60
      },
      title: {
        style: titleStyle,
        text: `Actual, Normal, and Departure for the period ${this.fromDate} to ${this.toDate} for ${this.selectedPlace.name} ${this.selectedRainfallFilter ? `(Filtered: ${this.selectedRainfallFilter.label}${this.selectedRainfallFilter.label === 'Custom' ? ' (' + this.customMin + '-' + (this.customMax === Infinity ? '∞' : this.customMax) + this.unit + ')' : ''})` : ''}`
      },
      credits: { enabled: false },
      xAxis: {
        categories: formattedDates,
        title: { text: 'Period' },
        plotLines: [...plotLines, ...countLabels],
        labels: {
          rotation: -45,
          step: Math.ceil(formattedDates.length / 10),
          style: { fontSize: '10px' }
        }
      },
      yAxis: [{
        min: 0,
        max: roundedLeft,
        tickInterval: tickLeft,
        title: { text: `Rainfall (${this.unit})` }
      }, {
        title: { text: 'Departure (%)' },
        opposite: true
      }],
      tooltip: {
        shared: true,
        formatter: function(this: Highcharts.TooltipFormatterContextObject): string {
          if (!this.points || this.points.length === 0) {
            return `<b>${this.x}</b><br/>No data available`;
          }
          let tooltip = `<b>${this.x}</b><br/>`;
          const unit = Array.isArray(this.points[0].series.chart.options.yAxis)
            ? this.points[0].series.chart.options.yAxis[0]?.title?.text?.split(' ')[1]?.replace(/[()]/g, '') || currentUnit
            : this.points[0].series.chart.options.yAxis?.title?.text?.split(' ')[1]?.replace(/[()]/g, '') || currentUnit;
          this.points.forEach(point => {
            const seriesName = point.series.name;
            const value = seriesName === 'Departure' ? `${point.y}%` : `${point.y} ${unit}`;
            tooltip += `${seriesName}: ${value}<br/>`;
          });
          return tooltip;
        }
      },
      legend: {
        y: 10
      },
      series: [
        {
          name: 'Actual',
          type: 'line',
          data: data.actual,
          color: 'green'
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
          data: data.departure,
          color: 'black',
          yAxis: 1
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

  updateSeasonChart(): void {
    if (this.noDataMessage || this.seasonDailyData.length === 0) {
      this.chart = null;
      return;
    }

    const conversionFactor = this.unit === 'cm' ? 0.1 : 1;
    const titleStyle = {
      color: '#333',
      fontSize: '15px',
      fontWeight: 'normal',
      fontFamily: 'Arial, sans-serif'
    };

    const maxActual = Math.max(...this.seasonDailyData.map(d => (d.actual ?? 0) * conversionFactor), 0);
    const maxNormal = Math.max(...this.seasonDailyData.map(d => (d.normal ?? 0) * conversionFactor), 0);
    const maxLeft = Math.max(maxActual, maxNormal);
    const roundedLeft = Math.ceil(maxLeft) || 1;
    const tickLeft = roundedLeft / 5;

    const formattedDates = this.seasonDailyData.map(d => {
      if (d.date.startsWith('gap-')) {
        return '';
      }
      const [, month, day] = d.date.split('-');
      return `${day}-${month}`;
    });

    const plotLines: Highcharts.XAxisPlotLinesOptions[] = [];
    const yearLabels: Highcharts.XAxisPlotLinesOptions[] = [];
    let currentIndex = 0;
    this.selectedYears.forEach((year, yearIndex) => {
      const yearData = this.seasonDailyData.filter(d => d.year === year && !d.date.startsWith('gap-'));
      yearLabels.push({
        color: 'transparent',
        width: 0,
        value: currentIndex,
        zIndex: 6,
        label: {
          text: `${year}`,
          align: 'left',
          style: { fontSize: '12px', color: '#000000', fontWeight: 'bold' },
          rotation: 0,
          y: -20
        }
      });
      currentIndex += yearData.length;
      if (yearIndex < this.selectedYears.length - 1) {
        plotLines.push({
          color: '#000000',
          dashStyle: 'Dash' as Highcharts.DashStyleValue,
          width: 1,
          value: currentIndex,
          zIndex: 5
        });
        currentIndex += 1;
      }
    });

    const currentUnit = this.unit; // Capture unit for use in formatter

    this.chart = new Chart({
      chart: {
        height: 600,
        marginTop: 60
      },
      title: {
        style: titleStyle,
        text: `Daily Rainfall for ${this.selectedSeason} across ${this.selectedYears.join(', ')} in ${this.selectedPlace.name}`
      },
      credits: { enabled: false },
      xAxis: {
        categories: formattedDates,
        title: { text: 'Date (DD-MM)' },
        plotLines: [...plotLines, ...yearLabels],
        labels: {
          rotation: -45,
          step: Math.ceil(formattedDates.length / 50),
          style: { fontSize: '10px' }
        }
      },
      yAxis: [{
        min: 0,
        max: roundedLeft,
        tickInterval: tickLeft,
        title: { text: `Rainfall (${this.unit})` }
      }],
      tooltip: {
        shared: true,
        formatter: function(this: Highcharts.TooltipFormatterContextObject): string {
          if (!this.points || this.points.length === 0) {
            return `<b>${this.x}</b><br/>No data available`;
          }
          let tooltip = `<b>${this.x}</b><br/>`;
          const unit = Array.isArray(this.points[0].series.chart.options.yAxis)
            ? this.points[0].series.chart.options.yAxis[0]?.title?.text?.split(' ')[1]?.replace(/[()]/g, '') || currentUnit
            : this.points[0].series.chart.options.yAxis?.title?.text?.split(' ')[1]?.replace(/[()]/g, '') || currentUnit;
          this.points.forEach(point => {
            const seriesName = point.series.name;
            const value = seriesName === 'Actual' || seriesName === 'Normal' ? `${point.y} ${unit}` : `${point.y}%`;
            tooltip += `${seriesName}: ${value}<br/>`;
            if (seriesName === 'Actual' && point.point.custom?.departure !== undefined) {
              tooltip += `Departure: ${point.point.custom.departure}%<br/>`;
            }
          });
          return tooltip;
        }
      },
      legend: {
        y: 10
      },
      series: [
        {
          name: 'Actual',
          type: 'column',
          data: this.seasonDailyData.map(d => ({
            y: d.actual !== null ? this.constants.trimToOneDecimals(d.actual * conversionFactor) : null,
            custom: { departure: d.departure }
          })),
          color: 'green',
          dataLabels: {
            enabled: true,
            formatter: function(this: Highcharts.PointLabelObject): string {
              return this.point.custom && this.point.custom.departure !== undefined
                ? `${this.point.custom.departure}%`
                : '';
            },
            style: { fontSize: '8px', color: 'black' },
            y: -10
          }
        },
        {
          name: 'Normal',
          type: 'line',
          data: this.seasonDailyData.map(d => d.normal !== null ? this.constants.trimToOneDecimals(d.normal * conversionFactor) : null),
          color: 'darkblue'
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