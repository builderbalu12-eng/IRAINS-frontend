//  nav bar with actual start date and end date *****************************
// import { Component, EventEmitter, Input, Output, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
// import { FormBuilder, FormGroup } from '@angular/forms';

// @Component({
//   selector: 'app-map-nav-bar',
//   templateUrl: './map-nav-bar.component.html',
//   styleUrls: ['./map-nav-bar.component.css']
// })
// export class MapNavBarComponent implements OnInit {
//   @Input() showComparison = false;
//   @Input() maxDate = '';
//   @Input() lastActiveLayer = 'country';

//   @Output() layerSelected = new EventEmitter<string>();
//   @Output() toggleComparison = new EventEmitter<void>();
//   @Output() filterChange = new EventEmitter<{ startDate: string; endDate: string; isActual: boolean }>();
//   @Output() resetMap = new EventEmitter<void>();
//   @Output() filterSettingsChange = new EventEmitter<{ selectedLevels: string[]; mode: string }>();

//   @ViewChild('filterPanel') filterPanel!: ElementRef;

//   navItems = [
//     { id: 'country', label: 'Country', active: true },
//     { id: 'region', label: 'Region', active: false },
//     { id: 'subdivision', label: 'Sub Division', active: false },
//     { id: 'state', label: 'State', active: false },
//     { id: 'district', label: 'District', active: false },
//     { id: 'block', label: 'Block', active: false }
//   ];

//   startDate: string = '';
//   endDate: string = '';
//   isActual: boolean = false;
//   mode: string = 'state';
//   availableLevels: string[] = ['country', 'region', 'state', 'district', 'block'];
//   selectedLevels: string[] = ['state', 'district', 'block'];
//   levelForm: FormGroup;
//   showFilterPanel: boolean = false;
//   selectionMessage: string = '';
//   selectedCount: number = 0;

//   constructor(private fb: FormBuilder) {
//     this.levelForm = this.fb.group({
//       country: [false],
//       region: [false],
//       state: [true],
//       district: [true],
//       block: [true]
//     });
//     this.updateSelectionMessage();
//   }

//   ngOnInit(): void {
//     if (this.maxDate) {
//       this.startDate = this.maxDate;
//       this.endDate = this.maxDate;
//     }
//     this.updateFormFromSelectedLevels();
//     this.levelForm.valueChanges.subscribe(() => {
//       this.updateSelectionMessage();
//     });
//   }

//   onSelectLayer(layerId: string) {
//     this.navItems.forEach(item => item.active = item.id === layerId);
//     this.layerSelected.emit(layerId);
//   }

//   onToggleComparisonClick() {
//     this.toggleComparison.emit();
//   }

//   onFilterChange() {
//     this.filterChange.emit({
//       startDate: this.startDate,
//       endDate: this.endDate,
//       isActual: this.isActual
//     });
//   }

//   onResetMapView() {
//     this.resetMap.emit();
//   }

//   setActiveLayer(layerName: string) {
//     this.navItems.forEach(item => item.active = item.id === layerName);
//   }

//   onModeChange(): void {
//     if (this.mode === 'state') {
//       this.selectedLevels = ['state', 'district', 'block'];
//     } else {
//       this.selectedLevels = ['subdivision', 'district', 'block'];
//     }
//     this.updateAvailableLevels();
//     this.updateFormFromSelectedLevels();
//     this.filterSettingsChange.emit({ selectedLevels: this.selectedLevels, mode: this.mode });
//   }

//   updateAvailableLevels(): void {
//     this.availableLevels = this.mode === 'state'
//       ? ['country', 'region', 'state', 'district', 'block']
//       : ['country', 'region', 'subdivision', 'district', 'block'];
//   }

//   updateFormFromSelectedLevels(): void {
//     const controls = this.levelForm.controls;
//     controls['country'].setValue(this.selectedLevels.includes('country'));
//     controls['region'].setValue(this.selectedLevels.includes('region'));
//     controls['state'].setValue(this.selectedLevels.includes(this.mode === 'state' ? 'state' : 'subdivision'));
//     controls['district'].setValue(this.selectedLevels.includes('district'));
//     controls['block'].setValue(this.selectedLevels.includes('block'));
//     this.updateSelectionMessage();
//   }

//   updateSelectionMessage(): void {
//     this.selectedCount = Object.values(this.levelForm.value).filter(value => value).length;
//     if (this.selectedCount < 3) {
//       this.selectionMessage = 'Select minimum 3.';
//     } else if (this.selectedCount > 3) {
//       this.selectionMessage = `Selected: ${this.selectedCount}. Selection limit is 3.`;
//     } else {
//       this.selectionMessage = ''; // No message when exactly 3 are selected
//     }
//   }

