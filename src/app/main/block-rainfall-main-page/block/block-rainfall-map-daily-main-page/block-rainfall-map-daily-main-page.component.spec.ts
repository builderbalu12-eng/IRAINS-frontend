import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockRainfallMapDailyMainPageComponent } from './block-rainfall-map-daily-main-page.component';

describe('BlockRainfallMapDailyMainPageComponent', () => {
  let component: BlockRainfallMapDailyMainPageComponent;
  let fixture: ComponentFixture<BlockRainfallMapDailyMainPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BlockRainfallMapDailyMainPageComponent]
    });
    fixture = TestBed.createComponent(BlockRainfallMapDailyMainPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
