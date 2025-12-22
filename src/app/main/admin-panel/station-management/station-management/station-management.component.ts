import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as L from 'leaflet'; // Import Leaflet for Map

@Component({
  selector: 'app-station-management',
  templateUrl: './station-management.component.html',
  styleUrls: ['./station-management.component.css']
})
export class StationManagementComponent implements OnInit, AfterViewInit {
  @ViewChild('regionChart') regionChartCanvas!: ElementRef<HTMLCanvasElement>;

  // Navigation & UI State
  activeTab: string = 'dashboard';
  navCollapsed = true;
  searchTerm = '';

  // Stats
  stats = { total: 500, active: 480, inactive: 20 };

  // Form & Edit Mode State
  stationForm!: FormGroup;
  editMode = false;
  editingStationId: any = null;

  // -----------------------
  // DROPDOWN DATA
  // -----------------------
  regions: string[] = ['Northern', 'Southern', 'Eastern', 'Western', 'Central', 'NorthEast'];
  subdivisions: string[] = ['Delhi Div', 'Lucknow Div', 'Ambala Div', 'Firozpur Div', 'Mumbai Div', 'Chennai Div'];
  states: string[] = ['Delhi', 'Uttar Pradesh', 'Punjab', 'Maharashtra', 'Tamil Nadu', 'West Bengal'];
  districts: string[] = ['New Delhi', 'Lucknow', 'Ambala', 'Mumbai City', 'Chennai', 'Kolkata'];
  
  // Station Dropdowns
  stationTypes = ['Permanent', 'Temporary', 'Mobile', 'Relay', 'Base', 'Repeater'];
  
  // Centre Dropdowns
  centreTypes: string[] = ['Training Centre', 'Control Centre', 'Data Centre', 'Logistics Hub', 'Admin Block', 'Signaling Centre'];

  // Data Containers
  allStations: any[] = [];
  filteredStations: any[] = []; // NEW: For Manage Tab Table
  recentActivity: any[] = [];
  logs: any[] = []; // NEW: For Logs Tab

  // -----------------------
  // FILTERS FOR MANAGE TAB
  // -----------------------
  filterRegion: string = '';
  filterSubdivision: string = '';
  filterState: string = '';
  filterDistrict: string = '';

  // -----------------------
  // MAP OBJECT
  // -----------------------
  private map!: L.Map;
  private mapInitialized = false;

  // Dashboard Cards Config
  dashboardCards = [
    { title: 'Total Stations', value: 500, color: 'blue', icon: 'bi bi-building' },
    { title: 'Active', value: 480, color: 'green', icon: 'bi bi-check-circle' },
    { title: 'Inactive', value: 20, color: 'orange', icon: 'bi bi-x-circle' },
    { title: 'Completion Rate', value: '96%', color: 'cyan', icon: 'bi bi-graph-up' }
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.initForm();
    this.loadMockData(); // Generates 500 items
    this.applyFilters(); // Initial filter run
  }

