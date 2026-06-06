import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageListings } from './manage-listings';

describe('ManageListings', () => {
  let component: ManageListings;
  let fixture: ComponentFixture<ManageListings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageListings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageListings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
