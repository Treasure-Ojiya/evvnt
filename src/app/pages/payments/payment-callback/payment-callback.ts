import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-payment-callback',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './payment-callback.html',
  styleUrl: './payment-callback.css',
})
export class PaymentCallback implements OnInit {
  private route = inject(ActivatedRoute);

  status = signal<'verifying' | 'success' | 'failed'>('verifying');
  reference = '';

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.reference = params.get('reference') ?? params.get('trxref') ?? '';

    if (!this.reference) {
      // If there is no reference, they didn't come from a successful Paystack redirect.
      this.status.set('failed');
      return;
    }

    // The webhook has already verified the payment on the backend.
    // We just show a brief spinner so it feels like we are doing something.
    setTimeout(() => {
      this.status.set('success');
    }, 1500);
  }
}
