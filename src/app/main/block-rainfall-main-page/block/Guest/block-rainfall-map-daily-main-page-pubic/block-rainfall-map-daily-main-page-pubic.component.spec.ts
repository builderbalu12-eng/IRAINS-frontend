import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockRainfallMapDailyMainPagePubicComponent } from './block-rainfall-map-daily-main-page-pubic.component';

describe('BlockRainfallMapDailyMainPagePubicComponent', () => {
  let component: BlockRainfallMapDailyMainPagePubicComponent;
  let fixture: ComponentFixture<BlockRainfallMapDailyMainPagePubicComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BlockRainfallMapDailyMainPagePubicComponent]
    });
    fixture = TestBed.createComponent(BlockRainfallMapDailyMainPagePubicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
