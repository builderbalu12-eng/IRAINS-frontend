import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StationDashboardService } from 'src/app/services/station-dashboard/station-dashboard.service';

@Component({
  selector: 'app-station-management',
  templateUrl: './station-management.component.html',
  styleUrls: ['./station-management.component.css']
})
export class StationManagementComponent implements OnInit {

  activeTab = 'dashboard';

  // ── Metrics ────────────────────────────────────────────────────────────────
  metrics: any = { total: 0, active: 0, inactive: 0, operational_rate: '0.0', by_type: {} };
  metricsLoading = false;

  // ── Geography cascade ──────────────────────────────────────────────────────
  geoRows: any[] = [];
  regions:      { name: string; code: any }[] = [];
  subdivisions: { name: string; code: any }[] = [];
  states:       { name: string; code: any }[] = [];
  districts:    { name: string; code: any }[] = [];
  blocks:       { name: string; code: any }[] = [];

  selRegion = '';  selRegionCode: any = null;
  selSubdiv = '';  selSubdivCode: any = null;
  selState  = '';  selStateCode:  any = null;
  selDistrict = ''; selDistrictCode: any = null;
  selBlock  = '';  selBlockCode:  any = null;
  generatedStationCode = '';

  rmcMcOptions: string[] = [];

  // ── Add Station ────────────────────────────────────────────────────────────
  addForm!: FormGroup;
  addSubTab = 'single';
  addLoading = false;
  addMsg = '';
  addErr = '';

  // Bulk upload
  bulkFile: File | null = null;
  bulkPreview: any[] = [];
  bulkLoading = false;
  bulkMsg = '';
  bulkErr = '';

  // ── Edit / Delete / Move ───────────────────────────────────────────────────
  editSearchQ = '';
  editSearchResults: any[] = [];
  editSearchLoading = false;
  editSearchTotal = 0;
  editSearchPage = 1;

  selectedStation: any = null;
  editActionTab: 'edit' | 'delete' | 'move' | null = null;

  editForm!: FormGroup;
  editLoading = false;
  editMsg = '';
  editErr = '';
  editDiff: { field: string; old: any; new: any }[] = [];

  deleteConfirmCode = '';
  deleteLoading = false;
  deleteMsg = '';
  deleteErr = '';

  // Move
  moveRegion = '';    moveRegionCode: any = null;
  moveSubdiv = '';    moveSubdivCode: any = null;
  moveState  = '';    moveStateCode:  any = null;
  moveDistrict = '';  moveDistrictCode: any = null;
  moveBlock  = '';    moveBlockCode:  any = null;
  moveBlocks: { name: string; code: any }[] = [];
  moveSubdivisions: { name: string; code: any }[] = [];
  moveStates:       { name: string; code: any }[] = [];
  moveDistricts:    { name: string; code: any }[] = [];
  moveNewCode = '';
  moveLoading = false;
  moveMsg = '';
  moveErr = '';

  // ── Visualization ──────────────────────────────────────────────────────────
  vizLevel = 'state';
  vizDistribution: any = { labels: [], counts: [] };
  vizLoading = false;

  // ── Search ─────────────────────────────────────────────────────────────────
  searchQ = '';
  searchMode = 'contains';
  searchCaseSensitive = false;
  searchStatus = 'active';
  searchType = '';
  searchRegion = '';
  searchState = '';
  searchPage = 1;
  searchResults: any[] = [];
  searchTotal = 0;
  searchLoading = false;

  // ── History ────────────────────────────────────────────────────────────────
  historyData: any[] = [];
  historyTotal = 0;
  historyPage = 1;
  historyLoading = false;
  historySubTab = 'inactive';
  timelineName = '';
  timelineData: any[] = [];
  timelineLoading = false;
  recentChanges: any[] = [];
  recentLoading = false;

  // ── Delete Disabled ────────────────────────────────────────────────────────
  disabledStations: any[] = [];
  disabledLoading = false;
  disabledSelected: Set<any> = new Set();
  deleteConsent = false;
  permDeleteLoading = false;
  permDeleteMsg = '';
  permDeleteErr = '';

  constructor(
    private fb: FormBuilder,
    private svc: StationDashboardService
  ) {}

