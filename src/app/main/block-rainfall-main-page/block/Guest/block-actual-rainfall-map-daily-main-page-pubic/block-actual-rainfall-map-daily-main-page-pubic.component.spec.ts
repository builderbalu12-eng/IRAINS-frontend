import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockActualRainfallMapDailyMainPagePubicComponent } from './block-actual-rainfall-map-daily-main-page-pubic.component';

describe('BlockActualRainfallMapDailyMainPagePubicComponent', () => {
  let component: BlockActualRainfallMapDailyMainPagePubicComponent;
  let fixture: ComponentFixture<BlockActualRainfallMapDailyMainPagePubicComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BlockActualRainfallMapDailyMainPagePubicComponent]
    });
    fixture = TestBed.createComponent(BlockActualRainfallMapDailyMainPagePubicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
