import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CummulativeDistrictSpatialComponent } from './cummulative-district-spatial.component';

describe('CummulativeDistrictSpatialComponent', () => {
  let component: CummulativeDistrictSpatialComponent;
  let fixture: ComponentFixture<CummulativeDistrictSpatialComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CummulativeDistrictSpatialComponent]
    });
    fixture = TestBed.createComponent(CummulativeDistrictSpatialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
