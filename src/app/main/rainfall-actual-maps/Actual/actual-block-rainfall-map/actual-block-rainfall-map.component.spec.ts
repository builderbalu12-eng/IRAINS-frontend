import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActualBlockRainfallMapComponent } from './actual-block-rainfall-map.component';

describe('ActualBlockRainfallMapComponent', () => {
  let component: ActualBlockRainfallMapComponent;
  let fixture: ComponentFixture<ActualBlockRainfallMapComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ActualBlockRainfallMapComponent]
    });
    fixture = TestBed.createComponent(ActualBlockRainfallMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
