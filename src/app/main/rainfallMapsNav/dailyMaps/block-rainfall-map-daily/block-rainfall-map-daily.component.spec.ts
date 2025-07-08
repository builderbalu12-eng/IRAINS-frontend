import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockRainfallMapDailyComponent } from './block-rainfall-map-daily.component';

describe('BlockRainfallMapDailyComponent', () => {
  let component: BlockRainfallMapDailyComponent;
  let fixture: ComponentFixture<BlockRainfallMapDailyComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BlockRainfallMapDailyComponent]
    });
    fixture = TestBed.createComponent(BlockRainfallMapDailyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