//   onApply(): void {
//     const selected = Object.keys(this.levelForm.value).filter(key => this.levelForm.value[key]);
//     const pendingLevels = selected.map(key => key === 'state' ? (this.mode === 'state' ? 'state' : 'subdivision') : key);
//     if (pendingLevels.length !== 3) {
//       return; // Do not apply if not exactly 3 levels
//     }
//     this.onResetMapView(); 
//     this.selectedLevels = pendingLevels;
//     this.closeFilterPanel();
//     this.filterSettingsChange.emit({ selectedLevels: this.selectedLevels, mode: this.mode });
//     this.onFilterChange();
//   }

//   toggleFilterPanel(event?: MouseEvent): void {
//     if (event) {
//       event.stopPropagation(); // Prevent click from triggering handleOutsideClick
//     }
//     this.showFilterPanel = !this.showFilterPanel;
//     console.log('Filter panel toggled. showFilterPanel:', this.showFilterPanel);
//   }

//   closeFilterPanel(): void {
//     this.showFilterPanel = false;
//     console.log('Filter panel closed. showFilterPanel:', this.showFilterPanel);
//   }

//   @HostListener('document:click', ['$event'])
//   handleOutsideClick(event: MouseEvent): void {
//     if (this.showFilterPanel && this.filterPanel && !this.filterPanel.nativeElement.contains(event.target)) {
//       this.closeFilterPanel();
//     }
//   }
// }

// import { Component, EventEmitter, Input, Output, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
// import { FormBuilder, FormGroup } from '@angular/forms';

// @Component({
//   selector: 'app-map-nav-bar',
//   templateUrl: './map-nav-bar.component.html',
//   styleUrls: ['./map-nav-bar.component.css']
// })
// export class MapNavBarComponent implements OnInit {
//   @Input() showComparison = false;
//   @Input() maxDate = '';
//   @Input() lastActiveLayer = 'country';

//   @Output() layerSelected = new EventEmitter<string>();
//   @Output() toggleComparison = new EventEmitter<void>();
//   @Output() filterChange = new EventEmitter<{ startDate: string; endDate: string; isActual: boolean }>();
//   @Output() resetMap = new EventEmitter<void>();
//   @Output() filterSettingsChange = new EventEmitter<{ selectedLevels: string[]; mode: string }>();

//   @ViewChild('filterPanel') filterPanel!: ElementRef;

//   navItems = [
//     { id: 'country', label: 'Country', active: true },
//     { id: 'region', label: 'Region', active: false },
//     { id: 'subdivision', label: 'Sub Division', active: false },
//     { id: 'state', label: 'State', active: false },
//     { id: 'district', label: 'District', active: false },
//     { id: 'block', label: 'Block', active: false }
//   ];

//   startDate: string = '';
//   endDate: string = '';
//   isActual: boolean = false;
//   mode: string = 'state';
//   availableLevels: string[] = ['country', 'region', 'state', 'district', 'block'];
//   selectedLevels: string[] = ['state', 'district', 'block'];
//   levelForm: FormGroup;
//   showFilterPanel: boolean = false;
//   selectionMessage: string = '';
//   selectedCount: number = 0;

//   constructor(private fb: FormBuilder) {
//     this.levelForm = this.fb.group({
//       country: [false],
//       region: [false],
//       state: [true],
//       district: [true],
//       block: [true]
//     });
//     this.updateSelectionMessage();
//   }

//   ngOnInit(): void {
//     if (this.maxDate) {
//       this.startDate = this.maxDate;
//       this.endDate = this.maxDate;
//     }
//     this.updateFormFromSelectedLevels();
//     this.levelForm.valueChanges.subscribe(() => {
//       this.updateSelectionMessage();
//     });
//   }

//   onSelectLayer(layerId: string) {
//     this.navItems.forEach(item => item.active = item.id === layerId);
//     this.layerSelected.emit(layerId);
//   }

//   onToggleComparisonClick() {
//     this.toggleComparison.emit();
//   }

//   onFilterChange() {
//     this.filterChange.emit({
//       startDate: this.startDate,
//       endDate: this.endDate,
//       isActual: this.isActual
//     });
//   }

//   onResetMapView() {
//     this.resetMap.emit();
//   }

