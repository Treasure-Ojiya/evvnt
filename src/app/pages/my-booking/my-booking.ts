import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, NgClass, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { EventCard } from '../../shared/components/event-card/event-card';
import { BookingService } from '../../core/services/booking-service/booking-service';
import { BookingDetailsResponse } from '../../app-model/model';

@Component({
  selector: 'app-my-booking',
  imports: [DatePipe, NgClass, NgTemplateOutlet, RouterLink],
  templateUrl: './my-booking.html',
  styleUrl: './my-booking.css',
})
export class MyBooking implements OnInit {
  private bookingService = inject(BookingService);
  private dialog = inject(MatDialog);

  // =========================
  // State
  // =========================

  bookings = signal<BookingDetailsResponse[]>([]);
  isLoading = signal(true);
  loadError = signal('');
  actionError = signal('');

  // Booking ids with an action in progress.
  confirmingId = signal<string | null>(null);
  cancellingId = signal<string | null>(null);
  payingId = signal<string | null>(null);

  // =========================
  // Derived lists
  // =========================

  // Not cancelled, and the event has not happened yet. Soonest first.
  upcoming = computed(() => {
    const startOfToday = this.startOfToday();

    return this.bookings()
      .filter((b) => this.isActive(b, startOfToday))
      .sort((a, b) => a.event.event_date.localeCompare(b.event.event_date));
  });

  // Cancelled or already happened. Most recent first.
  past = computed(() => {
    const startOfToday = this.startOfToday();

    return this.bookings()
      .filter((b) => !this.isActive(b, startOfToday))
      .sort((a, b) => b.event.event_date.localeCompare(a.event.event_date));
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

  openDetails(booking: BookingDetailsResponse): void {
    // Mapped to the shape EventCard already expects.
    this.dialog.open(EventCard, {
      data: {
        id: booking.event.uuid,
        title: booking.event.title,
        date: new Date(booking.event.event_date),
        image: booking.event.images[0] ?? '',
        price: booking.is_free ? 0 : booking.total_amount,
        description: '',
      },
      width: '500px',
      panelClass: 'event-dialog',
    });
  }

  askCancel(booking: BookingDetailsResponse): void {
    this.actionError.set('');
    this.confirmingId.set(booking.uuid);
  }

  keepBooking(): void {
    this.confirmingId.set(null);
  }

  confirmCancel(booking: BookingDetailsResponse): void {
    this.cancellingId.set(booking.uuid);
    this.actionError.set('');

    this.bookingService.cancelBooking(booking.uuid).subscribe({
      next: (updated) => {
        // Swap in the updated booking instead of refetching the list.
        this.bookings.update((list) =>
          list.map((b) => (b.uuid === updated.uuid ? updated : b)),
        );
        this.cancellingId.set(null);
        this.confirmingId.set(null);
      },
      error: (error) => {
        console.error('Cancel failed:', error);
        this.actionError.set(
          error?.error?.message ??
            'Could not cancel this booking. Please try again.',
        );
        this.cancellingId.set(null);
      },
    });
  }

  proceedToPayment(booking: BookingDetailsResponse): void {
    this.payingId.set(booking.uuid);
    this.actionError.set('');

    this.bookingService.bookingPayment(booking.uuid).subscribe({
      next: (payment) => {
        console.log('Payment started:', payment);

        // TODO: hand payment.reference / payment.provider to your payment
        // flow (redirect or inline checkout), then reload on return.
        this.payingId.set(null);
        this.loadBookings();
      },
      error: (error) => {
        console.error('Payment failed to start:', error);
        this.actionError.set(
          error?.error?.message ?? 'Could not start payment. Please try again.',
        );
        this.payingId.set(null);
      },
    });
  }

  // =========================
  // Template helpers
  // =========================

  canPay(booking: BookingDetailsResponse): boolean {
    return booking.status.toLowerCase() === 'pending' && !booking.is_free;
  }

  formatAmount(booking: BookingDetailsResponse): string {
    return booking.is_free
      ? 'Free'
      : `₦${booking.total_amount.toLocaleString('en-NG')}`;
  }

  statusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  // Orange = pending, teal = confirmed/paid, gray = anything else.
  statusClasses(status: string): string {
    const value = status.toLowerCase();

    if (value === 'pending') {
      return 'bg-[#FF6B35]/10 text-[#B34700]';
    }

    if (['paid', 'confirmed', 'completed', 'success'].includes(value)) {
      return 'bg-[#00BFA6]/10 text-[#00806e]';
    }

    return 'bg-gray-100 text-gray-500';
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
