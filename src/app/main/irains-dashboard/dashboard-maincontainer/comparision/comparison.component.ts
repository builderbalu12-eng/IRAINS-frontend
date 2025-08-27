import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { StateService } from 'src/app/services/state/state.service';
import { DistrictService } from 'src/app/services/district/district.service';
import { BlockService } from 'src/app/services/block/BlockService.service';
import { Constants } from 'src/app/services/constants';
import { forkJoin } from 'rxjs';


interface SummaryValue {
  name: string | null;
  value: number | null;
}


interface Summary {
  highest: { daily: SummaryValue; normal: SummaryValue; departure: SummaryValue; };
  lowest: { daily: SummaryValue; normal: SummaryValue; departure: SummaryValue; };
}


@Component({
  selector: 'app-comparison',
  templateUrl: './comparison.component.html',
  styleUrls: ['./comparison.component.css']
})
export class ComparisonComponent implements OnInit, OnChanges {
  @Input() showComparison = false;

  @Input() startDate = '';
  @Input() endDate = '';
  @Input() isActual = false;

  stateGeojson: any = null;
  districtGeojson: any = null;
  blockGeojson: any = null;

  stateData: any[] = [];
  districtData: any[] = [];
  blockData: any[] = [];

  maxDate = '';

  selectedState: any = null;
  selectedDistrict: any = null;
  selectedBlock: string | null = null;

  private stateMap!: L.Map;
  private districtMap!: L.Map;
  private blockMap!: L.Map;

  stateSummary: Summary = this.emptySummary();
  districtSummary: Summary = this.emptySummary();
  blockSummary: Summary = this.emptySummary();

  isGeojsonLoaded = false;

  isBuffering: boolean = false;

  constructor(
    private http: HttpClient,
    private stateService: StateService,
    private districtService: DistrictService,
    private blockService: BlockService,
    private constants: Constants
  ) { }

  ngOnInit(): void {
    this.loadGeojsonData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // When showComparison turns on and geojson loaded, initialize maps and fetch data
    if (changes['showComparison']?.currentValue && this.isGeojsonLoaded) {
      setTimeout(() => this.initializeMaps(), 0);
      this.fetchAllData();
    }
    // Fetch data if any filter property changes
    if (
      (changes['startDate'] && !changes['startDate'].firstChange) ||
      (changes['endDate'] && !changes['endDate'].firstChange) ||
      (changes['isActual'] && !changes['isActual'].firstChange)
    ) {
      this.fetchAllData();
    }
  }

  private loadGeojsonData(): void {
    this.http.get('assets/geojson/INDIA_STATE.json').subscribe({
      next: states => {
        this.stateGeojson = states;
        this.http.get('assets/geojson/INDIA_DISTRICT.json').subscribe({
          next: districts => {
            this.districtGeojson = districts;
            this.http.get('assets/geojson/INDIA_BLOCK.json').subscribe({
              next: blocks => {
                this.blockGeojson = blocks;
                this.isGeojsonLoaded = true;
                if (this.showComparison) {
                  setTimeout(() => this.initializeMaps(), 0);
                  this.fetchAllData();
                }
              },
              error: err => console.error('Error loading blocks GeoJSON:', err)
            });
          },
          error: err => console.error('Error loading districts GeoJSON:', err)
        });
      },
      error: err => console.error('Error loading state GeoJSON:', err)
    });
  }

  
  resetMapView(): void {
    this.selectedState = null;
    this.selectedDistrict = null;
    this.selectedBlock = null;
    this.updateMaps();
    this.computeSummaryForDistricts();
    this.computeSummaryForBlocks();
  }

  


