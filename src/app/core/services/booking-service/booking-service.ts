import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  BookingDetailsResponse,
  BookingModel,
  PaystackInitResponse,
} from '../../../app-model/model';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private http = inject(HttpClient);
  private baseUrl = environment.BASE_URL;

  // POST /bookings/  — direct mode (payment page "direct")
  createBooking(booking: BookingModel): Observable<BookingDetailsResponse> {
    return this.http.post<BookingDetailsResponse>(
      `${this.baseUrl}/bookings/`,
      booking,
    );
  }

  // POST /bookings/{order_id}/pay/paystack
  initPaystack(orderId: string): Observable<PaystackInitResponse> {
    return this.http.post<PaystackInitResponse>(
      `${this.baseUrl}/bookings/${orderId}/pay/paystack`,
      {},
    );
  }

  // POST /bookings/{order_id}/cancel
  cancelBooking(orderId: string): Observable<BookingDetailsResponse> {
    return this.http.post<BookingDetailsResponse>(
      `${this.baseUrl}/bookings/${orderId}/cancel`,
      {},
    );
  }
}
