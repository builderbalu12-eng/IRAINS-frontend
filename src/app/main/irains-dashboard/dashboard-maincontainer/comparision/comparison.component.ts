import { Component, OnInit, Input, SimpleChanges } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { forkJoin } from 'rxjs';
import { StateService } from 'src/app/services/state/state.service';
import { DistrictService } from 'src/app/services/district/district.service';
import { BlockService } from 'src/app/services/block/BlockService.service';
import { DataService } from 'src/app/data.service';
import { Constants } from 'src/app/services/constants';

@Component({
  selector: 'app-comparison',
  templateUrl: './comparison.component.html',
  styleUrls: ['./comparison.component.css']
})
export class ComparisonComponent implements OnInit {
  @Input() showComparison = false;

  // GeoJSON layers
  stateGeojson: any = null;
  districtGeojson: any = null;
  blockGeojson: any = null;

  // Data for maps
  stateData: any[] = [];
  districtData: any[] = [];
  blockData: any[] = [];

  // Controls
  startDate = '';
  endDate = '';
  maxDate = '';
  isActual = true;

  isGeojsonLoaded = false;

  selectedState: any = null;
  selectedDistrict: any = null;
  selectedBlock: string | null = null;

  // Maps
  private stateMap!: L.Map;
  private districtMap!: L.Map;
  private blockMap!: L.Map;

  constructor(
    private http: HttpClient,
    private stateService: StateService,
    private districtService: DistrictService,
    private blockService: BlockService,
    private dataService: DataService,
    private constants: Constants
  ) {}

