import { Component, ViewChild, OnInit } from '@angular/core';
import { ComparisonComponent } from 'src/app/main/irains-dashboard/dashboard-maincontainer/comparision/comparison.component';
import { MapNavBarComponent } from 'src/app/main/irains-dashboard/dashboard-maincontainer/map-nav-bar/map-nav-bar.component';

@Component({
  selector: 'app-dashboard-maincontainer',
  templateUrl: './dashboard-maincontainer.component.html',
  styleUrls: ['./dashboard-maincontainer.component.css']
})
export class DashboardMaincontainerComponent implements OnInit {
  @ViewChild('comparisonComp') comparisonComponent!: ComparisonComponent;
  @ViewChild('mapNavBar') mapNavBarComponent!: MapNavBarComponent;

  selectedLayer = 'subdivision';
  showComparison = true;
  lastActiveLayer = 'subdivision';
  startDate = '';
  endDate = '';
  isActual = false;
  maxDate = new Date().toISOString().split('T')[0];
  selectedLevels: string[] = ['state', 'district', 'block'];
  mode: string = 'state';        
  selectedPlace: { layer: string; code: string; name: string } = { layer: 'subdivision', code: '401', name: 'ANDAMAN & NICOBAR ISLANDS' };
  
  // Add initial load flag
  isInitialLoad = true;
  private initialLoadTimeout: any;

  ngOnInit() {
    // Set a timeout to mark initial load as complete after components are ready
    this.initialLoadTimeout = setTimeout(() => {
      this.isInitialLoad = false;
      console.log('Initial load completed, now passing selectedLayer and selectedPlace');
    }, 100); // Small delay to ensure child components are initialized
  }

  ngAfterViewInit() {
    if (this.mapNavBarComponent) {
      this.selectedLevels = this.mapNavBarComponent.selectedLevels || ['state', 'district', 'block'];
      this.mode = this.mapNavBarComponent.mode || 'state';
      this.startDate = this.mapNavBarComponent.startDate || this.maxDate;
      this.endDate = this.mapNavBarComponent.endDate || this.maxDate;
      this.isActual = this.mapNavBarComponent.isActual;
    }
    
    // Mark initial load as complete after ViewChild is available
    if (this.initialLoadTimeout) {
      clearTimeout(this.initialLoadTimeout);
    }
    this.isInitialLoad = false;
    console.log('Initial load completed after ViewChild initialization');
  }

  ngOnDestroy() {
    if (this.initialLoadTimeout) {
      clearTimeout(this.initialLoadTimeout);
    }
  }

  onLayerSelected(layerName: string) {
    console.log('Layer selected:', layerName, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    this.selectedLayer = layerName;
    this.lastActiveLayer = layerName;
    this.showComparison = false;
    // Reset selectedPlace to default for the new layer if necessary
    if (this.selectedPlace.layer !== layerName) {
      this.selectedPlace = this.getDefaultPlaceForLayer(layerName);
    }
  }

  onDateChanged(event: { startDate: string; endDate: string }) {
    console.log('Date changed:', event, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    this.startDate = event.startDate;
    this.endDate = event.endDate;
  }

  onPlaceSelected(event: { layer: string; code: string; name: string }) {
    console.log('Place selected from MapDashboardcontainer:', event, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    this.selectedPlace = event;
    this.selectedLayer = event.layer; // Ensure selectedLayer matches selectedPlace.layer
  }

  onSelectedPlaceChange(event: { layer: string; code: string; name: string }) {
    console.log('Place changed from MapCharts:', event, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    this.selectedPlace = event;
    this.selectedLayer = event.layer; // Ensure selectedLayer matches selectedPlace.layer
  }

  onToggleComparison() {
    this.showComparison = !this.showComparison;
    console.log('Toggled comparison, showComparison:', this.showComparison, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    if (!this.showComparison) {
      this.selectedLayer = this.lastActiveLayer;
    } else {
      if (this.mapNavBarComponent) {
        this.selectedLevels = this.mapNavBarComponent.selectedLevels || ['state', 'district', 'block'];
        this.mode = this.mapNavBarComponent.mode || 'state';
        this.startDate = this.mapNavBarComponent.startDate || this.maxDate;
        this.endDate = this.mapNavBarComponent.endDate || this.maxDate;
        this.isActual = this.mapNavBarComponent.isActual;
      }
    }
  }

  onFilterChange(filter: { startDate: string; endDate: string; isActual: boolean }) {
    console.log('Filter changed:', filter, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    this.startDate = filter.startDate;
    this.endDate = filter.endDate;
    this.isActual = filter.isActual;
  }

  onFilterSettingsChange(settings: { selectedLevels: string[]; mode: string }) {
    console.log('Filter settings changed:', settings, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    this.selectedLevels = settings.selectedLevels;
    this.mode = settings.mode;
  }

  onResetMapView() {
    console.log('Reset map view triggered at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    if (this.showComparison && this.comparisonComponent) {
      this.comparisonComponent.resetMapView();
    } else if (this.mapNavBarComponent) {
      this.startDate = this.maxDate;
      this.endDate = this.maxDate;
      this.isActual = false;
      this.mapNavBarComponent.startDate = this.maxDate;
      this.mapNavBarComponent.endDate = this.maxDate;
      this.mapNavBarComponent.isActual = false;
      this.mapNavBarComponent.onFilterChange();
      this.selectedPlace = { layer: 'country', code: 'INDIA', name: 'India' };
      this.selectedLayer = 'country';
    }
  }

  onClosePopup() {
    console.log('Closed popup, showComparison set to false at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    this.showComparison = false;
    this.selectedLayer = this.lastActiveLayer;
  }

  onFilterDatesChange(dates: string[]) {
    console.log('Filter dates changed:', dates, 'at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    // Handle filter dates change if needed, e.g., update map or other components
  }

  private getDefaultPlaceForLayer(layer: string): { layer: string; code: string; name: string } {
    switch (layer) {
      case 'country':
        return { layer: 'country', code: 'INDIA', name: 'India' };
      case 'subdivision':
        return { layer: 'subdivision', code: '401', name: 'ANDAMAN & NICOBAR ISLANDS' };
      case 'state':
        return { layer: 'state', code: '201', name: 'ARUNACHAL PRADESH' };
      case 'district':
        return { layer: 'district', code: '40404007', name: 'KOTTAYAM' };
      case 'block':
        return { layer: 'block', code: '4050500104', name: 'Minicoy Island' };
      default:
        return { layer: 'country', code: 'INDIA', name: 'India' };
    }
  }
}