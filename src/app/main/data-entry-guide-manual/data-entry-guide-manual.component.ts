import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-data-entry-guide-manual',
  templateUrl: './data-entry-guide-manual.component.html',
  styleUrls: ['./data-entry-guide-manual.component.css']
})
export class DataEntryGuideManualComponent {
  docUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    this.docUrl = this.sanitizer.bypassSecurityTrustResourceUrl('assets/Data entry Guide.pdf');
  }}