  ngOnInit(): void {
    this.loadGeojsonData();
    const todayStr = new Date().toISOString().split('T')[0];
    this.startDate = todayStr;
    this.endDate = todayStr;
    this.maxDate = todayStr;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['showComparison']?.currentValue && this.isGeojsonLoaded) {
      setTimeout(() => this.initializeMaps(), 0);
      this.fetchAllData();
    }
  }

  private loadGeojsonData(): void {
    forkJoin({
      states: this.http.get('assets/geojson/INDIA_STATE.json'),
      districts: this.http.get('assets/geojson/INDIA_DISTRICT.json'),
      blocks: this.http.get('assets/geojson/INDIA_BLOCK.json')
    }).subscribe({
      next: ({ states, districts, blocks }) => {
        this.stateGeojson = states;
        this.districtGeojson = districts;
        this.blockGeojson = blocks;
        this.isGeojsonLoaded = true;
        if (this.showComparison) {
          setTimeout(() => this.initializeMaps(), 0);
          this.fetchAllData();
        }
      },
      error: err => console.error('Error loading GeoJSON:', err)
    });
  }

  onDateOrModeChange(): void {
    this.fetchAllData();
  }

  // --- RESET BUTTON FUNCTIONALITY ---
  resetMapView(): void {
    this.selectedState = null;
    this.selectedDistrict = null;
    this.selectedBlock = null;
    this.updateMaps(); // Will redraw all as initial extent
  }

  private fetchAllData() {
    const params = {
      startDate: this.startDate,
      endDate: this.endDate,
      mode: this.isActual ? 'Actual' : 'Departure'
    };

    // State data
    this.stateService.fetchData(params).subscribe((res: any) => {
      this.stateData = res.data;
      this.updateMaps();
    });

    // District data
    this.districtService.fetchData(params).subscribe((res: any) => {
      this.districtData = res.data;
      this.updateMaps();
    });

    // Block data
    this.blockService.fetchData(params).subscribe((res: any) => {
      this.blockData = res.data;
      this.updateMaps();
    });
  }

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
      zoom: 5,
      scrollWheelZoom: false
    });
    L.tileLayer(
      'https://c.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
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
    // STATE
    const stateLayer = L.geoJSON(this.stateGeojson, {
      style: f => this.styleState(f),
      onEachFeature: (feature, layer) => this.onEachState(feature, layer)
    }).addTo(this.stateMap);
    if (stateLayer.getBounds().isValid())
      this.stateMap.fitBounds(stateLayer.getBounds(), { padding: [20, 20] });

    // DISTRICT
    const filteredDistricts = this.getFilteredDistricts();
    if (filteredDistricts?.features.length) {
      const districtLayer = L.geoJSON(filteredDistricts, {
        style: f => this.styleDistrict(f),
        onEachFeature: (feature, layer) => this.onEachDistrict(feature, layer)
      }).addTo(this.districtMap);
      if (districtLayer.getBounds().isValid())
        this.districtMap.fitBounds(districtLayer.getBounds(), { padding: [20, 20] });
    }

    // BLOCK
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

  // DATA-DRIVEN STYLE AND POPUPS

  private styleState(feature: any): any {
    const code = feature.properties.state_code;
    const data = this.stateData?.find((d: any) => String(d.state_code) === String(code));
    const value = this.isActual ? (data?.actual_state_rainfall ?? 'NA') : (data?.departure ?? 'NA');
    const fillColor = this.constants.getColorForRainfall(String(value));
    const isSelected = this.selectedState && feature === this.selectedState;
    return {
      fillColor,
      color: isSelected ? '#b91c1c' : '#333',
      weight: isSelected ? 3 : 1,
      fillOpacity: 1
    };
  }

  private styleDistrict(feature: any): any {
    const code = feature.properties.district_c;
    const data = this.districtData?.find((d: any) => d.district_code === code?.toString());
    const value = this.isActual ? (data?.actual_rainfall ?? 'NA') : (data?.departure ?? 'NA');
    const fillColor = this.constants.getColorForRainfall(String(value));
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
    const fillColor = this.constants.getColorForRainfall(String(value));
    const isSelected = this.selectedBlock === feature.properties.block_Name;
    return {
      fillColor,
      color: isSelected ? '#000' : '#888',
      weight: isSelected ? 3 : 1,
      fillOpacity: 1,
      dashArray: isSelected ? '4' : undefined
    };
  }

  private onEachState(feature: any, layer: L.Layer): void {
    const code = feature.properties.state_code;
    const data = this.stateData?.find((d: any) => String(d.state_code) === String(code));
    const name = feature.properties.state_name;
    const daily = data?.actual_state_rainfall != null && !isNaN(data?.actual_state_rainfall)
      ? this.constants.trimToOneDecimals(data?.actual_state_rainfall) : 'NA';
    const normal = data?.rainfall_normal_value != null && !isNaN(data?.rainfall_normal_value)
      ? data?.rainfall_normal_value : 'NA';
    const departure = data?.departure != null && !isNaN(data?.departure)
      ? this.constants.trimToOneDecimals(data?.departure) : 'NA';

    layer.bindTooltip(`
      <div>
        <div><b>${name}</b></div>
        <div>Daily: <b>${daily}</b></div>
        <div>Normal: <b>${normal}</b></div>
        <div>Departure: <b>${departure}</b></div>
      </div>
    `, { sticky: true });

    layer.on({
      click: () => {
        this.selectedState = feature;
        this.selectedDistrict = null;
        this.selectedBlock = null;
        this.updateMaps();
      }
    });
  }

  private onEachDistrict(feature: any, layer: L.Layer): void {
    const code = feature.properties.district_c;
    const data = this.districtData?.find((d: any) => d.district_code === code?.toString());
    const name = feature.properties.district;
    const daily = data?.actual_rainfall != null && !isNaN(data?.actual_rainfall)
      ? this.constants.trimToOneDecimals(data?.actual_rainfall) : 'NA';
    const normal = data?.normal_rainfall != null && !isNaN(data.normal_rainfall)
      ? this.constants.trimToOneDecimals(parseFloat(data.normal_rainfall)) : 'NA';
    const departure = data?.departure != null && !isNaN(data.departure)
      ? this.constants.trimToOneDecimals(data.departure) : 'NA';

    layer.bindTooltip(`
      <div>
        <div><b>${name}</b></div>
        <div>Daily: <b>${daily}</b></div>
        <div>Normal: <b>${normal}</b></div>
        <div>Departure: <b>${departure}</b></div>
      </div>
    `, { sticky: true });

    layer.on({
      click: () => {
        this.selectedDistrict = feature;
        this.selectedBlock = null;
        this.updateMaps();
      }
    });
  }

  private onEachBlock(feature: any, layer: L.Layer): void {
    const code = feature.properties.block_code || feature.properties.block_c;
    const data = this.blockData?.find((d: any) => d.block_code === code?.toString());
    const name = feature.properties.block_Name;
    const daily = data?.actual_rainfall != null && !isNaN(data?.actual_rainfall)
      ? this.constants.trimToOneDecimals(data?.actual_rainfall) : 'NA';
    const normal = data?.normal_rainfall != null && !isNaN(data.normal_rainfall)
      ? this.constants.trimToOneDecimals(parseFloat(data.normal_rainfall)) : 'NA';
    const departure = data?.departure != null && !isNaN(data.departure)
      ? this.constants.trimToOneDecimals(data.departure) : 'NA';

    layer.bindTooltip(`
      <div>
        <div><b>${name}</b></div>
        <div>Daily: <b>${daily}</b></div>
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
}
