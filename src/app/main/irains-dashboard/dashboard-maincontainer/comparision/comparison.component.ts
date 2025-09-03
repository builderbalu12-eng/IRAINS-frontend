// import { Component, OnInit, OnChanges, SimpleChanges, AfterViewInit, Renderer2, Input } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import * as L from 'leaflet';
// import { StateService } from 'src/app/services/state/state.service';
// import { DistrictService } from 'src/app/services/district/district.service';
// import { BlockService } from 'src/app/services/block/BlockService.service';
// import { RegionService } from 'src/app/services/region/region.service';
// import { SubdivisionService } from 'src/app/services/subDivision/subDivision.service';
// import { Constants } from 'src/app/services/constants';
// import { forkJoin } from 'rxjs';

// interface SummaryValue {
//   name: string | null;
//   value: number | null;
// }

// interface Summary {
//   highest: { daily: SummaryValue; normal: SummaryValue; departure: SummaryValue };
//   lowest: { daily: SummaryValue; normal: SummaryValue; departure: SummaryValue };
// }

// @Component({
//   selector: 'app-comparison',
//   templateUrl: './comparison.component.html',
//   styleUrls: ['./comparison.component.css']
// })
// export class ComparisonComponent implements OnInit, OnChanges, AfterViewInit {
//   @Input() showComparison = false;
//   @Input() startDate = '';
//   @Input() endDate = '';
//   @Input() isActual = false;
//   @Input() selectedLevels: string[] = ['state', 'district', 'block']; // Default values
//   @Input() mode: string = 'state'; // Default value
//   stateGeojson: any = null;
//   regionGeojson: any = null;
//   subdivisionGeojson: any = null;
//   districtGeojson: any = null;
//   blockGeojson: any = null;
//   stateData: any[] = [];
//   regionData: any[] = [];
//   subdivisionData: any[] = [];
//   districtData: any[] = [];
//   blockData: any[] = [];
//   maxDate = '';
//   selectedState: any = null;
//   selectedRegion: any = null;
//   selectedSubdivision: any = null;
//   selectedDistrict: any = null;
//   selectedBlock: string | null = null;
//   private map1!: L.Map;
//   private map2!: L.Map;
//   private map3!: L.Map;
//   map1Summary: Summary = this.emptySummary();
//   map2Summary: Summary = this.emptySummary();
//   map3Summary: Summary = this.emptySummary();
//   isGeojsonLoaded = false;
//   isBuffering: boolean = false;
//   private fullscreenMapId: string | null = null;

//   constructor(
//     private http: HttpClient,
//     private stateService: StateService,
//     private districtService: DistrictService,
//     private blockService: BlockService,
//     private regionService: RegionService,
//     private subdivisionService: SubdivisionService,
//     private constants: Constants,
//     private renderer: Renderer2
//   ) {}