//   setActiveLayer(layerName: string) {
//     this.navItems.forEach(item => item.active = item.id === layerName);
//   }

//   onModeChange(): void {
//     if (this.mode === 'state') {
//       this.selectedLevels = ['state', 'district', 'block'];
//     } else {
//       this.selectedLevels = ['subdivision', 'district', 'block'];
//     }
//     this.updateAvailableLevels();
//     this.updateFormFromSelectedLevels();
//     this.filterSettingsChange.emit({ selectedLevels: this.selectedLevels, mode: this.mode });
//   }

//   updateAvailableLevels(): void {
//     this.availableLevels = this.mode === 'state'
//       ? ['country', 'region', 'state', 'district', 'block']
//       : ['country', 'region', 'subdivision', 'district', 'block'];
//   }

//   updateFormFromSelectedLevels(): void {
//     const controls = this.levelForm.controls;
//     controls['country'].setValue(this.selectedLevels.includes('country'));
//     controls['region'].setValue(this.selectedLevels.includes('region'));
//     controls['state'].setValue(this.selectedLevels.includes(this.mode === 'state' ? 'state' : 'subdivision'));
//     controls['district'].setValue(this.selectedLevels.includes('district'));
//     controls['block'].setValue(this.selectedLevels.includes('block'));
//     this.updateSelectionMessage();
//   }

//   updateSelectionMessage(): void {
//     this.selectedCount = Object.values(this.levelForm.value).filter(value => value).length;
//     if (this.selectedCount < 3) {
//       this.selectionMessage = 'Select minimum 3.';
//     } else if (this.selectedCount > 3) {
//       this.selectionMessage = `Selected: ${this.selectedCount}. Selection limit is 3.`;
//     } else {
//       this.selectionMessage = ''; // No message when exactly 3 are selected
//     }
//   }

//   onApply(): void {
//     const selected = Object.keys(this.levelForm.value).filter(key => this.levelForm.value[key]);
//     const pendingLevels = selected.map(key => key === 'state' ? (this.mode === 'state' ? 'state' : 'subdivision') : key);
//     if (pendingLevels.length !== 3) {
//       return; // Do not apply if not exactly 3 levels
//     }
//     this.onResetMapView(); 
//     this.selectedLevels = pendingLevels;
//     this.closeFilterPanel();
//     this.filterSettingsChange.emit({ selectedLevels: this.selectedLevels, mode: this.mode });
//     this.onFilterChange();
//   }

//   toggleFilterPanel(event?: MouseEvent): void {
//     if (event) {
//       event.stopPropagation(); // Prevent click from triggering handleOutsideClick
//     }
//     this.showFilterPanel = !this.showFilterPanel;
//     console.log('Filter panel toggled. showFilterPanel:', this.showFilterPanel);
//   }

//   closeFilterPanel(): void {
//     this.showFilterPanel = false;
//     console.log('Filter panel closed. showFilterPanel:', this.showFilterPanel);
//   }

//   @HostListener('document:click', ['$event'])
//   handleOutsideClick(event: MouseEvent): void {
//     if (this.showFilterPanel && this.filterPanel && !this.filterPanel.nativeElement.contains(event.target)) {
//       this.closeFilterPanel();
//     }
//   }

//   onToggleActual(): void {
//     if (this.isActual) {
//       this.startDate = this.endDate;
//     }
//     this.onFilterChange();
//   }

//   onSelectDateChange(): void {
//     this.startDate = this.endDate;
//     this.onFilterChange();
//   }
// }


// import { Component, EventEmitter, Input, Output, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
// import { FormBuilder, FormGroup } from '@angular/forms';

// @Component({
//   selector: 'app-map-nav-bar',
//   templateUrl: './map-nav-bar.component.html',
//   styleUrls: ['./map-nav-bar.component.css']
// })
// export class MapNavBarComponent implements OnInit {
//   @Input() showComparison = false;
//   @Input() maxDate = '';
//   @Input() lastActiveLayer = 'country';

//   @Output() layerSelected = new EventEmitter<string>();
//   @Output() toggleComparison = new EventEmitter<void>();
//   @Output() filterChange = new EventEmitter<{ startDate: string; endDate: string; isActual: boolean }>();
//   @Output() resetMap = new EventEmitter<void>();
//   @Output() filterSettingsChange = new EventEmitter<{ selectedLevels: string[]; mode: string }>();

//   @ViewChild('filterPanel') filterPanel!: ElementRef;

