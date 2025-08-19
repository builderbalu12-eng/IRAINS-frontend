// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-dashboard-maincontainer',
//   templateUrl: './dashboard-maincontainer.component.html',
//   styleUrls: ['./dashboard-maincontainer.component.css']
// })
// export class DashboardMaincontainerComponent {
//   selectedLayer: string = 'map'; // default layer

//   onLayerSelected(layerName: string) {
//     this.selectedLayer = layerName;
//   }
// }


// // dashboard-maincontainer.component.ts
// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-dashboard-maincontainer',
//   templateUrl: './dashboard-maincontainer.component.html',
//   styleUrls: ['./dashboard-maincontainer.component.css']
// })
// export class DashboardMaincontainerComponent {
//   selectedLayer = 'country'; // default layer

//   onLayerSelected(layerName: string) {
//     this.selectedLayer = layerName;
//   }
//   showComparison: boolean = false;

//   // onLayerSelected(layer: string) {
//   //   console.log('Selected layer:', layer);
//   //   // Handle layer selection if needed
//   // }

//   onToggleComparison() {
//     console.log('Toggling comparison, current state:', this.showComparison);
//     this.showComparison = !this.showComparison;
//     console.log('New comparison state:', this.showComparison);
//   }

//   onClosePopup() {
//     console.log('Closing comparison popup');
//     this.showComparison = false;
//   }
// }



import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard-maincontainer',
  templateUrl: './dashboard-maincontainer.component.html',
  styleUrls: ['./dashboard-maincontainer.component.css']
})
export class DashboardMaincontainerComponent {
  selectedLayer = 'country';
  showComparison = false;

  onLayerSelected(layerName: string) {
    this.selectedLayer = layerName;
    // Whenever a non-Compare layer is selected, hide Compare view
    this.showComparison = false;
  }

  onToggleComparison() {
    // Toggle Compare mode ON/OFF
    this.showComparison = !this.showComparison;
  }

  onClosePopup() {
    // Close Compare view when triggered inside compare component
    this.showComparison = false;
  }
}


// import { Component, OnInit, Input, SimpleChanges } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import * as L from 'leaflet';
// import { forkJoin } from 'rxjs';
// import { StateService } from 'src/app/services/state/state.service';
// import { Constants } from 'src/app/services/constants';

// @Component({
//   selector: 'app-comparison',
//   templateUrl: './comparison.component.html',
//   styleUrls: ['./comparison.component.css']
// })
// export class ComparisonComponent implements OnInit {
//   @Input() showComparison = false;

//   stateGeojson: any = null;
//   districtGeojson: any = null;
//   blockGeojson: any = null;

//   selectedState: any = null;
//   selectedDistrict: any = null;
//   selectedBlock: string | null = null;

//   startDate = '';
//   endDate = '';
//   maxDate = '';
//   isActual = true;

//   isGeojsonLoaded = false;

//   private stateMap!: L.Map;
//   private districtMap!: L.Map;
//   private blockMap!: L.Map;

//   // The API results for the states
//   statedatacum: any[] = [];

//   legendItems = [
//     { color: "#0096ff", text: "Large Excess <br>[60% or more]" },
//     { color: "#32c0f8", text: "Excess <br>[20 to 59]%" },
//     { color: "#00cd5b", text: "Normal <br>[-19 to 19]%" },
//     { color: "#ff2700", text: "Deficient <br>[-59 to -20]%" },
//     { color: "#ffff20", text: "Large Deficient <br>[-99 to -60]%" },
//     { color: "#ffffff", text: "No Rain <br>[-100]%" },
//     { color: "#c0c0c0", text: "No <br>Data" }
//   ];

//   constructor(
//     private http: HttpClient,
//     private stateService: StateService,
//     private constants: Constants
//   ) {}

