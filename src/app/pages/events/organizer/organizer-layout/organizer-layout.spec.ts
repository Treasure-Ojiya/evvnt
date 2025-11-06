import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizerLayout } from './organizer-layout';

describe('OrganizerLayout', () => {
  let component: OrganizerLayout;
  let fixture: ComponentFixture<OrganizerLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizerLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrganizerLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