//   navItems = [
//     { id: 'country', label: 'Country', active: true },
//     { id: 'region', label: 'Region', active: false },
//     { id: 'subdivision', label: 'Sub Division', active: false },
//     { id: 'state', label: 'State', active: false },
//     { id: 'district', label: 'District', active: false },
//     { id: 'block', label: 'Block', active: false }
//   ];

//   startDate: string = '';
//   endDate: string = '';
//   isActual: boolean = false;
//   mode: string = 'state';
//   availableLevels: string[] = ['country', 'region', 'state', 'district', 'block'];
//   selectedLevels: string[] = ['state', 'district', 'block'];
//   levelForm: FormGroup;
//   showFilterPanel: boolean = false;
//   selectionMessage: string = '';
//   selectedCount: number = 0;

//   constructor(private fb: FormBuilder) {
//     this.levelForm = this.fb.group({
//       country: [false],
//       region: [false],
//       state: [true],
//       district: [true],
//       block: [true]
//     });
//     this.updateSelectionMessage();
//   }

//   ngOnInit(): void {
//     if (this.maxDate) {
//       this.startDate = this.maxDate;
//       this.endDate = this.maxDate;
//     }
//     this.updateFormFromSelectedLevels();
//     this.levelForm.valueChanges.subscribe(() => {
//       this.updateSelectionMessage();
//     });
//   }

//   onSelectLayer(layerId: string) {
//     this.navItems.forEach(item => item.active = item.id === layerId);
//     this.layerSelected.emit(layerId);
//   }

//   onToggleComparisonClick() {
//     this.toggleComparison.emit();
//   }

//   onFilterChange() {
//     this.filterChange.emit({
//       startDate: this.startDate,
//       endDate: this.endDate,
//       isActual: this.isActual
//     });
//   }

//   onResetMapView() {
//     this.resetMap.emit();
//   }

//   setActiveLayer(layerName: string) {
//     this.navItems.forEach(item => item.active = item.id === layerName);
//   }

//   onModeChange(): void {
//     if (this.mode === 'state') {
//       this.selectedLevels = ['state', 'district', 'block'];
//     } else {
//       this.selectedLevels = ['subdivision', 'district', 'block'];
//     }
//     this.updateAvailableLevels();
//     this.updateFormFromSelectedLevels();
//     this.filterSettingsChange.emit({ selectedLevels: this.selectedLevels, mode: this.mode });
//   }

//   updateAvailableLevels(): void {
//     this.availableLevels = this.mode === 'state'
//       ? ['country', 'region', 'state', 'district', 'block']
//       : ['country', 'region', 'subdivision', 'district', 'block'];
//   }

//   updateFormFromSelectedLevels(): void {
//     const controls = this.levelForm.controls;
//     controls['country'].setValue(this.selectedLevels.includes('country'));
//     controls['region'].setValue(this.selectedLevels.includes('region'));
//     controls['state'].setValue(this.selectedLevels.includes(this.mode === 'state' ? 'state' : 'subdivision'));
//     controls['district'].setValue(this.selectedLevels.includes('district'));
//     controls['block'].setValue(this.selectedLevels.includes('block'));
//     this.updateSelectionMessage();
//   }

//   updateSelectionMessage(): void {
//     this.selectedCount = Object.values(this.levelForm.value).filter(value => value).length;
//     if (this.selectedCount < 3) {
//       this.selectionMessage = 'Select minimum 3.';
//     } else if (this.selectedCount > 3) {
//       this.selectionMessage = `Selected: ${this.selectedCount}. Selection limit is 3.`;
//     } else {
//       this.selectionMessage = ''; // No message when exactly 3 are selected
//     }
//   }

//   onApply(): void {
//     const selected = Object.keys(this.levelForm.value).filter(key => this.levelForm.value[key]);
//     const pendingLevels = selected.map(key => key === 'state' ? (this.mode === 'state' ? 'state' : 'subdivision') : key);
//     if (pendingLevels.length !== 3) {
//       return; // Do not apply if not exactly 3 levels
//     }
//     this.onResetMapView(); 
//     this.selectedLevels = pendingLevels;
//     this.closeFilterPanel();
//     this.filterSettingsChange.emit({ selectedLevels: this.selectedLevels, mode: this.mode });
//     this.onFilterChange();
//   }

//   toggleFilterPanel(event?: MouseEvent): void {
//     if (event) {
//       event.stopPropagation(); // Prevent click from triggering handleOutsideClick
//     }
//     this.showFilterPanel = !this.showFilterPanel;
//   }