  private fetchAllData() {
    const params = {
      startDate: this.startDate,
      endDate: this.endDate,
      mode: this.isActual ? 'Actual' : 'Depature'
    };

    this.isBuffering = true;

    forkJoin({
      stateRes: this.stateService.fetchData(params),
      districtRes: this.districtService.fetchData(params),
      blockRes: this.blockService.fetchData(params)
    }).subscribe({
      next: ({ stateRes, districtRes, blockRes }) => {
        this.stateData = stateRes.data;
        this.districtData = districtRes.data;
        this.blockData = blockRes.data;

        this.computeSummaryForStates();
        this.computeSummaryForDistricts();
        this.computeSummaryForBlocks();
        this.updateMaps();

        this.isBuffering = false;
      },
      error: (err) => {
        console.error('Data fetch failed', err);
        this.isBuffering = false;
      }
    });
  }


  private emptySummary(): Summary {
    return {
      highest: {
        daily: { name: null, value: null },
        normal: { name: null, value: null },
        departure: { name: null, value: null }
      },
      lowest: {
        daily: { name: null, value: null },
        normal: { name: null, value: null },
        departure: { name: null, value: null }
      }
    };
  }

  private computeSummaryForStates(): void {
    if (!this.stateData || this.stateData.length === 0) {
      this.stateSummary = this.emptySummary();
      return;
    }
    this.stateSummary = this.computeSummary(this.stateData, 'state_name',
      'actual_state_rainfall', 'rainfall_normal_value', 'departure');
  }

  private computeSummaryForDistricts(): void {
    if (!this.districtData || this.districtData.length === 0) {
      this.districtSummary = this.emptySummary();
      return;
    }
    let filtered = this.districtData;
    if (this.selectedState) {
      const stateCode = String(this.selectedState.properties.state_code);
      filtered = this.districtData.filter(
        d => String(d.state_code) === stateCode
      );
    }
    this.districtSummary = this.computeSummary(
      filtered, 'district_name', 'actual_rainfall', 'normal_rainfall', 'departure'
    );
  }

  private computeSummaryForBlocks(): void {
    if (!this.blockData || this.blockData.length === 0) {
      this.blockSummary = this.emptySummary();
      return;
    }
    let filtered = this.blockData;
    if (this.selectedDistrict) {
      const districtCode = String(this.selectedDistrict.properties.district_c || '').trim();
      filtered = this.blockData.filter(
        b => String(b.district_code || b.district_c || '').trim() === districtCode
      );
    } else if (this.selectedState) {
      const stateCode = String(this.selectedState.properties.state_code);
      filtered = this.blockData.filter(
        b => String(b.state_code) === stateCode
      );
    }
    this.blockSummary = this.computeSummary(
      filtered, 'block_name', 'actual_rainfall', 'normal_rainfall', 'departure'
    );
  }

  private computeSummary(
    data: any[],
    nameKey: string,
    dailyKey: string,
    normalKey: string,
    departureKey: string
  ): Summary {
    let highestDaily: SummaryValue = { name: null, value: null };
    let lowestDaily: SummaryValue = { name: null, value: null };
    let highestNormal: SummaryValue = { name: null, value: null };
    let lowestNormal: SummaryValue = { name: null, value: null };
    let highestDeparture: SummaryValue = { name: null, value: null };
    let lowestDeparture: SummaryValue = { name: null, value: null };

    data.forEach(item => {
      const dailyRaw = this.parseNumberSafely(item[dailyKey]);
      const normalRaw = this.parseNumberSafely(item[normalKey]);
      const departureRaw = this.parseNumberSafely(item[departureKey]);
      const name = this.toCamelCase(item[nameKey] || null);

      const dailyVal = dailyRaw !== null ? this.constants.trimToOneDecimals(dailyRaw) : null;
      const normalVal = normalRaw !== null ? this.constants.trimToOneDecimals(normalRaw) : null;
      const departureVal = departureRaw !== null ? this.constants.trimToOneDecimals(departureRaw) : null;

      if (dailyVal !== null && (highestDaily.value === null || dailyVal > highestDaily.value)) {
        highestDaily = { name, value: dailyVal };
      }
      if (dailyVal !== null && (lowestDaily.value === null || dailyVal < lowestDaily.value)) {
        lowestDaily = { name, value: dailyVal };
      }
      if (normalVal !== null && (highestNormal.value === null || normalVal > highestNormal.value)) {
        highestNormal = { name, value: normalVal };
      }
      if (normalVal !== null && (lowestNormal.value === null || normalVal < lowestNormal.value)) {
        lowestNormal = { name, value: normalVal };
      }
      if (departureVal !== null && (highestDeparture.value === null || departureVal > highestDeparture.value)) {
        highestDeparture = { name, value: departureVal };
      }
      if (departureVal !== null && (lowestDeparture.value === null || departureVal < lowestDeparture.value)) {
        lowestDeparture = { name, value: departureVal };
      }
    });

    return {
      highest: {
        daily: highestDaily,
        normal: highestNormal,
        departure: highestDeparture
      },
      lowest: {
        daily: lowestDaily,
        normal: lowestNormal,
        departure: lowestDeparture
      }
    };
  }

