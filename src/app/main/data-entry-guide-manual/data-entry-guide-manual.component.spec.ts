import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataEntryGuideManualComponent } from './data-entry-guide-manual.component';

describe('DataEntryGuideManualComponent', () => {
  let component: DataEntryGuideManualComponent;
  let fixture: ComponentFixture<DataEntryGuideManualComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DataEntryGuideManualComponent]
    });
    fixture = TestBed.createComponent(DataEntryGuideManualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
