import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environment/environment';
import * as L from 'leaflet';

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
  description: string;
}

@Component({
  selector: 'app-geojson-management',
  templateUrl: './geojson-management.component.html',
  styleUrls: ['./geojson-management.component.css']
})
export class GeojsonManagementComponent implements OnInit, OnDestroy {

  tabs: TabConfig[] = [
    { key: 'country',     label: 'Country',    icon: 'bi-globe',             folder: 'root',        fetchFolders: ['root'],              fileFilter: 'COUNTRY',      description: 'India country boundary (INDIA_COUNTRY.json)' },
    { key: 'region',      label: 'Region',     icon: 'bi-globe-americas',    folder: 'regions',     fetchFolders: ['regions','root'],     fileFilter: 'REGION',       description: 'Meteorological regions — all-India file + per-region files' },
    { key: 'state',       label: 'State',      icon: 'bi-flag-fill',         folder: 'state',       fetchFolders: ['state','root'],       fileFilter: 'STATE',        description: 'State boundaries — all-India file + per-state district files' },
    { key: 'subdivision', label: 'Subdivision',icon: 'bi-diagram-3-fill',    folder: 'subdivision', fetchFolders: ['subdivision','root'], fileFilter: 'SUB_DIVISION', description: 'Meteorological subdivisions — all-India + per-subdivision files' },
    { key: 'district',    label: 'District',   icon: 'bi-pin-map-fill',      folder: 'root',        fetchFolders: ['root'],              fileFilter: 'DISTRICT',     description: 'All-India district boundaries (INDIA_DISTRICT.json)',
      requiredFields: ['region','region_cod','subdivisio','subdivis_1','state','state_code','district','district_c','block','block_code','country','area_sqkm','area_sqmi','abb','RMC_MC','RMC_MC_ID'] },
    { key: 'block',       label: 'Block',      icon: 'bi-grid-3x3-gap-fill', folder: 'root',        fetchFolders: ['root'],              fileFilter: 'BLOCK',        description: 'All-India block boundaries (INDIA_BLOCK.json)' },
    { key: 'mcrmcs',      label: 'MC / RMC',   icon: 'bi-broadcast',         folder: 'mcrmcs',      fetchFolders: ['mcrmcs'],            fileFilter: undefined,      description: 'Meteorological Centre and Regional MC boundary files' },
  ];

  activeTab = 'country';

  files:      { [k: string]: GeoFile[] }   = {};
  loading:    { [k: string]: boolean }     = {};
  uploadFile: { [k: string]: File | null } = {};
  uploading:  { [k: string]: boolean }     = {};
  uploadMsg:  { [k: string]: string }      = {};
  uploadErr:  { [k: string]: string }      = {};
  dragOver:   { [k: string]: boolean }     = {};
  features:   { [k: string]: number }      = {};

  // Preview state
  props:         { [k: string]: PropRow[] }    = {};
  geomType:      { [k: string]: string }       = {};
  previewMaps:   { [k: string]: L.Map | null } = {};
  missingFields: { [k: string]: string[] }     = {};

  private apiBase = environment.baseUrl;

  constructor(private http: HttpClient) {
    this.tabs.forEach(t => {
      this.files[t.key]       = [];
      this.loading[t.key]     = false;
      this.uploadFile[t.key]  = null;
      this.uploading[t.key]   = false;
      this.uploadMsg[t.key]   = '';
      this.uploadErr[t.key]   = '';
      this.dragOver[t.key]    = false;
      this.features[t.key]    = 0;
      this.props[t.key]         = [];
      this.geomType[t.key]      = '';
      this.previewMaps[t.key]   = null;
      this.missingFields[t.key] = [];
    });
  }

  ngOnInit(): void { this.loadTab('country'); }

  ngOnDestroy(): void {
    // Clean up Leaflet maps to avoid memory leaks
    Object.values(this.previewMaps).forEach(m => m?.remove());
  }

  selectTab(key: string) {
    this.activeTab = key;
    if (!this.files[key].length && !this.loading[key]) this.loadTab(key);
    // Re-render map if a file is already loaded on this tab
    if (this.uploadFile[key]) setTimeout(() => this.renderMap(key), 80);
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
          let rows: GeoFile[] = res.files ?? [];
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
    e.preventDefault();
    this.dragOver[key] = false;
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

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const geojson = JSON.parse(ev.target?.result as string);
        this.features[key] = geojson?.features?.length ?? 0;
        this.extractProps(key, geojson);
        this.checkRequiredFields(key, geojson);
        setTimeout(() => this.initMap(key, geojson), 80);
      } catch {
        this.uploadErr[key] = 'Invalid JSON.';
        this.uploadFile[key] = null;
      }
    };
    reader.readAsText(file);
  }

  // ── Extract property fields + sample values ──────────────
  private extractProps(key: string, geojson: any) {
    const features = geojson?.features ?? [];
    if (!features.length) { this.props[key] = []; return; }

    this.geomType[key] = features[0]?.geometry?.type ?? 'Unknown';

    // Collect unique keys from first 5 features
    const keySet = new Set<string>();
    features.slice(0, 5).forEach((f: any) => Object.keys(f.properties ?? {}).forEach((k: string) => keySet.add(k)));

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

  // ── Leaflet map preview ───────────────────────────────────
  private initMap(key: string, geojson: any) {
    const el = document.getElementById(`preview-map-${key}`);
    if (!el) return;

    // Destroy old map instance
    if (this.previewMaps[key]) {
      this.previewMaps[key]!.remove();
      this.previewMaps[key] = null;
    }

    const map = L.map(`preview-map-${key}`, {
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18
    }).addTo(map);

    const layer = L.geoJSON(geojson, {
      style: { color: '#002467', weight: 1, fillColor: '#3b82f6', fillOpacity: 0.25 }
    }).addTo(map);

    try { map.fitBounds(layer.getBounds(), { padding: [16, 16] }); } catch {}

    this.previewMaps[key] = map;
    setTimeout(() => map.invalidateSize(), 150);
  }

  private renderMap(key: string) {
    if (this.previewMaps[key]) {
      setTimeout(() => this.previewMaps[key]?.invalidateSize(), 50);
    }
  }

  clearFile(key: string) {
    this.uploadFile[key] = null;
    this.features[key]   = 0;
    this.uploadErr[key]  = '';
    this.uploadMsg[key]  = '';
    this.props[key]         = [];
    this.geomType[key]      = '';
    this.missingFields[key] = [];
    if (this.previewMaps[key]) { this.previewMaps[key]!.remove(); this.previewMaps[key] = null; }
  }

  // ── Upload ───────────────────────────────────────────────
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
