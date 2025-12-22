import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonsoonActivityComponent } from './monsoon-activity.component';

describe('MonsoonActivityComponent', () => {
  let component: MonsoonActivityComponent;
  let fixture: ComponentFixture<MonsoonActivityComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MonsoonActivityComponent]
    });
    fixture = TestBed.createComponent(MonsoonActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
