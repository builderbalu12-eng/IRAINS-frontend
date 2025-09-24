// import { Component, ViewChild } from '@angular/core';
// import { ComparisonComponent } from 'src/app/main/irains-dashboard/dashboard-maincontainer/comparision/comparison.component'; // update import path if needed

// @Component({
//   selector: 'app-dashboard-maincontainer',
//   templateUrl: './dashboard-maincontainer.component.html',
//   styleUrls: ['./dashboard-maincontainer.component.css']
// })
// export class DashboardMaincontainerComponent {
//   @ViewChild('comparisonComp') comparisonComponent!: ComparisonComponent;

//   selectedLayer = 'country';
//   showComparison = false;
//   lastActiveLayer = 'country';

//   startDate = '';
//   endDate = '';
//   isActual = false;

//   maxDate = new Date().toISOString().split('T')[0];

//   onLayerSelected(layerName: string) {
//     this.selectedLayer = layerName;
//     this.lastActiveLayer = layerName;
//     this.showComparison = false;
//   }

//   onToggleComparison() {
//     this.showComparison = !this.showComparison;

//     if (!this.showComparison) {
//       this.selectedLayer = this.lastActiveLayer;
//     }
//   }

//   onFilterChange(filter: { startDate: string; endDate: string; isActual: boolean }) {
//     this.startDate = filter.startDate;
//     this.endDate = filter.endDate;
//     this.isActual = filter.isActual;
//   }

//   onResetMapView() {
//     // Important: reset only when compare mode active
//     if (this.showComparison && this.comparisonComponent) {
//       this.comparisonComponent.resetMapView();
//     }
//   }

//   onClosePopup() {
//     this.showComparison = false;
//   }
// }


// import { Component, ViewChild } from '@angular/core';
// import { ComparisonComponent } from 'src/app/main/irains-dashboard/dashboard-maincontainer/comparision/comparison.component';
// import { MapNavBarComponent } from 'src/app/main/irains-dashboard/dashboard-maincontainer/map-nav-bar/map-nav-bar.component';

// @Component({
//   selector: 'app-dashboard-maincontainer',
//   templateUrl: './dashboard-maincontainer.component.html',
//   styleUrls: ['./dashboard-maincontainer.component.css']
// })
// export class DashboardMaincontainerComponent {
//   @ViewChild('comparisonComp') comparisonComponent!: ComparisonComponent;
//   @ViewChild('mapNavBar') mapNavBarComponent!: MapNavBarComponent;

//   selectedLayer = 'country';
//   // showComparison = false;  // if want to view map nav bars as default 
//   showComparison = true;  
//   lastActiveLayer = 'country';
//   startDate = '';
//   endDate = '';
//   isActual = false;
//   maxDate = new Date().toISOString().split('T')[0];
//   selectedLevels: string[] = ['state', 'district', 'block'];
//   mode: string = 'state';

//   ngAfterViewInit() {
//     if (this.mapNavBarComponent) {
//       this.selectedLevels = this.mapNavBarComponent.selectedLevels || ['state', 'district', 'block'];
//       this.mode = this.mapNavBarComponent.mode || 'state';
//     }
//   }

//   onLayerSelected(layerName: string) {
//     this.selectedLayer = layerName;
//     this.lastActiveLayer = layerName;
//     this.showComparison = false;
//   }

//   onToggleComparison() {
//     this.showComparison = !this.showComparison;

//     if (!this.showComparison) {
//       this.selectedLayer = this.lastActiveLayer;
//     } else {
//       if (this.mapNavBarComponent) {
//         this.selectedLevels = this.mapNavBarComponent.selectedLevels || ['state', 'district', 'block'];
//         this.mode = this.mapNavBarComponent.mode || 'state';
//       }
//     }
//   }

//   onFilterChange(filter: { startDate: string; endDate: string; isActual: boolean }) {
//     this.startDate = filter.startDate;
//     this.endDate = filter.endDate;
//     this.isActual = filter.isActual;
//   }

//   onFilterSettingsChange(settings: { selectedLevels: string[]; mode: string }) {
//     this.selectedLevels = settings.selectedLevels;
//     this.mode = settings.mode;
//   }

//   onResetMapView() {
//     if (this.showComparison && this.comparisonComponent) {
//       this.comparisonComponent.resetMapView();
//     }
//   }

