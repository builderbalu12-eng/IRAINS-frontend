import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';

@Component({
  selector: 'app-map-nav-bar',
  templateUrl: './map-nav-bar.component.html',
  styleUrls: ['./map-nav-bar.component.css']
})
export class MapNavBarComponent implements OnInit {
  @Input() showComparison = false;
  @Input() maxDate = '';
  @Input() lastActiveLayer = 'country';

  @Output() layerSelected = new EventEmitter<string>();
  @Output() toggleComparison = new EventEmitter<void>();
  @Output() filterChange = new EventEmitter<{ startDate: string; endDate: string; isActual: boolean }>();
  @Output() resetMap = new EventEmitter<void>();

  navItems = [
    { id: 'country', label: 'Country', active: true },
    { id: 'region', label: 'Region', active: false },
    { id: 'subdivision', label: 'Sub Division', active: false },
    { id: 'state', label: 'State', active: false },
    { id: 'district', label: 'District', active: false },
    { id: 'block', label: 'Block', active: false }
  ];

  startDate: string = '';
  endDate: string = '';
  isActual: boolean = false;

  ngOnInit(): void {
    if (this.maxDate) {
      this.startDate = this.maxDate;
      this.endDate = this.maxDate;
    }
  }

  onSelectLayer(layerId: string) {
    this.navItems.forEach(item => item.active = item.id === layerId);
    this.layerSelected.emit(layerId);
  }

  onToggleComparisonClick() {
    this.toggleComparison.emit();
  }

  onFilterChange() {
    this.filterChange.emit({
      startDate: this.startDate,
      endDate: this.endDate,
      isActual: this.isActual
    });
  }

  onResetMapView() {
    this.resetMap.emit();
  }

  setActiveLayer(layerName: string) {
    this.navItems.forEach(item => item.active = item.id === layerName);
  }
}
