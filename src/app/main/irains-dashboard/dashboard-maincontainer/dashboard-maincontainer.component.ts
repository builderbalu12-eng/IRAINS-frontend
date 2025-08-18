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
