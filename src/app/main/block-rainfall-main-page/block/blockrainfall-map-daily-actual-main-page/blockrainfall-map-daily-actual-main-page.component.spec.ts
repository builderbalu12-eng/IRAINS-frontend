import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockrainfallMapDailyActualMainPageComponent } from './blockrainfall-map-daily-actual-main-page.component';

describe('BlockrainfallMapDailyActualMainPageComponent', () => {
  let component: BlockrainfallMapDailyActualMainPageComponent;
  let fixture: ComponentFixture<BlockrainfallMapDailyActualMainPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BlockrainfallMapDailyActualMainPageComponent]
    });
    fixture = TestBed.createComponent(BlockrainfallMapDailyActualMainPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
