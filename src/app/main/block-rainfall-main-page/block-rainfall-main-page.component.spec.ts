import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockRainfallMainPageComponent } from './block-rainfall-main-page.component';

describe('BlockRainfallMainPageComponent', () => {
  let component: BlockRainfallMainPageComponent;
  let fixture: ComponentFixture<BlockRainfallMainPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BlockRainfallMainPageComponent]
    });
    fixture = TestBed.createComponent(BlockRainfallMainPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
