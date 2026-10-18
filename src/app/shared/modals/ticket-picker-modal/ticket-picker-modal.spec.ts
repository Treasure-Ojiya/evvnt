import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketPickerModal } from './ticket-picker-modal';

describe('TicketPickerModal', () => {
  let component: TicketPickerModal;
  let fixture: ComponentFixture<TicketPickerModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketPickerModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TicketPickerModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