//   ngOnInit(): void {
//     this.loadGeojsonData();
//     const todayStr = new Date().toISOString().split('T')[0];
//     this.startDate = todayStr;
//     this.endDate = todayStr;
//     this.maxDate = todayStr;
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (changes['showComparison']?.currentValue && this.isGeojsonLoaded) {
//       setTimeout(() => this.initializeMaps(), 0);
//     }
//   }

//   // Called when any date/toggle changes that require data update
//   onDateOrModeChange() {
//     this.fetchStateData();
//   }

//   private loadGeojsonData(): void {
//     forkJoin({
//       states: this.http.get('assets/geojson/INDIA_STATE.json'),
//       districts: this.http.get('assets/geojson/INDIA_DISTRICT.json'),
//       blocks: this.http.get('assets/geojson/INDIA_BLOCK.json')
//     }).subscribe({
//       next: ({ states, districts, blocks }) => {
//         this.stateGeojson = states;
//         this.districtGeojson = districts;
//         this.blockGeojson = blocks;
//         this.isGeojsonLoaded = true;
//         if (this.showComparison) setTimeout(() => this.initializeMaps(), 0);
//         this.fetchStateData();
//       },
//       error: err => console.error('Error loading GeoJSON:', err)
//     });
//   }

//   private fetchStateData() {
//     // Fetch state API data for color/tooltip info
//     const data = {
//       startDate: this.startDate,
//       endDate: this.endDate,
//       mode: this.isActual ? 'Actual' : 'Departure'
//     };
//     this.stateService.fetchData(data).subscribe((res) => {
//       this.statedatacum = res.data;
//       // Only update state layer -- other levels keep existing logic
//       if (this.stateMap) this.updateMaps();
//     });
//   }

//   private initializeMaps(): void {
//     if (this.stateMap || this.districtMap || this.blockMap) {
//       this.updateMaps();
//       return;
//     }
//     this.stateMap = this.createBaseMap('state-map');
//     this.districtMap = this.createBaseMap('district-map');
//     this.blockMap = this.createBaseMap('block-map');
//     this.renderGeojsonLayers();
//   }

//   private createBaseMap(containerId: string): L.Map {
//     const map = L.map(containerId, {
//       center: [20.5937, 78.9629],
//       zoom: 5,
//       scrollWheelZoom: false
//     });
//     L.tileLayer(
//       'https://c.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
//       { attribution: '&copy; <a href="https://carto.com/">CARTO</a>', subdomains: 'abcd', maxZoom: 19 }
//     ).addTo(map);
//     return map;
//   }

//   // ========= Core rendering logic =========

//   private renderGeojsonLayers(): void {
//     // State Map: use data-driven color/hover as per reference
//     const stateLayer = L.geoJSON(this.stateGeojson, {
//       style: feature => this.getStateStyle(feature),
//       onEachFeature: (feature, layer) => this.onEachStateDataDriven(feature, layer)
//     }).addTo(this.stateMap);
//     if (stateLayer.getBounds().isValid()) this.stateMap.fitBounds(stateLayer.getBounds(), { padding: [20, 20] });

//     // District and Block: keep old logic (color by alert etc.)
//     const filteredDistricts = this.getFilteredDistricts();
//     if (filteredDistricts?.features.length) {
//       const districtLayer = L.geoJSON(filteredDistricts, {
//         style: f => this.styleDistrict(f),
//         onEachFeature: (feature, layer) => this.onEachDistrict(feature, layer)
//       }).addTo(this.districtMap);
//       if (districtLayer.getBounds().isValid()) this.districtMap.fitBounds(districtLayer.getBounds(), { padding: [20, 20] });
//     }

//     const filteredBlocks = this.getFilteredBlocks();
//     if (filteredBlocks?.features.length) {
//       const blockLayer = L.geoJSON(filteredBlocks, {
//         style: f => this.styleBlock(f),
//         onEachFeature: (feature, layer) => this.onEachBlock(feature, layer)
//       }).addTo(this.blockMap);
//       if (blockLayer.getBounds().isValid()) this.blockMap.fitBounds(blockLayer.getBounds(), { padding: [20, 20] });
//     }

//     this.removeFocusFromLayers();
//   }

//   private updateMaps(): void {
//     [this.stateMap, this.districtMap, this.blockMap].forEach(map => {
//       map.eachLayer(layer => {
//         if (layer instanceof L.GeoJSON) map.removeLayer(layer);
//       });
//     });
//     this.renderGeojsonLayers();
//   }

//   // --- State color, popup, hover logic (data driven) ---

//   private getStateStyle(feature: any) {
//     // Get color using reference code logic (departure/actual from API)
//     const match = this.statedatacum.find(
//       d => String(d.state_code) === String(feature.properties.state_code)
//     );
//     let value = this.isActual
//       ? (match?.actual_state_rainfall ?? 'NA')
//       : (match?.departure ?? 'NA');
//     // If using constants service for color:
//     let fillColor = this.constants.getColorForRainfall(value);
//     const isSelected = this.selectedState && feature === this.selectedState;
//     return {
//       fillColor,
//       color: isSelected ? '#b91c1c' : '#333',
//       weight: isSelected ? 3 : 1,
//       fillOpacity: 1
//     };
//   }

//   private onEachStateDataDriven(feature: any, layer: L.Layer): void {
//     // Use stateData for popup content
//     const match = this.statedatacum.find(
//       d => String(d.state_code) === String(feature.properties.state_code)
//     );
//     const stateName = feature.properties.state_name;
//     const actual = match?.actual_state_rainfall != null && !isNaN(match.actual_state_rainfall)
//       ? this.constants.trimToOneDecimals(match.actual_state_rainfall)
//       : 'NA';
//     const normal = match?.rainfall_normal_value != null && !isNaN(match.rainfall_normal_value)
//       ? match.rainfall_normal_value
//       : 'NA';
//     const departure = match?.departure != null && !isNaN(match.departure)
//       ? this.constants.trimToOneDecimals(match.departure)
//       : 'NA';
//     const popupContent = `
//       <div style="background: white; padding: 5px;">
//         <div><b>STATE:</b> ${stateName}</div>
//         <div><b>DAILY RAINFALL:</b> ${actual}</div>
//         <div><b>NORMAL RAINFALL:</b> ${normal}</div>
//         <div><b>DEPARTURE:</b> ${departure} %</div>
//       </div>
//     `;

//     layer.bindTooltip(stateName, { sticky: true });
//     layer.on({
//       mouseover: function () { this.openPopup(); },
//       mouseout: function () { this.closePopup(); }
//     });
//     layer.on({
//       click: () => {
//         this.selectedState = feature;
//         this.selectedDistrict = null;
//         this.selectedBlock = null;
//         this.updateMaps();
//       }
//     });
//     layer.bindPopup(popupContent);
//   }

//   // --- The rest is unchanged (district/block) ---
//   private getFilteredDistricts(): any {
//     if (!this.selectedState || !this.districtGeojson) return this.districtGeojson;
//     const stateCode = String(this.selectedState.properties.state_code);
//     const firstDigit = stateCode.charAt(0);
//     const lastTwo = stateCode.slice(-2);
//     const filtered = this.districtGeojson.features.filter((f: any) => {
//       const distStateCode = String(f.properties.state_code);
//       return distStateCode.charAt(0) === firstDigit && distStateCode.slice(-2) === lastTwo;
//     });
//     return { ...this.districtGeojson, features: filtered };
//   }

//   private getFilteredBlocks(): any {
//     if (!this.blockGeojson) return this.blockGeojson;
//     let filtered: any[] = [];
//     if (this.selectedDistrict) {
//       const districtCode = String(this.selectedDistrict.properties.district_c || '').trim();
//       filtered = this.blockGeojson.features.filter((f: any) =>
//         String(f.properties.district_c || '').trim() === districtCode
//       );
//     } else if (this.selectedState) {
//       const stateCode = String(this.selectedState.properties.state_code);
//       const firstDigit = stateCode.charAt(0);
//       const lastTwo = stateCode.slice(-2);
//       filtered = this.blockGeojson.features.filter((f: any) => {
//         const blockStateCode = String(f.properties.state_code);
//         return blockStateCode.charAt(0) === firstDigit && blockStateCode.slice(-2) === lastTwo;
//       });
//     } else {
//       return this.blockGeojson;
//     }
//     return { ...this.blockGeojson, features: filtered };
//   }

//   private styleDistrict(feature: any): any {
//     const isSelected = this.selectedDistrict && feature === this.selectedDistrict;
//     return {
//       fillColor: this.alertColors[feature.properties.alert || 'NA'] || '#ccc',
//       color: isSelected ? '#000' : '#333',
//       weight: isSelected ? 3 : 1,
//       fillOpacity: 1
//     };
//   }

//   private styleBlock(feature: any): any {
//     const isSelected = this.selectedBlock === feature.properties.block_Name;
//     return {
//       fillColor: this.alertColors[feature.properties.alert || 'NA'] || '#ccc',
//       color: isSelected ? '#000' : '#888',
//       weight: isSelected ? 3 : 1,
//       fillOpacity: 1,
//       dashArray: isSelected ? '4' : undefined
//     };
//   }

//   // Remove tab-focus for all layers after update
//   private removeFocusFromLayers(): void {
//     [this.stateMap, this.districtMap, this.blockMap].forEach(map => {
//       map.eachLayer(layer => {
//         if ((layer as any)._path) {
//           const elem = (layer as any)._path as SVGElement;
//           elem.removeAttribute('tabindex');
//           elem.style.outline = 'none';
//         }
//       });
//     });
//   }

//   alertColors: { [key: string]: string } = {
//     NA: '#9df00fff',
//     moderate: '#EEDB00',
//     heavy: '#FFA500',
//     extreme: '#B22222'
//   };
// }
