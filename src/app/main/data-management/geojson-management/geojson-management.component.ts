import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environment/environment';
import * as L from 'leaflet';
import { FetchStationDataService } from 'src/app/services/station/station.service';
import { AdminActivityLogService, AdminActivityUser } from 'src/app/services/admin-activity-log.service';
import * as JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface GeoFile {
  id: number;
  file_name: string;
  display_name: string;
  feature_count: number;
  version: number;
  source: string;
  is_validated: boolean;
  created_at: string;
  updated_at: string;
  folder?: string;
}

interface PropRow { key: string; sample: string; }

interface TabConfig {
  key: string;
  label: string;
  icon: string;
  folder: string;
  fetchFolders: string[];
  fileFilter?: string;
  requiredFields?: string[];
  noSourceUpload?: boolean;
  description: string;
}

interface DerivedFile {
  fileName:     string;
  folder:       string;
  group:        'all-india' | 'per-region' | 'per-state' | 'per-subdivision'
                | 'per-mcrmcs' | 'per-subbasin' | 'per-fmo' | 'per-basin-type';
  groupKey:     string;
  geojson:      any;
  featureCount: number;
  status:       'pending' | 'uploading' | 'success' | 'error';
  msg:          string;
}

@Component({
  selector: 'app-geojson-management',
  templateUrl: './geojson-management.component.html',
  styleUrls: ['./geojson-management.component.css']
})
export class GeojsonManagementComponent implements OnInit, OnDestroy {

  tabs: TabConfig[] = [
    {
      key: 'district', label: 'District', icon: 'bi-pin-map-fill',
      folder: 'root', fetchFolders: ['root', 'regions', 'state', 'subdivision', 'mcrmcs'],
      description: 'Upload INDIA_DISTRICT.json to derive all geographic levels',
      requiredFields: ['region','region_cod','subdivisio','subdivis_1','state','state_code',
                       'district','district_c','block','block_code','country',
                       'area_sqkm','area_sqmi','abb','RMC_MC','RMC_MC_ID']
    },
    {
      key: 'block', label: 'Block', icon: 'bi-grid-3x3-gap-fill',
      folder: 'root', fetchFolders: ['root'], fileFilter: 'BLOCK',
      description: 'All-India block boundaries (INDIA_BLOCK.json)'
    },
  ];

  activeTab = 'district';

  files:      { [k: string]: GeoFile[] }   = {};
  loading:    { [k: string]: boolean }     = {};
  uploadFile: { [k: string]: File | null } = {};
  uploading:  { [k: string]: boolean }     = {};
  uploadMsg:  { [k: string]: string }      = {};
  uploadErr:  { [k: string]: string }      = {};
  dragOver:   { [k: string]: boolean }     = {};
  features:   { [k: string]: number }      = {};
  props:         { [k: string]: PropRow[] }    = {};
  geomType:      { [k: string]: string }       = {};
  previewMaps:   { [k: string]: L.Map | null } = {};
  missingFields: { [k: string]: string[] }     = {};

  // Download all state
  downloadingZip: { [k: string]: boolean } = {};

  // Derived files state
  derivedFiles:    DerivedFile[]      = [];
  selectedDerived: DerivedFile | null = null;
  derivedMap:      L.Map | null       = null;
  derivedGeoLayer: L.GeoJSON | null   = null;
  generating:      boolean            = false;

  // Derived compare state
  derivedCompareMode:    boolean               = false;
  derivedCompareFile:    DerivedFile | null    = null;
  derivedCompareGeo:     any                   = null;
  derivedCompareLoading: boolean               = false;
  derivedCompareErr:     string                = '';
  derivedCompareView:    'overlay' | 'side-by-side' = 'overlay';
  derivedCompareOvMap:   L.Map | null          = null;
  derivedCompareLMap:    L.Map | null          = null;
  derivedCompareRMap:    L.Map | null          = null;

  // Compare state
  uploadedGeoJson: { [k: string]: any }                        = {};
  previewMode:     { [k: string]: 'preview' | 'compare' }     = {};
  compareView:     { [k: string]: 'overlay' | 'side-by-side' }= {};
  compareGeo:      { [k: string]: any }                        = {};
  compareLoading:  { [k: string]: boolean }                    = {};
  compareErr:      { [k: string]: string }                     = {};
  overlayMaps:     { [k: string]: L.Map | null }               = {};
  sideLeftMaps:    { [k: string]: L.Map | null }               = {};
  sideRightMaps:   { [k: string]: L.Map | null }               = {};

  get derivedGroups(): { key: string; label: string }[] {
    switch (this.activeTab) {
      case 'district':
        return [
          { key: 'all-india',       label: 'All-India' },
          { key: 'per-region',      label: 'Per Region' },
          { key: 'per-state',       label: 'Per State' },
          { key: 'per-subdivision', label: 'Per Subdivision' },
          { key: 'per-mcrmcs',      label: 'Per MC / RMC' },
        ];
      case 'mcrmcs':
        return [
          { key: 'all-india',  label: 'All-India MC/RMC' },
          { key: 'per-mcrmcs', label: 'Per MC / RMC' },
        ];
      case 'river_basin':
        return [
          { key: 'per-subbasin',   label: 'Per Sub-Basin' },
          { key: 'per-fmo',        label: 'Per FMO Center' },
          { key: 'per-basin-type', label: 'Per Basin Type' },
        ];
      default: return [];
    }
  }

