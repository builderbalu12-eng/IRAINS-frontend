import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, throwError } from 'rxjs';
import {
  AdminActivityLogService,
  AdminActivityUser,
  CalculationPage,
  DisplayOrderEntityType,
  NormalsPage,
  SpatialPage,
} from 'src/app/services/admin-activity-log.service';
import { AdminRealtimeService } from 'src/app/services/admin-realtime.service';

@Component({
  selector: 'app-officer-identification-modal',
  templateUrl: './officer-identification-modal.component.html',
  styleUrls: ['./officer-identification-modal.component.css'],
})
export class OfficerIdentificationModalComponent implements OnInit {
  @Input() visible = true;
  @Input() routePath = '';
  @Input() spatialPage?: SpatialPage;
  @Input() normalsPage?: NormalsPage;
  @Input() calculationPage?: CalculationPage;
  @Input() displayOrderEntity?: DisplayOrderEntityType;
  @Input() reviewPublishPage = false;
  @Input() pageLabel = 'this page';

  @Output() identified = new EventEmitter<AdminActivityUser>();

  submitting = false;
  /** Hide popup when officer details already exist in this session. */
  skipModal = false;
  formError = '';
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private activityLog: AdminActivityLogService,
    private adminRealtime: AdminRealtimeService,
  ) {
    this.form = this.fb.group({
      emp_name: ['', Validators.required],
      emp_designation: ['', Validators.required],
      emp_phone_number: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      remark: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    const stored = this.activityLog.getStoredUser(this.routePath);
    if (!this.activityLog.isCompleteUser(stored)) return;

    this.form.patchValue({
      emp_name: stored!.emp_name,
      emp_designation: stored!.emp_designation,
      emp_phone_number: stored!.emp_phone_number,
      remark: stored!.remark ?? '',
    });

    // Already identified this session — unlock page without showing the popup again.
    this.skipModal = true;
    queueMicrotask(() => this.resumeFromStoredUser(stored!));
  }

  submit(): void {
    if (this.submitting) return;
    this.formError = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError = 'Please fill in all required fields correctly.';
      return;
    }

    this.submitting = true;
    const { emp_name, emp_designation, emp_phone_number, remark } = this.form.getRawValue();
    const user = this.activityLog.buildUserFromForm({
      emp_name: emp_name.trim(),
      emp_designation: emp_designation.trim(),
      emp_phone_number: String(emp_phone_number).replace(/\D/g, ''),
      remark: remark.trim(),
    });

    this.recordPageAccess(user).subscribe({
      next: () => {
        this.submitting = false;
        this.finishIdentified(user);
      },
      error: (err) => {
        this.submitting = false;
        this.formError = err?.message === 'Page configuration error'
          ? 'Page configuration error. Please refresh and try again.'
          : 'Failed to save your details. Please try again.';
      },
    });
  }

  private resumeFromStoredUser(user: AdminActivityUser): void {
    this.finishIdentified(user);
    // Still record PAGE_ACCESS for this visit, but do not block the UI.
    this.recordPageAccess(user).subscribe({ error: () => undefined });
  }

  private finishIdentified(user: AdminActivityUser): void {
    this.skipModal = true;
    this.visible = false;
    this.activityLog.storeUser(user, this.routePath || undefined);
    if (this.routePath) {
      this.adminRealtime.onOfficerIdentified(this.routePath, user);
    }
    this.identified.emit(user);
  }

  private recordPageAccess(user: AdminActivityUser): Observable<unknown> {
    if (this.displayOrderEntity) {
      return this.activityLog.recordDisplayOrderPageAccess(
        this.displayOrderEntity,
        user,
        this.routePath,
      );
    }
    if (this.normalsPage) {
      return this.activityLog.recordNormalsPageAccess(this.normalsPage, user, this.routePath);
    }
    if (this.calculationPage) {
      return this.activityLog.recordCalculationPageAccess(this.calculationPage, user, this.routePath);
    }
    if (this.reviewPublishPage) {
      return this.activityLog.recordReviewPublishPageAccess(user, this.routePath);
    }
    if (this.spatialPage) {
      return this.activityLog.recordPageAccess(this.spatialPage, user, this.routePath);
    }
    return throwError(() => new Error('Page configuration error'));
  }
}