//   closeFilterPanel(): void {
//     this.showFilterPanel = false;
//   }

//   @HostListener('document:click', ['$event'])
//   handleOutsideClick(event: MouseEvent): void {
//     if (this.showFilterPanel && this.filterPanel && !this.filterPanel.nativeElement.contains(event.target)) {
//       this.closeFilterPanel();
//     }
//   }

//   onToggleActual(): void {
//     if (this.isActual) {
//       this.startDate = this.endDate;
//     }
//     this.onFilterChange();
//   }

//   onSelectDateChange(): void {
//     this.startDate = this.endDate;
//     this.onFilterChange();
//   }
// }


// import { Component, EventEmitter, Input, Output, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
// import { FormBuilder, FormGroup } from '@angular/forms';

// @Component({
//   selector: 'app-map-nav-bar',
//   templateUrl: './map-nav-bar.component.html',
//   styleUrls: ['./map-nav-bar.component.css']
// })
// export class MapNavBarComponent implements OnInit {
//   @Input() showComparison = false;
//   @Input() maxDate = '';
//   @Input() lastActiveLayer = 'country';
//   @Output() toggleComparison = new EventEmitter<void>();
//   @Output() filterChange = new EventEmitter<{ startDate: string; endDate: string; isActual: boolean }>();
//   @Output() resetMap = new EventEmitter<void>();
//   @Output() filterSettingsChange = new EventEmitter<{ selectedLevels: string[]; mode: string }>();

//   @ViewChild('filterPanel') filterPanel!: ElementRef;

//   startDate: string = '';
//   endDate: string = '';
//   isActual: boolean = false;
//   mode: string = 'state';
//   availableLevels: string[] = ['country', 'region', 'state', 'district', 'block'];
//   selectedLevels: string[] = ['state', 'district', 'block'];
//   levelForm: FormGroup;
//   showFilterPanel: boolean = false;
//   selectionMessage: string = '';
//   selectedCount: number = 0;

//   // Marquee text inspired by reference DashboardComponent
//   marqueeText: string = 'Heavy rainfall expected in North-East region • Flood alert for coastal areas • Temperature rising in western states • Monitoring active • Statewide updates active';

//   constructor(private fb: FormBuilder) {
//     this.levelForm = this.fb.group({
//       country: [false],
//       region: [false],
//       state: [true],
//       district: [true],
//       block: [true]
//     });
//     this.updateSelectionMessage();
//   }

//   ngOnInit(): void {
//     if (this.maxDate) {
//       this.startDate = this.maxDate;
//       this.endDate = this.maxDate;
//     }
//     this.updateFormFromSelectedLevels();
//     this.levelForm.valueChanges.subscribe(() => {
//       this.updateSelectionMessage();
//     });
//   }

//   onToggleComparisonClick() {
//     this.toggleComparison.emit();
//   }

//   onFilterChange() {
//     this.filterChange.emit({
//       startDate: this.startDate,
//       endDate: this.endDate,
//       isActual: this.isActual
//     });
//   }

//   onResetMapView() {
//     this.resetMap.emit();
//   }

//   onModeChange(): void {
//     if (this.mode === 'state') {
//       this.selectedLevels = ['state', 'district', 'block'];
//     } else {
//       this.selectedLevels = ['subdivision', 'district', 'block'];
//     }
//     this.updateAvailableLevels();
//     this.updateFormFromSelectedLevels();
//     this.filterSettingsChange.emit({ selectedLevels: this.selectedLevels, mode: this.mode });
//   }

//   updateAvailableLevels(): void {
//     this.availableLevels = this.mode === 'state'
//       ? ['country', 'region', 'state', 'district', 'block']
//       : ['country', 'region', 'subdivision', 'district', 'block'];
//   }

//   updateFormFromSelectedLevels(): void {
//     const controls = this.levelForm.controls;
//     controls['country'].setValue(this.selectedLevels.includes('country'));
//     controls['region'].setValue(this.selectedLevels.includes('region'));
//     controls['state'].setValue(this.selectedLevels.includes(this.mode === 'state' ? 'state' : 'subdivision'));
//     controls['district'].setValue(this.selectedLevels.includes('district'));
//     controls['block'].setValue(this.selectedLevels.includes('block'));
//     this.updateSelectionMessage();
//   }

//   updateSelectionMessage(): void {
//     this.selectedCount = Object.values(this.levelForm.value).filter(value => value).length;
//     if (this.selectedCount < 3) {
//       this.selectionMessage = 'Select minimum 3.';
//     } else if (this.selectedCount > 3) {
//       this.selectionMessage = `Selected: ${this.selectedCount}. Selection limit is 3.`;
//     } else {
//       this.selectionMessage = '';
//     }
//   }