  ngOnInit() {
    this.buildAddForm();
    this.buildEditForm();
    this.loadMetrics();
    this.loadGeography();
    this.loadRmcMcOptions();
  }

  // ── Tab Navigation ─────────────────────────────────────────────────────────
  setTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'visualization')  this.loadVizDistribution();
    if (tab === 'history')        { this.loadHistory(); this.loadRecentChanges(); }
    if (tab === 'deleteDisabled') this.loadDisabled();
    if (tab === 'editdelete')     this.searchActiveStations();
    if (tab === 'dashboard')      this.loadRecentChanges();
  }

  // ── Metrics ────────────────────────────────────────────────────────────────
  loadMetrics() {
    this.metricsLoading = true;
    this.svc.getMetrics().subscribe({
      next: r => { if (r.success) this.metrics = r.data; this.metricsLoading = false; },
      error: () => this.metricsLoading = false
    });
  }

  get metricCards() {
    return [
      { title: 'Total Stations', value: this.metrics.total, icon: '🏗️', color: 'blue' },
      { title: 'Active Stations', value: this.metrics.active, icon: '✅', color: 'green' },
      { title: 'Inactive Stations', value: this.metrics.inactive, icon: '⛔', color: 'red' },
      { title: 'Operational Rate', value: this.metrics.operational_rate + '%', icon: '📊', color: 'purple' },
    ];
  }

  get typeBreakdown(): { type: string; count: number }[] {
    return Object.entries(this.metrics.by_type || {}).map(([k, v]) => ({ type: k, count: Number(v) }));
  }

  // ── Geography cascade ──────────────────────────────────────────────────────
  loadGeography() {
    this.svc.getGeography().subscribe({
      next: r => {
        if (r.success) {
          this.geoRows = r.data;
          this.regions = this.unique(r.data, 'region_name', 'region_code');
        }
      }
    });
  }

  loadRmcMcOptions() {
    this.svc.getRmcMcOptions().subscribe({
      next: r => { if (r.success) this.rmcMcOptions = r.data; }
    });
  }

  unique(rows: any[], nameKey: string, codeKey: string) {
    const seen = new Set();
    return rows.filter(r => {
      if (seen.has(r[nameKey])) return false;
      seen.add(r[nameKey]);
      return true;
    }).map(r => ({ name: r[nameKey], code: r[codeKey] }));
  }

  // Add-Station cascade
  onRegionChange(name: string, code: any) {
    this.selRegion = name; this.selRegionCode = code;
    this.selSubdiv = ''; this.selState = ''; this.selDistrict = ''; this.selBlock = '';
    this.selBlockCode = null; this.generatedStationCode = '';
    this.blocks = [];
    const rows = this.geoRows.filter(r => r.region_name === name);
    this.subdivisions = this.unique(rows, 'subdiv_name', 'subdiv_code');
    this.states = []; this.districts = [];
    this.addForm.patchValue({ region_name: name, region_code: code, subdiv_name: '', state_name: '', district_name: '', block_name: '', station_code: '' });
  }

  onSubdivChange(name: string, code: any) {
    this.selSubdiv = name; this.selSubdivCode = code;
    this.selState = ''; this.selDistrict = ''; this.selBlock = '';
    this.selBlockCode = null; this.generatedStationCode = '';
    this.blocks = [];
    const rows = this.geoRows.filter(r => r.region_name === this.selRegion && r.subdiv_name === name);
    this.states = this.unique(rows, 'state_name', 'state_code');
    this.districts = [];
    this.addForm.patchValue({ subdiv_name: name, subdiv_code: code, state_name: '', district_name: '', block_name: '', station_code: '' });
  }

  onStateChange(name: string, code: any) {
    this.selState = name; this.selStateCode = code;
    this.selDistrict = ''; this.selBlock = '';
    this.selBlockCode = null; this.generatedStationCode = '';
    this.blocks = [];
    const rows = this.geoRows.filter(r => r.state_name === name);
    this.districts = this.unique(rows, 'district_name', 'district_code');
    this.addForm.patchValue({ state_name: name, state_code: code, district_name: '', block_name: '', station_code: '' });
  }

  onDistrictChange(name: string, code: any) {
    this.selDistrict = name; this.selDistrictCode = code;
    this.selBlock = ''; this.selBlockCode = null; this.generatedStationCode = '';
    this.blocks = [];
    this.addForm.patchValue({ district_name: name, district_code: code, block_name: '', station_code: '' });
    this.svc.getBlocks(code).subscribe({
      next: r => {
        if (r.success) this.blocks = r.data.map((b: any) => ({ name: b.block_name, code: b.block_code }));
      }
    });
  }

  onBlockChange(name: string, code: any) {
    this.selBlock = name; this.selBlockCode = code;
    this.addForm.patchValue({ block_name: name, block_code: code, station_code: '' });
    this.generatedStationCode = 'Generating...';
    this.svc.generateCode(code).subscribe({
      next: r => {
        if (r.success) {
          this.generatedStationCode = r.data.station_code;
          this.addForm.patchValue({ station_code: r.data.station_code });
        }
      },
      error: () => { this.generatedStationCode = 'Error'; }
    });
  }

  // ── Add Station ────────────────────────────────────────────────────────────
  buildAddForm() {
    this.addForm = this.fb.group({
      station_name:  ['', Validators.required],
      station_type:  ['', Validators.required],
      latitude:      ['', [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitude:     ['', [Validators.required, Validators.min(-180), Validators.max(180)]],
      activationdate:['', Validators.required],
      is_new_station:['1', Validators.required],
      rmc_mc:        ['', Validators.required],
      // location (populated by cascade)
      region_name:   [''],
      region_code:   [''],
      subdiv_name:   [''],
      subdiv_code:   [''],
      state_name:    [''],
      state_code:    [''],
      district_name: [''],
      district_code: [''],
      block_name:    [''],
      block_code:    ['', Validators.required],
      station_code:  [{ value: '', disabled: true }],
    });
  }

  get addFormValid() {
    return this.addForm.valid && !!this.generatedStationCode && this.generatedStationCode !== 'Generating...' && this.generatedStationCode !== 'Error';
  }

  submitAddStation() {
    if (!this.addFormValid) { this.addForm.markAllAsTouched(); return; }
    this.addLoading = true; this.addMsg = ''; this.addErr = '';

    const v = this.addForm.getRawValue();
    const rmcParts = (v.rmc_mc as string).split(' ');
    const centre_type = rmcParts[0];
    const centre_name = rmcParts.slice(1).join(' ');

    const payload = {
      station_id:   this.generatedStationCode,
      station_name: v.station_name,
      station_type: v.station_type,
      centre_type,
      centre_name,
      is_new_station: v.is_new_station,
      latitude:     v.latitude,
      longitude:    v.longitude,
      activation_date: v.activationdate,
      block_code:   v.block_code,
      block_name:   v.block_name,
    };

    this.svc.addNewStation(payload).subscribe({
      next: (r: any) => {
        this.addLoading = false;
        if (r.success) {
          this.addMsg = `✅ Station "${v.station_name}" added successfully! Code: ${this.generatedStationCode}`;
          this.addForm.reset();
          this.generatedStationCode = '';
          this.selRegion = ''; this.selSubdiv = ''; this.selState = ''; this.selDistrict = ''; this.selBlock = '';
          this.subdivisions = []; this.states = []; this.districts = []; this.blocks = [];
          this.loadMetrics();
        } else {
          this.addErr = r.message || 'Failed to add station';
        }
      },
      error: (e: any) => {
        this.addLoading = false;
        this.addErr = e?.error?.message || 'Server error';
      }
    });
  }

  onBulkFileChange(event: any) {
    this.bulkFile = event.target.files[0] || null;
    this.bulkPreview = [];
    this.bulkMsg = ''; this.bulkErr = '';
    if (this.bulkFile) this.bulkMsg = `📁 "${this.bulkFile.name}" selected`;
  }

  downloadBulkTemplate() {
    const headers = ['station_name','station_type','latitude','longitude','block_code','district_code','centre_type','centre_name','activationdate'];
    const csv = headers.join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'station_bulk_template.csv';
    a.click();
  }

  // ── Edit/Delete/Move — Search ──────────────────────────────────────────────
  searchActiveStations() {
    this.editSearchLoading = true;
    this.editSearchPage = 1;
    this.svc.listActiveStations(this.editSearchQ, 1, 30).subscribe({
      next: r => {
        this.editSearchLoading = false;
        if (r.success) { this.editSearchResults = r.data; this.editSearchTotal = r.total; }
      },
      error: () => this.editSearchLoading = false
    });
  }

  selectStation(st: any) {
    this.selectedStation = st;
    this.editActionTab = null;
    this.editMsg = ''; this.editErr = '';
    this.deleteMsg = ''; this.deleteErr = '';
    this.moveMsg = ''; this.moveErr = '';
    this.deleteConfirmCode = '';
    this.editDiff = [];
  }

  setEditAction(action: 'edit' | 'delete' | 'move') {
    this.editActionTab = action;
    if (action === 'edit') this.prefillEditForm();
    if (action === 'move') this.initMoveRegions();
  }

  // ── Edit Form ──────────────────────────────────────────────────────────────
  buildEditForm() {
    this.editForm = this.fb.group({
      station_name:  ['', Validators.required],
      station_type:  ['', Validators.required],
      latitude:      ['', [Validators.required]],
      longitude:     ['', [Validators.required]],
      activationdate:[''],
      is_new_station:[''],
      rmc_mc:        [''],
    });
    this.editForm.valueChanges.subscribe(() => this.computeDiff());
  }

  prefillEditForm() {
    if (!this.selectedStation) return;
    const s = this.selectedStation;
    this.editForm.patchValue({
      station_name:   s.station_name,
      station_type:   s.station_type,
      latitude:       s.latitude,
      longitude:      s.longitude,
      activationdate: s.activationdate ? s.activationdate.split('T')[0] : '',
      is_new_station: s.is_new_station,
      rmc_mc:         s.rmc_mc,
    });
    this.computeDiff();
  }

  computeDiff() {
    if (!this.selectedStation || !this.editForm) return;
    const s = this.selectedStation;
    const v = this.editForm.value;
    const fields: { field: string; old: any; new: any }[] = [];
    if (v.station_name   !== s.station_name)   fields.push({ field: 'Station Name',   old: s.station_name,   new: v.station_name });
    if (v.station_type   !== s.station_type)   fields.push({ field: 'Station Type',   old: s.station_type,   new: v.station_type });
    if (v.latitude       != s.latitude)        fields.push({ field: 'Latitude',       old: s.latitude,       new: v.latitude });
    if (v.longitude      != s.longitude)       fields.push({ field: 'Longitude',      old: s.longitude,      new: v.longitude });
    if (v.rmc_mc         !== s.rmc_mc)         fields.push({ field: 'RMC/MC',         old: s.rmc_mc,         new: v.rmc_mc });
    this.editDiff = fields;
  }

  submitEdit() {
    if (this.editForm.invalid || !this.selectedStation) return;
    this.editLoading = true; this.editMsg = ''; this.editErr = '';
    const v = this.editForm.getRawValue();
    const rmcParts = (v.rmc_mc || '').split(' ');

    const payload = {
      station_id:     this.selectedStation.station_code,
      station_name:   v.station_name,
      station_type:   v.station_type,
      latitude:       v.latitude,
      longitude:      v.longitude,
      activation_date: v.activationdate,
      is_new_station: v.is_new_station,
      centre_type:    rmcParts[0] || '',
      centre_name:    rmcParts.slice(1).join(' ') || '',
    };

    this.svc.editStation(payload).subscribe({
      next: (r: any) => {
        this.editLoading = false;
        if (r.success) {
          this.editMsg = `✅ Station updated successfully`;
          this.selectedStation = { ...this.selectedStation, ...v };
          this.editDiff = [];
          this.searchActiveStations();
        } else {
          this.editErr = r.message || 'Failed to update';
        }
      },
      error: (e: any) => { this.editLoading = false; this.editErr = e?.error?.message || 'Server error'; }
    });
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  get deleteConfirmValid() {
    return this.deleteConfirmCode?.toString().trim() === this.selectedStation?.station_code?.toString().trim();
  }

  submitDelete() {
    if (!this.deleteConfirmValid || !this.selectedStation) return;
    this.deleteLoading = true; this.deleteMsg = ''; this.deleteErr = '';

    this.svc.deleteStation(this.selectedStation.station_code).subscribe({
      next: (r: any) => {
        this.deleteLoading = false;
        if (r.success) {
          this.deleteMsg = `✅ Station ${this.selectedStation.station_name} deactivated (flag=0)`;
          this.selectedStation = null;
          this.editActionTab = null;
          this.deleteConfirmCode = '';
          this.searchActiveStations();
          this.loadMetrics();
        } else {
          this.deleteErr = r.message || 'Delete failed';
        }
      },
      error: (e: any) => { this.deleteLoading = false; this.deleteErr = e?.error?.message || 'Server error'; }
    });
  }

  // ── Move ───────────────────────────────────────────────────────────────────
  initMoveRegions() {
    this.moveRegion = ''; this.moveSubdiv = ''; this.moveState = ''; this.moveDistrict = ''; this.moveBlock = '';
    this.moveRegionCode = null; this.moveSubdivCode = null; this.moveStateCode = null; this.moveDistrictCode = null; this.moveBlockCode = null;
    this.moveSubdivisions = []; this.moveStates = []; this.moveDistricts = []; this.moveBlocks = [];
    this.moveNewCode = '';
  }

  onMoveRegionChange(name: string, code: any) {
    this.moveRegion = name; this.moveRegionCode = code;
    this.moveSubdiv = ''; this.moveState = ''; this.moveDistrict = ''; this.moveBlock = '';
    const rows = this.geoRows.filter(r => r.region_name === name);
    this.moveSubdivisions = this.unique(rows, 'subdiv_name', 'subdiv_code');
    this.moveStates = []; this.moveDistricts = []; this.moveBlocks = [];
  }

  onMoveSubdivChange(name: string, code: any) {
    this.moveSubdiv = name; this.moveSubdivCode = code;
    this.moveState = ''; this.moveDistrict = ''; this.moveBlock = '';
    const rows = this.geoRows.filter(r => r.region_name === this.moveRegion && r.subdiv_name === name);
    this.moveStates = this.unique(rows, 'state_name', 'state_code');
    this.moveDistricts = []; this.moveBlocks = [];
  }

  onMoveStateChange(name: string, code: any) {
    this.moveState = name; this.moveStateCode = code;
    this.moveDistrict = ''; this.moveBlock = '';
    const rows = this.geoRows.filter(r => r.state_name === name);
    this.moveDistricts = this.unique(rows, 'district_name', 'district_code');
    this.moveBlocks = [];
  }

  onMoveDistrictChange(name: string, code: any) {
    this.moveDistrict = name; this.moveDistrictCode = code;
    this.moveBlock = ''; this.moveBlockCode = null;
    this.svc.getBlocks(code).subscribe({
      next: r => {
        if (r.success) this.moveBlocks = r.data.map((b: any) => ({ name: b.block_name, code: b.block_code }));
      }
    });
  }

  onMoveBlockChange(name: string, code: any) {
    this.moveBlock = name; this.moveBlockCode = code;
    this.moveNewCode = 'Generating...';
    this.svc.generateCode(code).subscribe({
      next: r => { if (r.success) this.moveNewCode = r.data.station_code; },
      error: () => { this.moveNewCode = 'Error'; }
    });
  }

  get moveReady() {
    return this.moveBlockCode && this.moveDistrictCode && this.moveNewCode && this.moveNewCode !== 'Generating...' && this.moveNewCode !== 'Error';
  }

  submitMove() {
    if (!this.moveReady || !this.selectedStation) return;
    this.moveLoading = true; this.moveMsg = ''; this.moveErr = '';
    this.svc.moveStation({
      station_code:    this.selectedStation.station_code,
      new_block_code:  this.moveBlockCode,
      new_block_name:  this.moveBlock,
      new_district_code: this.moveDistrictCode,
    }).subscribe({
      next: r => {
        this.moveLoading = false;
        if (r.success) {
          this.moveMsg = `✅ Station moved! Old: ${r.data.old_station_code} → New: ${r.data.new_station_code}`;
          this.selectedStation = null; this.editActionTab = null;
          this.searchActiveStations(); this.loadMetrics();
        } else {
          this.moveErr = r.message || 'Move failed';
        }
      },
      error: (e: any) => { this.moveLoading = false; this.moveErr = e?.error?.message || 'Server error'; }
    });
  }

  // ── Visualization ──────────────────────────────────────────────────────────
  loadVizDistribution() {
    this.vizLoading = true;
    this.svc.getDistribution(this.vizLevel).subscribe({
      next: r => { this.vizLoading = false; if (r.success) this.vizDistribution = r.data; },
      error: () => this.vizLoading = false
    });
  }

  // ── Search ─────────────────────────────────────────────────────────────────
  runSearch() {
    this.searchLoading = true; this.searchPage = 1;
    this.svc.searchStations({
      q: this.searchQ, mode: this.searchMode, case_sensitive: this.searchCaseSensitive,
      status: this.searchStatus, station_type: this.searchType, region: this.searchRegion,
      state: this.searchState, page: 1, limit: 50
    }).subscribe({
      next: r => {
        this.searchLoading = false;
        if (r.success) { this.searchResults = r.data; this.searchTotal = r.total; }
      },
      error: () => this.searchLoading = false
    });
  }

  exportSearchCSV() {
    if (!this.searchResults.length) return;
    const keys = Object.keys(this.searchResults[0]);
    const csv = [keys.join(','), ...this.searchResults.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'station_search_results.csv';
    a.click();
  }

  // ── History ────────────────────────────────────────────────────────────────
  loadHistory() {
    this.historyLoading = true;
    this.svc.getHistory(this.historyPage, 25).subscribe({
      next: r => {
        this.historyLoading = false;
        if (r.success) { this.historyData = r.data; this.historyTotal = r.total; }
      },
      error: () => this.historyLoading = false
    });
  }

  loadRecentChanges() {
    this.recentLoading = true;
    this.svc.getRecentChanges(30).subscribe({
      next: r => { this.recentLoading = false; if (r.success) this.recentChanges = r.data; },
      error: () => this.recentLoading = false
    });
  }

  loadTimeline() {
    if (!this.timelineName.trim()) return;
    this.timelineLoading = true;
    this.svc.getTimeline(this.timelineName).subscribe({
      next: r => { this.timelineLoading = false; if (r.success) this.timelineData = r.data; },
      error: () => this.timelineLoading = false
    });
  }

  // ── Delete Disabled ────────────────────────────────────────────────────────
  loadDisabled() {
    this.disabledLoading = true;
    this.svc.getHistory(1, 500).subscribe({
      next: r => { this.disabledLoading = false; if (r.success) this.disabledStations = r.data; },
      error: () => this.disabledLoading = false
    });
  }

  toggleDisabledSelect(code: any) {
    this.disabledSelected.has(code) ? this.disabledSelected.delete(code) : this.disabledSelected.add(code);
  }

  selectAllDisabled() { this.disabledStations.forEach(s => this.disabledSelected.add(s.station_code)); }
  clearDisabledSelect() { this.disabledSelected.clear(); }

  submitPermDelete() {
    if (!this.deleteConsent || this.disabledSelected.size === 0) return;
    this.permDeleteLoading = true; this.permDeleteMsg = ''; this.permDeleteErr = '';
    this.svc.permanentDelete(Array.from(this.disabledSelected)).subscribe({
      next: r => {
        this.permDeleteLoading = false;
        if (r.success) {
          this.permDeleteMsg = `✅ ${r.data.deleted_count} station(s) permanently deleted`;
          this.disabledSelected.clear();
          this.deleteConsent = false;
          this.loadDisabled();
          this.loadMetrics();
        } else {
          this.permDeleteErr = r.message || 'Delete failed';
        }
      },
      error: (e: any) => { this.permDeleteLoading = false; this.permDeleteErr = e?.error?.message || 'Server error'; }
    });
  }

  // ── Utilities ──────────────────────────────────────────────────────────────
  daysAgo(dateStr: string) {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    return diff === 0 ? 'Today' : diff === 1 ? '1 day ago' : `${diff} days ago`;
  }

  get disabledStats() {
    const types: any = {};
    this.disabledStations.forEach(s => { types[s.station_type] = (types[s.station_type] || 0) + 1; });
    const topType = Object.entries(types).sort((a: any, b: any) => b[1] - a[1])[0];
    return {
      count: this.disabledStations.length,
      top_type: topType ? topType[0] : 'N/A',
    };
  }
}
