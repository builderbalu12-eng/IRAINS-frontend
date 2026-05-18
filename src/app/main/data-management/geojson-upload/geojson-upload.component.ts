import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environment/environment';

interface GeoUploadLog {
  filename: string;
  layer: string;
  features: number;
  uploadedAt: string;
  status: 'success' | 'error';
}

interface BulkQueueItem {
  file: File;
  folder: string;
  features: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  message: string;
}

@Component({
  selector: 'app-geojson-upload',
  templateUrl: './geojson-upload.component.html',
  styleUrls: ['./geojson-upload.component.css']
})
export class GeojsonUploadComponent implements OnInit {

  // ── Mode toggle ────────────────────────────────────────────
  mode: 'single' | 'bulk' = 'single';

  // ── Single upload state ────────────────────────────────────
  selectedLayer = '';
  dragOver = false;
  selectedFile: File | null = null;
  previewJson: any = null;
  previewJsonStr = '';
  featureCount = 0;
  uploadError = '';
  uploadSuccess = '';
  isUploading = false;

  // ── Bulk upload state ──────────────────────────────────────
  bulkQueue: BulkQueueItem[] = [];
  isBulkUploading = false;
  bulkDoneCount = 0;

  // ── Shared ─────────────────────────────────────────────────
  layerOptions = [
    { value: 'root',        label: 'India-wide (INDIA_*)' },
    { value: 'state',       label: 'State-level Districts' },
    { value: 'subdivision', label: 'Subdivision Boundaries' },
    { value: 'regions',     label: 'Regional Boundaries' },
    { value: 'mcrmcs',      label: 'MC / RMC Boundaries' },
    { value: 'river_basin', label: 'River Basin' },
  ];