//   onApply(): void {
//     const selected = Object.keys(this.levelForm.value).filter(key => this.levelForm.value[key]);
//     const pendingLevels = selected.map(key => key === 'state' ? (this.mode === 'state' ? 'state' : 'subdivision') : key);
//     if (pendingLevels.length !== 3) {
//       return;
//     }
//     this.onResetMapView();
//     this.selectedLevels = pendingLevels;
//     this.closeFilterPanel();
//     this.filterSettingsChange.emit({ selectedLevels: this.selectedLevels, mode: this.mode });
//     this.onFilterChange();
//   }

//   toggleFilterPanel(event?: MouseEvent): void {
//     if (event) {
//       event.stopPropagation();
//     }
//     this.showFilterPanel = !this.showFilterPanel;
//   }

//   closeFilterPanel(): void {
//     this.showFilterPanel = false;
//   }

//   @HostListener('document:click', ['$event'])
//   handleOutsideClick(event: MouseEvent): void {
//     if (this.showFilterPanel && this.filterPanel && !this.filterPanel.nativeElement.contains(event.target)) {
//       this.closeFilterPanel();
//     }
//   }

//   onToggleActual(): void {
//     if (this.isActual) {
//       this.startDate = this.endDate;
//     }
//     this.onFilterChange();
//   }

//   onSelectDateChange(): void {
//     this.startDate = this.endDate;
//     this.onFilterChange();
//   }
// }



// import { Component, EventEmitter, Input, Output, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
// import { FormBuilder, FormGroup } from '@angular/forms';
// import { FetchStationDataService } from 'src/app/services/station/station.service';

// @Component({
//   selector: 'app-map-nav-bar',
//   templateUrl: './map-nav-bar.component.html',
//   styleUrls: ['./map-nav-bar.component.css']
// })
// export class MapNavBarComponent implements OnInit {
//   @Input() showComparison = false;
//   @Input() maxDate = '';
//   @Input() lastActiveLayer = 'country';
//   @Output() toggleComparison = new EventEmitter<void>();
//   @Output() filterChange = new EventEmitter<{ startDate: string; endDate: string; isActual: boolean }>();
//   @Output() resetMap = new EventEmitter<void>();
//   @Output() filterSettingsChange = new EventEmitter<{ selectedLevels: string[]; mode: string }>();

//   @ViewChild('filterPanel') filterPanel!: ElementRef;

//   startDate: string = '';
//   endDate: string = '';
//   isActual: boolean = false;
//   mode: string = 'state';
//   availableLevels: string[] = ['country', 'region', 'state', 'district', 'block'];
//   selectedLevels: string[] = ['state', 'district', 'block'];
//   levelForm: FormGroup;
//   showFilterPanel: boolean = false;
//   selectionMessage: string = '';
//   selectedCount: number = 0;

//   stationData: any[] = [];
//   topStations: any[] = [];

//   constructor(
//     private fb: FormBuilder,
//     private fetchStationDataService: FetchStationDataService
//   ) {
//     this.levelForm = this.fb.group({
//       country: [false],
//       region: [false],
//       state: [true],
//       district: [true],
//       block: [true]
//     });
//     this.updateSelectionMessage();
//   }

//   ngOnInit(): void {
//     if (this.maxDate) {
//       this.startDate = this.maxDate;
//       this.endDate = this.maxDate;
//       this.fetchStationData(this.maxDate);
//     }
//     this.updateFormFromSelectedLevels();
//     this.levelForm.valueChanges.subscribe(() => {
//       this.updateSelectionMessage();
//     });
//   }

//   fetchStationData(date: string): void {
//     this.fetchStationDataService.fetchStationDataTemp(date).subscribe(
//       (response: any) => {
//         this.stationData = response?.data || [];
//         this.topStations = this.stationData
//           .filter(station => station.data !== -999.9 && station.data > 0)
//           .sort((a, b) => b.data - a.data)
//           .slice(0, 5);
//       },
//       (error: any) => {
//         console.error("Error fetching data:", error);
//       }
//     );
//   }

//   onToggleComparisonClick() {
//     this.toggleComparison.emit();
//   }

//   onFilterChange() {
//     this.filterChange.emit({
//       startDate: this.startDate,
//       endDate: this.endDate,
//       isActual: this.isActual
//     });
//   }

