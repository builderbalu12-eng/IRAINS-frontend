import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-user-manual',
  templateUrl: './user-manual.component.html',
  styleUrls: ['./user-manual.component.css']
})
export class UserManualComponent {
  docUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    this.docUrl = this.sanitizer.bypassSecurityTrustResourceUrl('assets/Usermanual.pdf');
  }
}
