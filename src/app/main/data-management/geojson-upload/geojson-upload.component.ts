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

@Component({
  selector: 'app-geojson-upload',
  templateUrl: './geojson-upload.component.html',
  styleUrls: ['./geojson-upload.component.css']
})
export class GeojsonUploadComponent implements OnInit {
  selectedLayer = '';
  dragOver = false;
  selectedFile: File | null = null;
  previewJson: any = null;
  featureCount = 0;
  uploadError = '';
  uploadSuccess = '';
  isUploading = false;

  layerOptions = [
    { value: 'root',        label: 'India-wide (INDIA_STATE, INDIA_DISTRICT …)' },
    { value: 'state',       label: 'State-level District Boundaries' },
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

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.dragOver = true;
  }

  onDragLeave() { this.dragOver = false; }

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

  previewJsonStr = '';

  loadFile(file: File) {
    this.uploadError = '';
    this.uploadSuccess = '';
    if (!file.name.endsWith('.geojson') && !file.name.endsWith('.json')) {
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

    const formData = new FormData();
    formData.append('folder', this.selectedLayer);
    formData.append('file', this.selectedFile, this.selectedFile.name);

    this.http.post<any>(`${this.apiBase}/api/v1/geojson/upload`, formData).subscribe({
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
}
