import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-new-register',
  templateUrl: './new-register.component.html',
  styleUrls: ['./new-register.component.css']
})
export class NewRegisterComponent implements OnInit {
  form!: FormGroup;
  isSaving = false;
  success = '';
  error = '';
  showPassword = false;

  roles = ['HQ Admin', 'MC User', 'SP User', 'Public'];
  regions = ['North West', 'North East', 'Central India', 'South Peninsular', 'East & North East'];

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.form = this.fb.group({
      fullName:    ['', [Validators.required, Validators.minLength(3)]],
      email:       ['', [Validators.required, Validators.email]],
      username:    ['', [Validators.required, Validators.minLength(4)]],
      password:    ['', [Validators.required, Validators.minLength(8)]],
      role:        ['', Validators.required],
      region:      [''],
      designation: [''],
      phone:       [''],
      active:      [true]
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSaving = true;
    this.success = '';
    this.error = '';
    setTimeout(() => {
      this.success = `User "${this.form.value.username}" registered successfully.`;
      this.form.reset({ active: true });
      this.isSaving = false;
    }, 800);
  }

  get f() { return this.form.controls; }
}