//   onClosePopup() {
//     this.showComparison = false;
//   }
// }


// import { Component, ViewChild } from '@angular/core';
// import { ComparisonComponent } from 'src/app/main/irains-dashboard/dashboard-maincontainer/comparision/comparison.component';
// import { MapNavBarComponent } from 'src/app/main/irains-dashboard/dashboard-maincontainer/map-nav-bar/map-nav-bar.component';

// @Component({
//   selector: 'app-dashboard-maincontainer',
//   templateUrl: './dashboard-maincontainer.component.html',
//   styleUrls: ['./dashboard-maincontainer.component.css']
// })
// export class DashboardMaincontainerComponent {
//   @ViewChild('comparisonComp') comparisonComponent!: ComparisonComponent;
//   @ViewChild('mapNavBar') mapNavBarComponent!: MapNavBarComponent;

//   selectedLayer = 'country';
//   showComparison = true;
//   lastActiveLayer = 'country';
//   startDate = '';
//   endDate = '';
//   isActual = false;
//   maxDate = new Date().toISOString().split('T')[0];
//   selectedLevels: string[] = ['state', 'district', 'block'];
//   mode: string = 'state';

//   ngAfterViewInit() {
//     if (this.mapNavBarComponent) {
//       this.selectedLevels = this.mapNavBarComponent.selectedLevels || ['state', 'district', 'block'];
//       this.mode = this.mapNavBarComponent.mode || 'state';
//       this.startDate = this.mapNavBarComponent.startDate || this.maxDate;
//       this.endDate = this.mapNavBarComponent.endDate || this.maxDate;
//       this.isActual = this.mapNavBarComponent.isActual;
//     }
//   }

//   onLayerSelected(layerName: string) {
//     this.selectedLayer = layerName;
//     this.lastActiveLayer = layerName;
//     this.showComparison = false;
//   }

//   onToggleComparison() {
//     this.showComparison = !this.showComparison;

//     if (!this.showComparison) {
//       this.selectedLayer = this.lastActiveLayer;
//     } else {
//       if (this.mapNavBarComponent) {
//         this.selectedLevels = this.mapNavBarComponent.selectedLevels || ['state', 'district', 'block'];
//         this.mode = this.mapNavBarComponent.mode || 'state';
//         this.startDate = this.mapNavBarComponent.startDate || this.maxDate;
//         this.endDate = this.mapNavBarComponent.endDate || this.maxDate;
//         this.isActual = this.mapNavBarComponent.isActual;
//       }
//     }
//   }

//   onFilterChange(filter: { startDate: string; endDate: string; isActual: boolean }) {
//     this.startDate = filter.startDate;
//     this.endDate = filter.endDate;
//     this.isActual = filter.isActual;
//   }

//   onFilterSettingsChange(settings: { selectedLevels: string[]; mode: string }) {
//     this.selectedLevels = settings.selectedLevels;
//     this.mode = settings.mode;
//   }

//   onResetMapView() {
//     if (this.showComparison && this.comparisonComponent) {
//       this.comparisonComponent.resetMapView();
//     } else if (this.mapNavBarComponent) {
//       this.startDate = this.maxDate;
//       this.endDate = this.maxDate;
//       this.isActual = false;
//       this.mapNavBarComponent.startDate = this.maxDate;
//       this.mapNavBarComponent.endDate = this.maxDate;
//       this.mapNavBarComponent.isActual = false;
//       this.mapNavBarComponent.onFilterChange();
//     }
//   }

//   onClosePopup() {
//     this.showComparison = false;
//   }
// }



// import { Component, ViewChild } from '@angular/core';
// import { ComparisonComponent } from 'src/app/main/irains-dashboard/dashboard-maincontainer/comparision/comparison.component';
// import { MapNavBarComponent } from 'src/app/main/irains-dashboard/dashboard-maincontainer/map-nav-bar/map-nav-bar.component';

// @Component({
//   selector: 'app-dashboard-maincontainer',
//   templateUrl: './dashboard-maincontainer.component.html',
//   styleUrls: ['./dashboard-maincontainer.component.css']
// })
// export class DashboardMaincontainerComponent {
//   @ViewChild('comparisonComp') comparisonComponent!: ComparisonComponent;
//   @ViewChild('mapNavBar') mapNavBarComponent!: MapNavBarComponent;

