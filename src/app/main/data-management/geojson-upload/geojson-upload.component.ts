import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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
export class GeojsonUploadComponent {
  selectedLayer = '';
  dragOver = false;
  selectedFile: File | null = null;
  previewJson: any = null;
  featureCount = 0;
  uploadError = '';
  uploadSuccess = '';
  isUploading = false;

  layerOptions = [
    { value: 'state',       label: 'State Boundaries' },
    { value: 'district',    label: 'District Boundaries' },
    { value: 'subdivision', label: 'Subdivision Boundaries' },
    { value: 'region',      label: 'Region Boundaries' },
    { value: 'block',       label: 'Block Boundaries' },
  ];

  logs: GeoUploadLog[] = [];

  constructor(private http: HttpClient) {}

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

    setTimeout(() => {
      this.logs.unshift({
        filename: this.selectedFile!.name,
        layer: this.selectedLayer,
        features: this.featureCount,
        uploadedAt: new Date().toLocaleString(),
        status: 'success'
      });
      this.uploadSuccess = `Uploaded ${this.featureCount} features to ${this.selectedLayer} layer.`;
      this.isUploading = false;
      this.clearFile();
      this.selectedLayer = '';
    }, 1200);
  }
}
