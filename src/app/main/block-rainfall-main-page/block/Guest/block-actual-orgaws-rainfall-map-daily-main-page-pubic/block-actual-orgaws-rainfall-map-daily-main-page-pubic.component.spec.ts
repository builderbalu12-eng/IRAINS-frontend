import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockActualOrgawsRainfallMapDailyMainPagePubicComponent } from './block-actual-orgaws-rainfall-map-daily-main-page-pubic.component';

describe('BlockActualOrgawsRainfallMapDailyMainPagePubicComponent', () => {
  let component: BlockActualOrgawsRainfallMapDailyMainPagePubicComponent;
  let fixture: ComponentFixture<BlockActualOrgawsRainfallMapDailyMainPagePubicComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BlockActualOrgawsRainfallMapDailyMainPagePubicComponent]
    });
    fixture = TestBed.createComponent(BlockActualOrgawsRainfallMapDailyMainPagePubicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
