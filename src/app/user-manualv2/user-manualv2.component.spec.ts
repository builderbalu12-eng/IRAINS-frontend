import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserManualv2Component } from './user-manualv2.component';

describe('UserManualv2Component', () => {
  let component: UserManualv2Component;
  let fixture: ComponentFixture<UserManualv2Component>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserManualv2Component]
    });
    fixture = TestBed.createComponent(UserManualv2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
