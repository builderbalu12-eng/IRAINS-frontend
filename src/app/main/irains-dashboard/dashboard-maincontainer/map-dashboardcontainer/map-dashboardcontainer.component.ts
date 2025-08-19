
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


import { Component, AfterViewInit, OnChanges, SimpleChanges, Input, ElementRef, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';
import { GeoJSON } from 'geojson';


@Component({
  selector: 'app-map-dashboardcontainer',
  templateUrl: './map-dashboardcontainer.component.html',
  styleUrls: ['./map-dashboardcontainer.component.css']
})
export class MapDashboardcontainerComponent implements AfterViewInit, OnChanges {
  @Input() selectedLayer: string | undefined;


  map: L.Map | undefined;
  geoJsonLayer: L.GeoJSON | undefined;


  // Filter panel expanded/collapsed
  isFilterOpen = false;
  startDate = '';
  endDate = '';
  maxDate = '';
  isActual = true;


  private geoJsonFiles: { [key: string]: string } = {
    country: 'assets/geojson/INDIA_COUNTRY.json',
    region: 'assets/geojson/INDIA_REGIONS.json',
    subdivision: 'assets/geojson/INDIA_SUB_DIVISION.json',
    state: 'assets/geojson/INDIA_STATE.json',
    district: 'assets/geojson/INDIA_DISTRICT.json',
    block: 'assets/geojson/INDIA_BLOCK.json',
  };


  constructor(private http: HttpClient) {
    const today = new Date().toISOString().split('T')[0];
    this.startDate = today;
    this.endDate = today;
    this.maxDate = today;
  }


  ngAfterViewInit(): void {
    this.map = L.map('map').setView([20.5937, 78.9629], 9);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);
    if (this.selectedLayer) this.loadGeoJson(this.selectedLayer);
  }


  ngOnChanges(changes: SimpleChanges) {
    if ('selectedLayer' in changes && this.selectedLayer && this.map) {
      this.loadGeoJson(this.selectedLayer);
    }
  }


  private loadGeoJson(layerName: string) {
    if (this.geoJsonLayer) this.geoJsonLayer.remove();
    const geoJsonPath = this.geoJsonFiles[layerName.toLowerCase()];
    if (!geoJsonPath) {
      console.warn(`No GeoJSON file configured for layer: ${layerName}`);
      return;
    }
    this.http.get<GeoJSON | GeoJSON[]>(geoJsonPath).subscribe({
      next: (geojsonData) => {
        this.geoJsonLayer = L.geoJSON(geojsonData as any).addTo(this.map!);
        this.map!.fitBounds(this.geoJsonLayer.getBounds());
      },
      error: err => {
        console.error(`Error loading GeoJSON file for layer ${layerName}:`, err);
      }
    });
  }


  applyFilter() {
    // Hook for map filtering logic
    console.log('Filter:', { startDate: this.startDate, endDate: this.endDate, mode: this.isActual ? 'Actual' : 'Departure' });
  }


  // Filter overlay toggles
  openFilter() { this.isFilterOpen = true; }
  closeFilter() { this.isFilterOpen = false; }
}