  ngAfterViewInit() {
    // Chart initialization would go here
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 1. FORM INITIALIZATION
  // ──────────────────────────────────────────────────────────────────────────
  initForm() {
    this.stationForm = this.fb.group({
      // -- Editable Fields (Always) --
      centrename: ['', Validators.required],
      centretype: ['', Validators.required],
      stationname: ['', Validators.required],
      stationtype: ['', Validators.required],
      latitude: ['', [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitude: ['', [Validators.required, Validators.min(-180), Validators.max(180)]],
      remarks: [''],
      
      // -- Hierarchy Fields (Locked in Edit Mode) --
      regionnam: ['', Validators.required],
      subdivisio: [''],
      statenam: [''],
      districtnam: [''],
      blockcode: ['', Validators.required],
      
      // -- Always Readonly --
      stationcode: [{ value: '', disabled: true }] 
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. NAVIGATION & RESET
  // ──────────────────────────────────────────────────────────────────────────
  setTab(tab: string) {
    this.activeTab = tab;
    this.navCollapsed = true;

    if (tab === 'add') {
      this.resetForm();
    }

    // Initialize Map if switching to Map tab
    if (tab === 'map') {
      setTimeout(() => {
        this.initMap();
      }, 100); 
    }
  }

  resetForm() {
    this.editMode = false;
    this.editingStationId = null;
    this.stationForm.reset();
    
    // Unlock everything for a fresh "Add"
    this.stationForm.enable();
    // Keep stationcode disabled (auto-generated)
    this.stationForm.get('stationcode')?.disable();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. EDIT LOGIC
  // ──────────────────────────────────────────────────────────────────────────
  loadStationForEdit(station: any) {
    this.editMode = true;
    this.editingStationId = station.stationid;
    this.activeTab = 'edit'; // Auto-switch to form view

    // A. Patch Values
    this.stationForm.patchValue({
      centrename: station.centrename,
      centretype: station.centretype,
      stationname: station.stationname,
      stationtype: station.stationtype,
      latitude: station.latitude,
      longitude: station.longitude,
      remarks: station.remarks,
      regionnam: station.regionnam,
      subdivisio: station.subdivisio,
      statenam: station.statenam,
      districtnam: station.districtnam,
      blockcode: station.blockcode,
      stationcode: station.stationcode
    });

    // B. DISABLE Hierarchy (Lock Region -> Block)
    this.stationForm.get('regionnam')?.disable();
    this.stationForm.get('subdivisio')?.disable();
    this.stationForm.get('statenam')?.disable();
    this.stationForm.get('districtnam')?.disable();
    this.stationForm.get('blockcode')?.disable();

    // C. ENABLE Editable Details
    this.stationForm.get('centrename')?.enable();
    this.stationForm.get('centretype')?.enable();
    this.stationForm.get('stationname')?.enable();
    this.stationForm.get('stationtype')?.enable();
    this.stationForm.get('latitude')?.enable();
    this.stationForm.get('longitude')?.enable();
    this.stationForm.get('remarks')?.enable();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. SUBMIT LOGIC
  // ──────────────────────────────────────────────────────────────────────────
  onSubmitStation() {
    if (this.stationForm.invalid) {
      this.stationForm.markAllAsTouched(); // Show errors
      return;
    }

    const formValue = this.stationForm.getRawValue();

    if (this.editMode) {
      console.log('UPDATING Station ID:', this.editingStationId);
      console.log('Payload:', formValue);
      alert(`Success! Updated ${formValue.stationname} (Centre: ${formValue.centrename})`);
    } else {
      console.log('CREATING New Station:', formValue);
      alert(`Success! Added ${formValue.stationname}`);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5. MOVE / INACTIVE LOGIC
  // ──────────────────────────────────────────────────────────────────────────
  softDeleteStation(station: any) {
    if (!confirm(`Are you sure you want to make ${station.stationname} INACTIVE?`)) return;
    
    // Mock Update
    station.flag = 0; 
    station.updatedat = new Date();
    
    this.recentActivity.unshift({
      stationname: station.stationname,
      action: 'Deactivated',
      updatedat: new Date()
    });

    // Add to System Logs
    this.logs.unshift({ date: new Date(), action: 'DEACTIVATE', user: 'Admin', details: `${station.stationname} flagged inactive` });
  }

  moveStation(station: any) {
    const newBlock = prompt(`Move ${station.stationname}.\nEnter new Block Code (Current: ${station.blockcode}):`);
    if (newBlock && newBlock !== station.blockcode) {
      alert(`Initiating Move Process...\n1. Deactivating ID: ${station.stationid}\n2. Creating new entry in Block: ${newBlock}`);
      station.flag = 0; // Mark old as inactive
      
      this.logs.unshift({ date: new Date(), action: 'MOVE', user: 'Admin', details: `${station.stationname} moved to ${newBlock}` });
    }
  }

  onRegionChange() {
    if (!this.editMode) {
      // Logic to fetch subdivisions...
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 6. MAP LOGIC (NEW)
  // ──────────────────────────────────────────────────────────────────────────
  initMap() {
    // Prevent double initialization
    if (this.mapInitialized) {
      this.map.invalidateSize(); 
      return;
    }

    // Center on India [Lat, Lng]
    this.map = L.map('map').setView([20.5937, 78.9629], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Add 500 Pins
    this.allStations.forEach(st => {
      const color = st.flag ? 'blue' : 'red';
      
      L.circleMarker([st.latitude, st.longitude], {
        radius: 5,
        fillColor: color,
        color: '#fff',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(this.map)
      .bindPopup(`<b>${st.stationname}</b><br>${st.regionnam}<br>Status: ${st.flag ? 'Active' : 'Inactive'}`);
    });

    this.mapInitialized = true;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 7. FILTER LOGIC FOR MANAGE TAB
  // ──────────────────────────────────────────────────────────────────────────
  applyFilters() {
    this.filteredStations = this.allStations.filter(st => {
      const matchRegion = this.filterRegion ? st.regionnam === this.filterRegion : true;
      const matchSubdiv = this.filterSubdivision ? st.subdivisio === this.filterSubdivision : true;
      const matchState = this.filterState ? st.statenam === this.filterState : true;
      const matchDistrict = this.filterDistrict ? st.districtnam === this.filterDistrict : true;
      
      return matchRegion && matchSubdiv && matchState && matchDistrict;
    });
  }

  clearFilters() {
    this.filterRegion = '';
    this.filterSubdivision = '';
    this.filterState = '';
    this.filterDistrict = '';
    this.applyFilters();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 8. MOCK DATA GENERATOR (500 ITEMS)
  // ──────────────────────────────────────────────────────────────────────────
  loadMockData() {
    this.allStations = [];

    // Bounds for India
    const latMin = 8.4, latMax = 37.6;
    const lngMin = 68.7, lngMax = 97.25;

    for (let i = 0; i < 500; i++) {
      this.allStations.push({
        stationid: i + 1,
        stationcode: `NR${1000 + i}`,
        centrename: `Centre Alpha ${i + 1}`,
        centretype: this.centreTypes[i % this.centreTypes.length],
        stationname: `Ind Station ${i + 1}`,
        stationtype: this.stationTypes[i % this.stationTypes.length],
        // Hierarchy
        regionnam: this.regions[Math.floor(Math.random() * this.regions.length)],
        subdivisio: this.subdivisions[Math.floor(Math.random() * this.subdivisions.length)],
        statenam: this.states[Math.floor(Math.random() * this.states.length)],
        districtnam: this.districts[Math.floor(Math.random() * this.districts.length)],
        blockcode: `BLK${10 + (i % 99)}`,
        // Geo
        latitude: latMin + (Math.random() * (latMax - latMin)),
        longitude: lngMin + (Math.random() * (lngMax - lngMin)),
        flag: Math.random() > 0.05 ? 1 : 0, // 95% Active
        remarks: 'Automated test entry'
      });
    }

    // Initialize filtered list
    this.filteredStations = [...this.allStations];

    // Mock Activity
    this.recentActivity = [
      { stationname: 'Delhi Cantt', action: 'Added', updatedat: new Date() },
      { stationname: 'Mumbai Central', action: 'Updated', updatedat: new Date() }
    ];

    // Mock System Logs
    this.logs = Array.from({length: 20}, (_, i) => ({
      date: new Date(new Date().setDate(new Date().getDate() - i)),
      action: i % 3 === 0 ? 'UPDATE' : (i % 2 === 0 ? 'LOGIN' : 'ERROR'),
      user: 'SuperAdmin',
      details: `System check performed routine #${i+400}`
    }));
  }
}