  private parseNumberSafely(value: any): number | null {
    if (value === null || value === undefined) return null;
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    return num;
  }

  private layerControls: L.Control.Layers[] = [];

  private initializeMaps() {
    if (!this.stateMap) {
      this.stateMap = this.createBaseMap('state-map');
      this.districtMap = this.createBaseMap('district-map');
      this.blockMap = this.createBaseMap('block-map');
    }
    this.renderGeojsonLayers();
  }

  private createBaseMap(containerId: string): L.Map {
    const map = L.map(containerId, {
      center: [20.5937, 78.9629],
      zoom: 6,
      scrollWheelZoom: false,
      zoomDelta: 0.25,
      zoomSnap: 0,
      wheelPxPerZoomLevel: 120
    });
    L.tileLayer(
      'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      { attribution: '&copy; <a href="https://carto.com/">CARTO</a>', subdomains: 'abcd', maxZoom: 19 }
    ).addTo(map);
    return map;
  }

  private updateMaps(): void {
    [this.stateMap, this.districtMap, this.blockMap].forEach(map => {
      map.eachLayer(layer => {
        if (layer instanceof L.GeoJSON) map.removeLayer(layer);
      });
    });
    this.renderGeojsonLayers();
  }

  private renderGeojsonLayers(): void {
    const stateLayer = L.geoJSON(this.stateGeojson, {
      style: f => this.styleState(f),
      onEachFeature: (feature, layer) => this.onEachState(feature, layer)
    }).addTo(this.stateMap);
    if (stateLayer.getBounds().isValid())
      this.stateMap.fitBounds(stateLayer.getBounds(), { padding: [20, 20] });

    const filteredDistricts = this.getFilteredDistricts();
    if (filteredDistricts?.features.length) {
      const districtLayer = L.geoJSON(filteredDistricts, {
        style: f => this.styleDistrict(f),
        onEachFeature: (feature, layer) => this.onEachDistrict(feature, layer)
      }).addTo(this.districtMap);
      if (districtLayer.getBounds().isValid())
        this.districtMap.fitBounds(districtLayer.getBounds(), { padding: [20, 20] });
    }

    const filteredBlocks = this.getFilteredBlocks();
    if (filteredBlocks?.features.length) {
      const blockLayer = L.geoJSON(filteredBlocks, {
        style: f => this.styleBlock(f),
        onEachFeature: (feature, layer) => this.onEachBlock(feature, layer)
      }).addTo(this.blockMap);
      if (blockLayer.getBounds().isValid())
        this.blockMap.fitBounds(blockLayer.getBounds(), { padding: [20, 20] });
    }
    this.removeFocusFromLayers();
  }

  private getFilteredDistricts(): any {
    if (!this.selectedState || !this.districtGeojson) return this.districtGeojson;
    const stateCode = String(this.selectedState.properties.state_code);
    const firstDigit = stateCode.charAt(0);
    const lastTwo = stateCode.slice(-2);
    const filtered = this.districtGeojson.features.filter((f: any) => {
      const distStateCode = String(f.properties.state_code);
      return distStateCode.charAt(0) === firstDigit && distStateCode.slice(-2) === lastTwo;
    });
    return { ...this.districtGeojson, features: filtered };
  }

