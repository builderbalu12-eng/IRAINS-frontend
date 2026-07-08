import { Component, OnInit } from '@angular/core';
import { DataEntryLockService } from 'src/app/services/dataEntryLock.service';

@Component({
  selector: 'app-review-and-publish',
  templateUrl: './review-and-publish.component.html',
  styleUrls: ['./review-and-publish.component.css']
})
export class ReviewAndPublishComponent implements OnInit {
  isLocked: boolean = false;
  loading: boolean = false;
  saving: boolean = false;
  message: string = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private lockService: DataEntryLockService) {}

  ngOnInit(): void {
    this.loading = true;
    this.lockService.loadLock().subscribe({
      next: (res) => {
        this.isLocked = res.is_locked === 1;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onToggleChange(): void {
    this.saving = true;
    this.message = '';
    const newVal = this.isLocked ? 1 : 0;
    this.lockService.setLock(newVal).subscribe({
      next: (res) => {
        this.saving = false;
        this.messageType = 'success';
        this.message = res.is_locked === 1
          ? 'Data entry is now locked — the data-entry page will show a lock popup blocking submissions.'
          : 'Data entry is now unlocked — users can submit data as normal.';
        setTimeout(() => this.message = '', 4000);
      },
      error: () => {
        this.saving = false;
        this.messageType = 'error';
        this.message = 'Failed to update lock status. Please try again.';
        this.isLocked = !this.isLocked;
      }
    });
  }
}
