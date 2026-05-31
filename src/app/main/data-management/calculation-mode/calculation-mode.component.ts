import { Component, OnInit } from '@angular/core';
import { CalculationsModeService } from 'src/app/services/calculationsMode.service';

@Component({
  selector: 'app-calculation-mode',
  templateUrl: './calculation-mode.component.html',
  styleUrls: ['./calculation-mode.component.css']
})
export class CalculationModeComponent implements OnInit {
  useAws: boolean = true;
  loading: boolean = false;
  saving:  boolean = false;
  message: string  = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private calcMode: CalculationsModeService) {}

  ngOnInit(): void {
    this.loading = true;
    this.calcMode.loadMode().subscribe({
      next: (res) => {
        this.useAws = res.use_aws === 1;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onToggleChange(): void {
    this.saving = true;
    this.message = '';
    const newVal = this.useAws ? 1 : 0;
    this.calcMode.setMode(newVal).subscribe({
      next: (res) => {
        this.saving = false;
        this.messageType = 'success';
        this.message = res.use_aws === 1
          ? 'Mode set to IMD + AWS — all maps and exports now include AWS stations.'
          : 'Mode set to IMD Only — all maps and exports use IMD stations only.';
        setTimeout(() => this.message = '', 4000);
      },
      error: () => {
        this.saving = false;
        this.messageType = 'error';
        this.message = 'Failed to update mode. Please try again.';
        this.useAws = !this.useAws; // revert toggle on failure
      }
    });
  }
}
