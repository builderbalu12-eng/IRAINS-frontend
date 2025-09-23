
// import { Component, AfterViewInit } from '@angular/core';
// import * as L from 'leaflet';


// @Component({
//   selector: 'app-map-dashboardcontainer',
//   templateUrl: './map-dashboardcontainer.component.html',
//   styleUrls: ['./map-dashboardcontainer.component.css']
// })
// export class MapDashboardcontainerComponent implements AfterViewInit {
//   ngAfterViewInit(): void {
//     const map = L.map('map').setView([20.5937, 78.9629], 5); // Centered on India
//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//       attribution: '© OpenStreetMap'
//     }).addTo(map);
//   }
// }



// // map-dashboardcontainer.component.ts
// import { Component, AfterViewInit, OnChanges, SimpleChanges, Input } from '@angular/core';
// import * as L from 'leaflet';
// import { HttpClient } from '@angular/common/http';
// import { GeoJSON } from 'geojson';

// @Component({
//   selector: 'app-map-dashboardcontainer',
//   templateUrl: './map-dashboardcontainer.component.html',
//   styleUrls: ['./map-dashboardcontainer.component.css']
// })
// export class MapDashboardcontainerComponent implements AfterViewInit, OnChanges {
//   private map: L.Map | undefined;
//   private geoJsonLayer: L.GeoJSON | undefined;

//   @Input() selectedLayer: string | undefined;

//   private geoJsonFiles: { [key: string]: string } = {
//     country: 'assets/geojson/INDIA_COUNTRY.json',
//     region: 'assets/geojson/INDIA_REGIONS.json',
//     subdivision: 'assets/geojson/INDIA_SUB_DIVISION.json',
//     state: 'assets/geojson/INDIA_STATE.json',
//     district: 'assets/geojson/INDIA_DISTRICT.json',
//     block: 'assets/geojson/INDIA_BLOCK.json',
//   };

//   constructor(private http: HttpClient) {}

//   ngAfterViewInit(): void {
//     this.map = L.map('map').setView([20.5937, 78.9629], 5);
//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//       attribution: '© OpenStreetMap'
//     }).addTo(this.map);
//   }

//   ngOnChanges(changes: SimpleChanges) {
//     if ('selectedLayer' in changes && this.selectedLayer && this.map) {
//       this.loadGeoJson(this.selectedLayer);
//     }
//   }

//   private loadGeoJson(layerName: string) {
//     if (this.geoJsonLayer) {
//       this.geoJsonLayer.remove();
//     }

//     const geoJsonPath = this.geoJsonFiles[layerName.toLowerCase()];
//     if (!geoJsonPath) {
//       console.warn(`No GeoJSON file configured for layer: ${layerName}`);
//       return;
//     }

//     this.http.get<GeoJSON | GeoJSON[]>(geoJsonPath).subscribe({
//       next: (geojsonData) => {
//         this.geoJsonLayer = L.geoJSON(geojsonData as any).addTo(this.map!);
//         this.map!.fitBounds(this.geoJsonLayer.getBounds());
//       },
//       error: err => {
//         console.error(`Error loading GeoJSON file for layer ${layerName}:`, err);
//       }
//     });
//   }
// }





// import { Component, AfterViewInit, OnChanges, SimpleChanges, Input, ElementRef, ViewChild } from '@angular/core';
// import * as L from 'leaflet';
// import { HttpClient } from '@angular/common/http';
// import { GeoJSON } from 'geojson';

// @Component({
//   selector: 'app-map-dashboardcontainer',
//   templateUrl: './map-dashboardcontainer.component.html',
//   styleUrls: ['./map-dashboardcontainer.component.css']
// })
// export class MapDashboardcontainerComponent implements AfterViewInit, OnChanges {
//   @Input() selectedLayer: string | undefined;

//   map: L.Map | undefined;
//   geoJsonLayer: L.GeoJSON | undefined;

//   // Filter panel expanded/collapsed
//   isFilterOpen = false;
//   startDate = '';
//   endDate = '';
//   maxDate = '';
//   isActual = true;

//   private geoJsonFiles: { [key: string]: string } = {
//     country: 'assets/geojson/INDIA_COUNTRY.json',
//     region: 'assets/geojson/INDIA_REGIONS.json',
//     subdivision: 'assets/geojson/INDIA_SUB_DIVISION.json',
//     state: 'assets/geojson/INDIA_STATE.json',
//     district: 'assets/geojson/INDIA_DISTRICT.json',
//     block: 'assets/geojson/INDIA_BLOCK.json',
//   };

//   constructor(private http: HttpClient) {
//     const today = new Date().toISOString().split('T')[0];
//     this.startDate = today;
//     this.endDate = today;
//     this.maxDate = today;
//   }

//   ngAfterViewInit(): void {
//     this.map = L.map('map').setView([20.5937, 78.9629], 7);
//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//       attribution: '© OpenStreetMap'
//     }).addTo(this.map);
//     if (this.selectedLayer) this.loadGeoJson(this.selectedLayer);
//   }

//   ngOnChanges(changes: SimpleChanges) {
//     if ('selectedLayer' in changes && this.selectedLayer && this.map) {
//       this.loadGeoJson(this.selectedLayer);
//     }
//   }

//   private loadGeoJson(layerName: string) {
//     if (this.geoJsonLayer) this.geoJsonLayer.remove();
//     const geoJsonPath = this.geoJsonFiles[layerName.toLowerCase()];
//     if (!geoJsonPath) {
//       console.warn(`No GeoJSON file configured for layer: ${layerName}`);
//       return;
//     }
//     this.http.get<GeoJSON | GeoJSON[]>(geoJsonPath).subscribe({
//       next: (geojsonData) => {
//         this.geoJsonLayer = L.geoJSON(geojsonData as any).addTo(this.map!);
//         this.map!.fitBounds(this.geoJsonLayer.getBounds());
//       },
//       error: err => {
//         console.error(`Error loading GeoJSON file for layer ${layerName}:`, err);
//       }
//     });
//   }

//   applyFilter() {
//     // Hook for map filtering logic
//     console.log('Filter:', { startDate: this.startDate, endDate: this.endDate, mode: this.isActual ? 'Actual' : 'Departure' });
//   }

//   // Filter overlay toggles
//   openFilter() { this.isFilterOpen = true; }
//   closeFilter() { this.isFilterOpen = false; }
// }


// import { Component, AfterViewInit, OnChanges, SimpleChanges, Input, ElementRef, ViewChild } from '@angular/core';
// import * as L from 'leaflet';
// import { HttpClient } from '@angular/common/http';
// import { GeoJSON } from 'geojson';


// @Component({
//   selector: 'app-map-dashboardcontainer',
//   templateUrl: './map-dashboardcontainer.component.html',
//   styleUrls: ['./map-dashboardcontainer.component.css']
// })
// export class MapDashboardcontainerComponent implements AfterViewInit, OnChanges {
//   @Input() selectedLayer: string | undefined;


//   map: L.Map | undefined;
//   geoJsonLayer: L.GeoJSON | undefined;


//   // Filter panel expanded/collapsed
//   isFilterOpen = false;
//   startDate = '';
//   endDate = '';
//   maxDate = '';
//   isActual = true;


//   private geoJsonFiles: { [key: string]: string } = {
//     country: 'assets/geojson/INDIA_COUNTRY.json',
//     region: 'assets/geojson/INDIA_REGIONS.json',
//     subdivision: 'assets/geojson/INDIA_SUB_DIVISION.json',
//     state: 'assets/geojson/INDIA_STATE.json',
//     district: 'assets/geojson/INDIA_DISTRICT.json',
//     block: 'assets/geojson/INDIA_BLOCK.json',
//   };


//   constructor(private http: HttpClient) {
//     const today = new Date().toISOString().split('T')[0];
//     this.startDate = today;
//     this.endDate = today;
//     this.maxDate = today;
//   }


//   ngAfterViewInit(): void {
//     this.map = L.map('map').setView([20.5937, 78.9629], 9);
//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//       attribution: '© OpenStreetMap'
//     }).addTo(this.map);
//     if (this.selectedLayer) this.loadGeoJson(this.selectedLayer);
//   }


//   ngOnChanges(changes: SimpleChanges) {
//     if ('selectedLayer' in changes && this.selectedLayer && this.map) {
//       this.loadGeoJson(this.selectedLayer);
//     }
//   }


//   private loadGeoJson(layerName: string) {
//     if (this.geoJsonLayer) this.geoJsonLayer.remove();
//     const geoJsonPath = this.geoJsonFiles[layerName.toLowerCase()];
//     if (!geoJsonPath) {
//       console.warn(`No GeoJSON file configured for layer: ${layerName}`);
//       return;
//     }
//     this.http.get<GeoJSON | GeoJSON[]>(geoJsonPath).subscribe({
//       next: (geojsonData) => {
//         this.geoJsonLayer = L.geoJSON(geojsonData as any).addTo(this.map!);
//         this.map!.fitBounds(this.geoJsonLayer.getBounds());
//       },
//       error: err => {
//         console.error(`Error loading GeoJSON file for layer ${layerName}:`, err);
//       }
//     });
//   }


//   applyFilter() {
//     // Hook for map filtering logic
//     console.log('Filter:', { startDate: this.startDate, endDate: this.endDate, mode: this.isActual ? 'Actual' : 'Departure' });
//   }


//   // Filter overlay toggles
//   openFilter() { this.isFilterOpen = true; }
//   closeFilter() { this.isFilterOpen = false; }
// }


// import { Component, OnInit, OnChanges, SimpleChanges, AfterViewInit, Renderer2, Input, ViewChild, ElementRef } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import * as L from 'leaflet';
// import { StateService } from 'src/app/services/state/state.service';
// import { DistrictService } from 'src/app/services/district/district.service';
// import { BlockService } from 'src/app/services/block/BlockService.service';
// import { RegionService } from 'src/app/services/region/region.service';
// import { SubdivisionService } from 'src/app/services/subDivision/subDivision.service';
// import { CountryService } from 'src/app/services/country/country.service';
// import { Constants } from 'src/app/services/constants';
// import { forkJoin } from 'rxjs';

// @Component({
//   selector: 'app-map-dashboardcontainer',
//   templateUrl: './map-dashboardcontainer.component.html',
//   styleUrls: ['./map-dashboardcontainer.component.css']
// })
// export class MapDashboardcontainerComponent implements OnInit, OnChanges, AfterViewInit {
//   @Input() selectedLayer: string = 'country';
//   @Input() startDate: string = '';
//   @Input() endDate: string = '';
//   @Input() isActual: boolean = false;
//   @Input() maxDate: string = '';

//   @ViewChild('map') mapElement!: ElementRef;

//   stateGeojson: any = null;
//   regionGeojson: any = null;
//   subdivisionGeojson: any = null;
//   districtGeojson: any = null;
//   blockGeojson: any = null;
//   countryGeojson: any = null;
//   stateData: any[] = [];
//   regionData: any[] = [];
//   subdivisionData: any[] = [];
//   districtData: any[] = [];
//   blockData: any[] = [];
//   countryData: any[] = [];
//   isGeojsonLoaded = false;
//   isBuffering: boolean = false;
//   isFilterOpen = false;

//   private map!: L.Map;

//   actualLegendItems = [
//     { color: "#abf200", text: `Very Light Rainfall`, fontSize: "9.3px" },
//     { color: "#03ff00", text: "Light Rainfall", fontSize: "9.3px" },
//     { color: "#03ffff", text: "Moderate Rainfall", fontSize: "9.3px" },
//     { color: "#ffff00", text: "Heavy Rainfall", fontSize: "9.3px" },
//     { color: "#ff8c00", text: "Very Heavy Rainfall", fontSize: "9.3px" },
//     { color: "#ff0000", text: "Extremely Heavy Rainfall", fontSize: "9.3px" },
//     { color: "#c0c0c0", text: "No Data", fontSize: "9.3px" },
//   ];

//   departureLegendItems = [
//     { color: "#0096ff", text: `Large Excess <br>[60% or more]`, fontSize: "9.3px" },
//     { color: "#32c0f8", text: "Excess <br>[20 to 59]%", fontSize: "9.3px" },
//     { color: "#00cd5b", text: "Normal <br>[-19 to 19]%", fontSize: "9.3px" },
//     { color: "#ff2700", text: "Deficient <br>[-59 to -20]%", fontSize: "9.3px" },
//     { color: "#ffff20", text: "Large Deficient <br>[-99 to -60]%", fontSize: "9.3px" },
//     { color: "#ffffff", text: "No Rain <br>[-100]%", fontSize: "9.3px" },
//     { color: "#c0c0c0", text: "No Data", fontSize: "9.3px" },
//   ];

//   get currentLegendItems() {
//     return this.isActual ? this.actualLegendItems : this.departureLegendItems;
//   }

//   constructor(
//     private http: HttpClient,
//     private stateService: StateService,
//     private districtService: DistrictService,
//     private blockService: BlockService,
//     private regionService: RegionService,
//     private subdivisionService: SubdivisionService,
//     private countryService: CountryService,
//     private constants: Constants,
//     private renderer: Renderer2
//   ) {
//     const today = new Date().toISOString().split('T')[0];
//     this.startDate = today;
//     this.endDate = today;
//     this.maxDate = today;
//   }