  openGroups: { [k: string]: boolean } = {
    'all-india': true, 'per-region': true, 'per-state': true,
    'per-subdivision': false, 'per-mcrmcs': true,
  };

  allStations: any[] = [];
  showStations = false;
  private stationLayerMap = new Map<L.Map, L.LayerGroup>();

  showEmpModal = true;
  activityUser: AdminActivityUser | null = null;
  readonly pageRoute = '/data-management/geojson';

  private apiBase = environment.baseUrl;

  constructor(
    private http: HttpClient,
    private stationService: FetchStationDataService,
    private activityLog: AdminActivityLogService,
  ) {
    this.tabs.forEach(t => {
      this.files[t.key]         = [];
      this.loading[t.key]       = false;
      this.uploadFile[t.key]    = null;
      this.uploading[t.key]     = false;
      this.uploadMsg[t.key]     = '';
      this.uploadErr[t.key]     = '';
      this.dragOver[t.key]      = false;
      this.features[t.key]      = 0;
      this.props[t.key]         = [];
      this.geomType[t.key]      = '';
      this.previewMaps[t.key]    = null;
      this.missingFields[t.key]  = [];
      this.uploadedGeoJson[t.key]= null;
      this.previewMode[t.key]    = 'preview';
      this.compareView[t.key]    = 'overlay';
      this.compareGeo[t.key]     = null;
      this.compareLoading[t.key] = false;
      this.compareErr[t.key]     = '';
      this.overlayMaps[t.key]    = null;
      this.sideLeftMaps[t.key]   = null;
      this.sideRightMaps[t.key]  = null;
    });
  }

  ngOnInit(): void {
    this.stationService.getAllStations().subscribe(data => { this.allStations = data; });
  }

  onOfficerIdentified(user: AdminActivityUser): void {
    this.activityUser = user;
    this.showEmpModal = false;
    this.loadTab('district');
  }

  private logUpload(res: any, folder: string, fileName: string, featureCount?: number): void {
    const data = res?.data ?? res ?? {};
    this.activityLog.logSpatialActivity('geojson', 'UPLOAD', this.activityUser, {
      folder: data.folder ?? folder,
      file_name: data.fileName ?? data.file_name ?? fileName,
      feature_count: data.featureCount ?? data.feature_count ?? featureCount,
      version: data.version,
      old_version: data.old_version ?? data.oldVersion,
      remark: this.activityUser?.remark ?? '',
    }).subscribe();
  }

  ngOnDestroy(): void {
    Object.values(this.previewMaps).forEach(m => m?.remove());
    this.derivedMap?.remove();
    this.destroyDerivedCompareMaps();
    this.tabs.forEach(t => this.destroyCompareMaps(t.key));
  }

  selectTab(key: string) {
    this.activeTab = key;
    if (!this.files[key].length && !this.loading[key]) this.loadTab(key);
    if (this.uploadFile[key]) setTimeout(() => this.renderMap(key), 80);
    if (this.hasDerived(key) && this.selectedDerived) setTimeout(() => this.renderDerivedMap(), 200);
  }

  private hasDerived(key: string) {
    return ['district', 'mcrmcs', 'river_basin'].includes(key);
  }

  get activeConfig(): TabConfig {
    return this.tabs.find(t => t.key === this.activeTab)!;
  }

  // ── Fetch files from DB ──────────────────────────────────
  loadTab(key: string) {
    const cfg = this.tabs.find(t => t.key === key)!;
    this.loading[key] = true;
    this.files[key] = [];
    const folders = [...new Set(cfg.fetchFolders)];
    let pending = folders.length;
    let allFiles: GeoFile[] = [];

    folders.forEach(folder => {
      this.http.get<any>(`${this.apiBase}/api/v1/geojson/${folder}`).subscribe({
        next: (res) => {
          let rows: GeoFile[] = (res.files ?? []).map((f: GeoFile) => ({ ...f, folder }));
          if (cfg.fileFilter && folder === 'root') {
            rows = rows.filter(f => f.file_name.toUpperCase().includes(cfg.fileFilter!));
          }
          allFiles.push(...rows);
          if (--pending === 0) {
            this.files[key] = allFiles.sort((a, b) => a.file_name.localeCompare(b.file_name));
            this.loading[key] = false;
          }
        },
        error: () => { if (--pending === 0) this.loading[key] = false; }
      });
    });
  }

  // ── File pick / drag ─────────────────────────────────────
  onDragOver(e: DragEvent, key: string)  { e.preventDefault(); this.dragOver[key] = true; }
  onDragLeave(key: string)               { this.dragOver[key] = false; }

  onDrop(e: DragEvent, key: string) {
    e.preventDefault(); this.dragOver[key] = false;
    const file = e.dataTransfer?.files[0];
    if (file) this.loadFile(file, key);
  }

