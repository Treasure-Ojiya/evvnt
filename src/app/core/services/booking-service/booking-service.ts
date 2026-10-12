import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  BookingDetailsResponse,
  BookingModel,
  BookingPayment,
} from '../../../app-model/model';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  constructor(private http: HttpClient) {}

  private baseUrl = environment.BASE_URL;

  createBooking(booking: BookingModel): Observable<BookingDetailsResponse> {
    return this.http.post<BookingDetailsResponse>(
      `${this.baseUrl}/bookings/`,
      booking,
    );
  }

  getBookings(): Observable<BookingDetailsResponse[]> {
    return this.http.get<BookingDetailsResponse[]>(
      `${this.baseUrl}/bookings/me`,
    );
  }

  cancelBooking(orderId: string): Observable<BookingDetailsResponse> {
    return this.http.post<BookingDetailsResponse>(
      `${this.baseUrl}/bookings/${orderId}/cancel`,
      {},
    );
  }

  bookingPayment(orderId: string): Observable<BookingPayment> {
    return this.http.post<BookingPayment>(
      `${this.baseUrl}/bookings/${orderId}/payment`,
      {},
    );
  }
}
