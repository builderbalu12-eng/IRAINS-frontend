import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalculationExclusionComponent } from './calculation-exclusion.component';

describe('CalculationExclusionComponent', () => {
  let component: CalculationExclusionComponent;
  let fixture: ComponentFixture<CalculationExclusionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CalculationExclusionComponent]
    });
    fixture = TestBed.createComponent(CalculationExclusionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