  private getFilteredBlocks(): any {
    if (!this.blockGeojson) return this.blockGeojson;
    let filtered: any[] = [];
    if (this.selectedDistrict) {
      const districtCode = String(this.selectedDistrict.properties.district_c || '').trim();
      filtered = this.blockGeojson.features.filter((f: any) =>
        String(f.properties.district_c || '').trim() === districtCode
      );
    } else if (this.selectedState) {
      const stateCode = String(this.selectedState.properties.state_code);
      const firstDigit = stateCode.charAt(0);
      const lastTwo = stateCode.slice(-2);
      filtered = this.blockGeojson.features.filter((f: any) => {
        const blockStateCode = String(f.properties.state_code);
        return blockStateCode.charAt(0) === firstDigit && blockStateCode.slice(-2) === lastTwo;
      });
    } else {
      filtered = this.blockGeojson.features;
    }
    return { ...this.blockGeojson, features: filtered };
  }

  private removeFocusFromLayers(): void {
    [this.stateMap, this.districtMap, this.blockMap].forEach(map => {
      map.eachLayer(layer => {
        if ((layer as any)._path) {
          const elem = (layer as any)._path as SVGElement;
          elem.removeAttribute('tabindex');
          elem.style.outline = 'none';
        }
      });
    });
  }

  private styleState(feature: any): any {
    const code = feature.properties.state_code;
    const data = this.stateData?.find((d: any) => String(d.state_code) === String(code));
    const value = this.isActual ? (data?.actual_state_rainfall ?? 'NA') : (data?.departure ?? 'NA');
    const fillColor = this.isActual
      ? this.constants.getActualColorForRainfall(String(value))
      : this.constants.getColorForRainfall(String(value));
    const isSelected = this.selectedState && feature === this.selectedState;
    return {
      fillColor,
      color: isSelected ? '#000000ff' : '#333',
      weight: isSelected ? 3 : 1,
      fillOpacity: 1
    };
  }

  private styleDistrict(feature: any): any {
    const code = feature.properties.district_c;
    const data = this.districtData?.find((d: any) => d.district_code === code?.toString());
    const value = this.isActual ? (data?.actual_rainfall ?? 'NA') : (data?.departure ?? 'NA');
    const fillColor = this.isActual
      ? this.constants.getActualColorForRainfall(String(value))
      : this.constants.getColorForRainfall(String(value));
    const isSelected = this.selectedDistrict && feature === this.selectedDistrict;
    return {
      fillColor,
      color: isSelected ? '#000' : '#333',
      weight: isSelected ? 3 : 1,
      fillOpacity: 1
    };
  }

  private styleBlock(feature: any): any {
    const code = feature.properties.block_code || feature.properties.block_c;
    const data = this.blockData?.find((d: any) => d.block_code === code?.toString());
    const value = this.isActual ? (data?.actual_rainfall ?? 'NA') : (data?.departure ?? 'NA');
    const fillColor = this.isActual
      ? this.constants.getActualColorForRainfall(String(value))
      : this.constants.getColorForRainfall(String(value));
    const isSelected = this.selectedBlock === feature.properties.block_Name;
    return {
      fillColor,
      color: isSelected ? '#000' : '#000000ff',
      weight: isSelected ? 3 : 1,
      fillOpacity: 1,
      dashArray: isSelected ? '4' : undefined
    };
  }

  get summaryLabel(): string {
    return this.startDate === this.endDate ? 'Daily' : 'Cumulative';
  }

