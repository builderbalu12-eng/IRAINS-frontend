import { Component, Input, OnInit } from '@angular/core';
import * as FileSaver from 'file-saver';
import { NormalsDownloadService, NormalsLevel, NormalsView } from 'src/app/services/normalsDownload.service';

/** Year + Daily/Weekly/Monthly picker and download button for the Normals pages. */
@Component({
  selector: 'app-normals-download',
  templateUrl: './normals-download.component.html',
})
export class NormalsDownloadComponent implements OnInit {
  @Input() level!: NormalsLevel;

  readonly views: { value: NormalsView; label: string }[] = [
    { value: 'daily', label: 'Daily (all dates)' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  years: number[] = [];
  year: number | null = null;
  view: NormalsView = 'daily';
  downloading = false;
  error = '';

  constructor(private normalsDownload: NormalsDownloadService) {}

  ngOnInit(): void {
    this.normalsDownload.getYears(this.level).subscribe({
      next: (res) => {
        this.years = res.data;
        const current = new Date().getFullYear();
        this.year = this.years.includes(current) ? current : this.years[0] ?? null;
      },
      error: () => (this.error = 'Could not load the normal years.'),
    });
  }

  download(): void {
    if (!this.year || this.downloading) return;
    const year = this.year;
    this.downloading = true;
    this.error = '';
    this.normalsDownload.download(this.level, year, this.view).subscribe({
      next: (file) => {
        this.downloading = false;
        const name = this.level.charAt(0).toUpperCase() + this.level.slice(1);
        const view = this.view.charAt(0).toUpperCase() + this.view.slice(1);
        FileSaver.saveAs(file, `Normals_${name}_${year}_${view}.xlsx`);
      },
      error: () => {
        this.downloading = false;
        this.error = 'Download failed. Please try again.';
      },
    });
  }
}
