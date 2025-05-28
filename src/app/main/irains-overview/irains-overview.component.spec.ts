import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IrainsOverviewComponent } from './irains-overview.component';

describe('IrainsOverviewComponent', () => {
  let component: IrainsOverviewComponent;
  let fixture: ComponentFixture<IrainsOverviewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [IrainsOverviewComponent]
    });
    fixture = TestBed.createComponent(IrainsOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
