import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockRainfallMapActualOrgawsMainPageComponent } from './block-rainfall-map-actual-orgaws-main-page.component';

describe('BlockRainfallMapActualOrgawsMainPageComponent', () => {
  let component: BlockRainfallMapActualOrgawsMainPageComponent;
  let fixture: ComponentFixture<BlockRainfallMapActualOrgawsMainPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BlockRainfallMapActualOrgawsMainPageComponent]
    });
    fixture = TestBed.createComponent(BlockRainfallMapActualOrgawsMainPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
