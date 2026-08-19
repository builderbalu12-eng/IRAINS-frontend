import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subject, throwError } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import {
  AdminActivityLogService,
  AdminActivityUser,
  CalculationPage,
  DisplayOrderEntityType,
  NormalsPage,
  SpatialPage,
} from 'src/app/services/admin-activity-log.service';
import { AdminRealtimeService } from 'src/app/services/admin-realtime.service';
import {
  OfficerPassKey,
  OfficerPassKeyService,
} from 'src/app/services/officer-pass-key.service';

type ModalView = 'login' | 'create' | 'forgot' | 'reset' | 'revealed' | 'pending';

@Component({
  selector: 'app-officer-identification-modal',
  templateUrl: './officer-identification-modal.component.html',
  styleUrls: ['./officer-identification-modal.component.css'],
})
export class OfficerIdentificationModalComponent implements OnInit, OnDestroy {
  @Input() visible = true;
  @Input() routePath = '';
  @Input() spatialPage?: SpatialPage;
  @Input() normalsPage?: NormalsPage;
  @Input() calculationPage?: CalculationPage;
  @Input() displayOrderEntity?: DisplayOrderEntityType;
  @Input() reviewPublishPage = false;
  @Input() pageLabel = 'this page';

  @Output() identified = new EventEmitter<AdminActivityUser>();

  view: ModalView = 'login';
  submitting = false;
  /** Re-open from Activity panel even when parent set visible=false. */
  forceOpen = false;
  formError = '';
  formSuccess = '';
  revealedKey = '';
  copied = false;
  pendingIsReset = false;
  loginForm: FormGroup;
  createForm: FormGroup;
  recoverForm: FormGroup;

