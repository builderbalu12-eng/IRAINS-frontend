import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DistrictDailySpatialComponent } from './district-daily-spatial.component';

describe('DistrictDailySpatialComponent', () => {
  let component: DistrictDailySpatialComponent;
  let fixture: ComponentFixture<DistrictDailySpatialComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DistrictDailySpatialComponent]
    });
    fixture = TestBed.createComponent(DistrictDailySpatialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