//   onResetMapView() {
//     this.resetMap.emit();
//   }

//   onModeChange(): void {
//     if (this.mode === 'state') {
//       this.selectedLevels = ['state', 'district', 'block'];
//     } else {
//       this.selectedLevels = ['subdivision', 'district', 'block'];
//     }
//     this.updateAvailableLevels();
//     this.updateFormFromSelectedLevels();
//     this.filterSettingsChange.emit({ selectedLevels: this.selectedLevels, mode: this.mode });
//   }

//   updateAvailableLevels(): void {
//     this.availableLevels = this.mode === 'state'
//       ? ['country', 'region', 'state', 'district', 'block']
//       : ['country', 'region', 'subdivision', 'district', 'block'];
//   }

//   updateFormFromSelectedLevels(): void {
//     const controls = this.levelForm.controls;
//     controls['country'].setValue(this.selectedLevels.includes('country'));
//     controls['region'].setValue(this.selectedLevels.includes('region'));
//     controls['state'].setValue(this.selectedLevels.includes(this.mode === 'state' ? 'state' : 'subdivision'));
//     controls['district'].setValue(this.selectedLevels.includes('district'));
//     controls['block'].setValue(this.selectedLevels.includes('block'));
//     this.updateSelectionMessage();
//   }

//   updateSelectionMessage(): void {
//     this.selectedCount = Object.values(this.levelForm.value).filter(value => value).length;
//     if (this.selectedCount < 3) {
//       this.selectionMessage = 'Select minimum 3.';
//     } else if (this.selectedCount > 3) {
//       this.selectionMessage = `Selected: ${this.selectedCount}. Selection limit is 3.`;
//     } else {
//       this.selectionMessage = '';
//     }
//   }

//   onApply(): void {
//     const selected = Object.keys(this.levelForm.value).filter(key => this.levelForm.value[key]);
//     const pendingLevels = selected.map(key => key === 'state' ? (this.mode === 'state' ? 'state' : 'subdivision') : key);
//     if (pendingLevels.length !== 3) {
//       return;
//     }
//     this.onResetMapView();
//     this.selectedLevels = pendingLevels;
//     this.closeFilterPanel();
//     this.filterSettingsChange.emit({ selectedLevels: this.selectedLevels, mode: this.mode });
//     this.onFilterChange();
//   }

//   toggleFilterPanel(event?: MouseEvent): void {
//     if (event) {
//       event.stopPropagation();
//     }
//     this.showFilterPanel = !this.showFilterPanel;
//   }

//   closeFilterPanel(): void {
//     this.showFilterPanel = false;
//   }

//   @HostListener('document:click', ['$event'])
//   handleOutsideClick(event: MouseEvent): void {
//     if (this.showFilterPanel && this.filterPanel && !this.filterPanel.nativeElement.contains(event.target)) {
//       this.closeFilterPanel();
//     }
//   }

//   onToggleActual(): void {
//     if (this.isActual) {
//       this.startDate = this.endDate;
//     }
//     this.onFilterChange();
//   }

//   onSelectDateChange(): void {
//     this.startDate = this.endDate;
//     this.onFilterChange();
//   }
// }


import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  ViewChild,
  ElementRef,
  HostListener
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FetchStationDataService } from 'src/app/services/station/station.service';

@Component({
  selector: 'app-map-nav-bar',
  templateUrl: './map-nav-bar.component.html',
  styleUrls: ['./map-nav-bar.component.css']
})
export class MapNavBarComponent implements OnInit {
  @Input() showComparison = false;
  @Input() maxDate = '';
  @Input() lastActiveLayer = 'country';
  @Output() toggleComparison = new EventEmitter<void>();
  @Output() filterChange = new EventEmitter<{ startDate: string; endDate: string; isActual: boolean }>();
  @Output() resetMap = new EventEmitter<void>();
  @Output() filterSettingsChange = new EventEmitter<{ selectedLevels: string[]; mode: string }>();

  @ViewChild('filterPanel') filterPanel!: ElementRef;

  startDate: string = '';
  endDate: string = '';
  isActual: boolean = false;
  mode: string = 'state';
  availableLevels: string[] = ['country', 'region', 'state', 'district', 'block'];
  selectedLevels: string[] = ['state', 'district', 'block'];
  levelForm: FormGroup;
  showFilterPanel: boolean = false;
  selectionMessage: string = '';
  selectedCount: number = 0;

  stationData: any[] = [];
  topStations: any[] = [];

