import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeeklyDistrictSpatialComponent } from './weekly-district-spatial.component';

describe('WeeklyDistrictSpatialComponent', () => {
  let component: WeeklyDistrictSpatialComponent;
  let fixture: ComponentFixture<WeeklyDistrictSpatialComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WeeklyDistrictSpatialComponent]
    });
    fixture = TestBed.createComponent(WeeklyDistrictSpatialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