//   ngOnInit(): void {
//     this.loadGeojsonData();
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (this.isGeojsonLoaded) {
//       if (
//         (changes['startDate'] && !changes['startDate'].firstChange) ||
//         (changes['endDate'] && !changes['endDate'].firstChange) ||
//         (changes['isActual'] && !changes['isActual'].firstChange) ||
//         (changes['selectedLayer'] && !changes['selectedLayer'].firstChange)
//       ) {
//         this.fetchAllData();
//       }
//     }
//   }

//   ngAfterViewInit(): void {
//     this.initializeMap();
//   }

//   private loadGeojsonData(): void {
//     forkJoin({
//       states: this.http.get('assets/geojson/INDIA_STATE.json'),
//       districts: this.http.get('assets/geojson/INDIA_DISTRICT.json'),
//       blocks: this.http.get('assets/geojson/INDIA_BLOCK.json'),
//       regions: this.http.get('assets/geojson/INDIA_REGIONS.json'),
//       subdivisions: this.http.get('assets/geojson/INDIA_SUB_DIVISION.json'),
//       country: this.http.get('assets/geojson/INDIA_COUNTRY.json')
//     }).subscribe({
//       next: ({ states, districts, blocks, regions, subdivisions, country }) => {
//         this.stateGeojson = states;
//         this.districtGeojson = districts;
//         this.blockGeojson = blocks;
//         this.regionGeojson = regions;
//         this.subdivisionGeojson = subdivisions;
//         this.countryGeojson = country;
//         this.isGeojsonLoaded = true;
//         this.fetchAllData();
//       },
//       error: err => console.error('Error loading GeoJSON:', err)
//     });
//   }

//   private fetchAllData() {
//     const params = {
//       startDate: this.startDate || this.getDefaultDate(),
//       endDate: this.endDate || this.getDefaultDate(),
//       mode: this.isActual ? 'Actual' : 'Departure'
//     };
//     this.isBuffering = true;
//     forkJoin({
//       stateRes: this.stateService.fetchData(params),
//       regionRes: this.regionService.fetchData(params),
//       subdivisionRes: this.subdivisionService.fetchData(params),
//       districtRes: this.districtService.fetchData(params),
//       blockRes: this.blockService.fetchData(params),
//       countryRes: this.countryService.fetchData(params)
//     }).subscribe({
//       next: ({ stateRes, regionRes, subdivisionRes, districtRes, blockRes, countryRes }) => {
//         this.stateData = stateRes.data || [];
//         this.regionData = regionRes.data || [];
//         this.subdivisionData = subdivisionRes.data || [];
//         this.districtData = districtRes.data || [];
//         this.blockData = blockRes.data || [];
//         this.countryData = countryRes.data || [];
//         this.updateMap();
//         this.isBuffering = false;
//       },
//       error: (err) => {
//         console.error('Data fetch failed', err);
//         this.isBuffering = false;
//       }
//     });
//   }

//   private getDefaultDate(): string {
//     const currentDate = new Date();
//     const dd = String(currentDate.getDate()).padStart(2, '0');
//     const mon = String(currentDate.getMonth() + 1).padStart(2, '0');
//     const year = String(currentDate.getFullYear());
//     return `${year}-${mon}-${dd}`;
//   }

//   private initializeMap() {
//     if (!this.map) {
//       this.map = this.createBaseMap('map');
//       this.map.invalidateSize(); // Ensure Leaflet respects the container size
//     }
//   }

//   private createBaseMap(containerId: string): L.Map {
//     const map = L.map(containerId, {
//       center: [20.5937, 78.9629],
//       zoom: 6,
//       scrollWheelZoom: true,
//       zoomDelta: 0.25,
//       zoomSnap: 0,
//       wheelPxPerZoomLevel: 120
//     });
//     L.tileLayer(
//       'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
//       { attribution: '&copy; <a href="https://carto.com/">CARTO</a>', subdomains: 'abcd', maxZoom: 19 }
//     ).addTo(map);
//     return map;
//   }

//   private updateMap(): void {
//     this.map.eachLayer(layer => {
//       if (layer instanceof L.GeoJSON) this.map.removeLayer(layer);
//     });
//     this.renderGeojsonLayer();
//   }

//   private renderGeojsonLayer(): void {
//     const geojson = this.getGeojsonForLevel(this.selectedLayer);
//     if (geojson) {
//       const layer = L.geoJSON(geojson, {
//         style: (f: any) => this.styleFeature(f, this.selectedLayer),
//         onEachFeature: (f: any, l: L.Layer) => this.onEachFeature(f, l, this.selectedLayer)
//       }).addTo(this.map);
//       if (layer.getBounds().isValid()) {
//         this.map.fitBounds(layer.getBounds(), { padding: [20, 20] });
//       }
//     }
//     this.removeFocusFromLayers();
//   }

//   private getGeojsonForLevel(level: string): any {
//     if (level === 'country') return this.countryGeojson;
//     if (level === 'region') return this.regionGeojson;
//     if (level === 'state') return this.stateGeojson;
//     if (level === 'subdivision') return this.subdivisionGeojson;
//     if (level === 'district') return this.districtGeojson;
//     if (level === 'block') return this.blockGeojson;
//     return null;
//   }

//   private removeFocusFromLayers(): void {
//     this.map.eachLayer(layer => {
//       if ((layer as any)._path) {
//         const elem = (layer as any)._path as SVGElement;
//         elem.removeAttribute('tabindex');
//         elem.style.outline = 'none';
//       }
//     });
//   }

//   private styleFeature(feature: any, level: string): any {
//     const codeProp = this.getCodeProp(level);
//     const code = feature.properties[codeProp];
//     const dataCodeKey = this.getDataCodeKey(level);
//     const data = this.getDataForLevel(level)?.find((d: any) => String(d[dataCodeKey]).trim() === String(code).trim());
//     const dailyKey = this.getDailyKey(level);
//     const value = this.isActual ? (data?.[dailyKey] ?? 'NA') : (data?.departure ?? 'NA');
//     const fillColor = this.isActual
//       ? this.constants.getActualColorForRainfall(String(value))
//       : this.constants.getColorForRainfall(String(value));
//     return {
//       fillColor,
//       color: '#333',
//       weight: 1,
//       fillOpacity: level === 'region' || level === 'country' ? 1 : level === 'subdivision' ? 0.85 : 1,
//       dashArray: undefined
//     };
//   }

//   get summaryLabel(): string {
//     return this.startDate === this.endDate ? 'Daily' : 'Cumulative';
//   }

//   private onEachFeature(feature: any, layer: L.Layer, level: string): void {
//     const codeProp = this.getCodeProp(level);
//     const code = feature.properties[codeProp];
//     const dataCodeKey = this.getDataCodeKey(level);
//     const data = this.getDataForLevel(level)?.find((d: any) => String(d[dataCodeKey]).trim() === String(code).trim());
//     const nameProp = this.getNameProp(level);
//     const name = this.toCamelCase(feature.properties[nameProp]);
//     const dailyKey = this.getDailyKey(level);
//     const normalKey = this.getNormalKey(level);
//     const daily = data?.[dailyKey] != null && !isNaN(data?.[dailyKey])
//       ? this.constants.trimToOneDecimals(data?.[dailyKey]) : 'NA';
//     const normal = data?.[normalKey] != null && !isNaN(data?.[normalKey])
//       ? this.constants.trimToOneDecimals(data?.[normalKey]) : 'NA';
//     const departure = data?.departure != null && !isNaN(data.departure)
//       ? this.constants.trimToOneDecimals(data?.departure) : 'NA';

//     let tooltipContent = `
//       <div class="tooltip-content">
//         <div class="tooltip-title"><b>${name}</b></div>
//         <div class="tooltip-row">${this.summaryLabel}: <b>${daily}</b> mm</div>
//     `;
//     if (!this.isActual) {
//       tooltipContent += `
//         <div class="tooltip-row">Normal: <b>${normal}</b> mm</div>
//         <div class="tooltip-row">Departure: <b>${departure}</b>%</div>
//       `;
//     }
//     tooltipContent += `</div>`;
//     layer.bindTooltip(tooltipContent, { sticky: true, direction: 'top', offset: [0, -10], className: 'custom-tooltip' });

//     // Type guard to ensure layer is a Path (e.g., Polygon) before calling setStyle
//     if (layer instanceof L.Path) {
//       layer.on('mouseover', () => {
//         layer.setStyle({ weight: 2, fillOpacity: 0.7 });
//       });
//       layer.on('mouseout', () => {
//         layer.setStyle({ weight: 1, fillOpacity: level === 'region' || level === 'country' ? 1 : level === 'subdivision' ? 0.85 : 1 });
//       });
//     }
//   }

//   toCamelCase(name: string | null): string {
//     if (!name) return '';
//     return name
//       .split(' ')
//       .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
//       .join(' ');
//   }

//   getDataForLevel(level: string): any[] {
//     if (level === 'country') return this.countryData;
//     if (level === 'region') return this.regionData;
//     if (level === 'state') return this.stateData;
//     if (level === 'subdivision') return this.subdivisionData;
//     if (level === 'district') return this.districtData;
//     if (level === 'block') return this.blockData;
//     return [];
//   }

//   getCodeProp(level: string): string {
//     if (level === 'country') return 'name';
//     if (level === 'region') return 'region_cod';
//     if (level === 'state') return 'state_code';
//     if (level === 'subdivision') return 'SubDiv_Cod';
//     if (level === 'district') return 'district_c';
//     if (level === 'block') return 'block_code' || 'block_c';
//     return '';
//   }

//   getNameProp(level: string): string {
//     if (level === 'country') return 'name';
//     if (level === 'region') return 'region_nam';
//     if (level === 'state') return 'state_name';
//     if (level === 'subdivision') return 'subdivisio';
//     if (level === 'district') return 'district';
//     if (level === 'block') return 'block_Name';
//     return '';
//   }

//   getDataCodeKey(level: string): string {
//     if (level === 'country') return 'name';
//     if (level === 'region') return 'r_code';
//     if (level === 'state') return 'state_code';
//     if (level === 'subdivision') return 's_code';
//     if (level === 'district') return 'district_code';
//     if (level === 'block') return 'block_code';
//     return '';
//   }

//   getDailyKey(level: string): string {
//     if (level === 'country') return 'actual_rainfall';
//     if (level === 'region') return 'actual_rainfall';
//     if (level === 'state') return 'actual_state_rainfall';
//     if (level === 'subdivision') return 'actual_subdiv_rainfall';
//     if (level === 'district') return 'actual_rainfall';
//     if (level === 'block') return 'actual_rainfall';
//     return '';
//   }

//   getNormalKey(level: string): string {
//     if (level === 'country') return 'rainfall_normal_value';
//     if (level === 'region' || level === 'state' || level === 'subdivision') return 'rainfall_normal_value';
//     if (level === 'district' || level === 'block') return 'normal_rainfall';
//     return '';
//   }

//   openFilter() {
//     this.isFilterOpen = true;
//   }

//   closeFilter() {
//     this.isFilterOpen = false;
//   }

//   applyFilter() {
//     if (this.isActual) {
//       this.startDate = this.endDate; // Ensure startDate matches endDate for Actual mode
//     }
//     this.fetchAllData();
//     this.closeFilter();
//   }

//   onModeChange() {
//     if (this.isActual) {
//       this.startDate = this.endDate; // Sync startDate with endDate when switching to Actual mode
//     } else {
//       this.startDate = this.getDefaultDate(); // Reset startDate to default when switching to Departure mode
//     }
//     this.fetchAllData();
//   }
// }

// import { Component, OnInit, OnChanges, SimpleChanges, AfterViewInit, Renderer2, Input, Output, EventEmitter, ViewChild, ElementRef, OnDestroy } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import * as L from 'leaflet';
// import { StateService } from 'src/app/services/state/state.service';
// import { DistrictService } from 'src/app/services/district/district.service';
// import { BlockService } from 'src/app/services/block/BlockService.service';
// import { RegionService } from 'src/app/services/region/region.service';
// import { SubdivisionService } from 'src/app/services/subDivision/subDivision.service';
// import { CountryService } from 'src/app/services/country/country.service';
// import { Constants } from 'src/app/services/constants';
// import { forkJoin } from 'rxjs';

// @Component({
//   selector: 'app-map-dashboardcontainer',
//   templateUrl: './map-dashboardcontainer.component.html',
//   styleUrls: ['./map-dashboardcontainer.component.css']
// })
// export class MapDashboardcontainerComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
//   @Input() selectedLayer: string = 'country';
//   @Input() startDate: string = '';
//   @Input() endDate: string = '';
//   @Input() isActual: boolean = false;
//   @Input() maxDate: string = '';
//   @Output() layerSelected = new EventEmitter<string>();

//   @ViewChild('map') mapElement!: ElementRef;

//   private map!: L.Map;
//   stateGeojson: any = null;
//   regionGeojson: any = null;
//   subdivisionGeojson: any = null;
//   districtGeojson: any = null;
//   blockGeojson: any = null;
//   countryGeojson: any = null;
//   stateData: any[] = [];
//   regionData: any[] = [];
//   subdivisionData: any[] = [];
//   districtData: any[] = [];
//   blockData: any[] = [];
//   countryData: any[] = [];
//   isGeojsonLoaded = false;
//   isBuffering: boolean = false;
//   isFilterOpen = false;
//   private autoSelectInterval: any;
//   private lastManualSelection: number = 0;
//   private isAutoPlaying: boolean = true;

//   navItems = [
//     { id: 'country', label: 'Country', active: true },
//     { id: 'region', label: 'Region', active: false },
//     { id: 'subdivision', label: 'Sub Division', active: false },
//     { id: 'state', label: 'State', active: false },
//     { id: 'district', label: 'District', active: false },
//     { id: 'block', label: 'Block', active: false }
//   ];

//   actualLegendItems = [
//     { color: "#abf200", text: `Very Light Rainfall`, fontSize: "9.3px" },
//     { color: "#03ff00", text: "Light Rainfall", fontSize: "9.3px" },
//     { color: "#03ffff", text: "Moderate Rainfall", fontSize: "9.3px" },
//     { color: "#ffff00", text: "Heavy Rainfall", fontSize: "9.3px" },
//     { color: "#ff8c00", text: "Very Heavy Rainfall", fontSize: "9.3px" },
//     { color: "#ff0000", text: "Extremely Heavy Rainfall", fontSize: "9.3px" },
//     { color: "#c0c0c0", text: "No Data", fontSize: "9.3px" },
//   ];

//   departureLegendItems = [
//     { color: "#0096ff", text: `Large Excess <br>[60% or more]`, fontSize: "9.3px" },
//     { color: "#32c0f8", text: "Excess <br>[20 to 59]%", fontSize: "9.3px" },
//     { color: "#00cd5b", text: "Normal <br>[-19 to 19]%", fontSize: "9.3px" },
//     { color: "#ff2700", text: "Deficient <br>[-59 to -20]%", fontSize: "9.3px" },
//     { color: "#ffff20", text: "Large Deficient <br>[-99 to -60]%", fontSize: "9.3px" },
//     { color: "#ffffff", text: "No Rain <br>[-100]%", fontSize: "9.3px" },
//     { color: "#c0c0c0", text: "No Data", fontSize: "9.3px" },
//   ];

//   get currentLegendItems() {
//     return this.isActual ? this.actualLegendItems : this.departureLegendItems;
//   }

//   constructor(
//     private http: HttpClient,
//     private stateService: StateService,
//     private districtService: DistrictService,
//     private blockService: BlockService,
//     private regionService: RegionService,
//     private subdivisionService: SubdivisionService,
//     private countryService: CountryService,
//     private constants: Constants,
//     private renderer: Renderer2
//   ) {
//     const today = new Date().toISOString().split('T')[0];
//     this.startDate = today;
//     this.endDate = today;
//     this.maxDate = today;
//   }

//   ngOnInit(): void {
//     this.loadGeojsonData();
//     this.setActiveLayer(this.selectedLayer);
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (this.isGeojsonLoaded) {
//       if (
//         (changes['startDate'] && !changes['startDate'].firstChange) ||
//         (changes['endDate'] && !changes['endDate'].firstChange) ||
//         (changes['isActual'] && !changes['isActual'].firstChange) ||
//         (changes['selectedLayer'] && !changes['selectedLayer'].firstChange)
//       ) {
//         this.setActiveLayer(this.selectedLayer);
//         this.fetchAllData();
//       }
//     }
//   }

//   ngAfterViewInit(): void {
//     this.initializeMap();
//     setTimeout(() => {
//       if (this.map) {
//         this.map.invalidateSize();
//       }
//       this.startAutoSelection();
//     }, 200);
//   }

//   ngOnDestroy(): void {
//     if (this.autoSelectInterval) {
//       clearInterval(this.autoSelectInterval);
//     }
//     if (this.map) {
//       this.map.remove();
//     }
//   }

//   private loadGeojsonData(): void {
//     forkJoin({
//       states: this.http.get('assets/geojson/INDIA_STATE.json'),
//       districts: this.http.get('assets/geojson/INDIA_DISTRICT.json'),
//       blocks: this.http.get('assets/geojson/INDIA_BLOCK.json'),
//       regions: this.http.get('assets/geojson/INDIA_REGIONS.json'),
//       subdivisions: this.http.get('assets/geojson/INDIA_SUB_DIVISION.json'),
//       country: this.http.get('assets/geojson/INDIA_COUNTRY.json')
//     }).subscribe({
//       next: ({ states, districts, blocks, regions, subdivisions, country }) => {
//         this.stateGeojson = states;
//         this.districtGeojson = districts;
//         this.blockGeojson = blocks;
//         this.regionGeojson = regions;
//         this.subdivisionGeojson = subdivisions;
//         this.countryGeojson = country;
//         this.isGeojsonLoaded = true;
//         this.fetchAllData();
//       },
//       error: err => console.error('Error loading GeoJSON:', err)
//     });
//   }

//   private fetchAllData() {
//     const params = {
//       startDate: this.startDate || this.getDefaultDate(),
//       endDate: this.endDate || this.getDefaultDate(),
//       mode: this.isActual ? 'Actual' : 'Departure'
//     };
//     this.isBuffering = true;
//     forkJoin({
//       stateRes: this.stateService.fetchData(params),
//       regionRes: this.regionService.fetchData(params),
//       subdivisionRes: this.subdivisionService.fetchData(params),
//       districtRes: this.districtService.fetchData(params),
//       blockRes: this.blockService.fetchData(params),
//       countryRes: this.countryService.fetchData(params)
//     }).subscribe({
//       next: ({ stateRes, regionRes, subdivisionRes, districtRes, blockRes, countryRes }) => {
//         this.stateData = stateRes.data || [];
//         this.regionData = regionRes.data || [];
//         this.subdivisionData = subdivisionRes.data || [];
//         this.districtData = districtRes.data || [];
//         this.blockData = blockRes.data || [];
//         this.countryData = countryRes.data || [];
//         this.updateMap();
//         this.isBuffering = false;
//       },
//       error: (err) => {
//         console.error('Data fetch failed', err);
//         this.isBuffering = false;
//       }
//     });
//   }

//   private getDefaultDate(): string {
//     const currentDate = new Date();
//     const dd = String(currentDate.getDate()).padStart(2, '0');
//     const mon = String(currentDate.getMonth() + 1).padStart(2, '0');
//     const year = String(currentDate.getFullYear());
//     return `${year}-${mon}-${dd}`;
//   }

//   private initializeMap() {
//     if (!this.mapElement || this.map) return;
//     const container = this.mapElement.nativeElement;
//     if (!container) return;

//     this.map = this.createBaseMap(container);
//     this.map.invalidateSize();
//   }

//   private createBaseMap(container: HTMLElement): L.Map {
//     const map = L.map(container, {
//       center: [20.5937, 78.9629],
//       zoom: 5,
//       scrollWheelZoom: true,
//       zoomDelta: 0.25,
//       zoomSnap: 0,
//       wheelPxPerZoomLevel: 120,
//       layers: []
//     });

//     L.tileLayer(
//       'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
//       {
//         attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//       }
//     ).addTo(map);

//     return map;
//   }

//   private updateMap(): void {
//     if (!this.map) return;
//     this.map.eachLayer((layer: L.Layer) => {
//       if (layer instanceof L.GeoJSON) {
//         this.map.removeLayer(layer);
//       }
//     });
//     this.renderGeojsonLayer();
//   }

//   private renderGeojsonLayer(): void {
//     if (!this.map) return;
//     const geojson = this.getGeojsonForLevel(this.selectedLayer);
//     if (geojson && this.isGeojsonLoaded) {
//       const layer = L.geoJSON(geojson, {
//         style: (f: any) => this.styleFeature(f, this.selectedLayer),
//         onEachFeature: (f: any, l: L.Layer) => this.onEachFeature(f, l, this.selectedLayer)
//       }).addTo(this.map);
//       if (layer.getBounds().isValid()) {
//         this.map.fitBounds(layer.getBounds(), { padding: [20, 20], maxZoom: 10 });
//       }
//     }
//     this.removeFocusFromLayers();
//     this.map.invalidateSize();
//   }

//   private getGeojsonForLevel(level: string): any {
//     switch (level) {
//       case 'country': return this.countryGeojson;
//       case 'region': return this.regionGeojson;
//       case 'state': return this.stateGeojson;
//       case 'subdivision': return this.subdivisionGeojson;
//       case 'district': return this.districtGeojson;
//       case 'block': return this.blockGeojson;
//       default: return null;
//     }
//   }

//   private removeFocusFromLayers(): void {
//     if (!this.map) return;
//     this.map.eachLayer((layer: L.Layer) => {
//       if ((layer as any)._path) {
//         const elem = (layer as any)._path as SVGElement;
//         if (elem) {
//           elem.removeAttribute('tabindex');
//           elem.style.outline = 'none';
//         }
//       }
//     });
//   }

//   private styleFeature(feature: any, level: string): any {
//     const codeProp = this.getCodeProp(level);
//     const code = feature.properties[codeProp];
//     const dataCodeKey = this.getDataCodeKey(level);
//     const data = this.getDataForLevel(level)?.find((d: any) => String(d[dataCodeKey]).trim() === String(code).trim());
//     const dailyKey = this.getDailyKey(level);
//     const value = this.isActual ? (data?.[dailyKey] ?? 'NA') : (data?.departure ?? 'NA');
//     const fillColor = this.isActual
//       ? this.constants.getActualColorForRainfall(String(value))
//       : this.constants.getColorForRainfall(String(value));
//     return {
//       fillColor: fillColor || '#c0c0c0',
//       color: '#333',
//       weight: 1,
//       fillOpacity: level === 'region' || level === 'country' ? 0.8 : level === 'subdivision' ? 0.7 : 0.6,
//       dashArray: undefined
//     };
//   }

//   get summaryLabel(): string {
//     return this.startDate === this.endDate ? 'Daily' : 'Cumulative';
//   }

//   private onEachFeature(feature: any, layer: L.Layer, level: string): void {
//     const codeProp = this.getCodeProp(level);
//     const code = feature.properties[codeProp];
//     const dataCodeKey = this.getDataCodeKey(level);
//     const data = this.getDataForLevel(level)?.find((d: any) => String(d[dataCodeKey]).trim() === String(code).trim());
//     const nameProp = this.getNameProp(level);
//     const name = this.toCamelCase(feature.properties[nameProp]);
//     const dailyKey = this.getDailyKey(level);
//     const normalKey = this.getNormalKey(level);
//     const daily = data?.[dailyKey] != null && !isNaN(data?.[dailyKey])
//       ? this.constants.trimToOneDecimals(data?.[dailyKey]) : 'NA';
//     const normal = data?.[normalKey] != null && !isNaN(data?.[normalKey])
//       ? this.constants.trimToOneDecimals(data?.[normalKey]) : 'NA';
//     const departure = data?.departure != null && !isNaN(data.departure)
//       ? this.constants.trimToOneDecimals(data?.departure) : 'NA';

//     let tooltipContent = `
//       <div class="tooltip-content">
//         <div class="tooltip-title"><b>${name}</b></div>
//         <div class="tooltip-row">${this.summaryLabel}: <b>${daily}</b> mm</div>
//     `;
//     if (!this.isActual) {
//       tooltipContent += `
//         <div class="tooltip-row">Normal: <b>${normal}</b> mm</div>
//         <div class="tooltip-row">Departure: <b>${departure}</b>%</div>
//       `;
//     }
//     tooltipContent += `</div>`;
//     layer.bindTooltip(tooltipContent, { sticky: true, direction: 'top', offset: [0, -10], className: 'custom-tooltip' });

//     if (layer instanceof L.Path) {
//       layer.on('mouseover', () => {
//         layer.setStyle({ weight: 3, fillOpacity: 0.7, color: '#fff' });
//       });
//       layer.on('mouseout', () => {
//         layer.setStyle(this.styleFeature(feature, level));
//       });
//     }
//   }

//   toCamelCase(name: string | null): string {
//     if (!name) return '';
//     return name
//       .split(' ')
//       .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
//       .join(' ');
//   }

//   getDataForLevel(level: string): any[] {
//     switch (level) {
//       case 'country': return this.countryData;
//       case 'region': return this.regionData;
//       case 'state': return this.stateData;
//       case 'subdivision': return this.subdivisionData;
//       case 'district': return this.districtData;
//       case 'block': return this.blockData;
//       default: return [];
//     }
//   }

//   getCodeProp(level: string): string {
//     switch (level) {
//       case 'country': return 'name';
//       case 'region': return 'region_cod';
//       case 'state': return 'state_code';
//       case 'subdivision': return 'SubDiv_Cod';
//       case 'district': return 'district_c';
//       case 'block': return 'block_code' || 'block_c';
//       default: return '';
//     }
//   }

//   getNameProp(level: string): string {
//     switch (level) {
//       case 'country': return 'name';
//       case 'region': return 'region_nam';
//       case 'state': return 'state_name';
//       case 'subdivision': return 'subdivisio';
//       case 'district': return 'district';
//       case 'block': return 'block_Name';
//       default: return '';
//     }
//   }

//   getDataCodeKey(level: string): string {
//     switch (level) {
//       case 'country': return 'name';
//       case 'region': return 'r_code';
//       case 'state': return 'state_code';
//       case 'subdivision': return 's_code';
//       case 'district': return 'district_code';
//       case 'block': return 'block_code';
//       default: return '';
//     }
//   }

//   getDailyKey(level: string): string {
//     switch (level) {
//       case 'country': return 'actual_rainfall';
//       case 'region': return 'actual_rainfall';
//       case 'state': return 'actual_state_rainfall';
//       case 'subdivision': return 'actual_subdiv_rainfall';
//       case 'district': return 'actual_rainfall';
//       case 'block': return 'actual_rainfall';
//       default: return '';
//     }
//   }

//   getNormalKey(level: string): string {
//     switch (level) {
//       case 'country': return 'rainfall_normal_value';
//       case 'region':
//       case 'state':
//       case 'subdivision': return 'rainfall_normal_value';
//       case 'district':
//       case 'block': return 'normal_rainfall';
//       default: return '';
//     }
//   }

//   openFilter() {
//     this.isFilterOpen = true;
//   }

//   closeFilter() {
//     this.isFilterOpen = false;
//   }

//   applyFilter() {
//     if (this.isActual) {
//       this.startDate = this.endDate;
//     }
//     this.fetchAllData();
//     this.closeFilter();
//   }

//   onModeChange() {
//     if (this.isActual) {
//       this.startDate = this.endDate;
//     } else {
//       this.startDate = this.getDefaultDate();
//     }
//     this.fetchAllData();
//   }

//   onSelectLayer(layerId: string) {
//     this.navItems.forEach(item => (item.active = item.id === layerId));
//     this.selectedLayer = layerId;
//     this.lastManualSelection = Date.now();
//     this.isAutoPlaying = false;
//     if (this.autoSelectInterval) {
//       clearInterval(this.autoSelectInterval);
//     }
//     this.updateMap();
//     this.layerSelected.emit(layerId);
//     this.checkForAutoPlayRestart();
//   }

//   setActiveLayer(layerName: string) {
//     this.navItems.forEach(item => (item.active = item.id === layerName));
//     this.selectedLayer = layerName;
//   }

//   private startAutoSelection() {
//     this.isAutoPlaying = true;
//     this.setActiveLayer('country');
//     this.updateMap();
//     this.layerSelected.emit('country');

//     const autoSequence = this.navItems.map(item => item.id);
//     let sequenceIndex = 0;

//     this.autoSelectInterval = setInterval(() => {
//       if (!this.isAutoPlaying) return;

//       sequenceIndex = (sequenceIndex + 1) % autoSequence.length;
//       const currentLayer = autoSequence[sequenceIndex];
//       this.setActiveLayer(currentLayer);
//       this.selectedLayer = currentLayer;
//       this.updateMap();
//       this.layerSelected.emit(currentLayer);
//     }, 3500);
//   }

//   private checkForAutoPlayRestart() {
//     setTimeout(() => {
//       if (Date.now() - this.lastManualSelection >= 10000 && !this.isAutoPlaying) {
//         this.startAutoSelection();
//       }
//     }, 10000);
//   }
// }


// import { Component, OnInit, OnChanges, SimpleChanges, AfterViewInit, Renderer2, Input, Output, EventEmitter, ViewChild, ElementRef, OnDestroy } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import * as L from 'leaflet';
// import { StateService } from 'src/app/services/state/state.service';
// import { DistrictService } from 'src/app/services/district/district.service';
// import { BlockService } from 'src/app/services/block/BlockService.service';
// import { RegionService } from 'src/app/services/region/region.service';
// import { SubdivisionService } from 'src/app/services/subDivision/subDivision.service';
// import { CountryService } from 'src/app/services/country/country.service';
// import { Constants } from 'src/app/services/constants';
// import { forkJoin } from 'rxjs';

// @Component({
//   selector: 'app-map-dashboardcontainer',
//   templateUrl: './map-dashboardcontainer.component.html',
//   styleUrls: ['./map-dashboardcontainer.component.css']
// })
// export class MapDashboardcontainerComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
//   @Input() selectedLayer: string = 'country';
//   @Input() startDate: string = '';
//   @Input() endDate: string = '';
//   @Input() isActual: boolean = false;
//   @Input() maxDate: string = '';
//   @Output() layerSelected = new EventEmitter<string>();

//   @ViewChild('map') mapElement!: ElementRef;

//   private map!: L.Map;
//   stateGeojson: any = null;
//   regionGeojson: any = null;
//   subdivisionGeojson: any = null;
//   districtGeojson: any = null;
//   blockGeojson: any = null;
//   countryGeojson: any = null;
//   stateData: any[] = [];
//   regionData: any[] = [];
//   subdivisionData: any[] = [];
//   districtData: any[] = [];
//   blockData: any[] = [];
//   countryData: any[] = [];
//   isGeojsonLoaded = false;
//   isBuffering: boolean = false;
//   isFilterOpen = false;

//   navItems = [
//     { id: 'country', label: 'Country', active: true },
//     { id: 'region', label: 'Region', active: false },
//     { id: 'subdivision', label: 'Sub Division', active: false },
//     { id: 'state', label: 'State', active: false },
//     { id: 'district', label: 'District', active: false },
//     { id: 'block', label: 'Block', active: false }
//   ];

//   actualLegendItems = [
//     { color: "#abf200", text: `Very Light Rainfall`, fontSize: "9.3px" },
//     { color: "#03ff00", text: "Light Rainfall", fontSize: "9.3px" },
//     { color: "#03ffff", text: "Moderate Rainfall", fontSize: "9.3px" },
//     { color: "#ffff00", text: "Heavy Rainfall", fontSize: "9.3px" },
//     { color: "#ff8c00", text: "Very Heavy Rainfall", fontSize: "9.3px" },
//     { color: "#ff0000", text: "Extremely Heavy Rainfall", fontSize: "9.3px" },
//     { color: "#c0c0c0", text: "No Data", fontSize: "9.3px" },
//   ];

//   departureLegendItems = [
//     { color: "#0096ff", text: `Large Excess <br>[60% or more]`, fontSize: "9.3px" },
//     { color: "#32c0f8", text: "Excess <br>[20 to 59]%", fontSize: "9.3px" },
//     { color: "#00cd5b", text: "Normal <br>[-19 to 19]%", fontSize: "9.3px" },
//     { color: "#ff2700", text: "Deficient <br>[-59 to -20]%", fontSize: "9.3px" },
//     { color: "#ffff20", text: "Large Deficient <br>[-99 to -60]%", fontSize: "9.3px" },
//     { color: "#ffffff", text: "No Rain <br>[-100]%", fontSize: "9.3px" },
//     { color: "#c0c0c0", text: "No Data", fontSize: "9.3px" },
//   ];

//   get currentLegendItems() {
//     return this.isActual ? this.actualLegendItems : this.departureLegendItems;
//   }

//   constructor(
//     private http: HttpClient,
//     private stateService: StateService,
//     private districtService: DistrictService,
//     private blockService: BlockService,
//     private regionService: RegionService,
//     private subdivisionService: SubdivisionService,
//     private countryService: CountryService,
//     private constants: Constants,
//     private renderer: Renderer2
//   ) {
//     const today = new Date().toISOString().split('T')[0];
//     this.startDate = today;
//     this.endDate = today;
//     this.maxDate = today;
//   }

//   ngOnInit(): void {
//     this.loadGeojsonData();
//     this.setActiveLayer(this.selectedLayer);
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (this.isGeojsonLoaded) {
//       if (
//         (changes['startDate'] && !changes['startDate'].firstChange) ||
//         (changes['endDate'] && !changes['endDate'].firstChange) ||
//         (changes['isActual'] && !changes['isActual'].firstChange) ||
//         (changes['selectedLayer'] && !changes['selectedLayer'].firstChange)
//       ) {
//         this.setActiveLayer(this.selectedLayer);
//         this.fetchAllData();
//       }
//     }
//   }

//   ngAfterViewInit(): void {
//     this.initializeMap();
//     setTimeout(() => {
//       if (this.map) {
//         this.map.invalidateSize();
//       }
//     }, 200);
//   }

//   ngOnDestroy(): void {
//     if (this.map) {
//       this.map.remove();
//     }
//   }

//   private loadGeojsonData(): void {
//     forkJoin({
//       states: this.http.get('assets/geojson/INDIA_STATE.json'),
//       districts: this.http.get('assets/geojson/INDIA_DISTRICT.json'),
//       blocks: this.http.get('assets/geojson/INDIA_BLOCK.json'),
//       regions: this.http.get('assets/geojson/INDIA_REGIONS.json'),
//       subdivisions: this.http.get('assets/geojson/INDIA_SUB_DIVISION.json'),
//       country: this.http.get('assets/geojson/INDIA_COUNTRY.json')
//     }).subscribe({
//       next: ({ states, districts, blocks, regions, subdivisions, country }) => {
//         this.stateGeojson = states;
//         this.districtGeojson = districts;
//         this.blockGeojson = blocks;
//         this.regionGeojson = regions;
//         this.subdivisionGeojson = subdivisions;
//         this.countryGeojson = country;
//         this.isGeojsonLoaded = true;
//         this.fetchAllData();
//       },
//       error: err => console.error('Error loading GeoJSON:', err)
//     });
//   }

//   private fetchAllData() {
//     const params = {
//       startDate: this.startDate || this.getDefaultDate(),
//       endDate: this.endDate || this.getDefaultDate(),
//       mode: this.isActual ? 'Actual' : 'Departure'
//     };
//     this.isBuffering = true;
//     forkJoin({
//       stateRes: this.stateService.fetchData(params),
//       regionRes: this.regionService.fetchData(params),
//       subdivisionRes: this.subdivisionService.fetchData(params),
//       districtRes: this.districtService.fetchData(params),
//       blockRes: this.blockService.fetchData(params),
//       countryRes: this.countryService.fetchData(params)
//     }).subscribe({
//       next: ({ stateRes, regionRes, subdivisionRes, districtRes, blockRes, countryRes }) => {
//         this.stateData = stateRes.data || [];
//         this.regionData = regionRes.data || [];
//         this.subdivisionData = subdivisionRes.data || [];
//         this.districtData = districtRes.data || [];
//         this.blockData = blockRes.data || [];
//         this.countryData = countryRes.data || [];
//         this.updateMap();
//         this.isBuffering = false;
//       },
//       error: (err) => {
//         console.error('Data fetch failed', err);
//         this.isBuffering = false;
//       }
//     });
//   }

//   private getDefaultDate(): string {
//     const currentDate = new Date();
//     const dd = String(currentDate.getDate()).padStart(2, '0');
//     const mon = String(currentDate.getMonth() + 1).padStart(2, '0');
//     const year = String(currentDate.getFullYear());
//     return `${year}-${mon}-${dd}`;
//   }

//   private initializeMap() {
//     if (!this.mapElement || this.map) return;
//     const container = this.mapElement.nativeElement;
//     if (!container) return;

//     this.map = this.createBaseMap(container);
//     this.map.invalidateSize();
//   }

//   private createBaseMap(container: HTMLElement): L.Map {
//     const map = L.map(container, {
//       center: [20.5937, 78.9629],
//       zoom: 5,
//       scrollWheelZoom: true,
//       zoomDelta: 0.25,
//       zoomSnap: 0,
//       wheelPxPerZoomLevel: 120,
//       layers: []
//     });

//     L.tileLayer(
//       'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
//       {
//         attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//       }
//     ).addTo(map);

//     return map;
//   }

//   private updateMap(): void {
//     if (!this.map) return;
//     this.map.eachLayer((layer: L.Layer) => {
//       if (layer instanceof L.GeoJSON) {
//         this.map.removeLayer(layer);
//       }
//     });
//     this.renderGeojsonLayer();
//   }

//   private renderGeojsonLayer(): void {
//     if (!this.map) return;
//     const geojson = this.getGeojsonForLevel(this.selectedLayer);
//     if (geojson && this.isGeojsonLoaded) {
//       const layer = L.geoJSON(geojson, {
//         style: (f: any) => this.styleFeature(f, this.selectedLayer),
//         onEachFeature: (f: any, l: L.Layer) => this.onEachFeature(f, l, this.selectedLayer)
//       }).addTo(this.map);
//       if (layer.getBounds().isValid()) {
//         this.map.fitBounds(layer.getBounds(), { padding: [20, 20], maxZoom: 10 });
//       }
//     }
//     this.removeFocusFromLayers();
//     this.map.invalidateSize();
//   }

//   private getGeojsonForLevel(level: string): any {
//     switch (level) {
//       case 'country': return this.countryGeojson;
//       case 'region': return this.regionGeojson;
//       case 'state': return this.stateGeojson;
//       case 'subdivision': return this.subdivisionGeojson;
//       case 'district': return this.districtGeojson;
//       case 'block': return this.blockGeojson;
//       default: return null;
//     }
//   }

//   private removeFocusFromLayers(): void {
//     if (!this.map) return;
//     this.map.eachLayer((layer: L.Layer) => {
//       if ((layer as any)._path) {
//         const elem = (layer as any)._path as SVGElement;
//         if (elem) {
//           elem.removeAttribute('tabindex');
//           elem.style.outline = 'none';
//         }
//       }
//     });
//   }

//   private styleFeature(feature: any, level: string): any {
//     const codeProp = this.getCodeProp(level);
//     const code = feature.properties[codeProp];
//     const dataCodeKey = this.getDataCodeKey(level);
//     const data = this.getDataForLevel(level)?.find((d: any) => String(d[dataCodeKey]).trim() === String(code).trim());
//     const dailyKey = this.getDailyKey(level);
//     const value = this.isActual ? (data?.[dailyKey] ?? 'NA') : (data?.departure ?? 'NA');
//     const fillColor = this.isActual
//       ? this.constants.getActualColorForRainfall(String(value))
//       : this.constants.getColorForRainfall(String(value));
//     return {
//       fillColor: fillColor || '#c0c0c0',
//       color: '#333',
//       weight: 1,
//       fillOpacity: level === 'region' || level === 'country' ? 0.8 : level === 'subdivision' ? 0.7 : 0.6,
//       dashArray: undefined
//     };
//   }

//   get summaryLabel(): string {
//     return this.startDate === this.endDate ? 'Daily' : 'Cumulative';
//   }

//   private onEachFeature(feature: any, layer: L.Layer, level: string): void {
//     const codeProp = this.getCodeProp(level);
//     const code = feature.properties[codeProp];
//     const dataCodeKey = this.getDataCodeKey(level);
//     const data = this.getDataForLevel(level)?.find((d: any) => String(d[dataCodeKey]).trim() === String(code).trim());
//     const nameProp = this.getNameProp(level);
//     const name = this.toCamelCase(feature.properties[nameProp]);
//     const dailyKey = this.getDailyKey(level);
//     const normalKey = this.getNormalKey(level);
//     const daily = data?.[dailyKey] != null && !isNaN(data?.[dailyKey])
//       ? this.constants.trimToOneDecimals(data?.[dailyKey]) : 'NA';
//     const normal = data?.[normalKey] != null && !isNaN(data?.[normalKey])
//       ? this.constants.trimToOneDecimals(data?.[normalKey]) : 'NA';
//     const departure = data?.departure != null && !isNaN(data.departure)
//       ? this.constants.trimToOneDecimals(data?.departure) : 'NA';

//     let tooltipContent = `
//       <div class="tooltip-content">
//         <div class="tooltip-title"><b>${name}</b></div>
//         <div class="tooltip-row">${this.summaryLabel}: <b>${daily}</b> mm</div>
//     `;
//     if (!this.isActual) {
//       tooltipContent += `
//         <div class="tooltip-row">Normal: <b>${normal}</b> mm</div>
//         <div class="tooltip-row">Departure: <b>${departure}</b>%</div>
//       `;
//     }
//     tooltipContent += `</div>`;
//     layer.bindTooltip(tooltipContent, { sticky: true, direction: 'top', offset: [0, -10], className: 'custom-tooltip' });

//     if (layer instanceof L.Path) {
//       layer.on('mouseover', () => {
//         layer.setStyle({ weight: 3, fillOpacity: 0.7, color: '#fff' });
//       });
//       layer.on('mouseout', () => {
//         layer.setStyle(this.styleFeature(feature, level));
//       });
//     }
//   }

//   toCamelCase(name: string | null): string {
//     if (!name) return '';
//     return name
//       .split(' ')
//       .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
//       .join(' ');
//   }

//   getDataForLevel(level: string): any[] {
//     switch (level) {
//       case 'country': return this.countryData;
//       case 'region': return this.regionData;
//       case 'state': return this.stateData;
//       case 'subdivision': return this.subdivisionData;
//       case 'district': return this.districtData;
//       case 'block': return this.blockData;
//       default: return [];
//     }
//   }

//   getCodeProp(level: string): string {
//     switch (level) {
//       case 'country': return 'name';
//       case 'region': return 'region_cod';
//       case 'state': return 'state_code';
//       case 'subdivision': return 'SubDiv_Cod';
//       case 'district': return 'district_c';
//       case 'block': return 'block_code' || 'block_c';
//       default: return '';
//     }
//   }

//   getNameProp(level: string): string {
//     switch (level) {
//       case 'country': return 'name';
//       case 'region': return 'region_nam';
//       case 'state': return 'state_name';
//       case 'subdivision': return 'subdivisio';
//       case 'district': return 'district';
//       case 'block': return 'block_Name';
//       default: return '';
//     }
//   }

//   getDataCodeKey(level: string): string {
//     switch (level) {
//       case 'country': return 'name';
//       case 'region': return 'r_code';
//       case 'state': return 'state_code';
//       case 'subdivision': return 's_code';
//       case 'district': return 'district_code';
//       case 'block': return 'block_code';
//       default: return '';
//     }
//   }

//   getDailyKey(level: string): string {
//     switch (level) {
//       case 'country': return 'actual_rainfall';
//       case 'region': return 'actual_rainfall';
//       case 'state': return 'actual_state_rainfall';
//       case 'subdivision': return 'actual_subdiv_rainfall';
//       case 'district': return 'actual_rainfall';
//       case 'block': return 'actual_rainfall';
//       default: return '';
//     }
//   }

//   getNormalKey(level: string): string {
//     switch (level) {
//       case 'country': return 'rainfall_normal_value';
//       case 'region':
//       case 'state':
//       case 'subdivision': return 'rainfall_normal_value';
//       case 'district':
//       case 'block': return 'normal_rainfall';
//       default: return '';
//     }
//   }

//   openFilter() {
//     this.isFilterOpen = true;
//   }

//   closeFilter() {
//     this.isFilterOpen = false;
//   }

//   applyFilter() {
//     if (this.isActual) {
//       this.startDate = this.endDate;
//     }
//     this.fetchAllData();
//     this.closeFilter();
//   }

//   onModeChange() {
//     if (this.isActual) {
//       this.startDate = this.endDate;
//     } else {
//       this.startDate = this.getDefaultDate();
//     }
//     this.fetchAllData();
//   }

//   onSelectLayer(layerId: string) {
//     this.navItems.forEach(item => (item.active = item.id === layerId));
//     this.selectedLayer = layerId;
//     this.updateMap();
//     this.layerSelected.emit(layerId);
//   }

//   setActiveLayer(layerName: string) {
//     this.navItems.forEach(item => (item.active = item.id === layerName));
//     this.selectedLayer = layerName;
//   }
// }

// import { Component, OnInit, OnChanges, SimpleChanges, AfterViewInit, Renderer2, Input, Output, EventEmitter, ViewChild, ElementRef, OnDestroy } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import * as L from 'leaflet';
// import { StateService } from 'src/app/services/state/state.service';
// import { DistrictService } from 'src/app/services/district/district.service';
// import { BlockService } from 'src/app/services/block/BlockService.service';
// import { RegionService } from 'src/app/services/region/region.service';
// import { SubdivisionService } from 'src/app/services/subDivision/subDivision.service';
// import { CountryService } from 'src/app/services/country/country.service';
// import { Constants } from 'src/app/services/constants';
// import { forkJoin } from 'rxjs';

// @Component({
//   selector: 'app-map-dashboardcontainer',
//   templateUrl: './map-dashboardcontainer.component.html',
//   styleUrls: ['./map-dashboardcontainer.component.css']
// })
// export class MapDashboardcontainerComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
//   @Input() selectedLayer: string = 'country';
//   @Input() startDate: string = '';
//   @Input() endDate: string = '';
//   @Input() isActual: boolean = false;
//   @Input() maxDate: string = '';
//   @Output() layerSelected = new EventEmitter<string>();

//   @ViewChild('map') mapElement!: ElementRef;

//   private map!: L.Map;
//   stateGeojson: any = null;
//   regionGeojson: any = null;
//   subdivisionGeojson: any = null;
//   districtGeojson: any = null;
//   blockGeojson: any = null;
//   countryGeojson: any = null;
//   stateData: any[] = [];
//   regionData: any[] = [];
//   subdivisionData: any[] = [];
//   districtData: any[] = [];
//   blockData: any[] = [];
//   countryData: any[] = [];
//   isGeojsonLoaded = false;
//   isBuffering: boolean = false;

//   navItems = [
//     { id: 'country', label: 'Country', active: true },
//     { id: 'region', label: 'Region', active: false },
//     { id: 'subdivision', label: 'Sub Division', active: false },
//     { id: 'state', label: 'State', active: false },
//     { id: 'district', label: 'District', active: false },
//     { id: 'block', label: 'Block', active: false }
//   ];

//   actualLegendItems = [
//     { color: "#abf200", text: `Very Light Rainfall`, fontSize: "9.3px" },
//     { color: "#03ff00", text: "Light Rainfall", fontSize: "9.3px" },
//     { color: "#03ffff", text: "Moderate Rainfall", fontSize: "9.3px" },
//     { color: "#ffff00", text: "Heavy Rainfall", fontSize: "9.3px" },
//     { color: "#ff8c00", text: "Very Heavy Rainfall", fontSize: "9.3px" },
//     { color: "#ff0000", text: "Extremely Heavy Rainfall", fontSize: "9.3px" },
//     { color: "#c0c0c0", text: "No Data", fontSize: "9.3px" },
//   ];

//   departureLegendItems = [
//     { color: "#0096ff", text: `Large Excess <br>[60% or more]`, fontSize: "9.3px" },
//     { color: "#32c0f8", text: "Excess <br>[20 to 59]%", fontSize: "9.3px" },
//     { color: "#00cd5b", text: "Normal <br>[-19 to 19]%", fontSize: "9.3px" },
//     { color: "#ff2700", text: "Deficient <br>[-59 to -20]%", fontSize: "9.3px" },
//     { color: "#ffff20", text: "Large Deficient <br>[-99 to -60]%", fontSize: "9.3px" },
//     { color: "#ffffff", text: "No Rain <br>[-100]%", fontSize: "9.3px" },
//     { color: "#c0c0c0", text: "No Data", fontSize: "9.3px" },
//   ];

//   get currentLegendItems() {
//     return this.isActual ? this.actualLegendItems : this.departureLegendItems;
//   }

//   constructor(
//     private http: HttpClient,
//     private stateService: StateService,
//     private districtService: DistrictService,
//     private blockService: BlockService,
//     private regionService: RegionService,
//     private subdivisionService: SubdivisionService,
//     private countryService: CountryService,
//     private constants: Constants,
//     private renderer: Renderer2
//   ) {
//     const today = new Date().toISOString().split('T')[0];
//     this.startDate = today;
//     this.endDate = today;
//     this.maxDate = today;
//   }

//   ngOnInit(): void {
//     this.loadGeojsonData();
//     this.setActiveLayer(this.selectedLayer);
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (this.isGeojsonLoaded) {
//       if (
//         (changes['startDate'] && !changes['startDate'].firstChange) ||
//         (changes['endDate'] && !changes['endDate'].firstChange) ||
//         (changes['isActual'] && !changes['isActual'].firstChange) ||
//         (changes['selectedLayer'] && !changes['selectedLayer'].firstChange)
//       ) {
//         this.setActiveLayer(this.selectedLayer);
//         this.fetchAllData();
//       }
//     }
//   }

//   ngAfterViewInit(): void {
//     this.initializeMap();
//     setTimeout(() => {
//       if (this.map) {
//         this.map.invalidateSize();
//       }
//     }, 200);
//   }

//   ngOnDestroy(): void {
//     if (this.map) {
//       this.map.remove();
//     }
//   }

//   private loadGeojsonData(): void {
//     forkJoin({
//       states: this.http.get('assets/geojson/INDIA_STATE.json'),
//       districts: this.http.get('assets/geojson/INDIA_DISTRICT.json'),
//       blocks: this.http.get('assets/geojson/INDIA_BLOCK.json'),
//       regions: this.http.get('assets/geojson/INDIA_REGIONS.json'),
//       subdivisions: this.http.get('assets/geojson/INDIA_SUB_DIVISION.json'),
//       country: this.http.get('assets/geojson/INDIA_COUNTRY.json')
//     }).subscribe({
//       next: ({ states, districts, blocks, regions, subdivisions, country }) => {
//         this.stateGeojson = states;
//         this.districtGeojson = districts;
//         this.blockGeojson = blocks;
//         this.regionGeojson = regions;
//         this.subdivisionGeojson = subdivisions;
//         this.countryGeojson = country;
//         this.isGeojsonLoaded = true;
//         this.fetchAllData();
//       },
//       error: err => console.error('Error loading GeoJSON:', err)
//     });
//   }

//   private fetchAllData() {
//     const params = {
//       startDate: this.startDate || this.getDefaultDate(),
//       endDate: this.endDate || this.getDefaultDate(),
//       mode: this.isActual ? 'Actual' : 'Departure'
//     };
//     this.isBuffering = true;
//     forkJoin({
//       stateRes: this.stateService.fetchData(params),
//       regionRes: this.regionService.fetchData(params),
//       subdivisionRes: this.subdivisionService.fetchData(params),
//       districtRes: this.districtService.fetchData(params),
//       blockRes: this.blockService.fetchData(params),
//       countryRes: this.countryService.fetchData(params)
//     }).subscribe({
//       next: ({ stateRes, regionRes, subdivisionRes, districtRes, blockRes, countryRes }) => {
//         this.stateData = stateRes.data || [];
//         this.regionData = regionRes.data || [];
//         this.subdivisionData = subdivisionRes.data || [];
//         this.districtData = districtRes.data || [];
//         this.blockData = blockRes.data || [];
//         this.countryData = countryRes.data || [];
//         this.updateMap();
//         this.isBuffering = false;
//       },
//       error: (err) => {
//         console.error('Data fetch failed', err);
//         this.isBuffering = false;
//       }
//     });
//   }

//   private getDefaultDate(): string {
//     const currentDate = new Date();
//     const dd = String(currentDate.getDate()).padStart(2, '0');
//     const mon = String(currentDate.getMonth() + 1).padStart(2, '0');
//     const year = String(currentDate.getFullYear());
//     return `${year}-${mon}-${dd}`;
//   }

//   private initializeMap() {
//     if (!this.mapElement || this.map) return;
//     const container = this.mapElement.nativeElement;
//     if (!container) return;

//     this.map = this.createBaseMap(container);
//     this.map.invalidateSize();
//   }

//   private createBaseMap(container: HTMLElement): L.Map {
//     const map = L.map(container, {
//       center: [20.5937, 78.9629],
//       zoom: 5,
//       scrollWheelZoom: true,
//       zoomDelta: 0.25,
//       zoomSnap: 0,
//       wheelPxPerZoomLevel: 120,
//       layers: []
//     });

//     L.tileLayer(
//       'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
//       {
//         attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//       }
//     ).addTo(map);

//     return map;
//   }

//   private updateMap(): void {
//     if (!this.map) return;
//     this.map.eachLayer((layer: L.Layer) => {
//       if (layer instanceof L.GeoJSON) {
//         this.map.removeLayer(layer);
//       }
//     });
//     this.renderGeojsonLayer();
//   }

//   private renderGeojsonLayer(): void {
//     if (!this.map) return;
//     const geojson = this.getGeojsonForLevel(this.selectedLayer);
//     if (geojson && this.isGeojsonLoaded) {
//       const layer = L.geoJSON(geojson, {
//         style: (f: any) => this.styleFeature(f, this.selectedLayer),
//         onEachFeature: (f: any, l: L.Layer) => this.onEachFeature(f, l, this.selectedLayer)
//       }).addTo(this.map);
//       if (layer.getBounds().isValid()) {
//         this.map.fitBounds(layer.getBounds(), { padding: [20, 20], maxZoom: 10 });
//       }
//     }
//     this.removeFocusFromLayers();
//     this.map.invalidateSize();
//   }

//   private getGeojsonForLevel(level: string): any {
//     switch (level) {
//       case 'country': return this.countryGeojson;
//       case 'region': return this.regionGeojson;
//       case 'state': return this.stateGeojson;
//       case 'subdivision': return this.subdivisionGeojson;
//       case 'district': return this.districtGeojson;
//       case 'block': return this.blockGeojson;
//       default: return null;
//     }
//   }

//   private removeFocusFromLayers(): void {
//     if (!this.map) return;
//     this.map.eachLayer((layer: L.Layer) => {
//       if ((layer as any)._path) {
//         const elem = (layer as any)._path as SVGElement;
//         if (elem) {
//           elem.removeAttribute('tabindex');
//           elem.style.outline = 'none';
//         }
//       }
//     });
//   }

//   // private styleFeature(feature: any, level: string): any {
//   //   const codeProp = this.getCodeProp(level);
//   //   const code = feature.properties[codeProp];
//   //   const dataCodeKey = this.getDataCodeKey(level);
//   //   const data = this.getDataForLevel(level)?.find((d: any) => String(d[dataCodeKey]).trim() === String(code).trim());
//   //   const dailyKey = this.getDailyKey(level);
//   //   const value = this.isActual ? (data?.[dailyKey] ?? 'NA') : (data?.departure ?? 'NA');
//   //   const fillColor = this.isActual
//   //     ? this.constants.getActualColorForRainfall(String(value))
//   //     : this.constants.getColorForRainfall(String(value));
//   //   return {
//   //     fillColor: fillColor || '#c0c0c0',
//   //     color: '#333',
//   //     weight: 1,
//   //     fillOpacity: level === 'region' || level === 'country' ? 0.8 : level === 'subdivision' ? 0.7 : 0.6,
//   //     dashArray: undefined
//   //   };
//   // }
//   private styleFeature(feature: any, level: string): any {
//   const codeProp = this.getCodeProp(level);
//   const code = feature.properties[codeProp];
//   const dataCodeKey = this.getDataCodeKey(level);
//   const data = this.getDataForLevel(level)?.find((d: any) => String(d[dataCodeKey]).trim() === String(code).trim());
//   const dailyKey = this.getDailyKey(level);
//   const value = this.isActual ? (data?.[dailyKey] ?? 'NA') : (data?.departure ?? 'NA');
//   const fillColor = this.isActual
//     ? this.constants.getActualColorForRainfall(String(value))
//     : this.constants.getColorForRainfall(String(value));
//   return {
//     fillColor: fillColor || '#c0c0c0',
//     color: '#333',
//     weight: 1,
//     fillOpacity: 1, // Always no transparency
//     dashArray: undefined
//   };
// }


//   get summaryLabel(): string {
//     return this.startDate === this.endDate ? 'Daily' : 'Cumulative';
//   }

//   private onEachFeature(feature: any, layer: L.Layer, level: string): void {
//     const codeProp = this.getCodeProp(level);
//     const code = feature.properties[codeProp];
//     const dataCodeKey = this.getDataCodeKey(level);
//     const data = this.getDataForLevel(level)?.find((d: any) => String(d[dataCodeKey]).trim() === String(code).trim());
//     const nameProp = this.getNameProp(level);
//     const name = this.toCamelCase(feature.properties[nameProp]);
//     const dailyKey = this.getDailyKey(level);
//     const normalKey = this.getNormalKey(level);
//     const daily = data?.[dailyKey] != null && !isNaN(data?.[dailyKey])
//       ? this.constants.trimToOneDecimals(data?.[dailyKey]) : 'NA';
//     const normal = data?.[normalKey] != null && !isNaN(data?.[normalKey])
//       ? this.constants.trimToOneDecimals(data?.[normalKey]) : 'NA';
//     const departure = data?.departure != null && !isNaN(data.departure)
//       ? this.constants.trimToOneDecimals(data?.departure) : 'NA';

//     let tooltipContent = `
//       <div class="tooltip-content">
//         <div class="tooltip-title"><b>${name}</b></div>
//         <div class="tooltip-row">${this.summaryLabel}: <b>${daily}</b> mm</div>
//     `;
//     if (!this.isActual) {
//       tooltipContent += `
//         <div class="tooltip-row">Normal: <b>${normal}</b> mm</div>
//         <div class="tooltip-row">Departure: <b>${departure}</b>%</div>
//       `;
//     }
//     tooltipContent += `</div>`;
//     layer.bindTooltip(tooltipContent, { sticky: true, direction: 'top', offset: [0, -10], className: 'custom-tooltip' });
//   }

//   toCamelCase(name: string | null): string {
//     if (!name) return '';
//     return name
//       .split(' ')
//       .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
//       .join(' ');
//   }

//   getDataForLevel(level: string): any[] {
//     switch (level) {
//       case 'country': return this.countryData;
//       case 'region': return this.regionData;
//       case 'state': return this.stateData;
//       case 'subdivision': return this.subdivisionData;
//       case 'district': return this.districtData;
//       case 'block': return this.blockData;
//       default: return [];
//     }
//   }

//   getCodeProp(level: string): string {
//     switch (level) {
//       case 'country': return 'name';
//       case 'region': return 'region_cod';
//       case 'state': return 'state_code';
//       case 'subdivision': return 'SubDiv_Cod';
//       case 'district': return 'district_c';
//       case 'block': return 'block_code';
//       default: return '';
//     }
//   }

//   getNameProp(level: string): string {
//     switch (level) {
//       case 'country': return 'name';
//       case 'region': return 'region_nam';
//       case 'state': return 'state_name';
//       case 'subdivision': return 'subdivisio';
//       case 'district': return 'district';
//       case 'block': return 'block_Name';
//       default: return '';
//     }
//   }

//   getDataCodeKey(level: string): string {
//     switch (level) {
//       case 'country': return 'name';
//       case 'region': return 'r_code';
//       case 'state': return 'state_code';
//       case 'subdivision': return 's_code';
//       case 'district': return 'district_code';
//       case 'block': return 'block_code';
//       default: return '';
//     }
//   }

//   getDailyKey(level: string): string {
//     switch (level) {
//       case 'country': return 'actual_rainfall';
//       case 'region': return 'actual_rainfall';
//       case 'state': return 'actual_state_rainfall';
//       case 'subdivision': return 'actual_subdiv_rainfall';
//       case 'district': return 'actual_rainfall';
//       case 'block': return 'actual_rainfall';
//       default: return '';
//     }
//   }

//   getNormalKey(level: string): string {
//     switch (level) {
//       case 'country': return 'rainfall_normal_value';
//       case 'region':
//       case 'state':
//       case 'subdivision': return 'rainfall_normal_value';
//       case 'district':
//       case 'block': return 'normal_rainfall';
//       default: return '';
//     }
//   }

//   onDateChange() {
//     if (!this.isActual && this.startDate && this.endDate && new Date(this.startDate) > new Date(this.endDate)) {
//       this.startDate = this.endDate;
//     }
//     this.fetchAllData();
//   }

//   onModeChange() {
//     if (this.isActual) {
//       this.startDate = this.endDate;
//     } else {
//       if (!this.startDate || new Date(this.startDate) > new Date(this.endDate || this.getDefaultDate())) {
//         this.startDate = this.endDate || this.getDefaultDate();
//       }
//     }
//     this.fetchAllData();
//   }

//   onSelectLayer(layerId: string) {
//     this.navItems.forEach(item => (item.active = item.id === layerId));
//     this.selectedLayer = layerId;
//     this.updateMap();
//     this.layerSelected.emit(layerId);
//   }

//   setActiveLayer(layerName: string) {
//     this.navItems.forEach(item => (item.active = item.id === layerName));
//     this.selectedLayer = layerName;
//   }
// }



// import { Component, OnInit, OnChanges, SimpleChanges, AfterViewInit, Renderer2, Input, Output, EventEmitter, ViewChild, ElementRef, OnDestroy } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import * as L from 'leaflet';
// import { StateService } from 'src/app/services/state/state.service';
// import { DistrictService } from 'src/app/services/district/district.service';
// import { BlockService } from 'src/app/services/block/BlockService.service';
// import { RegionService } from 'src/app/services/region/region.service';
// import { SubdivisionService } from 'src/app/services/subDivision/subDivision.service';
// import { CountryService } from 'src/app/services/country/country.service';
// import { Constants } from 'src/app/services/constants';
// import { forkJoin } from 'rxjs';

// @Component({
//   selector: 'app-map-dashboardcontainer',
//   templateUrl: './map-dashboardcontainer.component.html',
//   styleUrls: ['./map-dashboardcontainer.component.css']
// })
// export class MapDashboardcontainerComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
//   @Input() selectedLayer: string = 'country';
//   @Input() startDate: string = '';
//   @Input() endDate: string = '';
//   @Input() isActual: boolean = false;
//   @Input() maxDate: string = '';
//   @Output() layerSelected = new EventEmitter<string>();

//   @ViewChild('map') mapElement!: ElementRef;

//   private map!: L.Map;
//   stateGeojson: any = null;
//   regionGeojson: any = null;
//   subdivisionGeojson: any = null;
//   districtGeojson: any = null;
//   blockGeojson: any = null;
//   countryGeojson: any = null;
//   stateData: any[] = [];
//   regionData: any[] = [];
//   subdivisionData: any[] = [];
//   districtData: any[] = [];
//   blockData: any[] = [];
//   countryData: any[] = [];
//   isGeojsonLoaded = false;
//   isBuffering: boolean = false;

//   navItems = [
//     { id: 'country', label: 'Country', active: true },
//     { id: 'region', label: 'Region', active: false },
//     { id: 'subdivision', label: 'Sub Division', active: false },
//     { id: 'state', label: 'State', active: false },
//     { id: 'district', label: 'District', active: false },
//     { id: 'block', label: 'Block', active: false }
//   ];

//   actualLegendItems = [
//     { color: "#abf200", text: `Very Light Rainfall`, fontSize: "9.3px" },
//     { color: "#03ff00", text: "Light Rainfall", fontSize: "9.3px" },
//     { color: "#03ffff", text: "Moderate Rainfall", fontSize: "9.3px" },
//     { color: "#ffff00", text: "Heavy Rainfall", fontSize: "9.3px" },
//     { color: "#ff8c00", text: "Very Heavy Rainfall", fontSize: "9.3px" },
//     { color: "#ff0000", text: "Extremely Heavy Rainfall", fontSize: "9.3px" },
//     { color: "#c0c0c0", text: "No Data", fontSize: "9.3px" },
//   ];

//   departureLegendItems = [
//     { color: "#0096ff", text: `Large Excess <br>[60% or more]`, fontSize: "9.3px" },
//     { color: "#32c0f8", text: "Excess <br>[20 to 59]%", fontSize: "9.3px" },
//     { color: "#00cd5b", text: "Normal <br>[-19 to 19]%", fontSize: "9.3px" },
//     { color: "#ff2700", text: "Deficient <br>[-59 to -20]%", fontSize: "9.3px" },
//     { color: "#ffff20", text: "Large Deficient <br>[-99 to -60]%", fontSize: "9.3px" },
//     { color: "#ffffff", text: "No Rain <br>[-100]%", fontSize: "9.3px" },
//     { color: "#c0c0c0", text: "No Data", fontSize: "9.3px" },
//   ];

//   get currentLegendItems() {
//     return this.isActual ? this.actualLegendItems : this.departureLegendItems;
//   }

//   constructor(
//     private http: HttpClient,
//     private stateService: StateService,
//     private districtService: DistrictService,
//     private blockService: BlockService,
//     private regionService: RegionService,
//     private subdivisionService: SubdivisionService,
//     private countryService: CountryService,
//     private constants: Constants,
//     private renderer: Renderer2
//   ) {
//     const today = new Date().toISOString().split('T')[0];
//     this.startDate = today;
//     this.endDate = today;
//     this.maxDate = today;
//   }

//   ngOnInit(): void {
//     this.loadGeojsonData();
//     this.setActiveLayer(this.selectedLayer);
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (this.isGeojsonLoaded) {
//       if (
//         (changes['startDate'] && !changes['startDate'].firstChange) ||
//         (changes['endDate'] && !changes['endDate'].firstChange) ||
//         (changes['isActual'] && !changes['isActual'].firstChange) ||
//         (changes['selectedLayer'] && !changes['selectedLayer'].firstChange)
//       ) {
//         this.setActiveLayer(this.selectedLayer);
//         this.fetchAllData();
//       }
//     }
//   }

//   ngAfterViewInit(): void {
//     this.initializeMap();
//     setTimeout(() => {
//       if (this.map) {
//         this.map.invalidateSize();
//       }
//     }, 200);
//   }

//   ngOnDestroy(): void {
//     if (this.map) {
//       this.map.remove();
//     }
//   }

//   private loadGeojsonData(): void {
//     forkJoin({
//       states: this.http.get('assets/geojson/INDIA_STATE.json'),
//       districts: this.http.get('assets/geojson/INDIA_DISTRICT.json'),
//       blocks: this.http.get('assets/geojson/INDIA_BLOCK.json'),
//       regions: this.http.get('assets/geojson/INDIA_REGIONS.json'),
//       subdivisions: this.http.get('assets/geojson/INDIA_SUB_DIVISION.json'),
//       country: this.http.get('assets/geojson/INDIA_COUNTRY.json')
//     }).subscribe({
//       next: ({ states, districts, blocks, regions, subdivisions, country }) => {
//         this.stateGeojson = states;
//         this.districtGeojson = districts;
//         this.blockGeojson = blocks;
//         this.regionGeojson = regions;
//         this.subdivisionGeojson = subdivisions;
//         this.countryGeojson = country;
//         this.isGeojsonLoaded = true;
//         this.fetchAllData();
//       },
//       error: err => console.error('Error loading GeoJSON:', err)
//     });
//   }

//   private fetchAllData() {
//     const params = {
//       startDate: this.startDate || this.getDefaultDate(),
//       endDate: this.endDate || this.getDefaultDate(),
//       mode: this.isActual ? 'Actual' : 'Departure'
//     };
//     this.isBuffering = true;
//     forkJoin({
//       stateRes: this.stateService.fetchData(params),
//       regionRes: this.regionService.fetchData(params),
//       subdivisionRes: this.subdivisionService.fetchData(params),
//       districtRes: this.districtService.fetchData(params),
//       blockRes: this.blockService.fetchData(params),
//       countryRes: this.countryService.fetchData(params)
//     }).subscribe({
//       next: ({ stateRes, regionRes, subdivisionRes, districtRes, blockRes, countryRes }) => {
//         this.stateData = stateRes.data || [];
//         this.regionData = regionRes.data || [];
//         this.subdivisionData = subdivisionRes.data || [];
//         this.districtData = districtRes.data || [];
//         this.blockData = blockRes.data || [];
//         this.countryData = countryRes.data || [];
//         this.updateMap();
//         this.isBuffering = false;
//       },
//       error: (err) => {
//         console.error('Data fetch failed', err);
//         this.isBuffering = false;
//       }
//     });
//   }

//   private getDefaultDate(): string {
//     const currentDate = new Date();
//     const dd = String(currentDate.getDate()).padStart(2, '0');
//     const mon = String(currentDate.getMonth() + 1).padStart(2, '0');
//     const year = String(currentDate.getFullYear());
//     return `${year}-${mon}-${dd}`;
//   }

//   private initializeMap() {
//     if (!this.mapElement || this.map) return;
//     const container = this.mapElement.nativeElement;
//     if (!container) return;

//     this.map = this.createBaseMap(container);
//     this.map.invalidateSize();
//   }

//   private createBaseMap(container: HTMLElement): L.Map {
//     const map = L.map(container, {
//       center: [20.5937, 78.9629],
//       zoom: 5,
//       scrollWheelZoom: true,
//       zoomDelta: 0.25,
//       zoomSnap: 0,
//       wheelPxPerZoomLevel: 120,
//       layers: []
//     });

//     L.tileLayer(
//       'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
//       {
//         attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//       }
//     ).addTo(map);

//     return map;
//   }

//   private updateMap(): void {
//     if (!this.map) return;
//     this.map.eachLayer((layer: L.Layer) => {
//       if (layer instanceof L.GeoJSON) {
//         this.map.removeLayer(layer);
//       }
//     });
//     this.renderGeojsonLayer();
//   }

//   private renderGeojsonLayer(): void {
//     if (!this.map) return;
//     const geojson = this.getGeojsonForLevel(this.selectedLayer);
//     if (geojson && this.isGeojsonLoaded) {
//       const layer = L.geoJSON(geojson, {
//         style: (f: any) => this.styleFeature(f, this.selectedLayer),
//         onEachFeature: (f: any, l: L.Layer) => this.onEachFeature(f, l, this.selectedLayer)
//       }).addTo(this.map);
//       if (layer.getBounds().isValid()) {
//         this.map.fitBounds(layer.getBounds(), { padding: [20, 20], maxZoom: 10 });
//       }
//     }
//     this.removeFocusFromLayers();
//     this.map.invalidateSize();
//   }

//   private getGeojsonForLevel(level: string): any {
//     switch (level) {
//       case 'country': return this.countryGeojson;
//       case 'region': return this.regionGeojson;
//       case 'state': return this.stateGeojson;
//       case 'subdivision': return this.subdivisionGeojson;
//       case 'district': return this.districtGeojson;
//       case 'block': return this.blockGeojson;
//       default: return null;
//     }
//   }

//   private removeFocusFromLayers(): void {
//     if (!this.map) return;
//     this.map.eachLayer((layer: L.Layer) => {
//       if ((layer as any)._path) {
//         const elem = (layer as any)._path as SVGElement;
//         if (elem) {
//           elem.removeAttribute('tabindex');
//           elem.style.outline = 'none';
//         }
//       }
//     });
//   }

//   private styleFeature(feature: any, level: string): any {
//     const codeProp = this.getCodeProp(level);
//     const code = feature.properties[codeProp];
//     const dataCodeKey = this.getDataCodeKey(level);
//     const data = this.getDataForLevel(level)?.find((d: any) => String(d[dataCodeKey]).trim() === String(code).trim());
//     const dailyKey = this.getDailyKey(level);
//     const value = this.isActual ? (data?.[dailyKey] ?? 'NA') : (data?.departure ?? 'NA');
//     const fillColor = this.isActual
//       ? this.constants.getActualColorForRainfall(String(value))
//       : this.constants.getColorForRainfall(String(value));
//     return {
//       fillColor: fillColor || '#c0c0c0',
//       color: '#333',
//       weight: 1,
//       fillOpacity: 1, // Always no transparency
//       dashArray: undefined
//     };
//   }

//   get summaryLabel(): string {
//     return this.startDate === this.endDate ? 'Daily' : 'Cumulative';
//   }

//   private onEachFeature(feature: any, layer: L.Layer, level: string): void {
//     const codeProp = this.getCodeProp(level);
//     const code = feature.properties[codeProp];
//     const dataCodeKey = this.getDataCodeKey(level);
//     const data = this.getDataForLevel(level)?.find((d: any) => String(d[dataCodeKey]).trim() === String(code).trim());
//     const nameProp = this.getNameProp(level);
//     const name = this.toCamelCase(feature.properties[nameProp]);
//     const dailyKey = this.getDailyKey(level);
//     const normalKey = this.getNormalKey(level);
//     const daily = data?.[dailyKey] != null && !isNaN(data?.[dailyKey])
//       ? this.constants.trimToOneDecimals(data?.[dailyKey]) : 'NA';
//     const normal = data?.[normalKey] != null && !isNaN(data?.[normalKey])
//       ? this.constants.trimToOneDecimals(data?.[normalKey]) : 'NA';
//     const departure = data?.departure != null && !isNaN(data.departure)
//       ? this.constants.trimToOneDecimals(data?.departure) : 'NA';

//     let tooltipContent = `
//       <div class="tooltip-content">
//         <div class="tooltip-title"><b>${name}</b></div>
//         <div class="tooltip-row">${this.summaryLabel}: <b>${daily}</b> mm</div>
//     `;
//     if (!this.isActual) {
//       tooltipContent += `
//         <div class="tooltip-row">Normal: <b>${normal}</b> mm</div>
//         <div class="tooltip-row">Departure: <b>${departure}</b>%</div>
//       `;
//     }
//     tooltipContent += `</div>`;
//     layer.bindTooltip(tooltipContent, { sticky: true, direction: 'top', offset: [0, -10], className: 'custom-tooltip' });
//   }

//   toCamelCase(name: string | null): string {
//     if (!name) return '';
//     return name
//       .split(' ')
//       .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
//       .join(' ');
//   }

//   getDataForLevel(level: string): any[] {
//     switch (level) {
//       case 'country': return this.countryData;
//       case 'region': return this.regionData;
//       case 'state': return this.stateData;
//       case 'subdivision': return this.subdivisionData;
//       case 'district': return this.districtData;
//       case 'block': return this.blockData;
//       default: return [];
//     }
//   }

//   getCodeProp(level: string): string {
//     switch (level) {
//       case 'country': return 'name';
//       case 'region': return 'region_cod';
//       case 'state': return 'state_code';
//       case 'subdivision': return 'SubDiv_Cod';
//       case 'district': return 'district_c';
//       case 'block': return 'block_code';
//       default: return '';
//     }
//   }

//   getNameProp(level: string): string {
//     switch (level) {
//       case 'country': return 'name';
//       case 'region': return 'region_nam';
//       case 'state': return 'state_name';
//       case 'subdivision': return 'subdivisio';
//       case 'district': return 'district';
//       case 'block': return 'block_Name';
//       default: return '';
//     }
//   }

//   getDataCodeKey(level: string): string {
//     switch (level) {
//       case 'country': return 'name';
//       case 'region': return 'r_code';
//       case 'state': return 'state_code';
//       case 'subdivision': return 's_code';
//       case 'district': return 'district_code';
//       case 'block': return 'block_code';
//       default: return '';
//     }
//   }

//   getDailyKey(level: string): string {
//     switch (level) {
//       case 'country': return 'actual_rainfall';
//       case 'region': return 'actual_rainfall';
//       case 'state': return 'actual_state_rainfall';
//       case 'subdivision': return 'actual_subdiv_rainfall';
//       case 'district': return 'actual_rainfall';
//       case 'block': return 'actual_rainfall';
//       default: return '';
//     }
//   }

//   getNormalKey(level: string): string {
//     switch (level) {
//       case 'country': return 'rainfall_normal_value';
//       case 'region':
//       case 'state':
//       case 'subdivision': return 'rainfall_normal_value';
//       case 'district':
//       case 'block': return 'normal_rainfall';
//       default: return '';
//     }
//   }

//   onDateChange() {
//     if (!this.isActual && this.startDate && this.endDate && new Date(this.startDate) > new Date(this.endDate)) {
//       this.startDate = this.endDate;
//     }
//     this.fetchAllData();
//   }

//   onModeChange() {
//     if (this.isActual) {
//       this.startDate = this.endDate;
//     } else {
//       if (!this.startDate || new Date(this.startDate) > new Date(this.endDate || this.getDefaultDate())) {
//         this.startDate = this.endDate || this.getDefaultDate();
//       }
//     }
//     this.fetchAllData();
//   }

//   onSelectLayer(layerId: string) {
//     this.navItems.forEach(item => (item.active = item.id === layerId));
//     this.selectedLayer = layerId;
//     this.updateMap();
//     this.layerSelected.emit(layerId);
//   }

//   setActiveLayer(layerName: string) {
//     this.navItems.forEach(item => (item.active = item.id === layerName));
//     this.selectedLayer = layerName;
//   }
// }


import { Component, OnInit, OnChanges, SimpleChanges, AfterViewInit, Renderer2, Input, Output, EventEmitter, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { StateService } from 'src/app/services/state/state.service';
import { DistrictService } from 'src/app/services/district/district.service';
import { BlockService } from 'src/app/services/block/BlockService.service';
import { RegionService } from 'src/app/services/region/region.service';
import { SubdivisionService } from 'src/app/services/subDivision/subDivision.service';
import { CountryService } from 'src/app/services/country/country.service';
import { Constants } from 'src/app/services/constants';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-map-dashboardcontainer',
  templateUrl: './map-dashboardcontainer.component.html',
  styleUrls: ['./map-dashboardcontainer.component.css']
})
export class MapDashboardcontainerComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() selectedLayer: string = 'country';
  @Input() startDate: string = '';
  @Input() endDate: string = '';
  @Input() isActual: boolean = false;
  @Input() maxDate: string = '';
  @Output() layerSelected = new EventEmitter<string>();

  @ViewChild('map') mapElement!: ElementRef;

  private map!: L.Map;
  stateGeojson: any = null;
  regionGeojson: any = null;
  subdivisionGeojson: any = null;
  districtGeojson: any = null;
  blockGeojson: any = null;
  countryGeojson: any = null;
  stateData: any[] = [];
  regionData: any[] = [];
  subdivisionData: any[] = [];
  districtData: any[] = [];
  blockData: any[] = [];
  countryData: any[] = [];
  isGeojsonLoaded = false;
  isBuffering: boolean = false;
  selectedDate: string = ''; // Single date for both startDate and endDate

  navItems = [
    { id: 'country', label: 'Country', active: true },
    { id: 'region', label: 'Region', active: false },
    { id: 'subdivision', label: 'Sub Division', active: false },
    { id: 'state', label: 'State', active: false },
    { id: 'district', label: 'District', active: false },
    { id: 'block', label: 'Block', active: false }
  ];

  actualLegendItems = [
    { color: "#abf200", text: `Very Light<br> Rainfall`, fontSize: "9.3px" },
    { color: "#03ff00", text: "Light Rainfall", fontSize: "9.3px" },
    { color: "#03ffff", text: "Moderate <br>Rainfall", fontSize: "9.3px" },
    { color: "#ffff00", text: "Heavy Rainfall", fontSize: "9.3px" },
    { color: "#ff8c00", text: "Very Heavy<br> Rainfall", fontSize: "9.3px" },
    { color: "#ff0000", text: "Extremely<br> Heavy Rainfall", fontSize: "9.3px" },
    { color: "#c0c0c0", text: "No Data", fontSize: "9.3px" },
  ];

  departureLegendItems = [
    { color: "#0096ff", text: `Large Excess <br>[60% or more]`, fontSize: "9.3px" },
    { color: "#32c0f8", text: "Excess <br>[20 to 59]%", fontSize: "9.3px" },
    { color: "#00cd5b", text: "Normal <br>[-19 to 19]%", fontSize: "9.3px" },
    { color: "#ff2700", text: "Deficient <br>[-59 to -20]%", fontSize: "9.3px" },
    { color: "#ffff20", text: "Large Deficient <br>[-99 to -60]%", fontSize: "9.3px" },
    { color: "#ffffff", text: "No Rain <br>[-100]%", fontSize: "9.3px" },
    { color: "#c0c0c0", text: "No Data", fontSize: "9.3px" },
  ];

  get currentLegendItems() {
    return this.isActual ? this.actualLegendItems : this.departureLegendItems;
  }

  constructor(
    private http: HttpClient,
    private stateService: StateService,
    private districtService: DistrictService,
    private blockService: BlockService,
    private regionService: RegionService,
    private subdivisionService: SubdivisionService,
    private countryService: CountryService,
    private constants: Constants,
    private renderer: Renderer2
  ) {
    const today = new Date().toISOString().split('T')[0];
    this.selectedDate = today;
    this.startDate = today;
    this.endDate = today;
    this.maxDate = today;
  }

  ngOnInit(): void {
    this.loadGeojsonData();
    this.setActiveLayer(this.selectedLayer);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.isGeojsonLoaded) {
      if (
        (changes['startDate'] && !changes['startDate'].firstChange) ||
        (changes['endDate'] && !changes['endDate'].firstChange) ||
        (changes['isActual'] && !changes['isActual'].firstChange) ||
        (changes['selectedLayer'] && !changes['selectedLayer'].firstChange)
      ) {
        this.setActiveLayer(this.selectedLayer);
        this.fetchAllData();
      }
    }
  }

  ngAfterViewInit(): void {
    this.initializeMap();
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 300); // Increased timeout for stability
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private loadGeojsonData(): void {
    forkJoin({
      states: this.http.get('assets/geojson/INDIA_STATE.json'),
      districts: this.http.get('assets/geojson/INDIA_DISTRICT.json'),
      blocks: this.http.get('assets/geojson/INDIA_BLOCK.json'),
      regions: this.http.get('assets/geojson/INDIA_REGIONS.json'),
      subdivisions: this.http.get('assets/geojson/INDIA_SUB_DIVISION.json'),
      country: this.http.get('assets/geojson/INDIA_COUNTRY.json')
    }).subscribe({
      next: ({ states, districts, blocks, regions, subdivisions, country }) => {
        this.stateGeojson = states;
        this.districtGeojson = districts;
        this.blockGeojson = blocks;
        this.regionGeojson = regions;
        this.subdivisionGeojson = subdivisions;
        this.countryGeojson = country;
        this.isGeojsonLoaded = true;
        this.fetchAllData();
      },
      error: err => console.error('Error loading GeoJSON:', err)
    });
  }

  private fetchAllData() {
    const params = {
      startDate: this.startDate || this.getDefaultDate(),
      endDate: this.endDate || this.getDefaultDate(),
      mode: this.isActual ? 'Actual' : 'Departure'
    };
    this.isBuffering = true;
    forkJoin({
      stateRes: this.stateService.fetchData(params),
      regionRes: this.regionService.fetchData(params),
      subdivisionRes: this.subdivisionService.fetchData(params),
      districtRes: this.districtService.fetchData(params),
      blockRes: this.blockService.fetchData(params),
      countryRes: this.countryService.fetchData(params)
    }).subscribe({
      next: ({ stateRes, regionRes, subdivisionRes, districtRes, blockRes, countryRes }) => {
        this.stateData = stateRes.data || [];
        this.regionData = regionRes.data || [];
        this.subdivisionData = subdivisionRes.data || [];
        this.districtData = districtRes.data || [];
        this.blockData = blockRes.data || [];
        this.countryData = countryRes.data || [];
        this.updateMap();
        this.isBuffering = false;
      },
      error: (err) => {
        console.error('Data fetch failed', err);
        this.isBuffering = false;
      }
    });
  }

  private getDefaultDate(): string {
    const currentDate = new Date();
    const dd = String(currentDate.getDate()).padStart(2, '0');
    const mon = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = String(currentDate.getFullYear());
    return `${year}-${mon}-${dd}`;
  }

  private initializeMap() {
    if (!this.mapElement || this.map) return;
    const container = this.mapElement.nativeElement;
    if (!container) {
      console.error('Map container not found');
      return;
    }

    this.map = this.createBaseMap(container);
    this.map.invalidateSize();
  }

  private createBaseMap(container: HTMLElement): L.Map {
    const map = L.map(container, {
      center: [20.5937, 78.9629],
      zoom: 4,
      scrollWheelZoom: true,
      zoomDelta: 0.25,
      zoomSnap: 0,
      wheelPxPerZoomLevel: 120,
      layers: []
    });

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }
    ).addTo(map);

    return map;
  }

  private updateMap(): void {
    if (!this.map) return;
    this.map.eachLayer((layer: L.Layer) => {
      if (layer instanceof L.GeoJSON) {
        this.map.removeLayer(layer);
      }
    });
    this.renderGeojsonLayer();
    this.map.invalidateSize();
  }

  private renderGeojsonLayer(): void {
    if (!this.map) return;
    const geojson = this.getGeojsonForLevel(this.selectedLayer);
    if (geojson && this.isGeojsonLoaded) {
      const layer = L.geoJSON(geojson, {
        style: (f: any) => this.styleFeature(f, this.selectedLayer),
        onEachFeature: (f: any, l: L.Layer) => this.onEachFeature(f, l, this.selectedLayer)
      }).addTo(this.map);
      if (layer.getBounds().isValid()) {
        this.map.fitBounds(layer.getBounds(), { padding: [20, 20], maxZoom: 10 });
      }
    }
    this.removeFocusFromLayers();
    this.map.invalidateSize();
  }

  private getGeojsonForLevel(level: string): any {
    switch (level) {
      case 'country': return this.countryGeojson;
      case 'region': return this.regionGeojson;
      case 'state': return this.stateGeojson;
      case 'subdivision': return this.subdivisionGeojson;
      case 'district': return this.districtGeojson;
      case 'block': return this.blockGeojson;
      default: return null;
    }
  }

  private removeFocusFromLayers(): void {
    if (!this.map) return;
    this.map.eachLayer((layer: L.Layer) => {
      if ((layer as any)._path) {
        const elem = (layer as any)._path as SVGElement;
        if (elem) {
          elem.removeAttribute('tabindex');
          elem.style.outline = 'none';
        }
      }
    });
  }

  private styleFeature(feature: any, level: string): any {
    const codeProp = this.getCodeProp(level);
    const code = feature.properties[codeProp];
    const dataCodeKey = this.getDataCodeKey(level);
    const data = this.getDataForLevel(level)?.find((d: any) => String(d[dataCodeKey]).trim() === String(code).trim());
    const dailyKey = this.getDailyKey(level);
    const value = this.isActual ? (data?.[dailyKey] ?? 'NA') : (data?.departure ?? 'NA');
    const fillColor = this.isActual
      ? this.constants.getActualColorForRainfall(String(value))
      : this.constants.getColorForRainfall(String(value));
    return {
      fillColor: fillColor || '#c0c0c0',
      color: '#333',
      weight: 1,
      fillOpacity: 1,
      dashArray: undefined
    };
  }

  get summaryLabel(): string {
    return 'Daily'; // Always daily since startDate and endDate are the same
  }

  private onEachFeature(feature: any, layer: L.Layer, level: string): void {
    const codeProp = this.getCodeProp(level);
    const code = feature.properties[codeProp];
    const dataCodeKey = this.getDataCodeKey(level);
    const data = this.getDataForLevel(level)?.find((d: any) => String(d[dataCodeKey]).trim() === String(code).trim());
    const nameProp = this.getNameProp(level);
    const name = this.toCamelCase(feature.properties[nameProp]);
    const dailyKey = this.getDailyKey(level);
    const normalKey = this.getNormalKey(level);
    const daily = data?.[dailyKey] != null && !isNaN(data?.[dailyKey])
      ? this.constants.trimToOneDecimals(data?.[dailyKey]) : 'NA';
    const normal = data?.[normalKey] != null && !isNaN(data?.[normalKey])
      ? this.constants.trimToOneDecimals(data?.[normalKey]) : 'NA';
    const departure = data?.departure != null && !isNaN(data.departure)
      ? this.constants.trimToOneDecimals(data?.departure) : 'NA';

    let tooltipContent = `
      <div class="tooltip-content">
        <div class="tooltip-title"><b>${name}</b></div>
        <div class="tooltip-row">Daily: <b>${daily}</b> mm</div>
    `;
    if (!this.isActual) {
      tooltipContent += `
        <div class="tooltip-row">Normal: <b>${normal}</b> mm</div>
        <div class="tooltip-row">Departure: <b>${departure}</b>%</div>
      `;
    }
    tooltipContent += `</div>`;
    layer.bindTooltip(tooltipContent, { sticky: true, direction: 'top', offset: [0, -10], className: 'custom-tooltip' });
  }

  toCamelCase(name: string | null): string {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  getDataForLevel(level: string): any[] {
    switch (level) {
      case 'country': return this.countryData;
      case 'region': return this.regionData;
      case 'state': return this.stateData;
      case 'subdivision': return this.subdivisionData;
      case 'district': return this.districtData;
      case 'block': return this.blockData;
      default: return [];
    }
  }

  getCodeProp(level: string): string {
    switch (level) {
      case 'country': return 'name';
      case 'region': return 'region_cod';
      case 'state': return 'state_code';
      case 'subdivision': return 'SubDiv_Cod';
      case 'district': return 'district_c';
      case 'block': return 'block_code';
      default: return '';
    }
  }

  getNameProp(level: string): string {
    switch (level) {
      case 'country': return 'name';
      case 'region': return 'region_nam';
      case 'state': return 'state_name';
      case 'subdivision': return 'subdivisio';
      case 'district': return 'district';
      case 'block': return 'block_Name';
      default: return '';
    }
  }

  getDataCodeKey(level: string): string {
    switch (level) {
      case 'country': return 'name';
      case 'region': return 'r_code';
      case 'state': return 'state_code';
      case 'subdivision': return 's_code';
      case 'district': return 'district_code';
      case 'block': return 'block_code';
      default: return '';
    }
  }

  getDailyKey(level: string): string {
    switch (level) {
      case 'country': return 'actual_rainfall';
      case 'region': return 'actual_rainfall';
      case 'state': return 'actual_state_rainfall';
      case 'subdivision': return 'actual_subdiv_rainfall';
      case 'district': return 'actual_rainfall';
      case 'block': return 'actual_rainfall';
      default: return '';
    }
  }

  getNormalKey(level: string): string {
    switch (level) {
      case 'country': return 'rainfall_normal_value';
      case 'region':
      case 'state':
      case 'subdivision': return 'rainfall_normal_value';
      case 'district':
      case 'block': return 'normal_rainfall';
      default: return '';
    }
  }

  onDateChange() {
    if (this.selectedDate) {
      this.startDate = this.selectedDate;
      this.endDate = this.selectedDate;
      this.fetchAllData();
    }
  }

  onModeChange() {
    this.startDate = this.selectedDate || this.getDefaultDate();
    this.endDate = this.selectedDate || this.getDefaultDate();
    this.fetchAllData();
  }

  onSelectLayer(layerId: string) {
    this.navItems.forEach(item => (item.active = item.id === layerId));
    this.selectedLayer = layerId;
    this.updateMap();
    this.layerSelected.emit(layerId);
  }

  setActiveLayer(layerName: string) {
    this.navItems.forEach(item => (item.active = item.id === layerName));
    this.selectedLayer = layerName;
  }
}