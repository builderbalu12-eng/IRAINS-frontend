import { Component, ViewChild } from '@angular/core';
import { ComparisonComponent } from 'src/app/main/irains-dashboard/dashboard-maincontainer/comparision/comparison.component'; // update import path if needed

@Component({
  selector: 'app-dashboard-maincontainer',
  templateUrl: './dashboard-maincontainer.component.html',
  styleUrls: ['./dashboard-maincontainer.component.css']
})
export class DashboardMaincontainerComponent {
  @ViewChild('comparisonComp') comparisonComponent!: ComparisonComponent;

  selectedLayer = 'country';
  showComparison = false;
  lastActiveLayer = 'country';

  startDate = '';
  endDate = '';
  isActual = false;

  maxDate = new Date().toISOString().split('T')[0];

  onLayerSelected(layerName: string) {
    this.selectedLayer = layerName;
    this.lastActiveLayer = layerName;
    this.showComparison = false;
  }

  onToggleComparison() {
    this.showComparison = !this.showComparison;

    if (!this.showComparison) {
      this.selectedLayer = this.lastActiveLayer;
    }
  }

  onFilterChange(filter: { startDate: string; endDate: string; isActual: boolean }) {
    this.startDate = filter.startDate;
    this.endDate = filter.endDate;
    this.isActual = filter.isActual;
  }

  onResetMapView() {
    // Important: reset only when compare mode active
    if (this.showComparison && this.comparisonComponent) {
      this.comparisonComponent.resetMapView();
    }
  }

  onClosePopup() {
    this.showComparison = false;
  }
}
