
// import { Component, OnInit, OnChanges, SimpleChanges, AfterViewInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
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
//   @Output() dateChanged = new EventEmitter<{ startDate: string; endDate: string }>();
//   @Output() placeSelected = new EventEmitter<{ layer: string; name: string }>();

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
//   selectedDate: string = '';

//   navItems = [
//     { id: 'country', label: 'Country', active: true },
//     { id: 'region', label: 'Region', active: false },
//     { id: 'subdivision', label: 'Sub Division', active: false },
//     { id: 'state', label: 'State', active: false },
//     { id: 'district', label: 'District', active: false },
//     { id: 'block', label: 'Block', active: false }
//   ];

//   actualLegendItems = [
//     { color: "#abf200", text: `Very Light<br> Rainfall`, fontSize: "9.3px" },
//     { color: "#03ff00", text: "Light Rainfall", fontSize: "9.3px" },
//     { color: "#03ffff", text: "Moderate <br>Rainfall", fontSize: "9.3px" },
//     { color: "#ffff00", text: "Heavy Rainfall", fontSize: "9.3px" },
//     { color: "#ff8c00", text: "Very Heavy<br> Rainfall", fontSize: "9.3px" },
//     { color: "#ff0000", text: "Extremely<br> Heavy Rainfall", fontSize: "9.3px" },
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
//     private constants: Constants
//   ) {
//     const today = new Date().toISOString().split('T')[0];
//     this.selectedDate = today;
//     this.startDate = today;
//     this.endDate = today;
//     this.maxDate = today;
//   }