//   selectedLayer = 'country';
//   showComparison = false;
//   lastActiveLayer = 'country';
//   startDate = '';
//   endDate = '';
//   isActual = false;
//   maxDate = new Date().toISOString().split('T')[0];
//   selectedLevels: string[] = ['state', 'district', 'block'];
//   mode: string = 'state';

//   ngAfterViewInit() {
//     if (this.mapNavBarComponent) {
//       this.selectedLevels = this.mapNavBarComponent.selectedLevels || ['state', 'district', 'block'];
//       this.mode = this.mapNavBarComponent.mode || 'state';
//       this.startDate = this.mapNavBarComponent.startDate || this.maxDate;
//       this.endDate = this.mapNavBarComponent.endDate || this.maxDate;
//       this.isActual = this.mapNavBarComponent.isActual;
//     }
//   }

//   onLayerSelected(layerName: string) {
//     this.selectedLayer = layerName;
//     this.lastActiveLayer = layerName;
//     this.showComparison = false;
//   }

//   onToggleComparison() {
//     this.showComparison = !this.showComparison;
//     if (!this.showComparison) {
//       this.selectedLayer = this.lastActiveLayer;
//     } else {
//       if (this.mapNavBarComponent) {
//         this.selectedLevels = this.mapNavBarComponent.selectedLevels || ['state', 'district', 'block'];
//         this.mode = this.mapNavBarComponent.mode || 'state';
//         this.startDate = this.mapNavBarComponent.startDate || this.maxDate;
//         this.endDate = this.mapNavBarComponent.endDate || this.maxDate;
//         this.isActual = this.mapNavBarComponent.isActual;
//       }
//     }
//   }

//   onFilterChange(filter: { startDate: string; endDate: string; isActual: boolean }) {
//     this.startDate = filter.startDate;
//     this.endDate = filter.endDate;
//     this.isActual = filter.isActual;
//   }

//   onFilterSettingsChange(settings: { selectedLevels: string[]; mode: string }) {
//     this.selectedLevels = settings.selectedLevels;
//     this.mode = settings.mode;
//   }

//   onResetMapView() {
//     if (this.showComparison && this.comparisonComponent) {
//       this.comparisonComponent.resetMapView();
//     } else if (this.mapNavBarComponent) {
//       this.startDate = this.maxDate;
//       this.endDate = this.maxDate;
//       this.isActual = false;
//       this.mapNavBarComponent.startDate = this.maxDate;
//       this.mapNavBarComponent.endDate = this.maxDate;
//       this.mapNavBarComponent.isActual = false;
//       this.mapNavBarComponent.onFilterChange();
//     }
//   }

//   onClosePopup() {
//     this.showComparison = false;
//   }
// }


// import { Component, ViewChild } from '@angular/core';
// import { ComparisonComponent } from 'src/app/main/irains-dashboard/dashboard-maincontainer/comparision/comparison.component';
// import { MapNavBarComponent } from 'src/app/main/irains-dashboard/dashboard-maincontainer/map-nav-bar/map-nav-bar.component';

// @Component({
//   selector: 'app-dashboard-maincontainer',
//   templateUrl: './dashboard-maincontainer.component.html',
//   styleUrls: ['./dashboard-maincontainer.component.css']
// })
// export class DashboardMaincontainerComponent {
//   @ViewChild('comparisonComp') comparisonComponent!: ComparisonComponent;
//   @ViewChild('mapNavBar') mapNavBarComponent!: MapNavBarComponent;

//   selectedLayer = 'country';
//   showComparison = false;
//   lastActiveLayer = 'country';
//   startDate = '';
//   endDate = '';
//   isActual = false;
//   maxDate = new Date().toISOString().split('T')[0];
//   selectedLevels: string[] = ['state', 'district', 'block'];
//   mode: string = 'state';

//   ngAfterViewInit() {
//     if (this.mapNavBarComponent) {
//       this.selectedLevels = this.mapNavBarComponent.selectedLevels || ['state', 'district', 'block'];
//       this.mode = this.mapNavBarComponent.mode || 'state';
//       this.startDate = this.mapNavBarComponent.startDate || this.maxDate;
//       this.endDate = this.mapNavBarComponent.endDate || this.maxDate;
//       this.isActual = this.mapNavBarComponent.isActual;
//     }
//   }

