import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-user-manualv2',
  templateUrl: './user-manualv2.component.html',
  styleUrls: ['./user-manualv2.component.css']
})
export class UserManualv2Component {
  docUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    // Bypass security for local asset URL
    this.docUrl = this.sanitizer.bypassSecurityTrustResourceUrl('assets/BRMS UserManual_V2.pdf');
  }
}