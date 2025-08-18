
// import { Component, EventEmitter, Output } from '@angular/core';

// @Component({
//   selector: 'app-map-nav-bar',
//   templateUrl: './map-nav-bar.component.html',
//   styleUrls: ['./map-nav-bar.component.css']
// })
// export class MapNavBarComponent {
//   @Output() layerSelected = new EventEmitter<string>();

//   onSelectLayer(layer: string) {
//     this.layerSelected.emit(layer);
//   }
// }


// import { Component, EventEmitter, Output } from '@angular/core';

// @Component({
//   selector: 'app-map-nav-bar',
//   templateUrl: './map-nav-bar.component.html',
//   styleUrls: ['./map-nav-bar.component.css']
// })
// export class MapNavBarComponent {
//   @Output() layerSelected = new EventEmitter<string>();
//   @Output() toggleComparison = new EventEmitter<void>();

//   onSelectLayer(layer: string) {
//     this.layerSelected.emit(layer);
//   }

//   onToggleComparison() {
//     this.toggleComparison.emit();
//   }
// }


// import { Component, EventEmitter, Input, Output } from '@angular/core';

// @Component({
//   selector: 'app-map-nav-bar',
//   templateUrl: './map-nav-bar.component.html',
//   styleUrls: ['./map-nav-bar.component.css']
// })
// export class MapNavBarComponent {
//   @Input() showComparison = false;
//   @Output() layerSelected = new EventEmitter<string>();
//   @Output() toggleComparison = new EventEmitter<void>();

//   navItems = [
//     { id: 'country', label: 'Country', active: true },
//     { id: 'region', label: 'Region', active: false },
//     { id: 'subdivision', label: 'Sub Division', active: false },
//     { id: 'state', label: 'State', active: false },
//     { id: 'district', label: 'District', active: false },
//     { id: 'block', label: 'Block', active: false }
//   ];

//   onSelectLayer(layerId: string) {
//     this.navItems.forEach(item => item.active = item.id === layerId);
//     this.layerSelected.emit(layerId);
//   }

//   onToggleComparison() {
//     this.toggleComparison.emit();
//   }
// }

import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-map-nav-bar',
  templateUrl: './map-nav-bar.component.html',
  styleUrls: ['./map-nav-bar.component.css']
})
export class MapNavBarComponent {
  @Input() showComparison = false;
  @Output() layerSelected = new EventEmitter<string>();
  @Output() toggleComparison = new EventEmitter<void>();

  navItems = [
    { id: 'country', label: 'Country', active: true },
    { id: 'region', label: 'Region', active: false },
    { id: 'subdivision', label: 'Sub Division', active: false },
    { id: 'state', label: 'State', active: false },
    { id: 'district', label: 'District', active: false },
    { id: 'block', label: 'Block', active: false }
  ];

  onSelectLayer(layerId: string) {
    // Reset active state for all except Compare button
    this.navItems.forEach(item => item.active = item.id === layerId);
    this.layerSelected.emit(layerId);
  }

  onToggleComparisonClick() {
    // Deactivate all layer buttons visually
    this.navItems.forEach(item => item.active = false);
    this.toggleComparison.emit();
  }
}