//   ngOnInit(): void {
//     this.loadGeojsonData();
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (changes['showComparison']?.currentValue && this.isGeojsonLoaded) {
//       setTimeout(() => this.initializeMaps(), 0);
//       this.fetchAllData();
//     }
//     if (
//       (changes['startDate'] && !changes['startDate'].firstChange) ||
//       (changes['endDate'] && !changes['endDate'].firstChange) ||
//       (changes['isActual'] && !changes['isActual'].firstChange) ||
//       (changes['selectedLevels'] && !changes['selectedLevels'].firstChange) ||
//       (changes['mode'] && !changes['mode'].firstChange)
//     ) {
//       this.fetchAllData();
//     }
//   }

//   ngAfterViewInit(): void {}

//   private loadGeojsonData(): void {
//     forkJoin({
//       states: this.http.get('assets/geojson/INDIA_STATE.json'),
//       districts: this.http.get('assets/geojson/INDIA_DISTRICT.json'),
//       blocks: this.http.get('assets/geojson/INDIA_BLOCK.json'),
//       regions: this.http.get('assets/geojson/INDIA_REGIONS.json'),
//       subdivisions: this.http.get('assets/geojson/INDIA_SUB_DIVISION.json')
//     }).subscribe({
//       next: ({ states, districts, blocks, regions, subdivisions }) => {
//         this.stateGeojson = states;
//         this.districtGeojson = districts;
//         this.blockGeojson = blocks;
//         this.regionGeojson = regions;
//         this.subdivisionGeojson = subdivisions;
//         this.isGeojsonLoaded = true;
//         if (this.showComparison) {
//           setTimeout(() => this.initializeMaps(), 0);
//           this.fetchAllData();
//         }
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
//       blockRes: this.blockService.fetchData(params)
//     }).subscribe({
//       next: ({ stateRes, regionRes, subdivisionRes, districtRes, blockRes }) => {
//         this.stateData = stateRes.data || [];
//         this.regionData = regionRes.data || [];
//         this.subdivisionData = subdivisionRes.data || [];
//         this.districtData = districtRes.data || [];
//         this.blockData = blockRes.data || [];
//         this.computeSummaries();
//         this.updateMaps();
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

//   private emptySummary(): Summary {
//     return {
//       highest: {
//         daily: { name: null, value: null },
//         normal: { name: null, value: null },
//         departure: { name: null, value: null }
//       },
//       lowest: {
//         daily: { name: null, value: null },
//         normal: { name: null, value: null },
//         departure: { name: null, value: null }
//       }
//     };
//   }

//   private computeSummaries(): void {
//     this.map1Summary = this.computeSummaryForLevel(this.selectedLevels[0]);
//     this.map2Summary = this.computeSummaryForLevel(this.selectedLevels[1]);
//     this.map3Summary = this.computeSummaryForLevel(this.selectedLevels[2]);
//   }

//   private computeSummaryForLevel(level: string): Summary {
//     let data: any[] = [];
//     let nameKey: string = '';
//     let dailyKey: string = '';
//     let normalKey: string = '';
//     let departureKey: string = '';
//     switch (level) {
//       case 'state':
//         data = this.getFilteredStates();
//         nameKey = 'state_name';
//         dailyKey = 'actual_state_rainfall';
//         normalKey = 'rainfall_normal_value';
//         departureKey = 'departure';
//         break;
//       case 'region':
//         data = this.regionData;
//         nameKey = 'name';
//         dailyKey = 'actual_rainfall';
//         normalKey = 'rainfall_normal_value';
//         departureKey = 'departure';
//         break;
//       case 'subdivision':
//         data = this.getFilteredSubdivisions();
//         nameKey = 'subdiv_name';
//         dailyKey = 'actual_subdiv_rainfall';
//         normalKey = 'rainfall_normal_value';
//         departureKey = 'departure';
//         break;
//       case 'district':
//         data = this.getFilteredDistrictsData();
//         nameKey = 'district_name';
//         dailyKey = 'actual_rainfall';
//         normalKey = 'normal_rainfall';
//         departureKey = 'departure';
//         break;
//       case 'block':
//         data = this.getFilteredBlocksData();
//         nameKey = 'block_name';
//         dailyKey = 'actual_rainfall';
//         normalKey = 'normal_rainfall';
//         departureKey = 'departure';
//         break;
//       default:
//         return this.emptySummary();
//     }
//     if (!data || data.length === 0) {
//       return this.emptySummary();
//     }
//     return this.computeSummary(data, nameKey, dailyKey, normalKey, departureKey);
//   }

//   private getFilteredStates(): any[] {
//     if (!this.selectedRegion) return this.stateData;
//     const regionCode = String(this.selectedRegion.properties.region_cod).trim();
//     return this.stateData.filter(d => String(d.region_code).trim() === regionCode);
//   }

//   private getFilteredSubdivisions(): any[] {
//     if (!this.selectedRegion) return this.subdivisionData;
//     const regionCode = String(this.selectedRegion.properties.region_cod).trim();
//     return this.subdivisionData.filter(d => String(d.region_code).trim() === regionCode);
//   }

//   private getFilteredDistrictsData(): any[] {
//     if (!this.districtData || this.districtData.length === 0) return [];
//     if (this.mode === 'state' && this.selectedState) {
//       const stateCode = String(this.selectedState.properties.state_code).trim();
//       return this.districtData.filter(d => {
//         const distCode = String(d.state_code).trim();
//         const firstDigit = stateCode.charAt(0);
//         const lastTwo = stateCode.slice(-2);
//         return distCode.charAt(0) === firstDigit && distCode.slice(-2) === lastTwo;
//       });
//     }
//     if (this.mode === 'subdivision' && this.selectedSubdivision) {
//       const subdivCode = String(this.selectedSubdivision.properties.SubDiv_Cod).trim();
//       return this.districtData.filter(d => String(d.sub_division_code).trim() === subdivCode);
//     }
//     if (this.selectedRegion) {
//       const regionCode = String(this.selectedRegion.properties.region_cod).trim();
//       const relatedStates = this.getFilteredStates();
//       const relatedSubdivisions = this.getFilteredSubdivisions();
//       const stateCodes = relatedStates.map(s => String(s.state_code).trim());
//       const subdivCodes = relatedSubdivisions.map(s => String(s.s_code).trim());
//       return this.districtData.filter(d =>
//         stateCodes.includes(String(d.state_code).trim()) ||
//         subdivCodes.includes(String(d.sub_division_code).trim())
//       );
//     }
//     return this.districtData;
//   }

//   private getFilteredBlocksData(): any[] {
//     if (!this.blockData || this.blockData.length === 0) return [];
//     if (this.selectedDistrict) {
//       const districtCode = String(this.selectedDistrict.properties.district_c).trim();
//       return this.blockData.filter(b => String(b.district_code || b.district_c).trim() === districtCode);
//     }
//     if (this.mode === 'state' && this.selectedState) {
//       const stateCode = String(this.selectedState.properties.state_code).trim();
//       return this.blockData.filter(b => {
//         const blockStateCode = String(b.state_code).trim();
//         const firstDigit = stateCode.charAt(0);
//         const lastTwo = stateCode.slice(-2);
//         return blockStateCode.charAt(0) === firstDigit && blockStateCode.slice(-2) === lastTwo;
//       });
//     }
//     if (this.mode === 'subdivision' && this.selectedSubdivision) {
//       const subdivCode = String(this.selectedSubdivision.properties.SubDiv_Cod).trim();
//       return this.blockData.filter(b => String(b.sub_division_code).trim() === subdivCode);
//     }
//     if (this.selectedRegion) {
//       const regionCode = String(this.selectedRegion.properties.region_cod).trim();
//       const relatedStates = this.getFilteredStates();
//       const relatedSubdivisions = this.getFilteredSubdivisions();
//       const stateCodes = relatedStates.map(s => String(s.state_code).trim());
//       const subdivCodes = relatedSubdivisions.map(s => String(s.s_code).trim());
//       return this.blockData.filter(b =>
//         stateCodes.includes(String(b.state_code).trim()) ||
//         subdivCodes.includes(String(b.sub_division_code).trim())
//       );
//     }
//     return this.blockData;
//   }

//   private getFilteredBlocksGeojson(): any {
//     if (!this.blockGeojson) return this.blockGeojson;
//     if (this.selectedDistrict) {
//       const districtCode = String(this.selectedDistrict.properties.district_c).trim();
//       const filtered = this.blockGeojson.features.filter((f: any) =>
//         String(f.properties.district_c).trim() === districtCode
//       );
//       return { ...this.blockGeojson, features: filtered };
//     }
//     if (this.mode === 'state' && this.selectedState) {
//       const stateCode = String(this.selectedState.properties.state_code).trim();
//       const filtered = this.blockGeojson.features.filter((f: any) => {
//         const blockStateCode = String(f.properties.state_code).trim();
//         const firstDigit = stateCode.charAt(0);
//         const lastTwo = stateCode.slice(-2);
//         return blockStateCode.charAt(0) === firstDigit && blockStateCode.slice(-2) === lastTwo;
//       });
//       return { ...this.blockGeojson, features: filtered };
//     }
//     if (this.mode === 'subdivision' && this.selectedSubdivision) {
//       const subdivCode = String(this.selectedSubdivision.properties.SubDiv_Cod).trim();
//       const filtered = this.blockGeojson.features.filter((f: any) =>
//         String(f.properties.subdivis_1).trim() === subdivCode
//       );
//       return { ...this.blockGeojson, features: filtered };
//     }
//     if (this.selectedRegion) {
//       const regionCode = String(this.selectedRegion.properties.region_cod).trim();
//       const filtered = this.blockGeojson.features.filter((f: any) =>
//         String(f.properties.region_cod).trim() === regionCode
//       );
//       return { ...this.blockGeojson, features: filtered };
//     }
//     return this.blockGeojson;
//   }

//   private computeSummary(
//     data: any[],
//     nameKey: string,
//     dailyKey: string,
//     normalKey: string,
//     departureKey: string
//   ): Summary {
//     let highestDaily: SummaryValue = { name: null, value: null };
//     let lowestDaily: SummaryValue = { name: null, value: null };
//     let highestNormal: SummaryValue = { name: null, value: null };
//     let lowestNormal: SummaryValue = { name: null, value: null };
//     let highestDeparture: SummaryValue = { name: null, value: null };
//     let lowestDeparture: SummaryValue = { name: null, value: null };
//     data.forEach(item => {
//       const dailyRaw = this.parseNumberSafely(item[dailyKey]);
//       const normalRaw = this.parseNumberSafely(item[normalKey]);
//       const departureRaw = this.parseNumberSafely(item[departureKey]);
//       const name = this.toCamelCase(item[nameKey] || null);
//       const dailyVal = dailyRaw !== null ? this.constants.trimToOneDecimals(dailyRaw) : null;
//       const normalVal = normalRaw !== null ? this.constants.trimToOneDecimals(normalRaw) : null;
//       const departureVal = departureRaw !== null ? this.constants.trimToOneDecimals(departureRaw) : null;
//       if (dailyVal !== null && (highestDaily.value === null || dailyVal > highestDaily.value)) {
//         highestDaily = { name, value: dailyVal };
//       }
//       if (dailyVal !== null && (lowestDaily.value === null || dailyVal < lowestDaily.value)) {
//         lowestDaily = { name, value: dailyVal };
//       }
//       if (normalVal !== null && (highestNormal.value === null || normalVal > highestNormal.value)) {
//         highestNormal = { name, value: normalVal };
//       }
//       if (normalVal !== null && (lowestNormal.value === null || normalVal < lowestNormal.value)) {
//         lowestNormal = { name, value: normalVal };
//       }
//       if (departureVal !== null && (highestDeparture.value === null || departureVal > highestDeparture.value)) {
//         highestDeparture = { name, value: departureVal };
//       }
//       if (departureVal !== null && (lowestDeparture.value === null || departureVal < lowestDeparture.value)) {
//         lowestDeparture = { name, value: departureVal };
//       }
//     });
//     return {
//       highest: {
//         daily: highestDaily,
//         normal: highestNormal,
//         departure: highestDeparture
//       },
//       lowest: {
//         daily: lowestDaily,
//         normal: lowestNormal,
//         departure: lowestDeparture
//       }
//     };
//   }

//   private parseNumberSafely(value: any): number | null {
//     if (value === null || value === undefined) return null;
//     const num = parseFloat(value);
//     if (isNaN(num)) return null;
//     return num;
//   }

//   private initializeMaps() {
//     if (!this.map1) {
//       this.map1 = this.createBaseMap('map1');
//       this.map2 = this.createBaseMap('map2');
//       this.map3 = this.createBaseMap('map3');
//     }
//     this.renderGeojsonLayers();
//   }

//   private createBaseMap(containerId: string): L.Map {
//     const map = L.map(containerId, {
//       center: [20.5937, 78.9629],
//       zoom: 6,
//       scrollWheelZoom: false,
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

//   private updateMaps(): void {
//     [this.map1, this.map2, this.map3].forEach(map => {
//       map.eachLayer(layer => {
//         if (layer instanceof L.GeoJSON) map.removeLayer(layer);
//       });
//     });
//     this.renderGeojsonLayers();
//   }

//   private renderGeojsonLayers(): void {
//     this.selectedLevels.forEach((level, index) => {
//       const map = [this.map1, this.map2, this.map3][index];
//       const geojson = this.getGeojsonForLevel(level);
//       if (geojson) {
//         const layer = L.geoJSON(geojson, {
//           style: (f: any) => this.styleFeature(f, level),
//           onEachFeature: (f: any, l: L.Layer) => this.onEachFeature(f, l, level)
//         }).addTo(map);
//         if (layer.getBounds().isValid()) {
//           map.fitBounds(layer.getBounds(), { padding: [20, 20] });
//         }
//       }
//     });
//     this.removeFocusFromLayers();
//   }

//   private getGeojsonForLevel(level: string): any {
//     if (level === 'region') return this.regionGeojson;
//     if (level === 'state') return this.getFilteredStateGeojson();
//     if (level === 'subdivision') return this.getFilteredSubdivisionGeojson();
//     if (level === 'district') return this.getFilteredDistrictsGeojson();
//     if (level === 'block') return this.getFilteredBlocksGeojson();
//     return null;
//   }

//   private getFilteredStateGeojson(): any {
//     if (!this.stateGeojson || !this.selectedRegion) return this.stateGeojson;
//     const regionCode = String(this.selectedRegion.properties.region_cod).trim();
//     const stateCodes = this.stateData
//       .filter(s => String(s.region_code).trim() === regionCode)
//       .map(s => String(s.state_code).trim());
//     const filtered = this.stateGeojson.features.filter((f: any) =>
//       stateCodes.includes(String(f.properties.state_code).trim())
//     );
//     return { ...this.stateGeojson, features: filtered };
//   }

//   private getFilteredSubdivisionGeojson(): any {
//     if (!this.subdivisionGeojson || !this.selectedRegion) return this.subdivisionGeojson;
//     const regionCode = String(this.selectedRegion.properties.region_cod).trim();
//     const subdivCodes = this.subdivisionData
//       .filter(s => String(s.region_code).trim() === regionCode)
//       .map(s => String(s.s_code).trim());
//     const filtered = this.subdivisionGeojson.features.filter((f: any) =>
//       subdivCodes.includes(String(f.properties.SubDiv_Cod).trim())
//     );
//     return { ...this.subdivisionGeojson, features: filtered };
//   }

//   private getFilteredDistrictsGeojson(): any {
//     if (!this.districtGeojson) return this.districtGeojson;
//     if (this.mode === 'state' && this.selectedState) {
//       const stateCode = String(this.selectedState.properties.state_code).trim();
//       const filtered = this.districtGeojson.features.filter((f: any) => {
//         const distCode = String(f.properties.state_code).trim();
//         const firstDigit = stateCode.charAt(0);
//         const lastTwo = stateCode.slice(-2);
//         return distCode.charAt(0) === firstDigit && distCode.slice(-2) === lastTwo;
//       });
//       return { ...this.districtGeojson, features: filtered };
//     }
//     if (this.mode === 'subdivision' && this.selectedSubdivision) {
//       const subdivCode = String(this.selectedSubdivision.properties.SubDiv_Cod).trim();
//       const filtered = this.districtGeojson.features.filter((f: any) =>
//         String(f.properties.subdivis_1).trim() === subdivCode
//       );
//       return { ...this.districtGeojson, features: filtered };
//     }
//     if (this.selectedRegion) {
//       const regionCode = String(this.selectedRegion.properties.region_cod).trim();
//       const filtered = this.districtGeojson.features.filter((f: any) =>
//         String(f.properties.region_cod).trim() === regionCode
//       );
//       return { ...this.districtGeojson, features: filtered };
//     }
//     return this.districtGeojson;
//   }

//   private removeFocusFromLayers(): void {
//     [this.map1, this.map2, this.map3].forEach(map => {
//       map.eachLayer(layer => {
//         if ((layer as any)._path) {
//           const elem = (layer as any)._path as SVGElement;
//           elem.removeAttribute('tabindex');
//           elem.style.outline = 'none';
//         }
//       });
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
//     const isSelected = this.isFeatureSelected(feature, level);
//     return {
//       fillColor,
//       color: isSelected ? '#000' : '#333',
//       weight: isSelected ? 3 : 1,
//       fillOpacity: level === 'region' ? 1 : level === 'subdivision' ? 0.85 : 1,
//       dashArray: level === 'block' && isSelected ? '4' : undefined
//     };
//   }

//   private isFeatureSelected(feature: any, level: string): boolean {
//     if (level === 'region') return this.selectedRegion === feature;
//     if (level === 'state') return this.selectedState === feature;
//     if (level === 'subdivision') return this.selectedSubdivision === feature;
//     if (level === 'district') return this.selectedDistrict === feature;
//     if (level === 'block') return this.toCamelCase(feature.properties.block_Name) === this.selectedBlock;
//     return false;
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
//     layer.bindTooltip(`
//       <div>
//         <div><b>${name}</b></div>
//         <div>${this.summaryLabel}: <b>${daily}</b></div>
//         <div>Normal: <b>${normal}</b></div>
//         <div>Departure: <b>${departure}</b></div>
//       </div>
//     `, { sticky: true });
//     layer.on({
//       click: () => {
//         this.handleFeatureClick(feature, level);
//         this.computeSummaries();
//         this.updateMaps();
//       }
//     });
//   }

//   private handleFeatureClick(feature: any, level: string): void {
//     if (level === 'region') {
//       this.selectedRegion = feature;
//       this.selectedState = null;
//       this.selectedSubdivision = null;
//       this.selectedDistrict = null;
//       this.selectedBlock = null;
//     } else if (level === 'state') {
//       this.selectedState = feature;
//       this.selectedSubdivision = null;
//       this.selectedDistrict = null;
//       this.selectedBlock = null;
//     } else if (level === 'subdivision') {
//       this.selectedSubdivision = feature;
//       this.selectedState = null;
//       this.selectedDistrict = null;
//       this.selectedBlock = null;
//     } else if (level === 'district') {
//       this.selectedDistrict = feature;
//       this.selectedBlock = null;
//     } else if (level === 'block') {
//       this.selectedBlock = feature.properties.block_Name;
//     }
//   }

//   toCamelCase(name: string | null): string {
//     if (!name) return '';
//     return name
//       .split(' ')
//       .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
//       .join(' ');
//   }

//   private capitalizeLevelName(level: string): string {
//     if (level === 'region') return 'Region';
//     if (level === 'state') return 'State';
//     if (level === 'subdivision') return 'Subdivision';
//     if (level === 'district') return 'District';
//     if (level === 'block') return 'Block';
//     return '';
//   }

//   get dateRangeLabel(): string {
//     if (!this.startDate) return '';
//     const formatDate = (d: string) => {
//       const dateObj = new Date(d);
//       const day = dateObj.getDate().toString().padStart(2, '0');
//       const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
//       const year = dateObj.getFullYear();
//       return `${day}-${month}-${year}`;
//     };
//     if (this.startDate === this.endDate) {
//       return `Date : ${formatDate(this.startDate)}`;
//     } else {
//       return `Date : ${formatDate(this.startDate)} to ${formatDate(this.endDate)}`;
//     }
//   }

//   getMapTitle(level: string, mapIndex: number): string {
//     if (mapIndex === 0) {
//       return `${this.capitalizeLevelName(level)} Map`;
//     }
//     if (mapIndex === 1) {
//       const map1Level = this.selectedLevels[0];
//       const levelName = this.capitalizeLevelName(this.selectedLevels[1]);
//       if (map1Level === 'region' && this.selectedRegion) {
//         return `${this.toCamelCase(this.selectedRegion.properties.region_nam)} ${levelName} Map`;
//       } else if (map1Level === 'state' && this.selectedState) {
//         return `${this.toCamelCase(this.selectedState.properties.state_name)} ${levelName} Map`;
//       } else if (map1Level === 'subdivision' && this.selectedSubdivision) {
//         return `${this.toCamelCase(this.selectedSubdivision.properties.subdivisio)} ${levelName} Map`;
//       } else if (map1Level === 'district' && this.selectedDistrict) {
//         return `${this.toCamelCase(this.selectedDistrict.properties.district)} ${levelName} Map`;
//       } else if (map1Level === 'block' && this.selectedBlock) {
//         return `${this.toCamelCase(this.selectedBlock)} ${levelName} Map`;
//       }
//       return `${levelName} Map`;
//     }
//     if (mapIndex === 2) {
//       const map2Level = this.selectedLevels[1];
//       const levelName = this.capitalizeLevelName(this.selectedLevels[2]);
//       if (map2Level === 'region' && this.selectedRegion) {
//         return `${this.toCamelCase(this.selectedRegion.properties.region_nam)} ${levelName} Map`;
//       } else if (map2Level === 'state' && this.selectedState) {
//         return `${this.toCamelCase(this.selectedState.properties.state_name)} ${levelName} Map`;
//       } else if (map2Level === 'subdivision' && this.selectedSubdivision) {
//         return `${this.toCamelCase(this.selectedSubdivision.properties.subdivisio)} ${levelName} Map`;
//       } else if (map2Level === 'district' && this.selectedDistrict) {
//         return `${this.toCamelCase(this.selectedDistrict.properties.district)} ${levelName} Map`;
//       } else if (map2Level === 'block' && this.selectedBlock) {
//         return `${this.toCamelCase(this.selectedBlock)} ${levelName} Map`;
//       }
//       const map1Level = this.selectedLevels[0];
//       if (map1Level === 'region' && this.selectedRegion) {
//         return `${this.toCamelCase(this.selectedRegion.properties.region_nam)} ${levelName} Map`;
//       } else if (map1Level === 'state' && this.selectedState) {
//         return `${this.toCamelCase(this.selectedState.properties.state_name)} ${levelName} Map`;
//       } else if (map1Level === 'subdivision' && this.selectedSubdivision) {
//         return `${this.toCamelCase(this.selectedSubdivision.properties.subdivisio)} ${levelName} Map`;
//       } else if (map1Level === 'district' && this.selectedDistrict) {
//         return `${this.toCamelCase(this.selectedDistrict.properties.district)} ${levelName} Map`;
//       } else if (map1Level === 'block' && this.selectedBlock) {
//         return `${this.toCamelCase(this.selectedBlock)} ${levelName} Map`;
//       }
//       return `${levelName} Map`;
//     }
//     return '';
//   }

//   getDataForLevel(level: string): any[] {
//     if (level === 'region') return this.regionData;
//     if (level === 'state') return this.getFilteredStates();
//     if (level === 'subdivision') return this.getFilteredSubdivisions();
//     if (level === 'district') return this.getFilteredDistrictsData();
//     if (level === 'block') return this.getFilteredBlocksData();
//     return [];
//   }

//   getCodeProp(level: string): string {
//     if (level === 'region') return 'region_cod';
//     if (level === 'state') return 'state_code';
//     if (level === 'subdivision') return 'SubDiv_Cod';
//     if (level === 'district') return 'district_c';
//     if (level === 'block') return 'block_code' || 'block_c';
//     return '';
//   }

//   getNameProp(level: string): string {
//     if (level === 'region') return 'region_nam';
//     if (level === 'state') return 'state_name';
//     if (level === 'subdivision') return 'subdivisio';
//     if (level === 'district') return 'district';
//     if (level === 'block') return 'block_Name';
//     return '';
//   }

//   getDataCodeKey(level: string): string {
//     if (level === 'region') return 'r_code';
//     if (level === 'state') return 'state_code';
//     if (level === 'subdivision') return 's_code';
//     if (level === 'district') return 'district_code';
//     if (level === 'block') return 'block_code';
//     return '';
//   }

//   getDailyKey(level: string): string {
//     if (level === 'region') return 'actual_rainfall';
//     if (level === 'state') return 'actual_state_rainfall';
//     if (level === 'subdivision') return 'actual_subdiv_rainfall';
//     if (level === 'district') return 'actual_rainfall';
//     if (level === 'block') return 'actual_rainfall';
//     return '';
//   }

//   getNormalKey(level: string): string {
//     if (level === 'region' || level === 'state' || level === 'subdivision') return 'rainfall_normal_value';
//     if (level === 'district' || level === 'block') return 'normal_rainfall';
//     return '';
//   }

//   toggleFullScreen(mapId: string): void {
//     const mapContainer = document.getElementById(mapId);
//     if (!mapContainer) return;
//     const isFullScreen = mapContainer.classList.contains('fullscreen');
//     if (isFullScreen) {
//       mapContainer.classList.remove('fullscreen');
//       this.fullscreenMapId = null;
//       this.updateBodyOverflow(false);
//       this.updateMapSize(mapId);
//       this.updateFullScreenIcon(mapId, false);
//     } else {
//       if (this.fullscreenMapId && this.fullscreenMapId !== mapId) {
//         const previous = document.getElementById(this.fullscreenMapId);
//         if (previous) {
//           previous.classList.remove('fullscreen');
//           this.updateFullScreenIcon(this.fullscreenMapId, false);
//           this.updateMapSize(this.fullscreenMapId);
//         }
//       }
//       mapContainer.classList.add('fullscreen');
//       this.fullscreenMapId = mapId;
//       this.updateBodyOverflow(true);
//       this.updateMapSize(mapId);
//       this.updateFullScreenIcon(mapId, true);
//     }
//   }

//   private updateMapSize(mapId: string): void {
//     let map: L.Map | undefined = undefined;
//     if (mapId === 'map1') map = this.map1;
//     else if (mapId === 'map2') map = this.map2;
//     else if (mapId === 'map3') map = this.map3;
//     if (map) {
//       setTimeout(() => {
//         map!.invalidateSize();
//       }, 100);
//     }
//   }

//   private updateBodyOverflow(disableScroll: boolean): void {
//     if (disableScroll) {
//       document.body.style.overflow = 'hidden';
//     } else {
//       document.body.style.overflow = 'auto';
//     }
//   }

//   private updateFullScreenIcon(mapId: string, isFullScreen: boolean): void {
//     const mapContainer = document.getElementById(mapId);
//     if (!mapContainer) return;
//     const button = mapContainer.querySelector('.fullscreen-toggle i');
//     if (!button) return;
//     if (isFullScreen) {
//       button.classList.remove('fa-expand');
//       button.classList.add('fa-compress');
//     } else {
//       button.classList.remove('fa-compress');
//       button.classList.add('fa-expand');
//     }
//   }

//   resetMapView(): void {
//     this.selectedState = null;
//     this.selectedRegion = null;
//     this.selectedSubdivision = null;
//     this.selectedDistrict = null;
//     this.selectedBlock = null;
//     this.computeSummaries();
//     this.updateMaps();
//   }
// }





// import { Component, OnInit, OnChanges, SimpleChanges, AfterViewInit, Renderer2, Input } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import * as L from 'leaflet';
// import { StateService } from 'src/app/services/state/state.service';
// import { DistrictService } from 'src/app/services/district/district.service';
// import { BlockService } from 'src/app/services/block/BlockService.service';
// import { RegionService } from 'src/app/services/region/region.service';
// import { SubdivisionService } from 'src/app/services/subDivision/subDivision.service';
// import { CountryService } from 'src/app/services/country/country.service'; // Added CountryService
// import { Constants } from 'src/app/services/constants';
// import { forkJoin } from 'rxjs';

// interface SummaryValue {
//   name: string | null;
//   value: number | null;
// }

// interface Summary {
//   highest: { daily: SummaryValue; normal: SummaryValue; departure: SummaryValue };
//   lowest: { daily: SummaryValue; normal: SummaryValue; departure: SummaryValue };
// }

// @Component({
//   selector: 'app-comparison',
//   templateUrl: './comparison.component.html',
//   styleUrls: ['./comparison.component.css']
// })
// export class ComparisonComponent implements OnInit, OnChanges, AfterViewInit {
//   @Input() showComparison = false;
//   @Input() startDate = '';
//   @Input() endDate = '';
//   @Input() isActual = false;
//   @Input() selectedLevels: string[] = ['state', 'district', 'block']; // Default values
//   @Input() mode: string = 'state'; // Default value
//   stateGeojson: any = null;
//   regionGeojson: any = null;
//   subdivisionGeojson: any = null;
//   districtGeojson: any = null;
//   blockGeojson: any = null;
//   countryGeojson: any = null; // Added countryGeojson
//   stateData: any[] = [];
//   regionData: any[] = [];
//   subdivisionData: any[] = [];
//   districtData: any[] = [];
//   blockData: any[] = [];
//   countryData: any[] = []; // Added countryData
//   maxDate = '';
//   selectedState: any = null;
//   selectedRegion: any = null;
//   selectedSubdivision: any = null;
//   selectedDistrict: any = null;
//   selectedBlock: string | null = null;
//   private map1!: L.Map;
//   private map2!: L.Map;
//   private map3!: L.Map;
//   map1Summary: Summary = this.emptySummary();
//   map2Summary: Summary = this.emptySummary();
//   map3Summary: Summary = this.emptySummary();
//   isGeojsonLoaded = false;
//   isBuffering: boolean = false;
//   private fullscreenMapId: string | null = null;

//   constructor(
//     private http: HttpClient,
//     private stateService: StateService,
//     private districtService: DistrictService,
//     private blockService: BlockService,
//     private regionService: RegionService,
//     private subdivisionService: SubdivisionService,
//     private countryService: CountryService, // Added CountryService
//     private constants: Constants,
//     private renderer: Renderer2
//   ) {}

//   ngOnInit(): void {
//     this.loadGeojsonData();
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (changes['showComparison']?.currentValue && this.isGeojsonLoaded) {
//       setTimeout(() => this.initializeMaps(), 0);
//       this.fetchAllData();
//     }
//     if (
//       (changes['startDate'] && !changes['startDate'].firstChange) ||
//       (changes['endDate'] && !changes['endDate'].firstChange) ||
//       (changes['isActual'] && !changes['isActual'].firstChange) ||
//       (changes['selectedLevels'] && !changes['selectedLevels'].firstChange) ||
//       (changes['mode'] && !changes['mode'].firstChange)
//     ) {
//       this.fetchAllData();
//     }
//   }

//   ngAfterViewInit(): void {}

//   private loadGeojsonData(): void {
//     forkJoin({
//       states: this.http.get('assets/geojson/INDIA_STATE.json'),
//       districts: this.http.get('assets/geojson/INDIA_DISTRICT.json'),
//       blocks: this.http.get('assets/geojson/INDIA_BLOCK.json'),
//       regions: this.http.get('assets/geojson/INDIA_REGIONS.json'),
//       subdivisions: this.http.get('assets/geojson/INDIA_SUB_DIVISION.json'),
//       country: this.http.get('assets/geojson/INDIA_COUNTRY.json') // Added country GeoJSON
//     }).subscribe({
//       next: ({ states, districts, blocks, regions, subdivisions, country }) => {
//         this.stateGeojson = states;
//         this.districtGeojson = districts;
//         this.blockGeojson = blocks;
//         this.regionGeojson = regions;
//         this.subdivisionGeojson = subdivisions;
//         this.countryGeojson = country; // Set countryGeojson
//         this.isGeojsonLoaded = true;
//         if (this.showComparison) {
//           setTimeout(() => this.initializeMaps(), 0);
//           this.fetchAllData();
//         }
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
//       countryRes: this.countryService.fetchData(params) // Added country data fetch
//     }).subscribe({
//       next: ({ stateRes, regionRes, subdivisionRes, districtRes, blockRes, countryRes }) => {
//         this.stateData = stateRes.data || [];
//         this.regionData = regionRes.data || [];
//         this.subdivisionData = subdivisionRes.data || [];
//         this.districtData = districtRes.data || [];
//         this.blockData = blockRes.data || [];
//         this.countryData = countryRes.data || []; // Set countryData
//         this.computeSummaries();
//         this.updateMaps();
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

//   private emptySummary(): Summary {
//     return {
//       highest: {
//         daily: { name: null, value: null },
//         normal: { name: null, value: null },
//         departure: { name: null, value: null }
//       },
//       lowest: {
//         daily: { name: null, value: null },
//         normal: { name: null, value: null },
//         departure: { name: null, value: null }
//       }
//     };
//   }

//   private computeSummaries(): void {
//     this.map1Summary = this.computeSummaryForLevel(this.selectedLevels[0]);
//     this.map2Summary = this.computeSummaryForLevel(this.selectedLevels[1]);
//     this.map3Summary = this.computeSummaryForLevel(this.selectedLevels[2]);
//   }

//   private computeSummaryForLevel(level: string): Summary {
//     let data: any[] = [];
//     let nameKey: string = '';
//     let dailyKey: string = '';
//     let normalKey: string = '';
//     let departureKey: string = '';
//     switch (level) {
//       case 'country':
//         data = this.countryData;
//         nameKey = 'name';
//         dailyKey = 'actual_rainfall';
//         normalKey = 'rainfall_normal_value';
//         departureKey = 'departure';
//         break;
//       case 'state':
//         data = this.getFilteredStates();
//         nameKey = 'state_name';
//         dailyKey = 'actual_state_rainfall';
//         normalKey = 'rainfall_normal_value';
//         departureKey = 'departure';
//         break;
//       case 'region':
//         data = this.regionData;
//         nameKey = 'name';
//         dailyKey = 'actual_rainfall';
//         normalKey = 'rainfall_normal_value';
//         departureKey = 'departure';
//         break;
//       case 'subdivision':
//         data = this.getFilteredSubdivisions();
//         nameKey = 'subdiv_name';
//         dailyKey = 'actual_subdiv_rainfall';
//         normalKey = 'rainfall_normal_value';
//         departureKey = 'departure';
//         break;
//       case 'district':
//         data = this.getFilteredDistrictsData();
//         nameKey = 'district_name';
//         dailyKey = 'actual_rainfall';
//         normalKey = 'normal_rainfall';
//         departureKey = 'departure';
//         break;
//       case 'block':
//         data = this.getFilteredBlocksData();
//         nameKey = 'block_name';
//         dailyKey = 'actual_rainfall';
//         normalKey = 'normal_rainfall';
//         departureKey = 'departure';
//         break;
//       default:
//         return this.emptySummary();
//     }
//     if (!data || data.length === 0) {
//       return this.emptySummary();
//     }
//     return this.computeSummary(data, nameKey, dailyKey, normalKey, departureKey);
//   }

//   private getFilteredStates(): any[] {
//     if (!this.selectedRegion) return this.stateData;
//     const regionCode = String(this.selectedRegion.properties.region_cod).trim();
//     return this.stateData.filter(d => String(d.region_code).trim() === regionCode);
//   }

//   private getFilteredSubdivisions(): any[] {
//     if (!this.selectedRegion) return this.subdivisionData;
//     const regionCode = String(this.selectedRegion.properties.region_cod).trim();
//     return this.subdivisionData.filter(d => String(d.region_code).trim() === regionCode);
//   }

//   private getFilteredDistrictsData(): any[] {
//     if (!this.districtData || this.districtData.length === 0) return [];
//     if (this.mode === 'state' && this.selectedState) {
//       const stateCode = String(this.selectedState.properties.state_code).trim();
//       return this.districtData.filter(d => {
//         const distCode = String(d.state_code).trim();
//         const firstDigit = stateCode.charAt(0);
//         const lastTwo = stateCode.slice(-2);
//         return distCode.charAt(0) === firstDigit && distCode.slice(-2) === lastTwo;
//       });
//     }
//     if (this.mode === 'subdivision' && this.selectedSubdivision) {
//       const subdivCode = String(this.selectedSubdivision.properties.SubDiv_Cod).trim();
//       return this.districtData.filter(d => String(d.sub_division_code).trim() === subdivCode);
//     }
//     if (this.selectedRegion) {
//       const regionCode = String(this.selectedRegion.properties.region_cod).trim();
//       const relatedStates = this.getFilteredStates();
//       const relatedSubdivisions = this.getFilteredSubdivisions();
//       const stateCodes = relatedStates.map(s => String(s.state_code).trim());
//       const subdivCodes = relatedSubdivisions.map(s => String(s.s_code).trim());
//       return this.districtData.filter(d =>
//         stateCodes.includes(String(d.state_code).trim()) ||
//         subdivCodes.includes(String(d.sub_division_code).trim())
//       );
//     }
//     return this.districtData;
//   }

//   private getFilteredBlocksData(): any[] {
//     if (!this.blockData || this.blockData.length === 0) return [];
//     if (this.selectedDistrict) {
//       const districtCode = String(this.selectedDistrict.properties.district_c).trim();
//       return this.blockData.filter(b => String(b.district_code || b.district_c).trim() === districtCode);
//     }
//     if (this.mode === 'state' && this.selectedState) {
//       const stateCode = String(this.selectedState.properties.state_code).trim();
//       return this.blockData.filter(b => {
//         const blockStateCode = String(b.state_code).trim();
//         const firstDigit = stateCode.charAt(0);
//         const lastTwo = stateCode.slice(-2);
//         return blockStateCode.charAt(0) === firstDigit && blockStateCode.slice(-2) === lastTwo;
//       });
//     }
//     if (this.mode === 'subdivision' && this.selectedSubdivision) {
//       const subdivCode = String(this.selectedSubdivision.properties.SubDiv_Cod).trim();
//       return this.blockData.filter(b => String(b.sub_division_code).trim() === subdivCode);
//     }
//     if (this.selectedRegion) {
//       const regionCode = String(this.selectedRegion.properties.region_cod).trim();
//       const relatedStates = this.getFilteredStates();
//       const relatedSubdivisions = this.getFilteredSubdivisions();
//       const stateCodes = relatedStates.map(s => String(s.state_code).trim());
//       const subdivCodes = relatedSubdivisions.map(s => String(s.s_code).trim());
//       return this.blockData.filter(b =>
//         stateCodes.includes(String(b.state_code).trim()) ||
//         subdivCodes.includes(String(b.sub_division_code).trim())
//       );
//     }
//     return this.blockData;
//   }

//   private getFilteredBlocksGeojson(): any {
//     if (!this.blockGeojson) return this.blockGeojson;
//     if (this.selectedDistrict) {
//       const districtCode = String(this.selectedDistrict.properties.district_c).trim();
//       const filtered = this.blockGeojson.features.filter((f: any) =>
//         String(f.properties.district_c).trim() === districtCode
//       );
//       return { ...this.blockGeojson, features: filtered };
//     }
//     if (this.mode === 'state' && this.selectedState) {
//       const stateCode = String(this.selectedState.properties.state_code).trim();
//       const filtered = this.blockGeojson.features.filter((f: any) => {
//         const blockStateCode = String(f.properties.state_code).trim();
//         const firstDigit = stateCode.charAt(0);
//         const lastTwo = stateCode.slice(-2);
//         return blockStateCode.charAt(0) === firstDigit && blockStateCode.slice(-2) === lastTwo;
//       });
//       return { ...this.blockGeojson, features: filtered };
//     }
//     if (this.mode === 'subdivision' && this.selectedSubdivision) {
//       const subdivCode = String(this.selectedSubdivision.properties.SubDiv_Cod).trim();
//       const filtered = this.blockGeojson.features.filter((f: any) =>
//         String(f.properties.subdivis_1).trim() === subdivCode
//       );
//       return { ...this.blockGeojson, features: filtered };
//     }
//     if (this.selectedRegion) {
//       const regionCode = String(this.selectedRegion.properties.region_cod).trim();
//       const filtered = this.blockGeojson.features.filter((f: any) =>
//         String(f.properties.region_cod).trim() === regionCode
//       );
//       return { ...this.blockGeojson, features: filtered };
//     }
//     return this.blockGeojson;
//   }

//   private computeSummary(
//     data: any[],
//     nameKey: string,
//     dailyKey: string,
//     normalKey: string,
//     departureKey: string
//   ): Summary {
//     let highestDaily: SummaryValue = { name: null, value: null };
//     let lowestDaily: SummaryValue = { name: null, value: null };
//     let highestNormal: SummaryValue = { name: null, value: null };
//     let lowestNormal: SummaryValue = { name: null, value: null };
//     let highestDeparture: SummaryValue = { name: null, value: null };
//     let lowestDeparture: SummaryValue = { name: null, value: null };
//     data.forEach(item => {
//       const dailyRaw = this.parseNumberSafely(item[dailyKey]);
//       const normalRaw = this.parseNumberSafely(item[normalKey]);
//       const departureRaw = this.parseNumberSafely(item[departureKey]);
//       const name = this.toCamelCase(item[nameKey] || null);
//       const dailyVal = dailyRaw !== null ? this.constants.trimToOneDecimals(dailyRaw) : null;
//       const normalVal = normalRaw !== null ? this.constants.trimToOneDecimals(normalRaw) : null;
//       const departureVal = departureRaw !== null ? this.constants.trimToOneDecimals(departureRaw) : null;
//       if (dailyVal !== null && (highestDaily.value === null || dailyVal > highestDaily.value)) {
//         highestDaily = { name, value: dailyVal };
//       }
//       if (dailyVal !== null && (lowestDaily.value === null || dailyVal < lowestDaily.value)) {
//         lowestDaily = { name, value: dailyVal };
//       }
//       if (normalVal !== null && (highestNormal.value === null || normalVal > highestNormal.value)) {
//         highestNormal = { name, value: normalVal };
//       }
//       if (normalVal !== null && (lowestNormal.value === null || normalVal < lowestNormal.value)) {
//         lowestNormal = { name, value: normalVal };
//       }
//       if (departureVal !== null && (highestDeparture.value === null || departureVal > highestDeparture.value)) {
//         highestDeparture = { name, value: departureVal };
//       }
//       if (departureVal !== null && (lowestDeparture.value === null || departureVal < lowestDeparture.value)) {
//         lowestDeparture = { name, value: departureVal };
//       }
//     });
//     return {
//       highest: {
//         daily: highestDaily,
//         normal: highestNormal,
//         departure: highestDeparture
//       },
//       lowest: {
//         daily: lowestDaily,
//         normal: lowestNormal,
//         departure: lowestDeparture
//       }
//     };
//   }

//   private parseNumberSafely(value: any): number | null {
//     if (value === null || value === undefined) return null;
//     const num = parseFloat(value);
//     if (isNaN(num)) return null;
//     return num;
//   }

//   private initializeMaps() {
//     if (!this.map1) {
//       this.map1 = this.createBaseMap('map1');
//       this.map2 = this.createBaseMap('map2');
//       this.map3 = this.createBaseMap('map3');
//     }
//     this.renderGeojsonLayers();
//   }

//   private createBaseMap(containerId: string): L.Map {
//     const map = L.map(containerId, {
//       center: [20.5937, 78.9629],
//       zoom: 6,
//       scrollWheelZoom: false,
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

//   private updateMaps(): void {
//     [this.map1, this.map2, this.map3].forEach(map => {
//       map.eachLayer(layer => {
//         if (layer instanceof L.GeoJSON) map.removeLayer(layer);
//       });
//     });
//     this.renderGeojsonLayers();
//   }

//   private renderGeojsonLayers(): void {
//     this.selectedLevels.forEach((level, index) => {
//       const map = [this.map1, this.map2, this.map3][index];
//       const geojson = this.getGeojsonForLevel(level);
//       if (geojson) {
//         const layer = L.geoJSON(geojson, {
//           style: (f: any) => this.styleFeature(f, level),
//           onEachFeature: (f: any, l: L.Layer) => this.onEachFeature(f, l, level)
//         }).addTo(map);
//         if (layer.getBounds().isValid()) {
//           map.fitBounds(layer.getBounds(), { padding: [20, 20] });
//         }
//         if (level === 'country') {
//           const matchedData = this.countryData[0];
//           const labelId = `label-India`;
//           const existingLabel = document.getElementById(labelId);
//           if (existingLabel) {
//             existingLabel.remove();
//           }
//           const dailyrainfall = matchedData && matchedData.actual_rainfall !== null && !Number.isNaN(matchedData.actual_rainfall)
//             ? this.constants.trimToOneDecimals(matchedData.actual_rainfall) : 'NA';
//           const normalrainfall = matchedData && matchedData.rainfall_normal_value !== null && !Number.isNaN(matchedData.rainfall_normal_value)
//             ? this.constants.trimToOneDecimals(matchedData.rainfall_normal_value) : 'NA';
//           const rainfall = matchedData && matchedData.departure !== null && !Number.isNaN(matchedData.departure)
//             ? this.constants.trimToOneDecimals(matchedData.departure) : 'NA';
//           // L.marker([23.9, 80.5], {
//           //   icon: L.divIcon({
//           //     className: 'state-label',
//           //     html: `
//           //       <div id="${labelId}" style="font-size: ${14}px; font-weight: 1000; color: #002467; width: 120px; text-align: center; white-space: nowrap;">
//           //         <div>India</div>
//           //         <div>${dailyrainfall}(${rainfall})</div>
//           //         <div>${normalrainfall}</div>
//           //       </div>
//           //     `,
//           //     iconSize: [200, 10]
//           //   })
//           // }).addTo(map);
//         }
//       }
//     });
//     this.removeFocusFromLayers();
//   }

//   private getGeojsonForLevel(level: string): any {
//     if (level === 'country') return this.countryGeojson; // Added country
//     if (level === 'region') return this.regionGeojson;
//     if (level === 'state') return this.getFilteredStateGeojson();
//     if (level === 'subdivision') return this.getFilteredSubdivisionGeojson();
//     if (level === 'district') return this.getFilteredDistrictsGeojson();
//     if (level === 'block') return this.getFilteredBlocksGeojson();
//     return null;
//   }

//   private getFilteredStateGeojson(): any {
//     if (!this.stateGeojson || !this.selectedRegion) return this.stateGeojson;
//     const regionCode = String(this.selectedRegion.properties.region_cod).trim();
//     const stateCodes = this.stateData
//       .filter(s => String(s.region_code).trim() === regionCode)
//       .map(s => String(s.state_code).trim());
//     const filtered = this.stateGeojson.features.filter((f: any) =>
//       stateCodes.includes(String(f.properties.state_code).trim())
//     );
//     return { ...this.stateGeojson, features: filtered };
//   }

//   private getFilteredSubdivisionGeojson(): any {
//     if (!this.subdivisionGeojson || !this.selectedRegion) return this.subdivisionGeojson;
//     const regionCode = String(this.selectedRegion.properties.region_cod).trim();
//     const subdivCodes = this.subdivisionData
//       .filter(s => String(s.region_code).trim() === regionCode)
//       .map(s => String(s.s_code).trim());
//     const filtered = this.subdivisionGeojson.features.filter((f: any) =>
//       subdivCodes.includes(String(f.properties.SubDiv_Cod).trim())
//     );
//     return { ...this.subdivisionGeojson, features: filtered };
//   }

//   private getFilteredDistrictsGeojson(): any {
//     if (!this.districtGeojson) return this.districtGeojson;
//     if (this.mode === 'state' && this.selectedState) {
//       const stateCode = String(this.selectedState.properties.state_code).trim();
//       const filtered = this.districtGeojson.features.filter((f: any) => {
//         const distCode = String(f.properties.state_code).trim();
//         const firstDigit = stateCode.charAt(0);
//         const lastTwo = stateCode.slice(-2);
//         return distCode.charAt(0) === firstDigit && distCode.slice(-2) === lastTwo;
//       });
//       return { ...this.districtGeojson, features: filtered };
//     }
//     if (this.mode === 'subdivision' && this.selectedSubdivision) {
//       const subdivCode = String(this.selectedSubdivision.properties.SubDiv_Cod).trim();
//       const filtered = this.districtGeojson.features.filter((f: any) =>
//         String(f.properties.subdivis_1).trim() === subdivCode
//       );
//       return { ...this.districtGeojson, features: filtered };
//     }
//     if (this.selectedRegion) {
//       const regionCode = String(this.selectedRegion.properties.region_cod).trim();
//       const filtered = this.districtGeojson.features.filter((f: any) =>
//         String(f.properties.region_cod).trim() === regionCode
//       );
//       return { ...this.districtGeojson, features: filtered };
//     }
//     return this.districtGeojson;
//   }

//   private removeFocusFromLayers(): void {
//     [this.map1, this.map2, this.map3].forEach(map => {
//       map.eachLayer(layer => {
//         if ((layer as any)._path) {
//           const elem = (layer as any)._path as SVGElement;
//           elem.removeAttribute('tabindex');
//           elem.style.outline = 'none';
//         }
//       });
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
//     const isSelected = this.isFeatureSelected(feature, level);
//     return {
//       fillColor,
//       color: isSelected ? '#000' : '#333',
//       weight: isSelected ? 3 : 1,
//       fillOpacity: level === 'region' || level === 'country' ? 1 : level === 'subdivision' ? 0.85 : 1,
//       dashArray: level === 'block' && isSelected ? '4' : undefined
//     };
//   }

//   private isFeatureSelected(feature: any, level: string): boolean {
//     if (level === 'country') return false; // No selection for country
//     if (level === 'region') return this.selectedRegion === feature;
//     if (level === 'state') return this.selectedState === feature;
//     if (level === 'subdivision') return this.selectedSubdivision === feature;
//     if (level === 'district') return this.selectedDistrict === feature;
//     if (level === 'block') return this.toCamelCase(feature.properties.block_Name) === this.selectedBlock;
//     return false;
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
//     layer.bindTooltip(`
//       <div>
//         <div><b>${name}</b></div>
//         <div>${this.summaryLabel}: <b>${daily}</b></div>
//         <div>Normal: <b>${normal}</b></div>
//         <div>Departure: <b>${departure}</b></div>
//       </div>
//     `, { sticky: true });
//     if (level !== 'country') { // No click handler for country
//       layer.on({
//         click: () => {
//           this.handleFeatureClick(feature, level);
//           this.computeSummaries();
//           this.updateMaps();
//         }
//       });
//     }
//   }

//   private handleFeatureClick(feature: any, level: string): void {
//     if (level === 'region') {
//       this.selectedRegion = feature;
//       this.selectedState = null;
//       this.selectedSubdivision = null;
//       this.selectedDistrict = null;
//       this.selectedBlock = null;
//     } else if (level === 'state') {
//       this.selectedState = feature;
//       this.selectedSubdivision = null;
//       this.selectedDistrict = null;
//       this.selectedBlock = null;
//     } else if (level === 'subdivision') {
//       this.selectedSubdivision = feature;
//       this.selectedState = null;
//       this.selectedDistrict = null;
//       this.selectedBlock = null;
//     } else if (level === 'district') {
//       this.selectedDistrict = feature;
//       this.selectedBlock = null;
//     } else if (level === 'block') {
//       this.selectedBlock = feature.properties.block_Name;
//     }
//   }

//   toCamelCase(name: string | null): string {
//     if (!name) return '';
//     return name
//       .split(' ')
//       .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
//       .join(' ');
//   }

//   private capitalizeLevelName(level: string): string {
//     if (level === 'country') return 'Country';
//     if (level === 'region') return 'Region';
//     if (level === 'state') return 'State';
//     if (level === 'subdivision') return 'Subdivision';
//     if (level === 'district') return 'District';
//     if (level === 'block') return 'Block';
//     return '';
//   }

//   get dateRangeLabel(): string {
//     if (!this.startDate) return '';
//     const formatDate = (d: string) => {
//       const dateObj = new Date(d);
//       const day = dateObj.getDate().toString().padStart(2, '0');
//       const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
//       const year = dateObj.getFullYear();
//       return `${day}-${month}-${year}`;
//     };
//     if (this.startDate === this.endDate) {
//       return `Date : ${formatDate(this.startDate)}`;
//     } else {
//       return `Date : ${formatDate(this.startDate)} to ${formatDate(this.endDate)}`;
//     }
//   }

//   getMapTitle(level: string, mapIndex: number): string {
//     if (mapIndex === 0) {
//       return `${this.capitalizeLevelName(level)} Map`;
//     }
//     if (mapIndex === 1) {
//       const map1Level = this.selectedLevels[0];
//       const levelName = this.capitalizeLevelName(this.selectedLevels[1]);
//       if (map1Level === 'country') {
//         return `India ${levelName} Map`;
//       } else if (map1Level === 'region' && this.selectedRegion) {
//         return `${this.toCamelCase(this.selectedRegion.properties.region_nam)} ${levelName} Map`;
//       } else if (map1Level === 'state' && this.selectedState) {
//         return `${this.toCamelCase(this.selectedState.properties.state_name)} ${levelName} Map`;
//       } else if (map1Level === 'subdivision' && this.selectedSubdivision) {
//         return `${this.toCamelCase(this.selectedSubdivision.properties.subdivisio)} ${levelName} Map`;
//       } else if (map1Level === 'district' && this.selectedDistrict) {
//         return `${this.toCamelCase(this.selectedDistrict.properties.district)} ${levelName} Map`;
//       } else if (map1Level === 'block' && this.selectedBlock) {
//         return `${this.toCamelCase(this.selectedBlock)} ${levelName} Map`;
//       }
//       return `${levelName} Map`;
//     }
//     if (mapIndex === 2) {
//       const map2Level = this.selectedLevels[1];
//       const levelName = this.capitalizeLevelName(this.selectedLevels[2]);
//       if (map2Level === 'country') {
//         return `India ${levelName} Map`;
//       } else if (map2Level === 'region' && this.selectedRegion) {
//         return `${this.toCamelCase(this.selectedRegion.properties.region_nam)} ${levelName} Map`;
//       } else if (map2Level === 'state' && this.selectedState) {
//         return `${this.toCamelCase(this.selectedState.properties.state_name)} ${levelName} Map`;
//       } else if (map2Level === 'subdivision' && this.selectedSubdivision) {
//         return `${this.toCamelCase(this.selectedSubdivision.properties.subdivisio)} ${levelName} Map`;
//       } else if (map2Level === 'district' && this.selectedDistrict) {
//         return `${this.toCamelCase(this.selectedDistrict.properties.district)} ${levelName} Map`;
//       } else if (map2Level === 'block' && this.selectedBlock) {
//         return `${this.toCamelCase(this.selectedBlock)} ${levelName} Map`;
//       }
//       const map1Level = this.selectedLevels[0];
//       if (map1Level === 'country') {
//         return `India ${levelName} Map`;
//       } else if (map1Level === 'region' && this.selectedRegion) {
//         return `${this.toCamelCase(this.selectedRegion.properties.region_nam)} ${levelName} Map`;
//       } else if (map1Level === 'state' && this.selectedState) {
//         return `${this.toCamelCase(this.selectedState.properties.state_name)} ${levelName} Map`;
//       } else if (map1Level === 'subdivision' && this.selectedSubdivision) {
//         return `${this.toCamelCase(this.selectedSubdivision.properties.subdivisio)} ${levelName} Map`;
//       } else if (map1Level === 'district' && this.selectedDistrict) {
//         return `${this.toCamelCase(this.selectedDistrict.properties.district)} ${levelName} Map`;
//       } else if (map1Level === 'block' && this.selectedBlock) {
//         return `${this.toCamelCase(this.selectedBlock)} ${levelName} Map`;
//       }
//       return `${levelName} Map`;
//     }
//     return '';
//   }

//   getDataForLevel(level: string): any[] {
//     if (level === 'country') return this.countryData; // Added country
//     if (level === 'region') return this.regionData;
//     if (level === 'state') return this.getFilteredStates();
//     if (level === 'subdivision') return this.getFilteredSubdivisions();
//     if (level === 'district') return this.getFilteredDistrictsData();
//     if (level === 'block') return this.getFilteredBlocksData();
//     return [];
//   }

//   getCodeProp(level: string): string {
//     if (level === 'country') return 'name'; // Added country
//     if (level === 'region') return 'region_cod';
//     if (level === 'state') return 'state_code';
//     if (level === 'subdivision') return 'SubDiv_Cod';
//     if (level === 'district') return 'district_c';
//     if (level === 'block') return 'block_code' || 'block_c';
//     return '';
//   }

//   getNameProp(level: string): string {
//     if (level === 'country') return 'name'; // Added country
//     if (level === 'region') return 'region_nam';
//     if (level === 'state') return 'state_name';
//     if (level === 'subdivision') return 'subdivisio';
//     if (level === 'district') return 'district';
//     if (level === 'block') return 'block_Name';
//     return '';
//   }

//   getDataCodeKey(level: string): string {
//     if (level === 'country') return 'name'; // Added country
//     if (level === 'region') return 'r_code';
//     if (level === 'state') return 'state_code';
//     if (level === 'subdivision') return 's_code';
//     if (level === 'district') return 'district_code';
//     if (level === 'block') return 'block_code';
//     return '';
//   }

//   getDailyKey(level: string): string {
//     if (level === 'country') return 'actual_rainfall'; // Added country
//     if (level === 'region') return 'actual_rainfall';
//     if (level === 'state') return 'actual_state_rainfall';
//     if (level === 'subdivision') return 'actual_subdiv_rainfall';
//     if (level === 'district') return 'actual_rainfall';
//     if (level === 'block') return 'actual_rainfall';
//     return '';
//   }

//   getNormalKey(level: string): string {
//     if (level === 'country') return 'rainfall_normal_value'; // Added country
//     if (level === 'region' || level === 'state' || level === 'subdivision') return 'rainfall_normal_value';
//     if (level === 'district' || level === 'block') return 'normal_rainfall';
//     return '';
//   }

//   toggleFullScreen(mapId: string): void {
//     const mapContainer = document.getElementById(mapId);
//     if (!mapContainer) return;
//     const isFullScreen = mapContainer.classList.contains('fullscreen');
//     if (isFullScreen) {
//       mapContainer.classList.remove('fullscreen');
//       this.fullscreenMapId = null;
//       this.updateBodyOverflow(false);
//       this.updateMapSize(mapId);
//       this.updateFullScreenIcon(mapId, false);
//     } else {
//       if (this.fullscreenMapId && this.fullscreenMapId !== mapId) {
//         const previous = document.getElementById(this.fullscreenMapId);
//         if (previous) {
//           previous.classList.remove('fullscreen');
//           this.updateFullScreenIcon(this.fullscreenMapId, false);
//           this.updateMapSize(this.fullscreenMapId);
//         }
//       }
//       mapContainer.classList.add('fullscreen');
//       this.fullscreenMapId = mapId;
//       this.updateBodyOverflow(true);
//       this.updateMapSize(mapId);
//       this.updateFullScreenIcon(mapId, true);
//     }
//   }

//   private updateMapSize(mapId: string): void {
//     let map: L.Map | undefined = undefined;
//     if (mapId === 'map1') map = this.map1;
//     else if (mapId === 'map2') map = this.map2;
//     else if (mapId === 'map3') map = this.map3;
//     if (map) {
//       setTimeout(() => {
//         map!.invalidateSize();
//       }, 100);
//     }
//   }

//   private updateBodyOverflow(disableScroll: boolean): void {
//     if (disableScroll) {
//       document.body.style.overflow = 'hidden';
//     } else {
//       document.body.style.overflow = 'auto';
//     }
//   }

//   private updateFullScreenIcon(mapId: string, isFullScreen: boolean): void {
//     const mapContainer = document.getElementById(mapId);
//     if (!mapContainer) return;
//     const button = mapContainer.querySelector('.fullscreen-toggle i');
//     if (!button) return;
//     if (isFullScreen) {
//       button.classList.remove('fa-expand');
//       button.classList.add('fa-compress');
//     } else {
//       button.classList.remove('fa-compress');
//       button.classList.add('fa-expand');
//     }
//   }

//   resetMapView(): void {
//     this.selectedState = null;
//     this.selectedRegion = null;
//     this.selectedSubdivision = null;
//     this.selectedDistrict = null;
//     this.selectedBlock = null;
//     this.computeSummaries();
//     this.updateMaps();
//   }
// }





import { Component, OnInit, OnChanges, SimpleChanges, AfterViewInit, Renderer2, Input } from '@angular/core';
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

interface SummaryValue {
  name: string | null;
  value: number | null;
}

interface Summary {
  highest: { daily: SummaryValue; normal: SummaryValue; departure: SummaryValue };
  lowest: { daily: SummaryValue; normal: SummaryValue; departure: SummaryValue };
}

@Component({
  selector: 'app-comparison',
  templateUrl: './comparison.component.html',
  styleUrls: ['./comparison.component.css']
})
export class ComparisonComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() showComparison = false;
  @Input() startDate = '';
  @Input() endDate = '';
  @Input() isActual = false;
  @Input() selectedLevels: string[] = ['state', 'district', 'block'];
  @Input() mode: string = 'state';
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
  maxDate = '';
  selectedState: any = null;
  selectedRegion: any = null;
  selectedSubdivision: any = null;
  selectedDistrict: any = null;
  selectedBlock: string | null = null;
  private map1!: L.Map;
  private map2!: L.Map;
  private map3!: L.Map;
  map1Summary: Summary = this.emptySummary();
  map2Summary: Summary = this.emptySummary();
  map3Summary: Summary = this.emptySummary();
  isGeojsonLoaded = false;
  isBuffering: boolean = false;
  private fullscreenMapId: string | null = null;

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
  ) {}

  ngOnInit(): void {
    this.loadGeojsonData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['showComparison']?.currentValue && this.isGeojsonLoaded) {
      setTimeout(() => this.initializeMaps(), 0);
      this.fetchAllData();
    }
    if (
      (changes['startDate'] && !changes['startDate'].firstChange) ||
      (changes['endDate'] && !changes['endDate'].firstChange) ||
      (changes['isActual'] && !changes['isActual'].firstChange) ||
      (changes['selectedLevels'] && !changes['selectedLevels'].firstChange) ||
      (changes['mode'] && !changes['mode'].firstChange)
    ) {
      if (changes['mode'] && !changes['mode'].firstChange) {
        this.resetMapView(); // Reset map view when mode changes
      }
      this.fetchAllData(); // Fetch data to apply filters
    }
  }

  ngAfterViewInit(): void {}

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
        if (this.showComparison) {
          setTimeout(() => this.initializeMaps(), 0);
          this.fetchAllData();
        }
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
        this.computeSummaries();
        this.updateMaps();
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

  private computeSummaries(): void {
    this.map1Summary = this.computeSummaryForLevel(this.selectedLevels[0]);
    this.map2Summary = this.computeSummaryForLevel(this.selectedLevels[1]);
    this.map3Summary = this.computeSummaryForLevel(this.selectedLevels[2]);
  }

  private computeSummaryForLevel(level: string): Summary {
    let data: any[] = [];
    let nameKey: string = '';
    let dailyKey: string = '';
    let normalKey: string = '';
    let departureKey: string = '';
    switch (level) {
      case 'country':
        data = this.countryData;
        nameKey = 'name';
        dailyKey = 'actual_rainfall';
        normalKey = 'rainfall_normal_value';
        departureKey = 'departure';
        break;
      case 'state':
        data = this.getFilteredStates();
        nameKey = 'state_name';
        dailyKey = 'actual_state_rainfall';
        normalKey = 'rainfall_normal_value';
        departureKey = 'departure';
        break;
      case 'region':
        data = this.regionData;
        nameKey = 'name';
        dailyKey = 'actual_rainfall';
        normalKey = 'rainfall_normal_value';
        departureKey = 'departure';
        break;
      case 'subdivision':
        data = this.getFilteredSubdivisions();
        nameKey = 'subdiv_name';
        dailyKey = 'actual_subdiv_rainfall';
        normalKey = 'rainfall_normal_value';
        departureKey = 'departure';
        break;
      case 'district':
        data = this.getFilteredDistrictsData();
        nameKey = 'district_name';
        dailyKey = 'actual_rainfall';
        normalKey = 'normal_rainfall';
        departureKey = 'departure';
        break;
      case 'block':
        data = this.getFilteredBlocksData();
        nameKey = 'block_name';
        dailyKey = 'actual_rainfall';
        normalKey = 'normal_rainfall';
        departureKey = 'departure';
        break;
      default:
        return this.emptySummary();
    }
    if (!data || data.length === 0) {
      return this.emptySummary();
    }
    return this.computeSummary(data, nameKey, dailyKey, normalKey, departureKey);
  }

  private getFilteredStates(): any[] {
    if (!this.selectedRegion) return this.stateData;
    const regionCode = String(this.selectedRegion.properties.region_cod).trim();
    return this.stateData.filter(d => String(d.region_code).trim() === regionCode);
  }

  private getFilteredSubdivisions(): any[] {
    if (!this.selectedRegion) return this.subdivisionData;
    const regionCode = String(this.selectedRegion.properties.region_cod).trim();
    return this.subdivisionData.filter(d => String(d.region_code).trim() === regionCode);
  }

  private getFilteredDistrictsData(): any[] {
    if (!this.districtData || this.districtData.length === 0) return [];
    if (this.mode === 'state' && this.selectedState) {
      const stateCode = String(this.selectedState.properties.state_code).trim();
      return this.districtData.filter(d => {
        const distCode = String(d.state_code).trim();
        const firstDigit = stateCode.charAt(0);
        const lastTwo = stateCode.slice(-2);
        return distCode.charAt(0) === firstDigit && distCode.slice(-2) === lastTwo;
      });
    }
    if (this.mode === 'subdivision' && this.selectedSubdivision) {
      const subdivCode = String(this.selectedSubdivision.properties.SubDiv_Cod).trim();
      return this.districtData.filter(d => String(d.sub_division_code).trim() === subdivCode);
    }
    if (this.selectedRegion) {
      const regionCode = String(this.selectedRegion.properties.region_cod).trim();
      const relatedStates = this.getFilteredStates();
      const relatedSubdivisions = this.getFilteredSubdivisions();
      const stateCodes = relatedStates.map(s => String(s.state_code).trim());
      const subdivCodes = relatedSubdivisions.map(s => String(s.s_code).trim());
      return this.districtData.filter(d =>
        stateCodes.includes(String(d.state_code).trim()) ||
        subdivCodes.includes(String(d.sub_division_code).trim())
      );
    }
    return this.districtData;
  }

  private getFilteredBlocksData(): any[] {
    if (!this.blockData || this.blockData.length === 0) return [];
    if (this.selectedDistrict) {
      const districtCode = String(this.selectedDistrict.properties.district_c).trim();
      return this.blockData.filter(b => String(b.district_code || b.district_c).trim() === districtCode);
    }
    if (this.mode === 'state' && this.selectedState) {
      const stateCode = String(this.selectedState.properties.state_code).trim();
      return this.blockData.filter(b => {
        const blockStateCode = String(b.state_code).trim();
        const firstDigit = stateCode.charAt(0);
        const lastTwo = stateCode.slice(-2);
        return blockStateCode.charAt(0) === firstDigit && blockStateCode.slice(-2) === lastTwo;
      });
    }
    if (this.mode === 'subdivision' && this.selectedSubdivision) {
      const subdivCode = String(this.selectedSubdivision.properties.SubDiv_Cod).trim();
      return this.blockData.filter(b => String(b.sub_division_code).trim() === subdivCode);
    }
    if (this.selectedRegion) {
      const regionCode = String(this.selectedRegion.properties.region_cod).trim();
      const relatedStates = this.getFilteredStates();
      const relatedSubdivisions = this.getFilteredSubdivisions();
      const stateCodes = relatedStates.map(s => String(s.state_code).trim());
      const subdivCodes = relatedSubdivisions.map(s => String(s.s_code).trim());
      return this.blockData.filter(b =>
        stateCodes.includes(String(b.state_code).trim()) ||
        subdivCodes.includes(String(b.sub_division_code).trim())
      );
    }
    return this.blockData;
  }

  private getFilteredBlocksGeojson(): any {
    if (!this.blockGeojson) return this.blockGeojson;
    if (this.selectedDistrict) {
      const districtCode = String(this.selectedDistrict.properties.district_c).trim();
      const filtered = this.blockGeojson.features.filter((f: any) =>
        String(f.properties.district_c).trim() === districtCode
      );
      return { ...this.blockGeojson, features: filtered };
    }
    if (this.mode === 'state' && this.selectedState) {
      const stateCode = String(this.selectedState.properties.state_code).trim();
      const filtered = this.blockGeojson.features.filter((f: any) => {
        const blockStateCode = String(f.properties.state_code).trim();
        const firstDigit = stateCode.charAt(0);
        const lastTwo = stateCode.slice(-2);
        return blockStateCode.charAt(0) === firstDigit && blockStateCode.slice(-2) === lastTwo;
      });
      return { ...this.blockGeojson, features: filtered };
    }
    if (this.mode === 'subdivision' && this.selectedSubdivision) {
      const subdivCode = String(this.selectedSubdivision.properties.SubDiv_Cod).trim();
      const filtered = this.blockGeojson.features.filter((f: any) =>
        String(f.properties.subdivis_1).trim() === subdivCode
      );
      return { ...this.blockGeojson, features: filtered };
    }
    if (this.selectedRegion) {
      const regionCode = String(this.selectedRegion.properties.region_cod).trim();
      const filtered = this.blockGeojson.features.filter((f: any) =>
        String(f.properties.region_cod).trim() === regionCode
      );
      return { ...this.blockGeojson, features: filtered };
    }
    return this.blockGeojson;
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

  private initializeMaps() {
    if (!this.map1) {
      this.map1 = this.createBaseMap('map1');
      this.map2 = this.createBaseMap('map2');
      this.map3 = this.createBaseMap('map3');
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
    [this.map1, this.map2, this.map3].forEach(map => {
      map.eachLayer(layer => {
        if (layer instanceof L.GeoJSON) map.removeLayer(layer);
      });
    });
    this.renderGeojsonLayers();
  }

  private renderGeojsonLayers(): void {
    this.selectedLevels.forEach((level, index) => {
      const map = [this.map1, this.map2, this.map3][index];
      const geojson = this.getGeojsonForLevel(level);
      if (geojson) {
        const layer = L.geoJSON(geojson, {
          style: (f: any) => this.styleFeature(f, level),
          onEachFeature: (f: any, l: L.Layer) => this.onEachFeature(f, l, level)
        }).addTo(map);
        if (layer.getBounds().isValid()) {
          map.fitBounds(layer.getBounds(), { padding: [20, 20] });
        }
        /*
        if (level === 'country') {
          const matchedData = this.countryData[0];
          const labelId = `label-India`;
          const existingLabel = document.getElementById(labelId);
          if (existingLabel) {
            existingLabel.remove();
          }
          const dailyrainfall = matchedData && matchedData.actual_rainfall !== null && !Number.isNaN(matchedData.actual_rainfall)
            ? this.constants.trimToOneDecimals(matchedData.actual_rainfall) : 'NA';
          const normalrainfall = matchedData && matchedData.rainfall_normal_value !== null && !Number.isNaN(matchedData.rainfall_normal_value)
            ? this.constants.trimToOneDecimals(matchedData.rainfall_normal_value) : 'NA';
          const rainfall = matchedData && matchedData.departure !== null && !Number.isNaN(matchedData.departure)
            ? this.constants.trimToOneDecimals(matchedData.departure) : 'NA';
          L.marker([23.9, 80.5], {
            icon: L.divIcon({
              className: 'state-label',
              html: `
                <div id="${labelId}" style="font-size: ${14}px; font-weight: 1000; color: #002467; width: 120px; text-align: center; white-space: nowrap;">
                  <div>India</div>
                  <div>${dailyrainfall}(${rainfall})</div>
                  <div>${normalrainfall}</div>
                </div>
              `,
              iconSize: [200, 10]
            })
          }).addTo(map);
        }
        */
      }
    });
    this.removeFocusFromLayers();
  }

  private getGeojsonForLevel(level: string): any {
    if (level === 'country') return this.countryGeojson;
    if (level === 'region') return this.regionGeojson;
    if (level === 'state') return this.getFilteredStateGeojson();
    if (level === 'subdivision') return this.getFilteredSubdivisionGeojson();
    if (level === 'district') return this.getFilteredDistrictsGeojson();
    if (level === 'block') return this.getFilteredBlocksGeojson();
    return null;
  }

  private getFilteredStateGeojson(): any {
    if (!this.stateGeojson || !this.selectedRegion) return this.stateGeojson;
    const regionCode = String(this.selectedRegion.properties.region_cod).trim();
    const stateCodes = this.stateData
      .filter(s => String(s.region_code).trim() === regionCode)
      .map(s => String(s.state_code).trim());
    const filtered = this.stateGeojson.features.filter((f: any) =>
      stateCodes.includes(String(f.properties.state_code).trim())
    );
    return { ...this.stateGeojson, features: filtered };
  }

  private getFilteredSubdivisionGeojson(): any {
    if (!this.subdivisionGeojson || !this.selectedRegion) return this.subdivisionGeojson;
    const regionCode = String(this.selectedRegion.properties.region_cod).trim();
    const subdivCodes = this.subdivisionData
      .filter(s => String(s.region_code).trim() === regionCode)
      .map(s => String(s.s_code).trim());
    const filtered = this.subdivisionGeojson.features.filter((f: any) =>
      subdivCodes.includes(String(f.properties.SubDiv_Cod).trim())
    );
    return { ...this.subdivisionGeojson, features: filtered };
  }

  private getFilteredDistrictsGeojson(): any {
    if (!this.districtGeojson) return this.districtGeojson;
    if (this.mode === 'state' && this.selectedState) {
      const stateCode = String(this.selectedState.properties.state_code).trim();
      const filtered = this.districtGeojson.features.filter((f: any) => {
        const distCode = String(f.properties.state_code).trim();
        const firstDigit = stateCode.charAt(0);
        const lastTwo = stateCode.slice(-2);
        return distCode.charAt(0) === firstDigit && distCode.slice(-2) === lastTwo;
      });
      return { ...this.districtGeojson, features: filtered };
    }
    if (this.mode === 'subdivision' && this.selectedSubdivision) {
      const subdivCode = String(this.selectedSubdivision.properties.SubDiv_Cod).trim();
      const filtered = this.districtGeojson.features.filter((f: any) =>
        String(f.properties.subdivis_1).trim() === subdivCode
      );
      return { ...this.districtGeojson, features: filtered };
    }
    if (this.selectedRegion) {
      const regionCode = String(this.selectedRegion.properties.region_cod).trim();
      const filtered = this.districtGeojson.features.filter((f: any) =>
        String(f.properties.region_cod).trim() === regionCode
      );
      return { ...this.districtGeojson, features: filtered };
    }
    return this.districtGeojson;
  }

  private removeFocusFromLayers(): void {
    [this.map1, this.map2, this.map3].forEach(map => {
      map.eachLayer(layer => {
        if ((layer as any)._path) {
          const elem = (layer as any)._path as SVGElement;
          elem.removeAttribute('tabindex');
          elem.style.outline = 'none';
        }
      });
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
    const isSelected = this.isFeatureSelected(feature, level);
    return {
      fillColor,
      color: isSelected ? '#000' : '#333',
      weight: isSelected ? 3 : 1,
      fillOpacity: level === 'region' || level === 'country' ? 1 : level === 'subdivision' ? 0.85 : 1,
      dashArray: level === 'block' && isSelected ? '4' : undefined
    };
  }

  private isFeatureSelected(feature: any, level: string): boolean {
    if (level === 'country') return false;
    if (level === 'region') return this.selectedRegion === feature;
    if (level === 'state') return this.selectedState === feature;
    if (level === 'subdivision') return this.selectedSubdivision === feature;
    if (level === 'district') return this.selectedDistrict === feature;
    if (level === 'block') return this.toCamelCase(feature.properties.block_Name) === this.selectedBlock;
    return false;
  }

  get summaryLabel(): string {
    return this.startDate === this.endDate ? 'Daily' : 'Cumulative';
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
    layer.bindTooltip(`
      <div>
        <div><b>${name}</b></div>
        <div>${this.summaryLabel}: <b>${daily}</b></div>
        <div>Normal: <b>${normal}</b></div>
        <div>Departure: <b>${departure}</b></div>
      </div>
    `, { sticky: true });
    if (level !== 'country') {
      layer.on({
        click: () => {
          this.handleFeatureClick(feature, level);
          this.computeSummaries();
          this.updateMaps();
        }
      });
    }
  }

  private handleFeatureClick(feature: any, level: string): void {
    if (level === 'region') {
      this.selectedRegion = feature;
      this.selectedState = null;
      this.selectedSubdivision = null;
      this.selectedDistrict = null;
      this.selectedBlock = null;
    } else if (level === 'state') {
      this.selectedState = feature;
      this.selectedSubdivision = null;
      this.selectedDistrict = null;
      this.selectedBlock = null;
    } else if (level === 'subdivision') {
      this.selectedSubdivision = feature;
      this.selectedState = null;
      this.selectedDistrict = null;
      this.selectedBlock = null;
    } else if (level === 'district') {
      this.selectedDistrict = feature;
      this.selectedBlock = null;
    } else if (level === 'block') {
      this.selectedBlock = feature.properties.block_Name;
    }
  }

  toCamelCase(name: string | null): string {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private capitalizeLevelName(level: string): string {
    if (level === 'country') return 'Country';
    if (level === 'region') return 'Region';
    if (level === 'state') return 'State';
    if (level === 'subdivision') return 'Subdivision';
    if (level === 'district') return 'District';
    if (level === 'block') return 'Block';
    return '';
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
      return `Date : ${formatDate(this.startDate)}`;
    } else {
      return `Date : ${formatDate(this.startDate)} to ${formatDate(this.endDate)}`;
    }
  }

  getMapTitle(level: string, mapIndex: number): string {
    if (mapIndex === 0) {
      return `${this.capitalizeLevelName(level)} Map`;
    }
    if (mapIndex === 1) {
      const map1Level = this.selectedLevels[0];
      const levelName = this.capitalizeLevelName(this.selectedLevels[1]);
      if (map1Level === 'country') {
        return `India ${levelName} Map`;
      } else if (map1Level === 'region' && this.selectedRegion) {
        return `${this.toCamelCase(this.selectedRegion.properties.region_nam)} ${levelName} Map`;
      } else if (map1Level === 'state' && this.selectedState) {
        return `${this.toCamelCase(this.selectedState.properties.state_name)} ${levelName} Map`;
      } else if (map1Level === 'subdivision' && this.selectedSubdivision) {
        return `${this.toCamelCase(this.selectedSubdivision.properties.subdivisio)} ${levelName} Map`;
      } else if (map1Level === 'district' && this.selectedDistrict) {
        return `${this.toCamelCase(this.selectedDistrict.properties.district)} ${levelName} Map`;
      } else if (map1Level === 'block' && this.selectedBlock) {
        return `${this.toCamelCase(this.selectedBlock)} ${levelName} Map`;
      }
      return `${levelName} Map`;
    }
    if (mapIndex === 2) {
      const map2Level = this.selectedLevels[1];
      const levelName = this.capitalizeLevelName(this.selectedLevels[2]);
      if (map2Level === 'country') {
        return `India ${levelName} Map`;
      } else if (map2Level === 'region' && this.selectedRegion) {
        return `${this.toCamelCase(this.selectedRegion.properties.region_nam)} ${levelName} Map`;
      } else if (map2Level === 'state' && this.selectedState) {
        return `${this.toCamelCase(this.selectedState.properties.state_name)} ${levelName} Map`;
      } else if (map2Level === 'subdivision' && this.selectedSubdivision) {
        return `${this.toCamelCase(this.selectedSubdivision.properties.subdivisio)} ${levelName} Map`;
      } else if (map2Level === 'district' && this.selectedDistrict) {
        return `${this.toCamelCase(this.selectedDistrict.properties.district)} ${levelName} Map`;
      } else if (map2Level === 'block' && this.selectedBlock) {
        return `${this.toCamelCase(this.selectedBlock)} ${levelName} Map`;
      }
      const map1Level = this.selectedLevels[0];
      if (map1Level === 'country') {
        return `India ${levelName} Map`;
      } else if (map1Level === 'region' && this.selectedRegion) {
        return `${this.toCamelCase(this.selectedRegion.properties.region_nam)} ${levelName} Map`;
      } else if (map1Level === 'state' && this.selectedState) {
        return `${this.toCamelCase(this.selectedState.properties.state_name)} ${levelName} Map`;
      } else if (map1Level === 'subdivision' && this.selectedSubdivision) {
        return `${this.toCamelCase(this.selectedSubdivision.properties.subdivisio)} ${levelName} Map`;
      } else if (map1Level === 'district' && this.selectedDistrict) {
        return `${this.toCamelCase(this.selectedDistrict.properties.district)} ${levelName} Map`;
      } else if (map1Level === 'block' && this.selectedBlock) {
        return `${this.toCamelCase(this.selectedBlock)} ${levelName} Map`;
      }
      return `${levelName} Map`;
    }
    return '';
  }

  getDataForLevel(level: string): any[] {
    if (level === 'country') return this.countryData;
    if (level === 'region') return this.regionData;
    if (level === 'state') return this.getFilteredStates();
    if (level === 'subdivision') return this.getFilteredSubdivisions();
    if (level === 'district') return this.getFilteredDistrictsData();
    if (level === 'block') return this.getFilteredBlocksData();
    return [];
  }

  getCodeProp(level: string): string {
    if (level === 'country') return 'name';
    if (level === 'region') return 'region_cod';
    if (level === 'state') return 'state_code';
    if (level === 'subdivision') return 'SubDiv_Cod';
    if (level === 'district') return 'district_c';
    if (level === 'block') return 'block_code' || 'block_c';
    return '';
  }

  getNameProp(level: string): string {
    if (level === 'country') return 'name';
    if (level === 'region') return 'region_nam';
    if (level === 'state') return 'state_name';
    if (level === 'subdivision') return 'subdivisio';
    if (level === 'district') return 'district';
    if (level === 'block') return 'block_Name';
    return '';
  }

  getDataCodeKey(level: string): string {
    if (level === 'country') return 'name';
    if (level === 'region') return 'r_code';
    if (level === 'state') return 'state_code';
    if (level === 'subdivision') return 's_code';
    if (level === 'district') return 'district_code';
    if (level === 'block') return 'block_code';
    return '';
  }

  getDailyKey(level: string): string {
    if (level === 'country') return 'actual_rainfall';
    if (level === 'region') return 'actual_rainfall';
    if (level === 'state') return 'actual_state_rainfall';
    if (level === 'subdivision') return 'actual_subdiv_rainfall';
    if (level === 'district') return 'actual_rainfall';
    if (level === 'block') return 'actual_rainfall';
    return '';
  }

  getNormalKey(level: string): string {
    if (level === 'country') return 'rainfall_normal_value';
    if (level === 'region' || level === 'state' || level === 'subdivision') return 'rainfall_normal_value';
    if (level === 'district' || level === 'block') return 'normal_rainfall';
    return '';
  }

  toggleFullScreen(mapId: string): void {
    const mapContainer = document.getElementById(mapId);
    if (!mapContainer) return;
    const isFullScreen = mapContainer.classList.contains('fullscreen');
    if (isFullScreen) {
      mapContainer.classList.remove('fullscreen');
      this.fullscreenMapId = null;
      this.updateBodyOverflow(false);
      this.updateMapSize(mapId);
      this.updateFullScreenIcon(mapId, false);
    } else {
      if (this.fullscreenMapId && this.fullscreenMapId !== mapId) {
        const previous = document.getElementById(this.fullscreenMapId);
        if (previous) {
          previous.classList.remove('fullscreen');
          this.updateFullScreenIcon(this.fullscreenMapId, false);
          this.updateMapSize(this.fullscreenMapId);
        }
      }
      mapContainer.classList.add('fullscreen');
      this.fullscreenMapId = mapId;
      this.updateBodyOverflow(true);
      this.updateMapSize(mapId);
      this.updateFullScreenIcon(mapId, true);
    }
  }

  private updateMapSize(mapId: string): void {
    let map: L.Map | undefined = undefined;
    if (mapId === 'map1') map = this.map1;
    else if (mapId === 'map2') map = this.map2;
    else if (mapId === 'map3') map = this.map3;
    if (map) {
      setTimeout(() => {
        map!.invalidateSize();
      }, 100);
    }
  }

  private updateBodyOverflow(disableScroll: boolean): void {
    if (disableScroll) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }

  private updateFullScreenIcon(mapId: string, isFullScreen: boolean): void {
    const mapContainer = document.getElementById(mapId);
    if (!mapContainer) return;
    const button = mapContainer.querySelector('.fullscreen-toggle i');
    if (!button) return;
    if (isFullScreen) {
      button.classList.remove('fa-expand');
      button.classList.add('fa-compress');
    } else {
      button.classList.remove('fa-compress');
      button.classList.add('fa-expand');
    }
  }

  resetMapView(): void {
    this.selectedState = null;
    this.selectedRegion = null;
    this.selectedSubdivision = null;
    this.selectedDistrict = null;
    this.selectedBlock = null;
    this.computeSummaries();
    this.updateMaps();
  }
}