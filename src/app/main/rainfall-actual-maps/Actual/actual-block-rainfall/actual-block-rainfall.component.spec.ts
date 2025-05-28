import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActualBlockRainfallComponent } from './actual-block-rainfall.component';

describe('ActualBlockRainfallComponent', () => {
  let component: ActualBlockRainfallComponent;
  let fixture: ComponentFixture<ActualBlockRainfallComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ActualBlockRainfallComponent]
    });
    fixture = TestBed.createComponent(ActualBlockRainfallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
