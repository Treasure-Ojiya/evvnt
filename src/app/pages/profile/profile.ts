import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../../core/services/user-service/user-service';
import { DatePipe } from '../../shared/pipes/date-pipe';
import { BookingService } from '../../core/services/booking-service/booking-service';
import { BookingDetailsResponse } from '../../app-model/model';

type ProfileTab = 'overview' | 'bookings' | 'saved' | 'following';

@Component({
  selector: 'app-profile',
  imports: [DatePipe, NgClass, NgTemplateOutlet, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private userService = inject(UserService);
  private bookingService = inject(BookingService);

  firstName = '';
  lastName = '';
  email = '';
  phone = '';
  createdAt = '';

  // Placeholder until the API provides it.
  location = 'Lagos, Nigeria';

  // =========================
  // Tabs
  // =========================

  activeTab: ProfileTab = 'overview';

  tabs: { id: ProfileTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'bookings', label: 'Bookings' },
    // { id: 'saved', label: 'Saved' },
    // { id: 'following', label: 'Following' },
  ];

  get activeTabLabel(): string {
    return this.tabs.find((tab) => tab.id === this.activeTab)?.label ?? '';
  }

  // =========================
  // Placeholder data (replace with API data later)
  // =========================

  stats = [
    { value: 12, label: 'Events attended' },
    { value: 8, label: 'Saved' },
    { value: 14, label: 'Following' },
  ];

  // =========================
  // Bookings (API)
  // =========================
  // A booking works like a reservation: it is made now and paid for later,
  // so pending bookings show up here too.

  bookings = signal<BookingDetailsResponse[]>([]);
  bookingsLoading = signal(true);
  bookingsError = signal('');

  // Next few bookings that are not cancelled and have not happened yet.
  upcomingBookings = computed(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return this.bookings()
      .filter(
        (b) =>
          b.status.toLowerCase() !== 'cancelled' &&
          new Date(b.event.event_date) >= startOfToday,
      )
      .sort((a, b) => a.event.event_date.localeCompare(b.event.event_date))
      .slice(0, 4);
  });

  // Every booking, soonest first, for the Bookings tab.
  allBookings = computed(() =>
    [...this.bookings()].sort((a, b) =>
      b.event.event_date.localeCompare(a.event.event_date),
    ),
  );

  recent = [
    {
      title: 'Art Exhibition',
      place: 'Lekki, Lagos',
      image: 'assets/images/event-3.jpg',
    },
    {
      title: 'Food & Culture Festival',
      place: 'Ikeja, Lagos',
      image: 'assets/images/event-4.jpg',
    },
    {
      title: 'Creative Workshop',
      place: 'Yaba, Lagos',
      image: 'assets/images/event-5.jpg',
    },
  ];

  saved = [
    {
      title: 'Theatre Production',
      place: 'Lagos, Nigeria',
      image: 'assets/images/event-6.jpg',
    },
    {
      title: 'Afrobeat Live',
      place: 'Lagos, Nigeria',
      image: 'assets/images/event-7.jpg',
    },
  ];

  // =========================
  // Lifecycle
  // =========================

  ngOnInit(): void {
    this.userDetails();
    this.loadBookings();
  }

  loadBookings(): void {
    this.bookingsLoading.set(true);
    this.bookingsError.set('');

    this.bookingService.getBookings().subscribe({
      next: (bookings) => {
        this.bookings.set(bookings);
        this.bookingsLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load bookings:', error);
        this.bookingsError.set('We could not load your bookings.');
        this.bookingsLoading.set(false);
      },
    });
  }

  // =========================
  // Booking row helpers
  // =========================

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

  statusLabel(booking: BookingDetailsResponse): string {
    const status = booking.status.toLowerCase();

    if (status === 'pending') {
      return booking.is_free ? 'Reserved' : 'Awaiting payment';
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  // Yellow = pending, green = confirmed or paid, gray = anything else.
  statusClasses(booking: BookingDetailsResponse): string {
    const status = booking.status.toLowerCase();

    if (status === 'pending') {
      return 'bg-accent/20 text-accent-dark';
    }

    if (['paid', 'confirmed', 'completed', 'success'].includes(status)) {
      return 'bg-success/10 text-success-dark';
    }

    return 'bg-gray-100 text-gray-500';
  }

  userDetails(): void {
    this.userService.getUser().subscribe({
      next: (user) => {
        this.firstName = user.first_name;
        this.lastName = user.last_name;
        this.email = user.email;
        this.phone = user.phone;
        this.createdAt = user.created_at;
      },
      error: (error) => {
        console.error('Error fetching user details:', error);
      },
    });
  }

  createInitials(): string {
    const firstInitial = this.firstName
      ? this.firstName.charAt(0).toUpperCase()
      : '';
    const lastInitial = this.lastName
      ? this.lastName.charAt(0).toUpperCase()
      : '';
    return firstInitial + lastInitial;
  }
}
