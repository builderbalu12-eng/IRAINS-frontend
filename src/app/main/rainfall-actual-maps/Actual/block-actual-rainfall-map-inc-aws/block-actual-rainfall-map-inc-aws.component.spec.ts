import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockActualRainfallMapIncAwsComponent } from './block-actual-rainfall-map-inc-aws.component';

describe('BlockActualRainfallMapIncAwsComponent', () => {
  let component: BlockActualRainfallMapIncAwsComponent;
  let fixture: ComponentFixture<BlockActualRainfallMapIncAwsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BlockActualRainfallMapIncAwsComponent]
    });
    fixture = TestBed.createComponent(BlockActualRainfallMapIncAwsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