  private revealedOfficer: OfficerPassKey | null = null;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private activityLog: AdminActivityLogService,
    private adminRealtime: AdminRealtimeService,
    private passKeys: OfficerPassKeyService,
  ) {
    this.loginForm = this.fb.group({
      pass_key: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
      remark: ['', Validators.required],
    });
    this.createForm = this.fb.group({
      emp_name: ['', Validators.required],
      emp_designation: ['', Validators.required],
      emp_phone_number: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      emp_email: ['', Validators.email],
      remark: ['', Validators.required],
    });
    this.recoverForm = this.fb.group({
      emp_name: ['', Validators.required],
      emp_phone_number: ['', Validators.pattern(/^\d{10}$/)],
      emp_email: ['', Validators.email],
    });
  }

  ngOnInit(): void {
    // Fresh Pass Key + Remarks on every page visit — do not carry over previous page text.
    this.resetLoginForm();

    this.activityLog.requestPassKeyLogin$
      .pipe(
        filter((path) => !path || path === this.routePath),
        takeUntil(this.destroy$),
      )
      .subscribe(() => this.openLogin());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Show Pass Key login (Forgot / Create links available). */
  openLogin(): void {
    this.forceOpen = true;
    this.view = 'login';
    this.formError = '';
    this.formSuccess = '';
    this.submitting = false;
    this.resetLoginForm();
  }

  get showBackdrop(): boolean {
    return this.visible || this.forceOpen;
  }

  get title(): string {
    switch (this.view) {
      case 'create':
        return 'Create Pass Key';
      case 'forgot':
        return 'Forgot Pass Key';
      case 'reset':
        return 'Reset Pass Key';
      case 'revealed':
        return 'Your Pass Key';
      case 'pending':
        return 'Awaiting HQ Approval';
      default:
        return 'Officer Identification';
    }
  }

  setView(view: ModalView): void {
    this.view = view;
    this.formError = '';
    this.formSuccess = '';
    this.copied = false;
    if (view === 'login') {
      this.resetLoginForm();
    } else if (view === 'create') {
      this.prefillCreateFromAuth();
    } else if (view === 'forgot' || view === 'reset') {
      this.recoverForm.reset({ emp_name: '', emp_phone_number: '', emp_email: '' });
    }
  }

  onPassKeyInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = this.passKeys.normalizePassKey(input.value);
    this.loginForm.patchValue({ pass_key: digits }, { emitEvent: false });
    input.value = digits;
  }

  submitLogin(): void {
    if (this.submitting) return;
    this.formError = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.formError = 'Please enter your 4-digit Pass Key and Reason/Remarks.';
      return;
    }

    this.submitting = true;
    const { pass_key, remark } = this.loginForm.getRawValue();
    this.passKeys.verify(pass_key, remark).subscribe({
      next: (res) => {
        if (!res.officer) {
          this.submitting = false;
          this.formError = 'Pass Key verified, but officer details were not returned.';
          return;
        }
        const user = this.activityLog.buildUserFromPassKeyOfficer(res.officer, remark, res.officer.pass_key);
        this.recordAndFinish(user);
      },
      error: (err) => {
        this.submitting = false;
        this.formError = this.passKeys.errorMessage(err, 'Invalid Pass Key. Please try again.');
      },
    });
  }

  submitCreate(): void {
    if (this.submitting) return;
    this.formError = '';

    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      this.formError = 'Please fill in all required fields correctly.';
      return;
    }

    this.submitting = true;
    const value = this.createForm.getRawValue();
    const auth = this.getAuthUser();
    this.passKeys.create({
      emp_name: value.emp_name.trim(),
      emp_designation: value.emp_designation.trim(),
      emp_phone_number: String(value.emp_phone_number).replace(/\D/g, ''),
      emp_email: value.emp_email?.trim() || auth?.username || null,
      login_id: auth?.userid ?? null,
      mcorhq_type: auth?.mcorhq ?? null,
      remark: value.remark.trim(),
    }).subscribe({
      next: (res) => {
        this.submitting = false;
        const isPending =
          res.status === 'pending' ||
          res.officer?.approval_status === 'pending' ||
          !res.pass_key;
        if (isPending) {
          this.showPendingApproval(res.message, res.hq_email_sent, false);
          return;
        }
        this.showRevealed(
          res.pass_key || res.officer?.pass_key,
          res.officer || null,
          value.remark.trim(),
          res.email_sent
            ? 'Pass Key created and sent to the registered email. Save this code — you will need it for future visits.'
            : 'Pass Key created. Save this code — you will need it for future visits.',
        );
      },
      error: (err) => {
        this.submitting = false;
        this.formError = this.passKeys.errorMessage(
          err,
          'Could not create a Pass Key. Please try again.',
        );
      },
    });
  }

  submitRecover(): void {
    if (this.submitting) return;
    this.formError = '';

    if (this.recoverForm.get('emp_name')?.invalid) {
      this.recoverForm.markAllAsTouched();
      this.formError = 'Please enter your name.';
      return;
    }

    const value = this.recoverForm.getRawValue();
    const emp_name = String(value.emp_name).trim();
    const emp_phone_number = String(value.emp_phone_number || '').replace(/\D/g, '');
    const emp_email = String(value.emp_email || '').trim();
    const phone = emp_phone_number.length === 10 ? emp_phone_number : '';
    if (!phone && !emp_email) {
      this.formError = 'Enter your registered 10-digit phone number or email.';
      return;
    }

    this.submitting = true;
    const payload = {
      emp_name,
      ...(phone ? { emp_phone_number: phone } : {}),
      ...(emp_email ? { emp_email } : {}),
    };
    const request$ = this.view === 'reset'
      ? this.passKeys.regenerateByIdentity(payload)
      : this.passKeys.forgot(payload);

    request$.subscribe({
      next: (res) => {
        this.submitting = false;
        if (this.view === 'reset') {
          const isPending =
            res.status === 'pending' ||
            res.officer?.pending_request_type === 'reset' ||
            res.officer?.approval_status === 'pending';
          if (isPending || !res.pass_key) {
            this.showPendingApproval(
              res.message ||
                'Pass Key reset request sent to HQ for approval. Your current Pass Key remains valid until HQ approves.',
              res.hq_email_sent,
              true,
            );
            return;
          }
        }
        const defaultMsg = this.view === 'reset'
          ? 'Pass Key reset. The previous code is no longer valid.'
          : 'Pass Key recovered.';
        this.showRevealed(
          res.pass_key || res.officer?.pass_key,
          res.officer || null,
          this.loginForm.get('remark')?.value || '',
          res.message || (res.email_sent ? `${defaultMsg} It was also emailed.` : defaultMsg),
        );
      },
      error: (err) => {
        this.submitting = false;
        this.formError = this.passKeys.errorMessage(err, 'No Pass Key found for the given details.');
      },
    });
  }

  continueAfterReveal(): void {
    if (this.submitting) return;
    this.formError = '';
    const remark = String(this.loginForm.get('remark')?.value || '').trim();
    if (!remark) {
      this.loginForm.get('remark')?.markAsTouched();
      this.formError = 'Please enter Reason/Remarks to continue.';
      return;
    }
    if (!this.revealedOfficer || !this.revealedKey) {
      this.submitLogin();
      return;
    }

    this.submitting = true;
    const user = this.activityLog.buildUserFromPassKeyOfficer(
      this.revealedOfficer,
      remark,
      this.revealedKey,
    );
    this.recordAndFinish(user);
  }

  copyPassKey(): void {
    if (!this.revealedKey) return;
    navigator.clipboard?.writeText(this.revealedKey).then(
      () => {
        this.copied = true;
        setTimeout(() => (this.copied = false), 2000);
      },
      () => undefined,
    );
  }

  goToForgotFromError(): void {
    this.setView('forgot');
  }

  backToLoginFromPending(): void {
    this.formError = '';
    this.formSuccess = '';
    this.setView('login');
  }

  private showPendingApproval(message?: string, hqEmailSent?: boolean, isReset = false): void {
    this.revealedKey = '';
    this.revealedOfficer = null;
    this.formError = '';
    this.pendingIsReset = isReset;
    this.formSuccess = message ||
      'Pass Key request sent to HQ for approval. The 4-digit code will be issued only after HQ approves.';
    if (hqEmailSent === false) {
      this.formSuccess += ' HQ approval email could not be sent — contact your administrator.';
    }
    this.view = 'pending';
  }

  private showRevealed(
    passKey: string | number | undefined,
    officer: OfficerPassKey | null,
    remark: string,
    message: string,
  ): void {
    const key = this.passKeys.normalizePassKey(passKey);
    if (key.length !== 4) {
      this.formError = 'Pass Key was created but could not be displayed. Use Forgot Pass Key to recover it.';
      this.view = 'login';
      return;
    }
    this.revealedKey = key;
    this.revealedOfficer = officer;
    this.formSuccess = message;
    this.loginForm.patchValue({ pass_key: key, remark });
    this.view = 'revealed';
  }

  private recordAndFinish(user: AdminActivityUser): void {
    this.recordPageAccess(user).subscribe({
      next: () => {
        this.submitting = false;
        this.finishIdentified(user);
      },
      error: (err) => {
        this.submitting = false;
        this.formError = err?.message === 'Page configuration error'
          ? 'Page configuration error. Please refresh and try again.'
          : this.passKeys.errorMessage(err, 'Failed to save your details. Please try again.');
      },
    });
  }

  private finishIdentified(
    user: AdminActivityUser,
    options: { alreadyConfirmed?: boolean } = {},
  ): void {
    this.forceOpen = false;
    if (!options.alreadyConfirmed) {
      this.activityLog.markIdentified(user, this.routePath || undefined);
    } else {
      this.activityLog.storeUser(user, this.routePath || undefined);
    }
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

  /** Always blank Pass Key + Remarks when the identification modal opens. */
  private resetLoginForm(): void {
    this.loginForm.reset({ pass_key: '', remark: '' });
    this.revealedKey = '';
    this.revealedOfficer = null;
    this.copied = false;
    this.pendingIsReset = false;
  }

  private prefillCreateFromAuth(): void {
    const auth = this.getAuthUser();
    // Prefill identity helpers only — never reuse previous page remarks.
    this.createForm.reset({
      emp_name: '',
      emp_designation: '',
      emp_phone_number: '',
      emp_email: auth?.username || '',
      remark: '',
    });
  }

  private getAuthUser(): any | null {
    const raw = localStorage.getItem('isAuthorised');
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed?.data?.[0] ?? null;
    } catch {
      return null;
    }
  }
}
