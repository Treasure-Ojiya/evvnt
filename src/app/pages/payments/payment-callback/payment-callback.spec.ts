import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentCallback } from './payment-callback';

describe('PaymentCallback', () => {
  let component: PaymentCallback;
  let fixture: ComponentFixture<PaymentCallback>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentCallback]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentCallback);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