  logs: GeoUploadLog[] = [];
  private apiBase = environment.baseUrl;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<any>(`${this.apiBase}/api/v1/geojson/upload-history`).subscribe({
      next: (res) => {
        if (res?.history) {
          this.logs = res.history.map((h: any) => ({
            filename:   h.file_name,
            layer:      h.folder,
            features:   h.feature_count,
            uploadedAt: new Date(h.created_at).toLocaleString(),
            status:     'success' as const
          }));
        }
      },
      error: () => {}
    });
  }

  // ── Auto-detect folder from filename ──────────────────────
  detectFolder(fileName: string): string {
    const n = fileName.toUpperCase().replace(/\.GEOJSON$|\.JSON$/, '');
    if (n.startsWith('ST_'))  return 'state';
    if (n.startsWith('SD_'))  return 'subdivision';
    if (n.startsWith('MC_') || n.startsWith('RMC_') || n === 'AHM' || n === 'AMV') return 'mcrmcs';
    if (n === 'BASIN_BOUNDARY') return 'river_basin';
    if (n.startsWith('INDIA_')) return 'root';
    // Known region filenames
    if (['C_INDIA','EAST_AND_NORTH_EAST_INDIA','NORTH_WEST_INDIA','SOUTH_PENINSULA'].includes(n)) return 'regions';
    // Remaining subdivision files without SD_ prefix (e.g. Chattisgarh.json)
    return 'subdivision';
  }

  // ── Single upload ──────────────────────────────────────────
  onDragOver(e: DragEvent)  { e.preventDefault(); this.dragOver = true; }
  onDragLeave()              { this.dragOver = false; }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragOver = false;
    const file = e.dataTransfer?.files[0];
    if (file) this.loadFile(file);
  }

  onFileSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.loadFile(file);
  }

  loadFile(file: File) {
    this.uploadError = '';
    this.uploadSuccess = '';
    if (!file.name.match(/\.(geojson|json)$/i)) {
      this.uploadError = 'Only .geojson or .json files are accepted.';
      return;
    }
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        this.previewJson = parsed;
        this.featureCount = parsed?.features?.length ?? 0;
        const full = JSON.stringify(parsed, null, 2);
        this.previewJsonStr = full.length > 600 ? full.slice(0, 600) + '\n...' : full;
      } catch {
        this.uploadError = 'Invalid JSON file.';
        this.selectedFile = null;
      }
    };
    reader.readAsText(file);
  }

  clearFile() {
    this.selectedFile = null;
    this.previewJson = null;
    this.previewJsonStr = '';
    this.featureCount = 0;
    this.uploadError = '';
    this.uploadSuccess = '';
  }

  upload() {
    if (!this.selectedFile || !this.selectedLayer) return;
    this.isUploading = true;
    this.uploadSuccess = '';
    this.uploadError = '';

    const fd = new FormData();
    fd.append('folder', this.selectedLayer);
    fd.append('file', this.selectedFile, this.selectedFile.name);

    this.http.post<any>(`${this.apiBase}/api/v1/geojson/upload`, fd).subscribe({
      next: (res) => {
        this.logs.unshift({
          filename:   this.selectedFile!.name,
          layer:      this.selectedLayer,
          features:   this.featureCount,
          uploadedAt: new Date().toLocaleString(),
          status:     'success'
        });
        this.uploadSuccess = res.message ?? `Uploaded ${this.featureCount} features to ${this.selectedLayer}.`;
        this.isUploading = false;
        this.clearFile();
        this.selectedLayer = '';
      },
      error: (err) => {
        this.logs.unshift({
          filename:   this.selectedFile!.name,
          layer:      this.selectedLayer,
          features:   this.featureCount,
          uploadedAt: new Date().toLocaleString(),
          status:     'error'
        });
        this.uploadError = err.error?.message ?? 'Upload failed. Please try again.';
        this.isUploading = false;
      }
    });
  }

  // ── Bulk upload ────────────────────────────────────────────
  onBulkFilesSelected(e: Event) {
    const files = Array.from((e.target as HTMLInputElement).files ?? []);
    this.addFilesToQueue(files);
    (e.target as HTMLInputElement).value = '';
  }

  onBulkDrop(e: DragEvent) {
    e.preventDefault();
    this.dragOver = false;
    const files = Array.from(e.dataTransfer?.files ?? []);
    this.addFilesToQueue(files);
  }

  private addFilesToQueue(files: File[]) {
    const valid = files.filter(f => f.name.match(/\.(geojson|json)$/i));
    const added: BulkQueueItem[] = [];

    for (const file of valid) {
      if (this.bulkQueue.some(q => q.file.name === file.name && q.status !== 'error')) continue;
      added.push({ file, folder: this.detectFolder(file.name), features: 0, status: 'pending', message: '' });
    }

    // Read feature counts for preview
    for (const item of added) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target?.result as string);
          item.features = parsed?.features?.length ?? 0;
        } catch {}
      };
      reader.readAsText(item.file);
    }

    this.bulkQueue.push(...added);
  }

  removeBulkItem(index: number) {
    this.bulkQueue.splice(index, 1);
  }

  clearBulkQueue() {
    this.bulkQueue = this.bulkQueue.filter(i => i.status === 'uploading');
  }

  get bulkPendingCount()  { return this.bulkQueue.filter(i => i.status === 'pending').length; }
  get bulkSuccessCount()  { return this.bulkQueue.filter(i => i.status === 'success').length; }
  get bulkErrorCount()    { return this.bulkQueue.filter(i => i.status === 'error').length; }
  get bulkProgressPct()   {
    if (!this.bulkQueue.length) return 0;
    return Math.round(((this.bulkSuccessCount + this.bulkErrorCount) / this.bulkQueue.length) * 100);
  }
  get allFolderSelected() { return this.bulkQueue.every(i => i.folder !== ''); }

  async uploadAll() {
    const pending = this.bulkQueue.filter(i => i.status === 'pending');
    if (!pending.length || this.isBulkUploading) return;
    this.isBulkUploading = true;
    this.bulkDoneCount = 0;

    for (const item of pending) {
      item.status = 'uploading';
      item.message = '';

      const fd = new FormData();
      fd.append('folder', item.folder);
      fd.append('file', item.file, item.file.name);

      await new Promise<void>((resolve) => {
        this.http.post<any>(`${this.apiBase}/api/v1/geojson/upload`, fd).subscribe({
          next: (res) => {
            item.status = 'success';
            item.message = res.message ?? 'Uploaded';
            this.logs.unshift({
              filename:   item.file.name,
              layer:      item.folder,
              features:   item.features,
              uploadedAt: new Date().toLocaleString(),
              status:     'success'
            });
            this.bulkDoneCount++;
            resolve();
          },
          error: (err) => {
            item.status = 'error';
            item.message = err.error?.message ?? 'Upload failed';
            this.bulkDoneCount++;
            resolve();
          }
        });
      });
    }

    this.isBulkUploading = false;
  }

  retryErrors() {
    this.bulkQueue.filter(i => i.status === 'error').forEach(i => { i.status = 'pending'; i.message = ''; });
    this.uploadAll();
  }
}