//   onLayerSelected(layerName: string) {
//     this.selectedLayer = layerName;
//     this.lastActiveLayer = layerName;
//     this.showComparison = false;
//   }

//   onDateChanged(event: { startDate: string; endDate: string }) {
//     this.startDate = event.startDate;
//     this.endDate = event.endDate;
//   }

//   onToggleComparison() {
//     this.showComparison = !this.showComparison;
//     if (!this.showComparison) {
//       this.selectedLayer = this.lastActiveLayer;
//     } else {
//       if (this.mapNavBarComponent) {
//         this.selectedLevels = this.mapNavBarComponent.selectedLevels || ['state', 'district', 'block'];
//         this.mode = this.mapNavBarComponent.mode || 'state';
//         this.startDate = this.mapNavBarComponent.startDate || this.maxDate;
//         this.endDate = this.mapNavBarComponent.endDate || this.maxDate;
//         this.isActual = this.mapNavBarComponent.isActual;
//       }
//     }
//   }

//   onFilterChange(filter: { startDate: string; endDate: string; isActual: boolean }) {
//     this.startDate = filter.startDate;
//     this.endDate = filter.endDate;
//     this.isActual = filter.isActual;
//   }

//   onFilterSettingsChange(settings: { selectedLevels: string[]; mode: string }) {
//     this.selectedLevels = settings.selectedLevels;
//     this.mode = settings.mode;
//   }

//   onResetMapView() {
//     if (this.showComparison && this.comparisonComponent) {
//       this.comparisonComponent.resetMapView();
//     } else if (this.mapNavBarComponent) {
//       this.startDate = this.maxDate;
//       this.endDate = this.maxDate;
//       this.isActual = false;
//       this.mapNavBarComponent.startDate = this.maxDate;
//       this.mapNavBarComponent.endDate = this.maxDate;
//       this.mapNavBarComponent.isActual = false;
//       this.mapNavBarComponent.onFilterChange();
//     }
//   }

//   onClosePopup() {
//     this.showComparison = false;
//   }
// }


// import { Component, ViewChild } from '@angular/core';
// import { ComparisonComponent } from 'src/app/main/irains-dashboard/dashboard-maincontainer/comparision/comparison.component';
// import { MapNavBarComponent } from 'src/app/main/irains-dashboard/dashboard-maincontainer/map-nav-bar/map-nav-bar.component';


// @Component({
//   selector: 'app-dashboard-maincontainer',
//   templateUrl: './dashboard-maincontainer.component.html',
//   styleUrls: ['./dashboard-maincontainer.component.css']
 
// })
// export class DashboardMaincontainerComponent {
//   @ViewChild('comparisonComp') comparisonComponent!: ComparisonComponent;
//   @ViewChild('mapNavBar') mapNavBarComponent!: MapNavBarComponent;


//   selectedLayer = 'country';
//   showComparison = false;
//   lastActiveLayer = 'country';
//   startDate = '';
//   endDate = '';
//   isActual = false;
//   maxDate = new Date().toISOString().split('T')[0];
//   selectedLevels: string[] = ['state', 'district', 'block'];
//   mode: string = 'state';
//   selectedPlace: { layer: string; name: string } = { layer: 'country', name: 'Country' }; // New property for selected place

//   ngAfterViewInit() {
//     if (this.mapNavBarComponent) {
//       this.selectedLevels = this.mapNavBarComponent.selectedLevels || ['state', 'district', 'block'];
//       this.mode = this.mapNavBarComponent.mode || 'state';
//       this.startDate = this.mapNavBarComponent.startDate || this.maxDate;
//       this.endDate = this.mapNavBarComponent.endDate || this.maxDate;
//       this.isActual = this.mapNavBarComponent.isActual;
//     }
//   }

//   onLayerSelected(layerName: string) {
//     this.selectedLayer = layerName;
//     this.lastActiveLayer = layerName;
//     this.showComparison = false;
//   }

//   onDateChanged(event: { startDate: string; endDate: string }) {
//     this.startDate = event.startDate;
//     this.endDate = event.endDate;
//   }

//   onPlaceSelected(event: { layer: string; name: string }) {
//     this.selectedPlace = event;
//   }