//   ngOnInit(): void {
//     this.loadGeojsonData();
//     this.setActiveLayer(this.selectedLayer);
//     this.synchronizeDates();
//     this.placeSelected.emit({ layer: 'country', name: 'India' });
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (this.isGeojsonLoaded) {
//       if (
//         (changes['startDate'] && !changes['startDate'].firstChange) ||
//         (changes['endDate'] && !changes['endDate'].firstChange) ||
//         (changes['isActual'] && !changes['isActual'].firstChange) ||
//         (changes['selectedLayer'] && !changes['selectedLayer'].firstChange)
//       ) {
//         this.synchronizeDates();
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
//     }, 300);
//   }

//   ngOnDestroy(): void {
//     if (this.map) {
//       this.map.remove();
//     }
//   }

//   private synchronizeDates(): void {
//     if (this.startDate && this.endDate && this.startDate === this.endDate) {
//       this.selectedDate = this.startDate;
//     } else {
//       this.selectedDate = this.startDate || this.getDefaultDate();
//       this.startDate = this.selectedDate;
//       this.endDate = this.selectedDate;
//     }
//     this.dateChanged.emit({ startDate: this.startDate, endDate: this.endDate });
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
//       startDate: this.selectedDate || this.getDefaultDate(),
//       endDate: this.selectedDate || this.getDefaultDate(),
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
//     if (!container) {
//       console.error('Map container not found');
//       return;
//     }

//     this.map = this.createBaseMap(container);
//     this.map.invalidateSize();
//   }

//   private createBaseMap(container: HTMLElement): L.Map {
//     const map = L.map(container, {
//       center: [20.5937, 78.9629],
//       zoom: 4,
//       scrollWheelZoom: true,
//       zoomDelta: 0.25,
//       zoomSnap: 0,
//       wheelPxPerZoomLevel: 120,
//       layers: []
//     });

//     L.tileLayer(
//       'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
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
//     this.map.invalidateSize();
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
//       fillOpacity: 1,
//       dashArray: undefined
//     };
//   }

//   get summaryLabel(): string {
//     return 'Daily';
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
//         <div class="tooltip-row">Daily: <b>${daily}</b> mm</div>
//     `;
//     if (!this.isActual) {
//       tooltipContent += `
//         <div class="tooltip-row">Normal: <b>${normal}</b> mm</div>
//         <div class="tooltip-row">Departure: <b>${departure}</b>%</div>
//       `;
//     }
//     tooltipContent += `</div>`;
//     layer.bindTooltip(tooltipContent, { sticky: true, direction: 'top', offset: [0, -10], className: 'custom-tooltip' });

//     layer.on('click', () => {
//       this.placeSelected.emit({ layer: this.selectedLayer, name });
//     });
//   }

//   toCamelCase(name: string | null): string {
//     if (!name) return '';
//     return name
//       .toLowerCase()
//       .split(' ')
//       .map(word => word.charAt(0).toUpperCase() + word.slice(1))
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
//     if (this.selectedDate) {
//       this.startDate = this.selectedDate;
//       this.endDate = this.selectedDate;
//       this.dateChanged.emit({ startDate: this.startDate, endDate: this.endDate });
//       this.fetchAllData();
//     }
//   }

//   onModeChange() {
//     this.startDate = this.selectedDate || this.getDefaultDate();
//     this.endDate = this.selectedDate || this.getDefaultDate();
//     this.dateChanged.emit({ startDate: this.startDate, endDate: this.endDate });
//     this.fetchAllData();
//   }

//   onSelectLayer(layerId: string) {
//     this.navItems.forEach(item => (item.active = item.id === layerId));
//     this.selectedLayer = layerId;
//     this.updateMap();
//     this.layerSelected.emit(layerId);
//     if (layerId === 'country') {
//       this.placeSelected.emit({ layer: layerId, name: 'India' });
//     } else if (layerId === 'region') {
//       this.placeSelected.emit({ layer: layerId, name: 'Central India' });
//     }
//   }

//   setActiveLayer(layerName: string) {
//     this.navItems.forEach(item => (item.active = item.id === layerName));
//     this.selectedLayer = layerName;
//   }
// }




// import { Component, OnInit, OnChanges, SimpleChanges, AfterViewInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
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
//   @Output() dateChanged = new EventEmitter<{ startDate: string; endDate: string }>();
//   @Output() placeSelected = new EventEmitter<{ layer: string; code: string; name: string }>();

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
//   selectedDate: string = '';

//   navItems = [
//     { id: 'country', label: 'Country', active: true },
//     { id: 'region', label: 'Region', active: false },
//     { id: 'subdivision', label: 'Sub Division', active: false },
//     { id: 'state', label: 'State', active: false },
//     { id: 'district', label: 'District', active: false },
//     { id: 'block', label: 'Block', active: false }
//   ];

//   actualLegendItems = [
//     { color: "#abf200", text: `Very Light<br> Rainfall`, fontSize: "9.3px" },
//     { color: "#03ff00", text: "Light Rainfall", fontSize: "9.3px" },
//     { color: "#03ffff", text: "Moderate <br>Rainfall", fontSize: "9.3px" },
//     { color: "#ffff00", text: "Heavy Rainfall", fontSize: "9.3px" },
//     { color: "#ff8c00", text: "Very Heavy<br> Rainfall", fontSize: "9.3px" },
//     { color: "#ff0000", text: "Extremely<br> Heavy Rainfall", fontSize: "9.3px" },
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
//     private constants: Constants
//   ) {
//     const today = new Date().toISOString().split('T')[0];
//     this.selectedDate = today;
//     this.startDate = today;
//     this.endDate = today;
//     this.maxDate = today;
//   }

//   ngOnInit(): void {
//     this.loadGeojsonData();
//     this.setActiveLayer(this.selectedLayer);
//     this.synchronizeDates();
//     this.emitDefaultPlace(this.selectedLayer);
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (this.isGeojsonLoaded) {
//       if (
//         (changes['startDate'] && !changes['startDate'].firstChange) ||
//         (changes['endDate'] && !changes['endDate'].firstChange) ||
//         (changes['isActual'] && !changes['isActual'].firstChange) ||
//         (changes['selectedLayer'] && !changes['selectedLayer'].firstChange)
//       ) {
//         this.synchronizeDates();
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
//     }, 300);
//   }

//   ngOnDestroy(): void {
//     if (this.map) {
//       this.map.remove();
//     }
//   }

//   private synchronizeDates(): void {
//     if (this.startDate && this.endDate && this.startDate === this.endDate) {
//       this.selectedDate = this.startDate;
//     } else {
//       this.selectedDate = this.startDate || this.getDefaultDate();
//       this.startDate = this.selectedDate;
//       this.endDate = this.selectedDate;
//     }
//     this.dateChanged.emit({ startDate: this.startDate, endDate: this.endDate });
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
//       startDate: this.selectedDate || this.getDefaultDate(),
//       endDate: this.selectedDate || this.getDefaultDate(),
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
//     if (!container) {
//       console.error('Map container not found');
//       return;
//     }

//     this.map = this.createBaseMap(container);
//     this.map.invalidateSize();
//   }

//   private createBaseMap(container: HTMLElement): L.Map {
//     const map = L.map(container, {
//       center: [20.5937, 78.9629],
//       zoom: 4,
//       scrollWheelZoom: true,
//       zoomDelta: 0.25,
//       zoomSnap: 0,
//       wheelPxPerZoomLevel: 120,
//       layers: []
//     });

//     L.tileLayer(
//       'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
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
//     this.map.invalidateSize();
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
//       fillOpacity: 1,
//       dashArray: undefined
//     };
//   }

//   get summaryLabel(): string {
//     return 'Daily';
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
//         <div class="tooltip-row">Daily: <b>${daily}</b> mm</div>
//     `;
//     if (!this.isActual) {
//       tooltipContent += `
//         <div class="tooltip-row">Normal: <b>${normal}</b> mm</div>
//         <div class="tooltip-row">Departure: <b>${departure}</b>%</div>
//       `;
//     }
//     tooltipContent += `</div>`;
//     layer.bindTooltip(tooltipContent, { sticky: true, direction: 'top', offset: [0, -10], className: 'custom-tooltip' });

//     layer.on('click', () => {
//       this.placeSelected.emit({ layer: this.selectedLayer, code, name });
//     });
//   }

//   toCamelCase(name: string | null): string {
//     if (!name) return '';
//     return name
//       .toLowerCase()
//       .split(' ')
//       .map(word => word.charAt(0).toUpperCase() + word.slice(1))
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
//     if (this.selectedDate) {
//       this.startDate = this.selectedDate;
//       this.endDate = this.selectedDate;
//       this.dateChanged.emit({ startDate: this.startDate, endDate: this.endDate });
//       this.fetchAllData();
//     }
//   }

//   onModeChange() {
//     this.startDate = this.selectedDate || this.getDefaultDate();
//     this.endDate = this.selectedDate || this.getDefaultDate();
//     this.dateChanged.emit({ startDate: this.startDate, endDate: this.endDate });
//     this.fetchAllData();
//   }

//   private emitDefaultPlace(layerId: string) {
//     let defaultPlace: { layer: string; code: string; name: string };
//     switch (layerId) {
//       case 'country':
//         defaultPlace = { layer: 'country', code: 'INDIA', name: 'India' };
//         break;
//       case 'region':
//         defaultPlace = { layer: 'region', code: '1', name: 'Central India' };
//         break;
//       case 'state':
//         defaultPlace = { layer: 'state', code: '302', name: 'Delhi (Ut)' };
//         break;
//       case 'subdivision':
//         defaultPlace = { layer: 'subdivision', code: '301', name: 'Delhi And Haryana And Chandigarh' };
//         break;
//       case 'district':
//         defaultPlace = { layer: 'district', code: '30102003', name: 'New Delhi' }; // Assumed district_code
//         break;
//       case 'block':
//         defaultPlace = { layer: 'block', code: '3010200302', name: 'Delhi Cantoment' };
//         break;
//       default:
//         defaultPlace = { layer: 'country', code: 'INDIA', name: 'India' };
//     }
//     this.placeSelected.emit(defaultPlace);
//   }

//   onSelectLayer(layerId: string) {
//     this.navItems.forEach(item => (item.active = item.id === layerId));
//     this.selectedLayer = layerId;
//     this.updateMap();
//     this.layerSelected.emit(layerId);
//     this.emitDefaultPlace(layerId);
//   }

//   setActiveLayer(layerName: string) {
//     this.navItems.forEach(item => (item.active = item.id === layerName));
//     this.selectedLayer = layerName;
//   }
// }


// import { Component, OnInit, OnChanges, SimpleChanges, AfterViewInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import * as L from 'leaflet';
// import { StateService } from 'src/app/services/state/state.service';
// import { DistrictService } from 'src/app/services/district/district.service';
// import { BlockService } from 'src/app/services/block/BlockService.service';
// import { RegionService } from 'src/app/services/region/region.service';
// import { SubdivisionService } from 'src/app/services/subDivision/subDivision.service';
// import { CountryService } from 'src/app/services/country/country.service';
// import { Constants } from 'src/app/services/constants';
// import { forkJoin, Observable, of } from 'rxjs';

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
//   @Output() dateChanged = new EventEmitter<{ startDate: string; endDate: string }>();
//   @Output() placeSelected = new EventEmitter<{ layer: string; code: string; name: string }>();

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
//   isBuffering: boolean = false;
//   selectedDate: string = '';

//   private lastFetchedParams: Map<string, string> = new Map();

//   navItems = [
//     { id: 'country', label: 'Country', active: true },
//     { id: 'region', label: 'Region', active: false },
//     { id: 'subdivision', label: 'Sub Division', active: false },
//     { id: 'state', label: 'State', active: false },
//     { id: 'district', label: 'District', active: false },
//     { id: 'block', label: 'Block', active: false }
//   ];

//   actualLegendItems = [
//     { color: "#abf200", text: `Very Light<br> Rainfall`, fontSize: "9.3px" },
//     { color: "#03ff00", text: "Light Rainfall", fontSize: "9.3px" },
//     { color: "#03ffff", text: "Moderate <br>Rainfall", fontSize: "9.3px" },
//     { color: "#ffff00", text: "Heavy Rainfall", fontSize: "9.3px" },
//     { color: "#ff8c00", text: "Very Heavy<br> Rainfall", fontSize: "9.3px" },
//     { color: "#ff0000", text: "Extremely<br> Heavy Rainfall", fontSize: "9.3px" },
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
//     private constants: Constants
//   ) {
//     const today = new Date().toISOString().split('T')[0];
//     this.selectedDate = today;
//     this.startDate = today;
//     this.endDate = today;
//     this.maxDate = today;
//   }

//   ngOnInit(): void {
//     this.setActiveLayer(this.selectedLayer);
//     this.synchronizeDates();
//     this.emitDefaultPlace(this.selectedLayer);
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (
//       changes['startDate'] ||
//       changes['endDate'] ||
//       changes['isActual']
//     ) {
//       this.synchronizeDates();
//       this.prepareLayer();
//     }
//     if (changes['selectedLayer']) {
//       this.setActiveLayer(this.selectedLayer);
//       this.prepareLayer();
//       this.emitDefaultPlace(this.selectedLayer);
//     }
//   }

//   ngAfterViewInit(): void {
//     this.initializeMap();
//     this.prepareLayer();
//     setTimeout(() => {
//       if (this.map) {
//         this.map.invalidateSize();
//       }
//     }, 300);
//   }

//   ngOnDestroy(): void {
//     if (this.map) {
//       this.map.remove();
//     }
//   }

//   private currentParamsKey(): string {
//     const mode = this.isActual ? 'Actual' : 'Departure';
//     return `${this.startDate}_${this.endDate}_${mode}`;
//   }

//   private prepareLayer(): void {
//     if (!this.map) return;
//     this.isBuffering = true;

//     const layer = this.selectedLayer;
//     const needsGeo = this.getGeojsonForLevel(layer) === null;
//     const loadGeo: Observable<any> = needsGeo ? this.loadGeojsonForLevel(layer) : of(null);

//     const currentKey = this.currentParamsKey();
//     const lastKey = this.lastFetchedParams.get(layer);
//     const hasData = this.getDataForLevel(layer).length > 0;
//     const needsData = !hasData || currentKey !== lastKey;
//     const params = {
//       startDate: this.startDate || this.getDefaultDate(),
//       endDate: this.endDate || this.getDefaultDate(),
//       mode: this.isActual ? 'Actual' : 'Departure'
//     };
//     const loadData: Observable<any> = needsData ? this.fetchDataForLayerObservable(layer, params) : of(null);

//     forkJoin({ geo: loadGeo, data: loadData }).subscribe({
//       next: (res) => {
//         if (res.geo !== null) {
//           this.setGeojsonForLevel(layer, res.geo);
//         }
//         if (res.data !== null) {
//           this.setDataForLevel(layer, res.data.data || []);
//           this.lastFetchedParams.set(layer, currentKey);
//         }
//         this.updateMap();
//         this.isBuffering = false;
//       },
//       error: (err) => {
//         console.error('Error preparing layer:', err);
//         this.isBuffering = false;
//       }
//     });
//   }

//   private loadGeojsonForLevel(level: string): Observable<any> {
//     let url: string;
//     switch (level) {
//       case 'country':
//         url = 'assets/geojson/INDIA_COUNTRY.json';
//         break;
//       case 'region':
//         url = 'assets/geojson/INDIA_REGIONS.json';
//         break;
//       case 'subdivision':
//         url = 'assets/geojson/INDIA_SUB_DIVISION.json';
//         break;
//       case 'state':
//         url = 'assets/geojson/INDIA_STATE.json';
//         break;
//       case 'district':
//         url = 'assets/geojson/INDIA_DISTRICT.json';
//         break;
//       case 'block':
//         url = 'assets/geojson/INDIA_BLOCK.json';
//         break;
//       default:
//         throw new Error(`Unknown level: ${level}`);
//     }
//     return this.http.get(url);
//   }

//   private setGeojsonForLevel(level: string, geojson: any): void {
//     switch (level) {
//       case 'country':
//         this.countryGeojson = geojson;
//         break;
//       case 'region':
//         this.regionGeojson = geojson;
//         break;
//       case 'subdivision':
//         this.subdivisionGeojson = geojson;
//         break;
//       case 'state':
//         this.stateGeojson = geojson;
//         break;
//       case 'district':
//         this.districtGeojson = geojson;
//         break;
//       case 'block':
//         this.blockGeojson = geojson;
//         break;
//     }
//   }

//   private fetchDataForLayerObservable(level: string, params: any): Observable<any> {
//     switch (level) {
//       case 'country':
//         return this.countryService.fetchData(params);
//       case 'region':
//         return this.regionService.fetchData(params);
//       case 'subdivision':
//         return this.subdivisionService.fetchData(params);
//       case 'state':
//         return this.stateService.fetchData(params);
//       case 'district':
//         return this.districtService.fetchData(params);
//       case 'block':
//         return this.blockService.fetchData(params);
//       default:
//         throw new Error(`Unknown level: ${level}`);
//     }
//   }

//   private setDataForLevel(level: string, data: any[]): void {
//     switch (level) {
//       case 'country':
//         this.countryData = data;
//         break;
//       case 'region':
//         this.regionData = data;
//         break;
//       case 'subdivision':
//         this.subdivisionData = data;
//         break;
//       case 'state':
//         this.stateData = data;
//         break;
//       case 'district':
//         this.districtData = data;
//         break;
//       case 'block':
//         this.blockData = data;
//         break;
//     }
//   }

//   private synchronizeDates(): void {
//     if (this.startDate && this.endDate && this.startDate === this.endDate) {
//       this.selectedDate = this.startDate;
//     } else {
//       this.selectedDate = this.startDate || this.getDefaultDate();
//       this.startDate = this.selectedDate;
//       this.endDate = this.selectedDate;
//     }
//     this.dateChanged.emit({ startDate: this.startDate, endDate: this.endDate });
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
//     if (!container) {
//       console.error('Map container not found');
//       return;
//     }

//     this.map = this.createBaseMap(container);
//     this.map.invalidateSize();
//   }

//   private createBaseMap(container: HTMLElement): L.Map {
//     const map = L.map(container, {
//       center: [20.5937, 78.9629],
//       zoom: 4,
//       scrollWheelZoom: true,
//       zoomDelta: 0.25,
//       zoomSnap: 0,
//       wheelPxPerZoomLevel: 120,
//       layers: []
//     });

//     L.tileLayer(
//       'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
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
//     this.map.invalidateSize();
//   }

//   private renderGeojsonLayer(): void {
//     if (!this.map) return;
//     const geojson = this.getGeojsonForLevel(this.selectedLayer);
//     if (geojson) {
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
//       case 'subdivision': return this.subdivisionGeojson;
//       case 'state': return this.stateGeojson;
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
//       fillOpacity: 1,
//       dashArray: undefined
//     };
//   }

//   get summaryLabel(): string {
//     return 'Daily';
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
//         <div class="tooltip-row">Daily: <b>${daily}</b> mm</div>
//     `;
//     if (!this.isActual) {
//       tooltipContent += `
//         <div class="tooltip-row">Normal: <b>${normal}</b> mm</div>
//         <div class="tooltip-row">Departure: <b>${departure}</b>%</div>
//       `;
//     }
//     tooltipContent += `</div>`;
//     layer.bindTooltip(tooltipContent, { sticky: true, direction: 'top', offset: [0, -10], className: 'custom-tooltip' });

//     layer.on('click', () => {
//       this.placeSelected.emit({ layer: this.selectedLayer, code, name });
//     });
//   }

//   toCamelCase(name: string | null): string {
//     if (!name) return '';
//     return name
//       .toLowerCase()
//       .split(' ')
//       .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//       .join(' ');
//   }

//   getDataForLevel(level: string): any[] {
//     switch (level) {
//       case 'country': return this.countryData;
//       case 'region': return this.regionData;
//       case 'subdivision': return this.subdivisionData;
//       case 'state': return this.stateData;
//       case 'district': return this.districtData;
//       case 'block': return this.blockData;
//       default: return [];
//     }
//   }

//   getCodeProp(level: string): string {
//     switch (level) {
//       case 'country': return 'name';
//       case 'region': return 'region_cod';
//       case 'subdivision': return 'SubDiv_Cod';
//       case 'state': return 'state_code';
//       case 'district': return 'district_c';
//       case 'block': return 'block_code';
//       default: return '';
//     }
//   }

//   getNameProp(level: string): string {
//     switch (level) {
//       case 'country': return 'name';
//       case 'region': return 'region_nam';
//       case 'subdivision': return 'subdivisio';
//       case 'state': return 'state_name';
//       case 'district': return 'district';
//       case 'block': return 'block_Name';
//       default: return '';
//     }
//   }

//   getDataCodeKey(level: string): string {
//     switch (level) {
//       case 'country': return 'name';
//       case 'region': return 'r_code';
//       case 'subdivision': return 's_code';
//       case 'state': return 'state_code';
//       case 'district': return 'district_code';
//       case 'block': return 'block_code';
//       default: return '';
//     }
//   }

//   getDailyKey(level: string): string {
//     switch (level) {
//       case 'country': return 'actual_rainfall';
//       case 'region': return 'actual_rainfall';
//       case 'subdivision': return 'actual_subdiv_rainfall';
//       case 'state': return 'actual_state_rainfall';
//       case 'district': return 'actual_rainfall';
//       case 'block': return 'actual_rainfall';
//       default: return '';
//     }
//   }

//   getNormalKey(level: string): string {
//     switch (level) {
//       case 'country': return 'rainfall_normal_value';
//       case 'region':
//       case 'subdivision':
//       case 'state': return 'rainfall_normal_value';
//       case 'district':
//       case 'block': return 'normal_rainfall';
//       default: return '';
//     }
//   }

//   onDateChange() {
//     if (this.selectedDate) {
//       this.startDate = this.selectedDate;
//       this.endDate = this.selectedDate;
//       this.dateChanged.emit({ startDate: this.startDate, endDate: this.endDate });
//       // ngOnChanges will handle prepareLayer
//     }
//   }

//   onModeChange() {
//     this.startDate = this.selectedDate || this.getDefaultDate();
//     this.endDate = this.selectedDate || this.getDefaultDate();
//     this.dateChanged.emit({ startDate: this.startDate, endDate: this.endDate });
//     // ngOnChanges will handle prepareLayer due to isActual change (assuming toggled externally)
//   }

//   private emitDefaultPlace(layerId: string) {
//     let defaultPlace: { layer: string; code: string; name: string };
//     switch (layerId) {
//       case 'country':
//         defaultPlace = { layer: 'country', code: 'INDIA', name: 'India' };
//         break;
//       case 'region':
//         defaultPlace = { layer: 'region', code: '1', name: 'Central India' };
//         break;
//       case 'subdivision':
//         defaultPlace = { layer: 'subdivision', code: '301', name: 'Delhi And Haryana And Chandigarh' };
//         break;
//       case 'state':
//         defaultPlace = { layer: 'state', code: '302', name: 'Delhi (Ut)' };
//         break;
//       case 'district':
//         defaultPlace = { layer: 'district', code: '30102003', name: 'New Delhi' };
//         break;
//       case 'block':
//         defaultPlace = { layer: 'block', code: '3010200302', name: 'Delhi Cantoment' };
//         break;
//       default:
//         defaultPlace = { layer: 'country', code: 'INDIA', name: 'India' };
//     }
//     this.placeSelected.emit(defaultPlace);
//   }

//   onSelectLayer(layerId: string) {
//     this.navItems.forEach(item => (item.active = item.id === layerId));
//     this.selectedLayer = layerId;
//     this.layerSelected.emit(layerId);
//     this.prepareLayer();
//     this.emitDefaultPlace(layerId);
//   }

//   setActiveLayer(layerName: string) {
//     this.navItems.forEach(item => (item.active = item.id === layerName));
//     this.selectedLayer = layerName;
//   }
// }


// import {
//   Component, OnInit, OnChanges, AfterViewInit, OnDestroy,
//   Input, Output, EventEmitter, SimpleChanges, ViewChild, ElementRef
// } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import * as L from 'leaflet';
// import { forkJoin, Observable, of } from 'rxjs';
// import { StateService } from 'src/app/services/state/state.service';
// import { DistrictService } from 'src/app/services/district/district.service';
// import { BlockService } from 'src/app/services/block/BlockService.service';
// import { RegionService } from 'src/app/services/region/region.service';
// import { SubdivisionService } from 'src/app/services/subDivision/subDivision.service';
// import { CountryService } from 'src/app/services/country/country.service';
// import { Constants } from 'src/app/services/constants';

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
//   @Output() dateChanged = new EventEmitter<{ startDate: string, endDate: string }>();
//   @Output() placeSelected = new EventEmitter<{ layer: string, code: string, name: string }>();
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
//   isBuffering: boolean = false;
//   selectedDate: string = '';
//   private lastFetchedParams: Map<string, string> = new Map();

//   navItems = [
//     { id: 'country', label: 'Country', active: true },
//     { id: 'region', label: 'Region', active: false },
//     { id: 'subdivision', label: 'Sub Division', active: false },
//     { id: 'state', label: 'State', active: false },
//     { id: 'district', label: 'District', active: false },
//     { id: 'block', label: 'Block', active: false }
//   ];

//   actualLegendItems = [
//     { color: "#abf200", text: "Very Light<br> Rainfall", fontSize: "9.3px" },
//     { color: "#03ff00", text: "Light Rainfall", fontSize: "9.3px" },
//     { color: "#03ffff", text: "Moderate <br>Rainfall", fontSize: "9.3px" },
//     { color: "#ffff00", text: "Heavy Rainfall", fontSize: "9.3px" },
//     { color: "#ff8c00", text: "Very Heavy<br> Rainfall", fontSize: "9.3px" },
//     { color: "#ff0000", text: "Extremely<br> Heavy Rainfall", fontSize: "9.3px" },
//     { color: "#c0c0c0", text: "No Data", fontSize: "9.3px" },
//   ];
//   departureLegendItems = [
//     { color: "#0096ff", text: "Large Excess <br>[60% or more]", fontSize: "9.3px" },
//     { color: "#32c0f8", text: "Excess <br>[20 to 59]% ", fontSize: "9.3px" },
//     { color: "#00cd5b", text: "Normal <br>[-19 to 19]% ", fontSize: "9.3px" },
//     { color: "#ff2700", text: "Deficient <br>[-59 to -20]% ", fontSize: "9.3px" },
//     { color: "#ffff20", text: "Large Deficient <br>[-99 to -60]% ", fontSize: "9.3px" },
//     { color: "#ffffff", text: "No Rain <br>[-100]% ", fontSize: "9.3px" },
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
//     private constants: Constants
//   ) {
//     const today = new Date().toISOString().split('T')[0];
//     this.selectedDate = today;
//     this.startDate = today;
//     this.endDate = today;
//     this.maxDate = today;
//   }

//   ngOnInit(): void {
//     this.setActiveLayer(this.selectedLayer);
//     this.synchronizeDates();
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (changes['startDate'] || changes['endDate'] || changes['isActual']) {
//       this.synchronizeDates();
//       this.prepareLayer();
//     }
//     if (changes['selectedLayer']) {
//       this.setActiveLayer(this.selectedLayer);
//       this.prepareLayer();
//     }
//   }

//   ngAfterViewInit(): void {
//     this.initializeMap();
//     this.prepareLayer();
//     setTimeout(() => {
//       if (this.map) this.map.invalidateSize();
//     }, 300);
//   }

//   ngOnDestroy(): void {
//     if (this.map) this.map.remove();
//   }

//   private currentParamsKey(): string {
//     const mode = this.isActual ? 'Actual' : 'Departure';
//     return `${this.startDate}_${this.endDate}_${mode}`;
//   }

//   private prepareLayer(): void {
//     if (!this.map) return;
//     this.isBuffering = true;

//     const layer = this.selectedLayer;
//     const needsGeo = this.getGeojsonForLevel(layer) === null;
//     const loadGeo: Observable<any> = needsGeo ? this.loadGeojsonForLevel(layer) : of(null);
//     const currentKey = this.currentParamsKey();
//     const lastKey = this.lastFetchedParams.get(layer);
//     const hasData = this.getDataForLevel(layer).length > 0;
//     const needsData = !hasData || currentKey !== lastKey;
//     const params = {
//       startDate: this.startDate || this.getDefaultDate(),
//       endDate: this.endDate || this.getDefaultDate(),
//       mode: this.isActual ? 'Actual' : 'Departure'
//     };
//     const loadData: Observable<any> = needsData ? this.fetchDataForLayerObservable(layer, params) : of(null);

//     forkJoin({ geo: loadGeo, data: loadData }).subscribe({
//       next: (res) => {
//         if (res.geo !== null) this.setGeojsonForLevel(layer, res.geo);
//         if (res.data !== null) {
//           this.setDataForLevel(layer, res.data.data || []);
//           this.lastFetchedParams.set(layer, currentKey);
//         }
//         this.updateMap();
//         this.emitDefaultPlace(layer);
//         this.isBuffering = false;
//       },
//       error: (err) => {
//         console.error('Error preparing layer:', err);
//         this.isBuffering = false;
//       }
//     });
//   }

//   private loadGeojsonForLevel(level: string): Observable<any> {
//     let url: string;
//     switch (level) {
//       case 'country': url = 'assets/geojson/INDIA_COUNTRY.json'; break;
//       case 'region': url = 'assets/geojson/INDIA_REGIONS.json'; break;
//       case 'subdivision': url = 'assets/geojson/INDIA_SUB_DIVISION.json'; break;
//       case 'state': url = 'assets/geojson/INDIA_STATE.json'; break;
//       case 'district': url = 'assets/geojson/INDIA_DISTRICT.json'; break;
//       case 'block': url = 'assets/geojson/INDIA_BLOCK.json'; break;
//       default: throw new Error(`Unknown level: ${level}`);
//     }
//     return this.http.get(url);
//   }

//   private setGeojsonForLevel(level: string, geojson: any): void {
//     switch (level) {
//       case 'country': this.countryGeojson = geojson; break;
//       case 'region': this.regionGeojson = geojson; break;
//       case 'subdivision': this.subdivisionGeojson = geojson; break;
//       case 'state': this.stateGeojson = geojson; break;
//       case 'district': this.districtGeojson = geojson; break;
//       case 'block': this.blockGeojson = geojson; break;
//     }
//   }

//   private fetchDataForLayerObservable(level: string, params: any): Observable<any> {
//     switch (level) {
//       case 'country': return this.countryService.fetchData(params);
//       case 'region': return this.regionService.fetchData(params);
//       case 'subdivision': return this.subdivisionService.fetchData(params);
//       case 'state': return this.stateService.fetchData(params);
//       case 'district': return this.districtService.fetchData(params);
//       case 'block': return this.blockService.fetchData(params);
//       default: throw new Error(`Unknown level: ${level}`);
//     }
//   }

//   private setDataForLevel(level: string, data: any[]): void {
//     switch (level) {
//       case 'country': this.countryData = data; break;
//       case 'region': this.regionData = data; break;
//       case 'subdivision': this.subdivisionData = data; break;
//       case 'state': this.stateData = data; break;
//       case 'district': this.districtData = data; break;
//       case 'block': this.blockData = data; break;
//     }
//   }

//   private synchronizeDates(): void {
//     if (this.startDate && this.endDate && this.startDate === this.endDate) {
//       this.selectedDate = this.startDate;
//     } else {
//       this.selectedDate = this.startDate || this.getDefaultDate();
//       this.startDate = this.selectedDate;
//       this.endDate = this.selectedDate;
//     }
//     this.dateChanged.emit({ startDate: this.startDate, endDate: this.endDate });
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
//     if (!container) {
//       console.error('Map container not found');
//       return;
//     }
//     this.map = L.map(container, {
//       center: [20.5937, 78.9629],
//       zoom: 4,
//       scrollWheelZoom: true,
//       zoomDelta: 0.25,
//       zoomSnap: 0,
//       wheelPxPerZoomLevel: 120,
//       layers: []
//     });
//     L.tileLayer(
//       'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
//       { attribution: '&copy; OpenStreetMap contributors' }
//     ).addTo(this.map);
//   }

//   private updateMap(): void {
//     if (!this.map) return;
//     this.map.eachLayer((layer: L.Layer) => {
//       if (layer instanceof L.GeoJSON) this.map.removeLayer(layer);
//     });
//     this.renderGeojsonLayer();
//     this.map.invalidateSize();
//   }

//   private renderGeojsonLayer(): void {
//     const geojson = this.getGeojsonForLevel(this.selectedLayer);
//     if (geojson) {
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
//       case 'subdivision': return this.subdivisionGeojson;
//       case 'state': return this.stateGeojson;
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
//       fillOpacity: 1,
//       dashArray: undefined
//     };
//   }

//   get summaryLabel(): string {
//     return 'Daily';
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
//         <div class="tooltip-row">Daily: <b>${daily}</b> mm</div>
//     `;
//     if (!this.isActual) {
//       tooltipContent += `
//         <div class="tooltip-row">Normal: <b>${normal}</b> mm</div>
//         <div class="tooltip-row">Departure: <b>${departure}</b>%</div>
//       `;
//     }
//     tooltipContent += `</div>`;
//     layer.bindTooltip(tooltipContent,
//       { sticky: true, direction: 'top', offset: [0, -10], className: 'custom-tooltip' }
//     );
//     layer.on('click', () => {
//       this.placeSelected.emit({ layer: this.selectedLayer, code, name });
//     });
//   }

//   toCamelCase(name: string | null): string {
//     if (!name) return '';
//     return name
//       .toLowerCase()
//       .split(' ')
//       .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//       .join(' ');
//   }

//   getDataForLevel(level: string): any[] {
//     switch (level) {
//       case 'country': return this.countryData;
//       case 'region': return this.regionData;
//       case 'subdivision': return this.subdivisionData;
//       case 'state': return this.stateData;
//       case 'district': return this.districtData;
//       case 'block': return this.blockData;
//       default: return [];
//     }
//   }

//   getCodeProp(level: string): string {
//     switch (level) {
//       case 'country': return 'name';
//       case 'region': return 'region_cod';
//       case 'subdivision': return 'SubDiv_Cod';
//       case 'state': return 'state_code';
//       case 'district': return 'district_c';
//       case 'block': return 'block_code';
//       default: return '';
//     }
//   }
//   getNameProp(level: string): string {
//     switch (level) {
//       case 'country': return 'name';
//       case 'region': return 'region_nam';
//       case 'subdivision': return 'subdivisio';
//       case 'state': return 'state_name';
//       case 'district': return 'district';
//       case 'block': return 'block_Name';
//       default: return '';
//     }
//   }
//   getDataCodeKey(level: string): string {
//     switch (level) {
//       case 'country': return 'name';
//       case 'region': return 'r_code';
//       case 'subdivision': return 's_code';
//       case 'state': return 'state_code';
//       case 'district': return 'district_code';
//       case 'block': return 'block_code';
//       default: return '';
//     }
//   }
//   getDailyKey(level: string): string {
//     switch (level) {
//       case 'country': return 'actual_rainfall';
//       case 'region': return 'actual_rainfall';
//       case 'subdivision': return 'actual_subdiv_rainfall';
//       case 'state': return 'actual_state_rainfall';
//       case 'district': return 'actual_rainfall';
//       case 'block': return 'actual_rainfall';
//       default: return '';
//     }
//   }
//   getNormalKey(level: string): string {
//     switch (level) {
//       case 'country': return 'rainfall_normal_value';
//       case 'region':
//       case 'subdivision':
//       case 'state': return 'rainfall_normal_value';
//       case 'district':
//       case 'block': return 'normal_rainfall';
//       default: return '';
//     }
//   }

//   onDateChange() {
//     if (this.selectedDate) {
//       this.startDate = this.selectedDate;
//       this.endDate = this.selectedDate;
//       this.dateChanged.emit({ startDate: this.startDate, endDate: this.endDate });
//     }
//   }
//   onModeChange() {
//     this.startDate = this.selectedDate || this.getDefaultDate();
//     this.endDate = this.selectedDate || this.getDefaultDate();
//     this.dateChanged.emit({ startDate: this.startDate, endDate: this.endDate });
//   }

//   private emitDefaultPlace(layerId: string) {
//     const geojson = this.getGeojsonForLevel(layerId);
//     if (!geojson || !geojson.features || geojson.features.length === 0) {
//       this.placeSelected.emit({ layer: 'country', code: 'INDIA', name: 'India' });
//       return;
//     }
//     const feature = geojson.features[0];
//     let code: string = '';
//     let name: string = '';
//     switch (layerId) {
//       case 'country':
//         code = feature.properties.name;
//         name = 'India';
//         break;
//       case 'region':
//         code = feature.properties.region_cod;
//         name = feature.properties.region_nam;
//         break;
//       case 'subdivision':
//         code = feature.properties.SubDiv_Cod;
//         name = feature.properties.subdivisio;
//         break;
//       case 'state':
//         code = feature.properties.state_code;
//         name = feature.properties.state_name;
//         break;
//       case 'district':
//         code = feature.properties.district_c;
//         name = feature.properties.district;
//         break;
//       case 'block':
//         code = feature.properties.block_code;
//         name = feature.properties.block_Name;
//         break;
//       default:
//         code = 'INDIA';
//         name = 'India';
//         break;
//     }
//     this.placeSelected.emit({ layer: layerId, code: String(code), name: this.toCamelCase(name) });
//   }

//   onSelectLayer(layerId: string) {
//     this.navItems.forEach(item => item.active = item.id === layerId);
//     this.selectedLayer = layerId;
//     this.layerSelected.emit(layerId);
//     this.prepareLayer();
//   }

//   setActiveLayer(layerName: string) {
//     this.navItems.forEach(item => item.active = item.id === layerName);
//     this.selectedLayer = layerName;
//   }
// }



import {
  Component, OnInit, OnChanges, AfterViewInit, OnDestroy,
  Input, Output, EventEmitter, SimpleChanges, ViewChild, ElementRef
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { forkJoin, Observable, of } from 'rxjs';
import { StateService } from 'src/app/services/state/state.service';
import { DistrictService } from 'src/app/services/district/district.service';
import { BlockService } from 'src/app/services/block/BlockService.service';
import { RegionService } from 'src/app/services/region/region.service';
import { SubdivisionService } from 'src/app/services/subDivision/subDivision.service';
import { CountryService } from 'src/app/services/country/country.service';
import { Constants } from 'src/app/services/constants';

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
  @Output() dateChanged = new EventEmitter<{ startDate: string, endDate: string }>();
  @Output() placeSelected = new EventEmitter<{ layer: string, code: string, name: string }>();
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
  isBuffering: boolean = false;
  selectedDate: string = '';
  private lastFetchedParams: Map<string, string> = new Map();

  navItems = [
    { id: 'country', label: 'Country', active: true },
    { id: 'region', label: 'Region', active: false },
    { id: 'subdivision', label: 'Sub Division', active: false },
    { id: 'state', label: 'State', active: false },
    { id: 'district', label: 'District', active: false },
    { id: 'block', label: 'Block', active: false }
  ];

  actualLegendItems = [
    { color: "#abf200", text: "Very Light<br> Rainfall", fontSize: "9.3px" },
    { color: "#03ff00", text: "Light Rainfall", fontSize: "9.3px" },
    { color: "#03ffff", text: "Moderate <br>Rainfall", fontSize: "9.3px" },
    { color: "#ffff00", text: "Heavy Rainfall", fontSize: "9.3px" },
    { color: "#ff8c00", text: "Very Heavy<br> Rainfall", fontSize: "9.3px" },
    { color: "#ff0000", text: "Extremely<br> Heavy Rainfall", fontSize: "9.3px" },
    { color: "#c0c0c0", text: "No Data", fontSize: "9.3px" },
  ];
  departureLegendItems = [
    { color: "#0096ff", text: "Large Excess <br>[60% or more]", fontSize: "9.3px" },
    { color: "#32c0f8", text: "Excess <br>[20 to 59]% ", fontSize: "9.3px" },
    { color: "#00cd5b", text: "Normal <br>[-19 to 19]% ", fontSize: "9.3px" },
    { color: "#ff2700", text: "Deficient <br>[-59 to -20]% ", fontSize: "9.3px" },
    { color: "#ffff20", text: "Large Deficient <br>[-99 to -60]% ", fontSize: "9.3px" },
    { color: "#ffffff", text: "No Rain <br>[-100]% ", fontSize: "9.3px" },
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
    private constants: Constants
  ) {
    const today = new Date().toISOString().split('T')[0];
    this.selectedDate = today;
    this.startDate = today;
    this.endDate = today;
    this.maxDate = today;
  }

  ngOnInit(): void {
    this.setActiveLayer(this.selectedLayer);
    this.synchronizeDates();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['startDate'] || changes['endDate'] || changes['isActual']) {
      this.synchronizeDates();
      this.prepareLayer();
    }
    if (changes['selectedLayer']) {
      this.setActiveLayer(this.selectedLayer);
      this.prepareLayer();
    }
  }

  ngAfterViewInit(): void {
    this.initializeMap();
    this.prepareLayer();
    setTimeout(() => {
      if (this.map) this.map.invalidateSize();
    }, 300);
  }

  ngOnDestroy(): void {
    if (this.map) this.map.remove();
  }

  private currentParamsKey(): string {
    const mode = this.isActual ? 'Actual' : 'Departure';
    return `${this.startDate}_${this.endDate}_${mode}`;
  }

  private prepareLayer(): void {
    if (!this.map) return;
    this.isBuffering = true;

    const layer = this.selectedLayer;
    const needsGeo = this.getGeojsonForLevel(layer) === null;
    const loadGeo: Observable<any> = needsGeo ? this.loadGeojsonForLevel(layer) : of(null);
    const currentKey = this.currentParamsKey();
    const lastKey = this.lastFetchedParams.get(layer);
    const hasData = this.getDataForLevel(layer).length > 0;
    const needsData = !hasData || currentKey !== lastKey;
    const params = {
      startDate: this.startDate || this.getDefaultDate(),
      endDate: this.endDate || this.getDefaultDate(),
      mode: this.isActual ? 'Actual' : 'Departure'
    };
    const loadData: Observable<any> = needsData ? this.fetchDataForLayerObservable(layer, params) : of(null);

    forkJoin({ geo: loadGeo, data: loadData }).subscribe({
      next: (res) => {
        if (res.geo !== null) this.setGeojsonForLevel(layer, res.geo);
        if (res.data !== null) {
          this.setDataForLevel(layer, res.data.data || []);
          this.lastFetchedParams.set(layer, currentKey);
        }
        this.updateMap();
        this.emitDefaultPlace(layer);
        this.isBuffering = false;
      },
      error: (err) => {
        console.error('Error preparing layer:', err);
        this.isBuffering = false;
      }
    });
  }

  private loadGeojsonForLevel(level: string): Observable<any> {
    let url: string;
    switch (level) {
      case 'country': url = 'assets/geojson/INDIA_COUNTRY.json'; break;
      case 'region': url = 'assets/geojson/INDIA_REGIONS.json'; break;
      case 'subdivision': url = 'assets/geojson/INDIA_SUB_DIVISION.json'; break;
      case 'state': url = 'assets/geojson/INDIA_STATE.json'; break;
      case 'district': url = 'assets/geojson/INDIA_DISTRICT.json'; break;
      case 'block': url = 'assets/geojson/INDIA_BLOCK.json'; break;
      default: throw new Error(`Unknown level: ${level}`);
    }
    return this.http.get(url);
  }

  private setGeojsonForLevel(level: string, geojson: any): void {
    switch (level) {
      case 'country': this.countryGeojson = geojson; break;
      case 'region': this.regionGeojson = geojson; break;
      case 'subdivision': this.subdivisionGeojson = geojson; break;
      case 'state': this.stateGeojson = geojson; break;
      case 'district': this.districtGeojson = geojson; break;
      case 'block': this.blockGeojson = geojson; break;
    }
  }

  private fetchDataForLayerObservable(level: string, params: any): Observable<any> {
    switch (level) {
      case 'country': return this.countryService.fetchData(params);
      case 'region': return this.regionService.fetchData(params);
      case 'subdivision': return this.subdivisionService.fetchData(params);
      case 'state': return this.stateService.fetchData(params);
      case 'district': return this.districtService.fetchData(params);
      case 'block': return this.blockService.fetchData(params);
      default: throw new Error(`Unknown level: ${level}`);
    }
  }

  private setDataForLevel(level: string, data: any[]): void {
    switch (level) {
      case 'country': this.countryData = data; break;
      case 'region': this.regionData = data; break;
      case 'subdivision': this.subdivisionData = data; break;
      case 'state': this.stateData = data; break;
      case 'district': this.districtData = data; break;
      case 'block': this.blockData = data; break;
    }
  }

  private synchronizeDates(): void {
    if (this.startDate && this.endDate && this.startDate === this.endDate) {
      this.selectedDate = this.startDate;
    } else {
      this.selectedDate = this.startDate || this.getDefaultDate();
      this.startDate = this.selectedDate;
      this.endDate = this.selectedDate;
    }
    this.dateChanged.emit({ startDate: this.startDate, endDate: this.endDate });
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
    this.map = L.map(container, {
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
      { attribution: '&copy; OpenStreetMap contributors' }
    ).addTo(this.map);
  }

  private updateMap(): void {
    if (!this.map) return;
    this.map.eachLayer((layer: L.Layer) => {
      if (layer instanceof L.GeoJSON) this.map.removeLayer(layer);
    });
    this.renderGeojsonLayer();
    this.map.invalidateSize();
  }

  private renderGeojsonLayer(): void {
    const geojson = this.getGeojsonForLevel(this.selectedLayer);
    if (geojson) {
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
      case 'subdivision': return this.subdivisionGeojson;
      case 'state': return this.stateGeojson;
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
    return 'Daily';
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
    layer.bindTooltip(tooltipContent,
      { sticky: true, direction: 'top', offset: [0, -10], className: 'custom-tooltip' }
    );
    layer.on('click', () => {
      this.placeSelected.emit({ layer: this.selectedLayer, code, name });
    });
  }

  toCamelCase(name: string | null): string {
    if (!name) return '';
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getDataForLevel(level: string): any[] {
    switch (level) {
      case 'country': return this.countryData;
      case 'region': return this.regionData;
      case 'subdivision': return this.subdivisionData;
      case 'state': return this.stateData;
      case 'district': return this.districtData;
      case 'block': return this.blockData;
      default: return [];
    }
  }

  getCodeProp(level: string): string {
    switch (level) {
      case 'country': return 'name';
      case 'region': return 'region_cod';
      case 'subdivision': return 'SubDiv_Cod';
      case 'state': return 'state_code';
      case 'district': return 'district_c';
      case 'block': return 'block_code';
      default: return '';
    }
  }
  getNameProp(level: string): string {
    switch (level) {
      case 'country': return 'name';
      case 'region': return 'region_nam';
      case 'subdivision': return 'subdivisio';
      case 'state': return 'state_name';
      case 'district': return 'district';
      case 'block': return 'block_Name';
      default: return '';
    }
  }
  getDataCodeKey(level: string): string {
    switch (level) {
      case 'country': return 'name';
      case 'region': return 'r_code';
      case 'subdivision': return 's_code';
      case 'state': return 'state_code';
      case 'district': return 'district_code';
      case 'block': return 'block_code';
      default: return '';
    }
  }
  getDailyKey(level: string): string {
    switch (level) {
      case 'country': return 'actual_rainfall';
      case 'region': return 'actual_rainfall';
      case 'subdivision': return 'actual_subdiv_rainfall';
      case 'state': return 'actual_state_rainfall';
      case 'district': return 'actual_rainfall';
      case 'block': return 'actual_rainfall';
      default: return '';
    }
  }
  getNormalKey(level: string): string {
    switch (level) {
      case 'country': return 'rainfall_normal_value';
      case 'region':
      case 'subdivision':
      case 'state': return 'rainfall_normal_value';
      case 'district':
      case 'block': return 'normal_rainfall';
      default: return '';
    }
  }

  onDateChange() {
    if (this.selectedDate) {
      this.startDate = this.selectedDate;
      this.endDate = this.selectedDate;
      this.dateChanged.emit({ startDate: this.startDate, endDate: this.endDate });
      this.prepareLayer();
    }
  }
  onModeChange() {
    this.startDate = this.selectedDate || this.getDefaultDate();
    this.endDate = this.selectedDate || this.getDefaultDate();
    this.dateChanged.emit({ startDate: this.startDate, endDate: this.endDate });
    this.prepareLayer();
  }

  private emitDefaultPlace(layerId: string) {
    const geojson = this.getGeojsonForLevel(layerId);
    if (!geojson || !geojson.features || geojson.features.length === 0) {
      this.placeSelected.emit({ layer: 'country', code: 'INDIA', name: 'India' });
      return;
    }
    const feature = geojson.features[0];
    let code: string = '';
    let name: string = '';
    switch (layerId) {
      case 'country':
        code = feature.properties.name;
        name = 'India';
        break;
      case 'region':
        code = feature.properties.region_cod;
        name = feature.properties.region_nam;
        break;
      case 'subdivision':
        code = feature.properties.SubDiv_Cod;
        name = feature.properties.subdivisio;
        break;
      case 'state':
        code = feature.properties.state_code;
        name = feature.properties.state_name;
        break;
      case 'district':
        code = feature.properties.district_c;
        name = feature.properties.district;
        break;
      case 'block':
        code = feature.properties.block_code;
        name = feature.properties.block_Name;
        break;
      default:
        code = 'INDIA';
        name = 'India';
        break;
    }
    this.placeSelected.emit({ layer: layerId, code: String(code), name: this.toCamelCase(name) });
  }

  onSelectLayer(layerId: string) {
    this.navItems.forEach(item => item.active = item.id === layerId);
    this.selectedLayer = layerId;
    this.layerSelected.emit(layerId);
    this.prepareLayer();
  }

  setActiveLayer(layerName: string) {
    this.navItems.forEach(item => item.active = item.id === layerName);
    this.selectedLayer = layerName;
  }
}