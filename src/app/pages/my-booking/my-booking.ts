import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import {
  TicketPickerData,
  TicketPickerModal,
  TicketPickerResult,
} from '../../shared/modals/ticket-picker-modal/ticket-picker-modal';
import { BookingService } from '../../core/services/booking-service/booking-service';
import { BookingDetailsResponse } from '../../app-model/model';

@Component({
  selector: 'app-my-booking',
  imports: [DatePipe, RouterLink],
  templateUrl: './my-booking.html',
  styleUrl: './my-booking.css',
})
export class MyBooking implements OnInit {
  private bookingService = inject(BookingService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  // =========================
  // State
  // =========================

  bookings = signal<BookingDetailsResponse[]>([]);
  isLoading = signal(true);
  loadError = signal('');

  // =========================
  // Derived lists
  // =========================

  // Bookings that are not cancelled, for events that have not happened yet.
  // Soonest first. Pending (saved, not yet paid) bookings are included.
  upcoming = computed(() => {
    const startOfToday = this.startOfToday();

    return this.bookings()
      .filter((b) => this.isActive(b, startOfToday))
      .sort((a, b) => a.event.event_date.localeCompare(b.event.event_date));
  });

  // =========================
  // Lifecycle
  // =========================

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.isLoading.set(true);
    this.loadError.set('');

    this.bookingService.getBookings().subscribe({
      next: (bookings) => {
        this.bookings.set(bookings);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load bookings:', error);
        this.loadError.set(
          'We could not load your bookings. Please try again.',
        );
        this.isLoading.set(false);
      },
    });
  }

  // =========================
  // Actions
  // =========================

  // Asks which ticket type and how many, then opens the payment page.
  proceedToPayment(booking: BookingDetailsResponse): void {
    this.dialog
      .open<TicketPickerModal, TicketPickerData, TicketPickerResult>(
        TicketPickerModal,
        {
          data: {
            eventId: booking.event.uuid,
            eventTitle: booking.event.title,
            ticketTypeId: booking.ticket_type_id,
            quantity: booking.quantity,
          },
          width: '480px',
          maxWidth: '94vw',
          autoFocus: 'dialog',
        },
      )
      .afterClosed()
      .subscribe((choice) => {
        if (!choice) {
          return;
        }

        this.router.navigate(['/payment'], {
          queryParams: {
            event: booking.event.uuid,
            ticket: choice.ticketTypeId,
            qty: choice.quantity,
            booking: booking.uuid,
          },
        });
      });
  }

  // =========================
  // Template helpers
  // =========================

  // A pending booking can go on to payment (or confirmation, if it is free).
  canPay(booking: BookingDetailsResponse): boolean {
    return booking.status.toLowerCase() === 'pending';
  }

  payLabel(booking: BookingDetailsResponse): string {
    return booking.is_free ? 'Confirm spot' : 'Proceed to payment';
  }

  formatAmount(booking: BookingDetailsResponse): string {
    return booking.is_free
      ? 'Free'
      : `₦${booking.total_amount.toLocaleString('en-NG')}`;
  }

  month(iso: string): string {
    return new Date(iso).toLocaleDateString('en-NG', { month: 'short' });
  }

  day(iso: string): string {
    return String(new Date(iso).getDate());
  }

  // =========================
  // Private helpers
  // =========================

  private startOfToday(): Date {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private isActive(
    booking: BookingDetailsResponse,
    startOfToday: Date,
  ): boolean {
    return (
      booking.status.toLowerCase() !== 'cancelled' &&
      new Date(booking.event.event_date) >= startOfToday
    );
  }
}
