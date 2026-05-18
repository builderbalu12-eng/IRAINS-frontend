import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environment/environment';

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

interface TabConfig {
  key: string;
  label: string;
  icon: string;
  folder: string;           // folder to upload to
  fetchFolders: string[];   // folders to fetch files from
  fileFilter?: string;      // if set, only show files whose name contains this (for root folder)
  description: string;
}

@Component({
  selector: 'app-geojson-management',
  templateUrl: './geojson-management.component.html',
  styleUrls: ['./geojson-management.component.css']
})
export class GeojsonManagementComponent implements OnInit {

  tabs: TabConfig[] = [
    { key: 'country',     label: 'Country',     icon: 'bi-globe',              folder: 'root',        fetchFolders: ['root'],        fileFilter: 'COUNTRY',     description: 'India country boundary (INDIA_COUNTRY.json)' },
    { key: 'region',      label: 'Region',       icon: 'bi-globe-americas',     folder: 'regions',     fetchFolders: ['regions','root'], fileFilter: 'REGION',    description: 'Meteorological regions — all-India file + per-region files' },
    { key: 'state',       label: 'State',        icon: 'bi-flag-fill',          folder: 'state',       fetchFolders: ['state','root'],  fileFilter: 'STATE',     description: 'State boundaries — all-India file + per-state district files' },
    { key: 'subdivision', label: 'Subdivision',  icon: 'bi-diagram-3-fill',     folder: 'subdivision', fetchFolders: ['subdivision','root'], fileFilter: 'SUB_DIVISION', description: 'Meteorological subdivisions — all-India file + per-subdivision files' },
    { key: 'district',    label: 'District',     icon: 'bi-pin-map-fill',       folder: 'root',        fetchFolders: ['root'],        fileFilter: 'DISTRICT',    description: 'All-India district boundaries (INDIA_DISTRICT.json)' },
    { key: 'block',       label: 'Block',        icon: 'bi-grid-3x3-gap-fill',  folder: 'root',        fetchFolders: ['root'],        fileFilter: 'BLOCK',       description: 'All-India block boundaries (INDIA_BLOCK.json)' },
    { key: 'mcrmcs',      label: 'MC / RMC',     icon: 'bi-broadcast',          folder: 'mcrmcs',      fetchFolders: ['mcrmcs'],      fileFilter: undefined,     description: 'Meteorological Centre and Regional MC boundary files' },
  ];

  activeTab = 'country';

  // Per-tab state (keyed by tab.key)
  files:       { [k: string]: GeoFile[] }   = {};
  loading:     { [k: string]: boolean }     = {};
  uploadFile:  { [k: string]: File | null } = {};
  uploading:   { [k: string]: boolean }     = {};
  uploadMsg:   { [k: string]: string }      = {};
  uploadErr:   { [k: string]: string }      = {};
  dragOver:    { [k: string]: boolean }     = {};
  features:    { [k: string]: number }      = {};

  private apiBase = environment.baseUrl;

  constructor(private http: HttpClient) {
    this.tabs.forEach(t => {
      this.files[t.key]      = [];
      this.loading[t.key]    = false;
      this.uploadFile[t.key] = null;
      this.uploading[t.key]  = false;
      this.uploadMsg[t.key]  = '';
      this.uploadErr[t.key]  = '';
      this.dragOver[t.key]   = false;
      this.features[t.key]   = 0;
    });
  }

  ngOnInit(): void {
    this.loadTab('country');
  }

  selectTab(key: string) {
    this.activeTab = key;
    if (!this.files[key].length && !this.loading[key]) {
      this.loadTab(key);
    }
  }

  get activeConfig(): TabConfig {
    return this.tabs.find(t => t.key === this.activeTab)!;
  }

  loadTab(key: string) {
    const cfg = this.tabs.find(t => t.key === key)!;
    this.loading[key] = true;
    this.files[key] = [];

    // For tabs that fetch from multiple folders, merge results
    const foldersToFetch = [...new Set(cfg.fetchFolders)];
    let pending = foldersToFetch.length;
    let allFiles: GeoFile[] = [];

    foldersToFetch.forEach(folder => {
      this.http.get<any>(`${this.apiBase}/api/v1/geojson/${folder}`).subscribe({
        next: (res) => {
          let rows: GeoFile[] = res.files ?? [];
          // If a fileFilter is set and this is the root folder, filter by filename
          if (cfg.fileFilter && folder === 'root') {
            rows = rows.filter(f => f.file_name.toUpperCase().includes(cfg.fileFilter!));
          }
          allFiles.push(...rows);
          pending--;
          if (pending === 0) {
            this.files[key] = allFiles.sort((a, b) => a.file_name.localeCompare(b.file_name));
            this.loading[key] = false;
          }
        },
        error: () => {
          pending--;
          if (pending === 0) this.loading[key] = false;
        }
      });
    });
  }

  // ── Upload handlers ──────────────────────────────────────
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
        const parsed = JSON.parse(ev.target?.result as string);
        this.features[key] = parsed?.features?.length ?? 0;
      } catch {
        this.uploadErr[key] = 'Invalid JSON.';
        this.uploadFile[key] = null;
      }
    };
    reader.readAsText(file);
  }

  clearFile(key: string) {
    this.uploadFile[key] = null;
    this.features[key]   = 0;
    this.uploadErr[key]  = '';
    this.uploadMsg[key]  = '';
  }

  upload(key: string) {
    const cfg  = this.tabs.find(t => t.key === key)!;
    const file = this.uploadFile[key];
    if (!file) return;

    this.uploading[key]  = true;
    this.uploadMsg[key]  = '';
    this.uploadErr[key]  = '';

    const fd = new FormData();
    fd.append('folder', cfg.folder);
    fd.append('file', file, file.name);

    this.http.post<any>(`${this.apiBase}/api/v1/geojson/upload`, fd).subscribe({
      next: (res) => {
        this.uploadMsg[key] = res.message ?? 'Uploaded successfully.';
        this.uploading[key] = false;
        this.clearFile(key);
        this.files[key] = [];    // force reload
        this.loadTab(key);
      },
      error: (err) => {
        this.uploadErr[key] = err.error?.message ?? 'Upload failed.';
        this.uploading[key] = false;
      }
    });
  }
}