  private onEachState(feature: any, layer: L.Layer): void {
    const code = feature.properties.state_code;
    const data = this.stateData?.find((d: any) => String(d.state_code) === String(code));
    const name = this.toCamelCase(feature.properties.state_name);
    const daily = data?.actual_state_rainfall != null && !isNaN(data?.actual_state_rainfall)
      ? this.constants.trimToOneDecimals(data?.actual_state_rainfall) : 'NA';
    const normal = data?.rainfall_normal_value != null && !isNaN(data?.rainfall_normal_value)
      ? data?.rainfall_normal_value : 'NA';
    const departure = data?.departure != null && !isNaN(data?.departure)
      ? this.constants.trimToOneDecimals(data?.departure) : 'NA';
    layer.bindTooltip(`
      <div>
        <div><b>${name}</b></div>
        <div>${this.summaryLabel}: <b>${daily}</b></div>
        <div>Normal: <b>${normal}</b></div>
        <div>Departure: <b>${departure}</b></div>
      </div>
    `, { sticky: true });
    layer.on({
      click: () => {
        this.selectedState = feature;
        this.selectedDistrict = null;
        this.selectedBlock = null;
        this.computeSummaryForDistricts();
        this.computeSummaryForBlocks();
        this.updateMaps();
      }
    });
  }

  private onEachDistrict(feature: any, layer: L.Layer): void {
    const code = feature.properties.district_c;
    const data = this.districtData?.find((d: any) => d.district_code === code?.toString());
    const name = this.toCamelCase(feature.properties.district);
    const daily = data?.actual_rainfall != null && !isNaN(data?.actual_rainfall)
      ? this.constants.trimToOneDecimals(data?.actual_rainfall) : 'NA';
    const normal = data?.normal_rainfall != null && !isNaN(data.normal_rainfall)
      ? this.constants.trimToOneDecimals(parseFloat(data.normal_rainfall)) : 'NA';
    const departure = data?.departure != null && !isNaN(data.departure)
      ? this.constants.trimToOneDecimals(data.departure) : 'NA';
    layer.bindTooltip(`
      <div>
        <div><b>${name}</b></div>
        <div>${this.summaryLabel}: <b>${daily}</b></div>
        <div>Normal: <b>${normal}</b></div>
        <div>Departure: <b>${departure}</b></div>
      </div>
    `, { sticky: true });
    layer.on({
      click: () => {
        this.selectedDistrict = feature;
        this.selectedBlock = null;
        this.computeSummaryForBlocks();
        this.updateMaps();
      }
    });
  }

  private onEachBlock(feature: any, layer: L.Layer): void {
    const code = feature.properties.block_code || feature.properties.block_c;
    const data = this.blockData?.find((d: any) => d.block_code === code?.toString());
    const name = this.toCamelCase(feature.properties.block_Name);
    const daily = data?.actual_rainfall != null && !isNaN(data?.actual_rainfall)
      ? this.constants.trimToOneDecimals(data?.actual_rainfall) : 'NA';
    const normal = data?.normal_rainfall != null && !isNaN(data.normal_rainfall)
      ? this.constants.trimToOneDecimals(parseFloat(data.normal_rainfall)) : 'NA';
    const departure = data?.departure != null && !isNaN(data.departure)
      ? this.constants.trimToOneDecimals(data.departure) : 'NA';
    layer.bindTooltip(`
      <div>
        <div><b>${name}</b></div>
        <div>${this.summaryLabel}: <b>${daily}</b></div>
        <div>Normal: <b>${normal}</b></div>
        <div>Departure: <b>${departure}</b></div>
      </div>
    `, { sticky: true });
    layer.on({
      click: () => {
        this.selectedBlock = feature.properties.block_Name;
        this.updateMaps();
      }
    });
  }

  toCamelCase(name: string | null): string {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  get dateRangeLabel(): string {
    if (!this.startDate) return '';
    const formatDate = (d: string) => {
      const dateObj = new Date(d);
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${day}-${month}-${year}`;
    };

    if (this.startDate === this.endDate) {
      // Single date format
      return `Date : ${formatDate(this.startDate)}`;
    } else {
      // Date range format
      return `Date : ${formatDate(this.startDate)} to ${formatDate(this.endDate)}`;
    }
  }

}
