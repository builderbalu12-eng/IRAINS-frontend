import { Component, OnInit, Input, SimpleChanges } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { forkJoin } from 'rxjs';

interface AlertColors {
  [key: string]: string;
  NA: string;
  moderate: string;
  heavy: string;
  extreme: string;
}

@Component({
  selector: 'app-comparison',
  templateUrl: './comparison.component.html',
  styleUrls: ['./comparison.component.css']
})
export class ComparisonComponent implements OnInit {
  @Input() showComparison = false;

  stateGeojson: any = null;
  districtGeojson: any = null;
  blockGeojson: any = null;

  selectedState: any = null;
  selectedDistrict: any = null;
  selectedBlock: string | null = null;

  // New: date fields and maxDate
  startDate = '';
  endDate = '';
  maxDate = '';
  isActual = true;

  isGeojsonLoaded = false;

  private stateMap!: L.Map;
  private districtMap!: L.Map;
  private blockMap!: L.Map;

  alertColors: AlertColors = {
    NA: '#9df00fff',
    moderate: '#EEDB00',
    heavy: '#FFA500',
    extreme: '#B22222'
  };

  constructor(private http: HttpClient) {}

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
        if (this.showComparison) setTimeout(() => this.initializeMaps(), 0);
      },
      error: err => console.error('Error loading GeoJSON:', err)
    });
  }

  private initializeMaps(): void {
    if (this.stateMap || this.districtMap || this.blockMap) {
      this.updateMaps();
      return;
    }
    this.stateMap = this.createBaseMap('state-map');
    this.districtMap = this.createBaseMap('district-map');
    this.blockMap = this.createBaseMap('block-map');
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
      return this.blockGeojson;
    }
    return { ...this.blockGeojson, features: filtered };
  }

  private renderGeojsonLayers(): void {
    const stateLayer = L.geoJSON(this.stateGeojson, {
      style: f => this.styleState(f),
      onEachFeature: (feature, layer) => this.onEachState(feature, layer)
    }).addTo(this.stateMap);
    if (stateLayer.getBounds().isValid()) this.stateMap.fitBounds(stateLayer.getBounds(), { padding: [20, 20] });

    const filteredDistricts = this.getFilteredDistricts();
    if (filteredDistricts?.features.length) {
      const districtLayer = L.geoJSON(filteredDistricts, {
        style: f => this.styleDistrict(f),
        onEachFeature: (feature, layer) => this.onEachDistrict(feature, layer)
      }).addTo(this.districtMap);
      if (districtLayer.getBounds().isValid()) this.districtMap.fitBounds(districtLayer.getBounds(), { padding: [20, 20] });
    }

    const filteredBlocks = this.getFilteredBlocks();
    if (filteredBlocks?.features.length) {
      const blockLayer = L.geoJSON(filteredBlocks, {
        style: f => this.styleBlock(f),
        onEachFeature: (feature, layer) => this.onEachBlock(feature, layer)
      }).addTo(this.blockMap);
      if (blockLayer.getBounds().isValid()) this.blockMap.fitBounds(blockLayer.getBounds(), { padding: [20, 20] });
    }

    this.removeFocusFromLayers();
  }

  private updateMaps(): void {
    [this.stateMap, this.districtMap, this.blockMap].forEach(map => {
      map.eachLayer(layer => {
        if (layer instanceof L.GeoJSON) map.removeLayer(layer);
      });
    });
    this.renderGeojsonLayers();
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

  private onEachState(feature: any, layer: L.Layer): void {
    layer.bindTooltip(feature.properties.state_name, { sticky: true });
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
    layer.bindTooltip(feature.properties.district, { sticky: true });
    layer.on({
      click: () => {
        this.selectedDistrict = feature;
        this.selectedBlock = null;
        this.updateMaps();
      }
    });
  }

  private onEachBlock(feature: any, layer: L.Layer): void {
    layer.bindTooltip(feature.properties.block_Name, { sticky: true });
    layer.on({
      click: () => {
        this.selectedBlock = feature.properties.block_Name;
        this.updateMaps();
      }
    });
  }

  private styleState(feature: any): any {
    const isSelected = this.selectedState && feature === this.selectedState;
    return {
      fillColor: this.alertColors[feature.properties.alert || 'NA'] || '#ccc',
      color: isSelected ? '#b91c1c' : '#333',
      weight: isSelected ? 3 : 1,
      fillOpacity: 1
    };
  }

  private styleDistrict(feature: any): any {
    const isSelected = this.selectedDistrict && feature === this.selectedDistrict;
    return {
      fillColor: this.alertColors[feature.properties.alert || 'NA'] || '#ccc',
      color: isSelected ? '#000' : '#333',
      weight: isSelected ? 3 : 1,
      fillOpacity: 1
    };
  }

  private styleBlock(feature: any): any {
    const isSelected = this.selectedBlock === feature.properties.block_Name;
    return {
      fillColor: this.alertColors[feature.properties.alert || 'NA'] || '#ccc',
      color: isSelected ? '#000' : '#888',
      weight: isSelected ? 3 : 1,
      fillOpacity: 1,
      dashArray: isSelected ? '4' : undefined
    };
  }
}