  constructor(
    private fb: FormBuilder,
    private fetchStationDataService: FetchStationDataService
  ) {
    this.levelForm = this.fb.group({
      country: [false],
      region: [false],
      state: [true],
      district: [true],
      block: [true]
    });
    this.updateSelectionMessage();
  }

  ngOnInit(): void {
    const marqueeDate = this.getMarqueeDate();
    this.startDate = marqueeDate;
    this.endDate = marqueeDate;
    this.fetchStationData(marqueeDate);
    this.updateFormFromSelectedLevels();
    this.levelForm.valueChanges.subscribe(() => {
      this.updateSelectionMessage();
    });
  }

  getMarqueeDate(): string {
    const now = new Date();
    let marqueeDate = new Date();

    const cutoffHour = 13; // 1:00PM
    const cutoffMinute = 45; // 1:45PM

    if (
      now.getHours() < cutoffHour ||
      (now.getHours() === cutoffHour && now.getMinutes() < cutoffMinute)
    ) {
      // Before 1:45PM: use previous day
      marqueeDate.setDate(now.getDate() - 1);
    }
    // Format date as 'YYYY-MM-DD'
    const yyyy = marqueeDate.getFullYear();
    const mm = String(marqueeDate.getMonth() + 1).padStart(2, '0');
    const dd = String(marqueeDate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  fetchStationData(date: string): void {
    this.fetchStationDataService.fetchStationDataTemp(date).subscribe(
      (response: any) => {
        this.stationData = response?.data || [];
        this.topStations = this.stationData
          .filter(station => station.data !== -999.9 && station.data > 0)
          .sort((a, b) => b.data - a.data)
          .slice(0, 5);
      },
      (error: any) => {
        console.error("Error fetching data:", error);
      }
    );
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

  onModeChange(): void {
    if (this.mode === 'state') {
      this.selectedLevels = ['state', 'district', 'block'];
    } else {
      this.selectedLevels = ['subdivision', 'district', 'block'];
    }
    this.updateAvailableLevels();
    this.updateFormFromSelectedLevels();
    this.filterSettingsChange.emit({ selectedLevels: this.selectedLevels, mode: this.mode });
  }

  updateAvailableLevels(): void {
    this.availableLevels = this.mode === 'state'
      ? ['country', 'region', 'state', 'district', 'block']
      : ['country', 'region', 'subdivision', 'district', 'block'];
  }

  updateFormFromSelectedLevels(): void {
    const controls = this.levelForm.controls;
    controls['country'].setValue(this.selectedLevels.includes('country'));
    controls['region'].setValue(this.selectedLevels.includes('region'));
    controls['state'].setValue(this.selectedLevels.includes(this.mode === 'state' ? 'state' : 'subdivision'));
    controls['district'].setValue(this.selectedLevels.includes('district'));
    controls['block'].setValue(this.selectedLevels.includes('block'));
    this.updateSelectionMessage();
  }

  updateSelectionMessage(): void {
    this.selectedCount = Object.values(this.levelForm.value).filter(value => value).length;
    if (this.selectedCount < 3) {
      this.selectionMessage = 'Select minimum 3.';
    } else if (this.selectedCount > 3) {
      this.selectionMessage = `Selected: ${this.selectedCount}. Selection limit is 3.`;
    } else {
      this.selectionMessage = '';
    }
  }

  onApply(): void {
    const selected = Object.keys(this.levelForm.value).filter(key => this.levelForm.value[key]);
    const pendingLevels = selected.map(key => key === 'state' ? (this.mode === 'state' ? 'state' : 'subdivision') : key);
    if (pendingLevels.length !== 3) {
      return;
    }
    this.onResetMapView();
    this.selectedLevels = pendingLevels;
    this.closeFilterPanel();
    this.filterSettingsChange.emit({ selectedLevels: this.selectedLevels, mode: this.mode });
    this.onFilterChange();
  }

  toggleFilterPanel(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.showFilterPanel = !this.showFilterPanel;
  }

  closeFilterPanel(): void {
    this.showFilterPanel = false;
  }

  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: MouseEvent): void {
    if (this.showFilterPanel && this.filterPanel && !this.filterPanel.nativeElement.contains(event.target)) {
      this.closeFilterPanel();
    }
  }

  onToggleActual(): void {
    if (this.isActual) {
      this.startDate = this.endDate;
    }
    this.onFilterChange();
  }

  onSelectDateChange(): void {
    this.startDate = this.endDate;
    this.onFilterChange();
  }
}