  onFileSelected(e: Event, key: string) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.loadFile(file, key);
    (e.target as HTMLInputElement).value = '';
  }

  loadFile(file: File, key: string) {
    this.uploadErr[key] = '';
    this.uploadMsg[key] = '';
    if (!file.name.match(/\.(geojson|json)$/i)) {
      this.uploadErr[key] = 'Only .json / .geojson files accepted.';
      return;
    }
    this.uploadFile[key] = file;
    this.clearDerived();

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const geojson = JSON.parse(ev.target?.result as string);
        this.features[key]      = geojson?.features?.length ?? 0;
        this.uploadedGeoJson[key] = geojson;
        this.extractProps(key, geojson);
        this.checkRequiredFields(key, geojson);
        setTimeout(() => this.initMap(key, geojson), 80);
        if (this.hasDerived(key) && !this.missingFields[key]?.length) {
          this.generating = true;
          setTimeout(() => this.generateDerivedFiles(key, geojson), 250);
        }
      } catch {
        this.uploadErr[key] = 'Invalid JSON.';
        this.uploadFile[key] = null;
      }
    };
    reader.readAsText(file);
  }

  // ── Extract property fields ───────────────────────────────
  private extractProps(key: string, geojson: any) {
    const features = geojson?.features ?? [];
    if (!features.length) { this.props[key] = []; return; }
    this.geomType[key] = features[0]?.geometry?.type ?? 'Unknown';
    const keySet = new Set<string>();
    features.slice(0, 5).forEach((f: any) =>
      Object.keys(f.properties ?? {}).forEach((k: string) => keySet.add(k)));
    const first = features[0]?.properties ?? {};
    this.props[key] = Array.from(keySet).map(k => ({
      key: k,
      sample: first[k] !== null && first[k] !== undefined ? String(first[k]) : '—'
    }));
  }

  // ── Required-field validation ─────────────────────────────
  private checkRequiredFields(key: string, geojson: any) {
    const tab = this.tabs.find(t => t.key === key);
    if (!tab?.requiredFields?.length) { this.missingFields[key] = []; return; }
    const props = Object.keys(geojson?.features?.[0]?.properties ?? {});
    this.missingFields[key] = tab.requiredFields.filter(f => !props.includes(f));
  }

  isRequired(tabKey: string, fieldName: string): boolean {
    return this.tabs.find(t => t.key === tabKey)?.requiredFields?.includes(fieldName) ?? false;
  }

  // ── Derived file generation dispatcher ───────────────────
  private generateDerivedFiles(key: string, geojson: any) {
    switch (key) {
      case 'district':    this.generateDistrictDerived(geojson); break;
      case 'mcrmcs':      this.generateMcrmcDerived(geojson);    break;
      case 'river_basin': this.generateRiverBasinDerived(geojson); break;
    }
  }

  // ── Shared helpers ────────────────────────────────────────
  private toMultiPolygonFeature(feats: any[], props: Record<string, any>): any {
    const coords: any[] = [];
    for (const f of feats) {
      const geom = f.geometry;
      if (!geom) continue;
      if (geom.type === 'Polygon')           coords.push(geom.coordinates);
      else if (geom.type === 'MultiPolygon') coords.push(...geom.coordinates);
    }
    return { type: 'Feature', properties: props,
             geometry: { type: 'MultiPolygon', coordinates: coords } };
  }

  private groupBy(features: any[], propKey: string): Map<string, any[]> {
    const map = new Map<string, any[]>();
    for (const f of features) {
      const val = f.properties?.[propKey];
      if (val == null) continue;
      const k = String(val);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(f);
    }
    return map;
  }

  private sorted(map: Map<string, any[]>): [string, any[]][] {
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }

  private fc(feats: any[]) { return { type: 'FeatureCollection', features: feats }; }
  private clean(s: string) { return s.toUpperCase().replace(/[^A-Z0-9]/g, '_'); }

  // ── District derivation ───────────────────────────────────
  private generateDistrictDerived(geojson: any) {
    const features: any[] = geojson.features;
    const byRegion = this.groupBy(features, 'region');
    const byState  = this.groupBy(features, 'state');
    const bySubdiv = this.groupBy(features, 'subdivisio');
    const byMc     = this.groupBy(features, 'RMC_MC');

    const allIndia: DerivedFile[] = [
      { fileName: 'INDIA_COUNTRY.json',      folder: 'root', group: 'all-india', groupKey: 'INDIA',
        geojson: this.fc([this.toMultiPolygonFeature(features, { country: 'INDIA' })]),
        featureCount: 1, status: 'pending', msg: '' },
      { fileName: 'INDIA_REGION.json',       folder: 'root', group: 'all-india', groupKey: 'ALL_REGIONS',
        geojson: this.fc(this.sorted(byRegion).map(([k, f]) => this.toMultiPolygonFeature(f, { region: k }))),
        featureCount: byRegion.size, status: 'pending', msg: '' },
      { fileName: 'INDIA_STATE.json',        folder: 'root', group: 'all-india', groupKey: 'ALL_STATES',
        geojson: this.fc(this.sorted(byState).map(([k, f]) => this.toMultiPolygonFeature(f, { state: k }))),
        featureCount: byState.size, status: 'pending', msg: '' },
      { fileName: 'INDIA_SUB_DIVISION.json', folder: 'root', group: 'all-india', groupKey: 'ALL_SUBDIVS',
        geojson: this.fc(this.sorted(bySubdiv).map(([k, f]) => this.toMultiPolygonFeature(f, { subdivisio: k }))),
        featureCount: bySubdiv.size, status: 'pending', msg: '' },
    ];

    const perRegion: DerivedFile[] = this.sorted(byRegion).map(([k, feats]) => ({
      fileName: `${this.clean(k)}.json`, folder: 'regions', group: 'per-region' as const,
      groupKey: k, geojson: this.fc(feats), featureCount: feats.length, status: 'pending' as const, msg: ''
    }));
    const perState: DerivedFile[] = this.sorted(byState).map(([k, feats]) => ({
      fileName: `ST_${this.clean(k)}.json`, folder: 'state', group: 'per-state' as const,
      groupKey: k, geojson: this.fc(feats), featureCount: feats.length, status: 'pending' as const, msg: ''
    }));
    const perSubdiv: DerivedFile[] = this.sorted(bySubdiv).map(([k, feats]) => ({
      fileName: `SD_${this.clean(k)}.json`, folder: 'subdivision', group: 'per-subdivision' as const,
      groupKey: k, geojson: this.fc(feats), featureCount: feats.length, status: 'pending' as const, msg: ''
    }));
    // MC/RMC: file name = RMC_MC value with spaces → underscores (e.g. "MC THIRVANTHAPURAM" → "MC_THIRVANTHAPURAM.json")
    const perMc: DerivedFile[] = this.sorted(byMc).map(([k, feats]) => ({
      fileName: `${k.replace(/\s+/g, '_')}.json`, folder: 'mcrmcs', group: 'per-mcrmcs' as const,
      groupKey: k, geojson: this.fc(feats), featureCount: feats.length, status: 'pending' as const, msg: ''
    }));

    this.derivedFiles = [...allIndia, ...perRegion, ...perState, ...perSubdiv, ...perMc];
    this.finishGeneration();
  }

  // ── MC/RMC derivation ─────────────────────────────────────
  private generateMcrmcDerived(geojson: any) {
    const features: any[] = geojson.features;
    const byMc = this.groupBy(features, 'RMC_MC');

    const allIndia: DerivedFile[] = [
      { fileName: 'INDIA_MCRMCS.json', folder: 'mcrmcs', group: 'all-india', groupKey: 'ALL_MCRMCS',
        geojson: this.fc(this.sorted(byMc).map(([k, f]) =>
          this.toMultiPolygonFeature(f, { RMC_MC: k, RMC_MC_ID: f[0]?.properties?.RMC_MC_ID ?? null }))),
        featureCount: byMc.size, status: 'pending', msg: '' },
    ];

    const perMc: DerivedFile[] = this.sorted(byMc).map(([k, feats]) => ({
      fileName: `${k.replace(/\s+/g, '_')}.json`,
      folder: 'mcrmcs', group: 'per-mcrmcs' as const, groupKey: k,
      geojson: this.fc(feats), featureCount: feats.length, status: 'pending' as const, msg: ''
    }));

    this.derivedFiles = [...allIndia, ...perMc];
    this.finishGeneration();
  }

  // ── River Basin derivation ────────────────────────────────
  private generateRiverBasinDerived(geojson: any) {
    const features: any[] = geojson.features;
    const bySubbasin = this.groupBy(features, 'SUBBASIN');
    const byFmo      = this.groupBy(features, 'FMO');
    const byBasin    = this.groupBy(features, 'BASIN_12');

    const perSubbasin: DerivedFile[] = this.sorted(bySubbasin).map(([k, feats]) => ({
      fileName: `SUB_${this.clean(k)}.json`, folder: 'river_basin',
      group: 'per-subbasin' as const, groupKey: k,
      geojson: this.fc(feats), featureCount: feats.length, status: 'pending' as const, msg: ''
    }));
    const perFmo: DerivedFile[] = this.sorted(byFmo).map(([k, feats]) => ({
      fileName: `FMO_${this.clean(k)}.json`, folder: 'river_basin',
      group: 'per-fmo' as const, groupKey: k,
      geojson: this.fc(feats), featureCount: feats.length, status: 'pending' as const, msg: ''
    }));
    const perBasin: DerivedFile[] = this.sorted(byBasin).map(([k, feats]) => ({
      fileName: `BASIN_${this.clean(k)}.json`, folder: 'river_basin',
      group: 'per-basin-type' as const, groupKey: k,
      geojson: this.fc(feats), featureCount: feats.length, status: 'pending' as const, msg: ''
    }));

    this.derivedFiles = [...perSubbasin, ...perFmo, ...perBasin];
    this.finishGeneration();
  }

  private finishGeneration() {
    this.generating = false;
    if (this.derivedFiles.length) this.selectDerived(this.derivedFiles[0]);
  }

  // ── Derived file helpers ──────────────────────────────────
  getDerivedGroup(key: string): DerivedFile[] {
    return this.derivedFiles.filter(f => f.group === key);
  }

  countGroup(key: string): number {
    return this.derivedFiles.filter(f => f.group === key).length;
  }

  toggleGroup(key: string) { this.openGroups[key] = !this.openGroups[key]; }

  selectDerived(file: DerivedFile) {
    this.selectedDerived = file;
    setTimeout(() => this.renderDerivedMap(), 150);
  }

  private renderDerivedMap() {
    const el = document.getElementById('derived-preview-map');
    if (!el || !this.selectedDerived) return;

    if (!this.derivedMap) {
      const map = L.map('derived-preview-map', {
        zoomControl: true, attributionControl: false, scrollWheelZoom: true
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { maxZoom: 18 }).addTo(map);
      if (this.showStations) this.addStationDots(map);
      this.derivedMap = map;
    }

    if (this.derivedGeoLayer) {
      this.derivedMap.removeLayer(this.derivedGeoLayer);
      this.derivedGeoLayer = null;
    }

    this.derivedGeoLayer = L.geoJSON(this.selectedDerived.geojson, {
      style: { color: '#002467', weight: 1.5, fillColor: '#3b82f6', fillOpacity: 0.3 },
      onEachFeature: (feature, layer) => {
        if (feature.properties && Object.keys(feature.properties).length) {
          layer.bindTooltip(this.buildTooltip(feature.properties),
            { sticky: true, opacity: 1, className: 'attr-tooltip' });
        }
      }
    }).addTo(this.derivedMap);

    const boundsLayer = this.derivedGeoLayer;
    setTimeout(() => {
      this.derivedMap?.invalidateSize();
      try { this.derivedMap?.fitBounds(boundsLayer.getBounds(), { padding: [20, 20] }); } catch {}
    }, 150);
  }

  // ── Derived upload / download ─────────────────────────────
  uploadDerived(file: DerivedFile) {
    if (file.status === 'uploading') return;
    file.status = 'uploading'; file.msg = '';
    const blob = new Blob([JSON.stringify(file.geojson)], { type: 'application/json' });
    const fd = new FormData();
    fd.append('folder', file.folder);
    fd.append('file', blob, file.fileName);
    this.http.post<any>(`${this.apiBase}/api/v1/geojson/upload`, fd).subscribe({
      next:  (res) => {
        file.status = 'success';
        file.msg = res.message ?? 'Uploaded';
        this.logUpload(res, file.folder, file.fileName, file.featureCount);
      },
      error: (err) => { file.status = 'error';   file.msg = err.error?.message ?? 'Failed'; }
    });
  }

  uploadGroupDerived(group: string) {
    const targets = group === 'all'
      ? this.derivedFiles.filter(f => f.status !== 'success' && f.status !== 'uploading')
      : this.derivedFiles.filter(f => f.group === group &&
          f.status !== 'success' && f.status !== 'uploading');
    this.uploadSequential(targets, 0);
  }

  private uploadSequential(files: DerivedFile[], idx: number) {
    if (idx >= files.length) return;
    const file = files[idx];
    file.status = 'uploading'; file.msg = '';
    const blob = new Blob([JSON.stringify(file.geojson)], { type: 'application/json' });
    const fd = new FormData();
    fd.append('folder', file.folder);
    fd.append('file', blob, file.fileName);
    this.http.post<any>(`${this.apiBase}/api/v1/geojson/upload`, fd).subscribe({
      next:  (res) => {
        file.status = 'success';
        file.msg = res.message ?? 'Uploaded';
        this.logUpload(res, file.folder, file.fileName, file.featureCount);
        this.uploadSequential(files, idx + 1);
      },
      error: (err) => { file.status = 'error';   file.msg = err.error?.message ?? 'Failed';
                        this.uploadSequential(files, idx + 1); }
    });
  }

  downloadDerived(file: DerivedFile) {
    const blob = new Blob([JSON.stringify(file.geojson, null, 2)],
      { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = file.fileName; a.click();
    URL.revokeObjectURL(url);
  }

  async downloadAllAsZip(tabKey: string) {
    const tabFiles = this.files[tabKey];
    if (!tabFiles || tabFiles.length === 0) return;
    this.downloadingZip[tabKey] = true;

    try {
      const zip = new (JSZip as any)();

      // Group files by folder
      const byFolder: { [folder: string]: GeoFile[] } = {};
      tabFiles.forEach(f => {
        const folder = f.folder || 'root';
        if (!byFolder[folder]) byFolder[folder] = [];
        byFolder[folder].push(f);
      });

      // Fetch each file and add to ZIP inside its folder
      const fetches: Promise<void>[] = [];
      for (const [folder, folderFiles] of Object.entries(byFolder)) {
        for (const f of folderFiles) {
          const p = this.http
            .get<any>(`${this.apiBase}/api/v1/geojson/${folder}/${f.file_name}`)
            .toPromise()
            .then(res => {
              const content = JSON.stringify(res.geojson ?? res, null, 2);
              zip.folder(folder).file(f.file_name, content);
            })
            .catch(() => {
              zip.folder(folder).file(f.file_name, '{}');
            });
          fetches.push(p);
        }
      }

      await Promise.all(fetches);

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `geojson_${tabKey}_${new Date().toISOString().slice(0,10)}.zip`);
    } finally {
      this.downloadingZip[tabKey] = false;
    }
  }

  // ── Derived compare ──────────────────────────────────────
  enterDerivedCompare(file: DerivedFile) {
    this.derivedCompareFile    = file;
    this.derivedCompareMode    = true;
    this.derivedCompareLoading = true;
    this.derivedCompareErr     = '';
    this.derivedCompareGeo     = null;
    this.destroyDerivedCompareMaps();
    // *ngIf will remove derived-preview-map div — detach stale map instance
    if (this.derivedMap) { this.derivedMap.remove(); this.derivedMap = null; this.derivedGeoLayer = null; }
    this.http.get<any>(`${this.apiBase}/api/v1/geojson/${file.folder}/${file.fileName}`)
      .subscribe({
        next: (geojson) => {
          this.derivedCompareGeo     = geojson;
          this.derivedCompareLoading = false;
          setTimeout(() => this.renderDerivedCompareMap(), 200);
        },
        error: () => {
          this.derivedCompareLoading = false;
          this.derivedCompareErr     = 'Not found in DB yet.';
        }
      });
  }

  exitDerivedCompare() {
    this.derivedCompareMode = false;
    this.derivedCompareFile = null;
    this.derivedCompareGeo  = null;
    this.derivedCompareErr  = '';
    this.destroyDerivedCompareMaps();
    // *ngIf destroys and recreates the div — kill stale map so renderDerivedMap builds fresh
    if (this.derivedMap) { this.derivedMap.remove(); this.derivedMap = null; this.derivedGeoLayer = null; }
    setTimeout(() => this.renderDerivedMap(), 200);
  }

  setDerivedCompareView(view: 'overlay' | 'side-by-side') {
    this.derivedCompareView = view;
    this.destroyDerivedCompareMaps();
    setTimeout(() => this.renderDerivedCompareMap(), 150);
  }

  derivedCompareDelta(): number {
    return (this.derivedCompareFile?.featureCount ?? 0) - (this.derivedCompareGeo?.features?.length ?? 0);
  }

  private renderDerivedCompareMap() {
    if (this.derivedCompareView === 'overlay') this.renderDerivedOverlay();
    else                                        this.renderDerivedSideBySide();
  }

  private renderDerivedOverlay() {
    const el = document.getElementById('derived-compare-overlay');
    if (!el) return;
    if (this.derivedCompareOvMap) { this.derivedCompareOvMap.remove(); this.derivedCompareOvMap = null; }
    const map = L.map('derived-compare-overlay',
      { zoomControl: true, attributionControl: false, scrollWheelZoom: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
    this.derivedCompareOvMap = map;
    let boundsRef: L.GeoJSON | null = null;
    if (this.derivedCompareGeo) {
      boundsRef = this.makeCompareLayer(this.derivedCompareGeo, '#dc2626', '#fca5a5').addTo(map);
    }
    if (this.derivedCompareFile?.geojson) {
      const nl = this.makeCompareLayer(this.derivedCompareFile.geojson, '#2563eb', '#93c5fd').addTo(map);
      if (!boundsRef) boundsRef = nl;
    }
    const ref = boundsRef;
    setTimeout(() => {
      map.invalidateSize();
      try { if (ref) map.fitBounds(ref.getBounds(), { padding: [20, 20] }); } catch {}
    }, 150);
  }

  private renderDerivedSideBySide() {
    const elL = document.getElementById('derived-compare-left');
    const elR = document.getElementById('derived-compare-right');
    if (!elL || !elR) return;
    if (this.derivedCompareLMap) { this.derivedCompareLMap.remove(); this.derivedCompareLMap = null; }
    if (this.derivedCompareRMap) { this.derivedCompareRMap.remove(); this.derivedCompareRMap = null; }
    const leftMap  = L.map('derived-compare-left',
      { zoomControl: true, attributionControl: false, scrollWheelZoom: true });
    const rightMap = L.map('derived-compare-right',
      { zoomControl: true, attributionControl: false, scrollWheelZoom: true });
    [leftMap, rightMap].forEach(m =>
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(m));
    this.derivedCompareLMap = leftMap;
    this.derivedCompareRMap = rightMap;
    let boundsRef: L.GeoJSON | null = null;
    if (this.derivedCompareGeo) {
      boundsRef = this.makeCompareLayer(this.derivedCompareGeo, '#dc2626', '#fca5a5').addTo(leftMap);
    }
    if (this.derivedCompareFile?.geojson) {
      this.makeCompareLayer(this.derivedCompareFile.geojson, '#2563eb', '#93c5fd').addTo(rightMap);
    }
    this.syncMaps(leftMap, rightMap);
    const ref = boundsRef;
    setTimeout(() => {
      leftMap.invalidateSize(); rightMap.invalidateSize();
      try { if (ref) { leftMap.fitBounds(ref.getBounds(), { padding: [20, 20] });
                       rightMap.fitBounds(ref.getBounds(), { padding: [20, 20] }); } } catch {}
    }, 150);
  }

  private destroyDerivedCompareMaps() {
    if (this.derivedCompareOvMap) { this.derivedCompareOvMap.remove(); this.derivedCompareOvMap = null; }
    if (this.derivedCompareLMap)  { this.derivedCompareLMap.remove();  this.derivedCompareLMap  = null; }
    if (this.derivedCompareRMap)  { this.derivedCompareRMap.remove();  this.derivedCompareRMap  = null; }
  }

  private clearDerived() {
    this.derivedFiles      = [];
    this.selectedDerived   = null;
    this.derivedCompareMode = false;
    this.derivedCompareFile = null;
    this.derivedCompareGeo  = null;
    this.destroyDerivedCompareMaps();
    if (this.derivedGeoLayer && this.derivedMap) {
      this.derivedMap.removeLayer(this.derivedGeoLayer);
      this.derivedGeoLayer = null;
    }
  }

  // ── Attribute tooltip ─────────────────────────────────────
  private buildTooltip(props: Record<string, any>): string {
    const rows = Object.entries(props)
      .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
      .map(([k, v]) =>
        `<tr>
           <td style="font-weight:700;color:#002467;padding:2px 10px 2px 0;font-size:11px;white-space:nowrap">${k}</td>
           <td style="color:#334155;padding:2px 0;font-size:11px">${v}</td>
         </tr>`)
      .join('');
    return `<table style="border-collapse:collapse;min-width:120px">${rows}</table>`;
  }

  toggleStations() {
    this.showStations = !this.showStations;
    const activeMaps = [
      ...Object.values(this.previewMaps),
      this.derivedMap,
    ].filter((m): m is L.Map => !!m);
    activeMaps.forEach(m => this.showStations ? this.addStationDots(m) : this.removeStationDots(m));
  }

  private addStationDots(map: L.Map) {
    const existing = this.stationLayerMap.get(map);
    if (existing) { existing.remove(); this.stationLayerMap.delete(map); }
    const group = L.layerGroup();
    this.allStations.forEach(s => {
      const lat = parseFloat(s.latitude);
      const lng = parseFloat(s.longitude);
      if (isNaN(lat) || isNaN(lng)) return;
      L.circleMarker([lat, lng] as L.LatLngExpression, {
        radius: 4,
        color: '#dc2626',
        fillColor: '#ef4444',
        fillOpacity: 0.85,
        weight: 1
      })
      .bindTooltip(`<b>${s.station_name}</b><br>${s.station_code}`, { sticky: true })
      .addTo(group);
    });
    group.addTo(map);
    this.stationLayerMap.set(map, group);
  }

  private removeStationDots(map: L.Map) {
    const layer = this.stationLayerMap.get(map);
    if (layer) { layer.remove(); this.stationLayerMap.delete(map); }
  }

  // ── Leaflet map preview ───────────────────────────────────
  private initMap(key: string, geojson: any) {
    const el = document.getElementById(`preview-map-${key}`);
    if (!el) return;
    if (this.previewMaps[key]) { this.previewMaps[key]!.remove(); this.previewMaps[key] = null; }
    const map = L.map(`preview-map-${key}`, {
      zoomControl: true, attributionControl: false, scrollWheelZoom: true,
      center: [20.5937, 78.9629], zoom: 4 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { maxZoom: 18 }).addTo(map);
    const layer = L.geoJSON(geojson, {
      style: { color: '#002467', weight: 1, fillColor: '#3b82f6', fillOpacity: 0.25 },
      onEachFeature: (feature, layerItem) => {
        if (feature.properties && Object.keys(feature.properties).length) {
          layerItem.bindTooltip(this.buildTooltip(feature.properties),
            { sticky: true, opacity: 1, className: 'attr-tooltip' });
        }
      }
    }).addTo(map);
    if (this.showStations) this.addStationDots(map);
    this.previewMaps[key] = map;
    setTimeout(() => {
      map.invalidateSize();
      try { map.fitBounds(layer.getBounds(), { padding: [20, 20] }); } catch {}
    }, 300);
  }

  private renderMap(key: string) {
    if (this.previewMaps[key]) setTimeout(() => this.previewMaps[key]?.invalidateSize(), 50);
  }

  clearFile(key: string) {
    this.uploadFile[key]    = null;
    this.features[key]      = 0;
    this.uploadErr[key]     = '';
    this.uploadMsg[key]     = '';
    this.props[key]         = [];
    this.geomType[key]      = '';
    this.missingFields[key] = [];
    if (this.previewMaps[key]) { this.previewMaps[key]!.remove(); this.previewMaps[key] = null; }
    if (this.hasDerived(key)) { this.clearDerived(); this.generating = false; }
    this.previewMode[key]     = 'preview';
    this.compareGeo[key]      = null;
    this.compareErr[key]      = '';
    this.uploadedGeoJson[key] = null;
    this.destroyCompareMaps(key);
  }

  // ── Compare mode ─────────────────────────────────────────
  hasDbMatch(key: string): boolean {
    const uploaded = this.uploadFile[key];
    if (!uploaded) return false;
    return this.files[key].some(f => f.file_name.toLowerCase() === uploaded.name.toLowerCase());
  }

  getDbMatch(key: string): GeoFile | null {
    const uploaded = this.uploadFile[key];
    if (!uploaded) return null;
    return this.files[key].find(f => f.file_name.toLowerCase() === uploaded.name.toLowerCase()) ?? null;
  }

  featureDelta(key: string): number {
    return this.features[key] - (this.getDbMatch(key)?.feature_count ?? 0);
  }

  enterCompare(key: string) {
    const dbFile = this.getDbMatch(key);
    if (!dbFile) return;
    const cfg = this.tabs.find(t => t.key === key)!;
    this.previewMode[key]    = 'compare';
    this.compareLoading[key] = true;
    this.compareErr[key]     = '';
    this.http.get<any>(`${this.apiBase}/api/v1/geojson/${cfg.folder}/${dbFile.file_name}`)
      .subscribe({
        next: (geojson) => {
          this.compareGeo[key]      = geojson;
          this.compareLoading[key]  = false;
          setTimeout(() => this.renderCompareMap(key), 200);
        },
        error: () => {
          this.compareLoading[key] = false;
          this.compareErr[key]     = 'Could not load DB version.';
        }
      });
  }

  exitCompare(key: string) {
    this.previewMode[key] = 'preview';
    this.destroyCompareMaps(key);
    setTimeout(() => this.initMap(key, this.uploadedGeoJson[key]), 150);
  }

  setCompareView(view: 'overlay' | 'side-by-side', key: string) {
    this.compareView[key] = view;
    this.destroyCompareMaps(key);
    setTimeout(() => this.renderCompareMap(key), 150);
  }

  private renderCompareMap(key: string) {
    if (this.compareView[key] === 'overlay') this.renderOverlayMap(key);
    else                                      this.renderSideBySideMap(key);
  }

  private makeCompareLayer(geojson: any, color: string, fill: string): L.GeoJSON {
    return L.geoJSON(geojson, {
      style: { color, weight: 2, fillColor: fill, fillOpacity: 0.35 },
      onEachFeature: (feature, layer) => {
        if (feature.properties && Object.keys(feature.properties).length) {
          layer.bindTooltip(this.buildTooltip(feature.properties),
            { sticky: true, opacity: 1, className: 'attr-tooltip' });
        }
      }
    });
  }

  private renderOverlayMap(key: string) {
    const el = document.getElementById(`compare-overlay-${key}`);
    if (!el) return;
    if (this.overlayMaps[key]) { this.overlayMaps[key]!.remove(); this.overlayMaps[key] = null; }
    const map = L.map(`compare-overlay-${key}`,
      { zoomControl: true, attributionControl: false, scrollWheelZoom: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
    this.overlayMaps[key] = map;

    let boundsRef: L.GeoJSON | null = null;
    if (this.compareGeo[key]) {
      boundsRef = this.makeCompareLayer(this.compareGeo[key], '#dc2626', '#fca5a5').addTo(map);
    }
    if (this.uploadedGeoJson[key]) {
      const nl = this.makeCompareLayer(this.uploadedGeoJson[key], '#2563eb', '#93c5fd').addTo(map);
      if (!boundsRef) boundsRef = nl;
    }
    const ref = boundsRef;
    setTimeout(() => {
      map.invalidateSize();
      try { if (ref) map.fitBounds(ref.getBounds(), { padding: [20, 20] }); } catch {}
    }, 150);
  }

  private renderSideBySideMap(key: string) {
    const elL = document.getElementById(`compare-left-${key}`);
    const elR = document.getElementById(`compare-right-${key}`);
    if (!elL || !elR) return;
    if (this.sideLeftMaps[key])  { this.sideLeftMaps[key]!.remove();  this.sideLeftMaps[key]  = null; }
    if (this.sideRightMaps[key]) { this.sideRightMaps[key]!.remove(); this.sideRightMaps[key] = null; }

    const leftMap  = L.map(`compare-left-${key}`,
      { zoomControl: true, attributionControl: false, scrollWheelZoom: true });
    const rightMap = L.map(`compare-right-${key}`,
      { zoomControl: true, attributionControl: false, scrollWheelZoom: true });
    [leftMap, rightMap].forEach(m =>
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(m));
    this.sideLeftMaps[key]  = leftMap;
    this.sideRightMaps[key] = rightMap;

    let boundsRef: L.GeoJSON | null = null;
    if (this.compareGeo[key]) {
      boundsRef = this.makeCompareLayer(this.compareGeo[key], '#dc2626', '#fca5a5').addTo(leftMap);
    }
    if (this.uploadedGeoJson[key]) {
      this.makeCompareLayer(this.uploadedGeoJson[key], '#2563eb', '#93c5fd').addTo(rightMap);
    }
    this.syncMaps(leftMap, rightMap);

    const ref = boundsRef;
    setTimeout(() => {
      leftMap.invalidateSize();  rightMap.invalidateSize();
      try { if (ref) { leftMap.fitBounds(ref.getBounds(), { padding: [20, 20] });
                       rightMap.fitBounds(ref.getBounds(), { padding: [20, 20] }); } } catch {}
    }, 150);
  }

  private syncMaps(mapA: L.Map, mapB: L.Map) {
    let syncing = false;
    mapA.on('move', () => {
      if (syncing) return; syncing = true;
      mapB.setView(mapA.getCenter(), mapA.getZoom(), { animate: false });
      syncing = false;
    });
    mapB.on('move', () => {
      if (syncing) return; syncing = true;
      mapA.setView(mapB.getCenter(), mapB.getZoom(), { animate: false });
      syncing = false;
    });
  }

  private destroyCompareMaps(key: string) {
    if (this.overlayMaps[key])   { this.overlayMaps[key]!.remove();   this.overlayMaps[key]   = null; }
    if (this.sideLeftMaps[key])  { this.sideLeftMaps[key]!.remove();  this.sideLeftMaps[key]  = null; }
    if (this.sideRightMaps[key]) { this.sideRightMaps[key]!.remove(); this.sideRightMaps[key] = null; }
  }

  // ── Upload source file to DB ──────────────────────────────
  upload(key: string) {
    const cfg  = this.tabs.find(t => t.key === key)!;
    const file = this.uploadFile[key];
    if (!file) return;
    this.uploading[key] = true;
    this.uploadMsg[key] = '';
    this.uploadErr[key] = '';
    const fd = new FormData();
    fd.append('folder', cfg.folder);
    fd.append('file', file, file.name);
    this.http.post<any>(`${this.apiBase}/api/v1/geojson/upload`, fd).subscribe({
      next: (res) => {
        this.uploadMsg[key] = res.message ?? 'Uploaded successfully.';
        this.uploading[key] = false;
        this.logUpload(res, cfg.folder, file.name, this.features[key]);
        this.clearFile(key);
        this.files[key] = [];
        this.loadTab(key);
      },
      error: (err) => {
        this.uploadErr[key] = err.error?.message ?? 'Upload failed.';
        this.uploading[key] = false;
      }
    });
  }
}