//   onToggleComparison() {
//     this.showComparison = !this.showComparison;
//     if (!this.showComparison) {
//       this.selectedLayer = this.lastActiveLayer;
//     } else {
//       if (this.mapNavBarComponent) {
//         this.selectedLevels = this.mapNavBarComponent.selectedLevels || ['state', 'district', 'block'];
//         this.mode = this.mapNavBarComponent.mode || 'state';
//         this.startDate = this.mapNavBarComponent.startDate || this.maxDate;
//         this.endDate = this.mapNavBarComponent.endDate || this.maxDate;
//         this.isActual = this.mapNavBarComponent.isActual;
//       }
//     }
//   }

//   onFilterChange(filter: { startDate: string; endDate: string; isActual: boolean }) {
//     this.startDate = filter.startDate;
//     this.endDate = filter.endDate;
//     this.isActual = filter.isActual;
//   }

//   onFilterSettingsChange(settings: { selectedLevels: string[]; mode: string }) {
//     this.selectedLevels = settings.selectedLevels;
//     this.mode = settings.mode;
//   }

//   onResetMapView() {
//     if (this.showComparison && this.comparisonComponent) {
//       this.comparisonComponent.resetMapView();
//     } else if (this.mapNavBarComponent) {
//       this.startDate = this.maxDate;
//       this.endDate = this.maxDate;
//       this.isActual = false;
//       this.mapNavBarComponent.startDate = this.maxDate;
//       this.mapNavBarComponent.endDate = this.maxDate;
//       this.mapNavBarComponent.isActual = false;
//       this.mapNavBarComponent.onFilterChange();
//       this.selectedPlace = { layer: 'country', name: 'Country' }; // Reset to country
//     }
//   }

//   onClosePopup() {
//     this.showComparison = false;
//   }
// }


import { Component, ViewChild } from '@angular/core';
import { ComparisonComponent } from 'src/app/main/irains-dashboard/dashboard-maincontainer/comparision/comparison.component';
import { MapNavBarComponent } from 'src/app/main/irains-dashboard/dashboard-maincontainer/map-nav-bar/map-nav-bar.component';

@Component({
  selector: 'app-dashboard-maincontainer',
  templateUrl: './dashboard-maincontainer.component.html',
  styleUrls: ['./dashboard-maincontainer.component.css']
})
export class DashboardMaincontainerComponent {
  @ViewChild('comparisonComp') comparisonComponent!: ComparisonComponent;
  @ViewChild('mapNavBar') mapNavBarComponent!: MapNavBarComponent;

  selectedLayer = 'country';
  showComparison = false;
  lastActiveLayer = 'country';
  startDate = '';
  endDate = '';
  isActual = false;
  maxDate = new Date().toISOString().split('T')[0];
  selectedLevels: string[] = ['state', 'district', 'block'];
  mode: string = 'state';
  selectedPlace: { layer: string; name: string } = { layer: 'country', name: 'India' };

  ngAfterViewInit() {
    if (this.mapNavBarComponent) {
      this.selectedLevels = this.mapNavBarComponent.selectedLevels || ['state', 'district', 'block'];
      this.mode = this.mapNavBarComponent.mode || 'state';
      this.startDate = this.mapNavBarComponent.startDate || this.maxDate;
      this.endDate = this.mapNavBarComponent.endDate || this.maxDate;
      this.isActual = this.mapNavBarComponent.isActual;
    }
  }

  onLayerSelected(layerName: string) {
    this.selectedLayer = layerName;
    this.lastActiveLayer = layerName;
    this.showComparison = false;
  }

  onDateChanged(event: { startDate: string; endDate: string }) {
    this.startDate = event.startDate;
    this.endDate = event.endDate;
  }

  onPlaceSelected(event: { layer: string; name: string }) {
    this.selectedPlace = event;
  }

  onToggleComparison() {
    this.showComparison = !this.showComparison;
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
    this.startDate = filter.startDate;
    this.endDate = filter.endDate;
    this.isActual = filter.isActual;
  }

  onFilterSettingsChange(settings: { selectedLevels: string[]; mode: string }) {
    this.selectedLevels = settings.selectedLevels;
    this.mode = settings.mode;
  }

  onResetMapView() {
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
      this.selectedPlace = { layer: 'country', name: 'India' };
    }
  }

  onClosePopup() {
    this.showComparison = false;
  }
}