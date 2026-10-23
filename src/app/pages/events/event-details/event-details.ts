import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter, switchMap } from 'rxjs';
import { EventModel, EventTicketTypeModel } from '../../../app-model/model';
import { ExploreService } from '../../../core/services/explore-service/explore-service';
import { BookingService } from '../../../core/services/booking-service/booking-service';
import { CartService } from '../../../core/services/cart-service/cart-service';
import { AuthService } from '../../../core/services/auth-service/auth-service';
import { UserService } from '../../../core/services/user-service/user-service';
import { OrganizerService } from '../../../core/services/organizer-service/organizer-service';
import { ToastService } from '../../../core/services/toast-service/toast-service';

const MAX_PER_ORDER = 10;

@Component({
  selector: 'app-event-details',
  imports: [DatePipe, NgClass, RouterLink],
  templateUrl: './event-details.html',
  styleUrl: './event-details.css',
})
export class EventDetails {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private exploreService = inject(ExploreService);
  private cartService = inject(CartService);
  private bookingService = inject(BookingService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private organizerService = inject(OrganizerService);
  private toastService = inject(ToastService);

  // =========================
  // State
  // =========================

  event = signal<EventModel | null>(null);
  isLoading = signal(true);
  loadError = signal('');

  selectedTicketId = signal<string | null>(null);
  quantity = signal(1);

  // True while the event is being saved to queue.
  isQueueing = signal(false);
  linkCopied = signal(false);

  isLoggedIn = toSignal(this.authService.isLoggedIn$, { initialValue: false });

  // Organizer tools (publish, add photos)
  currentUserId = signal<string | null>(null);
  isPublishing = signal(false);
  ownerError = signal('');

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = params.get('id');

      if (id) {
        this.loadEvent(id);
      }
    });

    // Only ask who the user is once they are logged in.
    this.authService.isLoggedIn$
      .pipe(
        filter((loggedIn) => loggedIn),
        switchMap(() => this.userService.getUser()),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (user) => this.currentUserId.set(user.uuid),
        error: (error) =>
          console.error('Could not load the current user:', error),
      });
  }

  // =========================
  // Derived state
  // =========================

  coverImage = computed(() => this.event()?.image_url ?? '');

  isOwner = computed(() => {
    const userId = this.currentUserId();
    return !!userId && userId === this.event()?.organizer?.uuid;
  });

  tickets = computed(() => this.event()?.ticket_types ?? []);

  selectedTicket = computed(
    () =>
      this.tickets().find((t) => t.uuid === this.selectedTicketId()) ?? null,
  );

  maxQuantity = computed(() => {
    const available = this.selectedTicket()?.available_quantity ?? 0;
    return Math.max(1, Math.min(MAX_PER_ORDER, available));
  });

  total = computed(() => (this.selectedTicket()?.price ?? 0) * this.quantity());

  // People who already have a ticket, summed across ticket types.
  goingCount = computed(() =>
    this.tickets().reduce((sum, t) => sum + t.sold_quantity, 0),
  );

  isPast = computed(() => {
    const date = this.event()?.event_date;
    return !!date && new Date(date).getTime() < Date.now();
  });

  isFreeEvent = computed(() => this.event()?.event_type === 'free');

  startingPrice = computed(() => {
    const prices = this.tickets()
      .filter((t) => t.available_quantity > 0)
      .map((t) => t.price);

    return prices.length ? Math.min(...prices) : null;
  });

  canBook = computed(
    () =>
      !this.isPast() &&
      // !this.isQueueing() &&
      !!this.selectedTicket() &&
      (this.selectedTicket()?.available_quantity ?? 0) > 0,
  );

  ctaLabel = computed(() => {
    if (this.isPast()) {
      return 'This event has ended';
    }

    if (this.tickets().length === 0) {
      return 'Booking not open yet';
    }

    if (!this.selectedTicket()) {
      return 'Sold out';
    }

    if (!this.isLoggedIn()) {
      return 'Sign in to continue';
    }

    return this.total() === 0
      ? 'Reserve my spot'
      : `Continue to payment · ${this.formatPrice(this.total())}`;
  });

  mapsUrl = computed(() => {
    const location = this.event()?.location;

    return location
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
      : '';
  });

  // =========================
  // Loading
  // =========================

  loadEvent(id: string): void {
    this.isLoading.set(true);
    this.loadError.set('');

    this.exploreService.getEvent(id).subscribe({
      next: (event) => {
        this.event.set(event);

        // Preselect the first ticket that is still available.
        const first = event.ticket_types.find((t) => t.available_quantity > 0);
        this.selectedTicketId.set(first?.uuid ?? null);
        this.quantity.set(1);

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load event:', error);
        this.loadError.set(
          error?.status === 404
            ? 'We could not find this event. It may have been removed.'
            : 'We could not load this event right now. Please try again.',
        );
        this.isLoading.set(false);
      },
    });
  }

  retry(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.loadEvent(id);
    }
  }

  // =========================
  // Ticket selection
  // =========================

  selectTicket(ticket: EventTicketTypeModel): void {
    if (ticket.available_quantity <= 0) {
      return;
    }

    this.selectedTicketId.set(ticket.uuid);
    this.quantity.set(Math.min(this.quantity(), this.maxQuantityFor(ticket)));
  }

  changeQuantity(delta: number): void {
    const next = this.quantity() + delta;
    this.quantity.set(Math.min(this.maxQuantity(), Math.max(1, next)));
  }

  // =========================
  // Payment and saving for later
  // =========================

  // ---- Direct to payment (bypasses cart entirely) ----
  goToPayment(): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/auth/authentication']);
      return;
    }
    const event = this.event();
    const ticket = this.selectedTicket();
    if (!event || !ticket || !this.canBook()) return;

    this.router.navigate(['/payment'], {
      queryParams: {
        event: event.uuid,
        ticket: ticket.uuid,
        qty: this.quantity(),
      },
    });
  }

  // ---- Keep for later (only this one touches the cart) ----
  saveForLater(): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/auth/authentication']);
      return;
    }
    const event = this.event();
    const ticket = this.selectedTicket();
    if (!event || !ticket || !this.canBook()) return;

    this.isQueueing.set(true);

    this.cartService
      .addToCart({
        event_id: event.uuid,
        ticket_type_id: ticket.uuid,
        quantity: this.quantity(),
      })
      .subscribe({
        next: () => {
          this.isQueueing.set(false);
          this.toastService.show(
            'Added to your queue. You can pay for it any time.',
            'success',
            4000,
          );
        },
        error: (error) => {
          this.isQueueing.set(false);
          this.toastService.show(
            typeof error?.error?.detail === 'string'
              ? error.error.detail
              : 'We could not add this to your queue. Please try again.',
            'error',
            5000,
          );
        },
      });
  }
  // =========================
  // Organizer tools
  // =========================

  publish(): void {
    const event = this.event();

    if (!event) {
      return;
    }

    this.isPublishing.set(true);
    this.ownerError.set('');

    this.organizerService.publishEvent(event.uuid).subscribe({
      next: (updated) => {
        this.event.set(updated);
        this.isPublishing.set(false);
      },
      error: (error) => {
        console.error('Publish failed:', error);
        this.ownerError.set(
          error?.error?.message ??
            'Could not publish this event. Please try again.',
        );
        this.isPublishing.set(false);
      },
    });
  }

  statusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  scrollToTickets(): void {
    document
      .getElementById('tickets')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async share(): Promise<void> {
    const url = window.location.href;
    const title = this.event()?.title ?? 'EVVNT event';

    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }

      await navigator.clipboard.writeText(url);
      this.linkCopied.set(true);
      setTimeout(() => this.linkCopied.set(false), 2000);
    } catch {
      // The person dismissed the share sheet, nothing to do.
    }
  }

  // =========================
  // Template helpers
  // =========================

  formatPrice(amount: number): string {
    return amount === 0 ? 'Free' : `₦${amount.toLocaleString('en-NG')}`;
  }

  isSoldOut(ticket: EventTicketTypeModel): boolean {
    return ticket.available_quantity <= 0;
  }

  isFewLeft(ticket: EventTicketTypeModel): boolean {
    return (
      !this.isSoldOut(ticket) &&
      ticket.available_quantity <= Math.max(5, ticket.total_quantity * 0.1)
    );
  }

  day(iso: string): string {
    return String(new Date(iso).getDate());
  }

  private maxQuantityFor(ticket: EventTicketTypeModel): number {
    return Math.max(1, Math.min(MAX_PER_ORDER, ticket.available_quantity));
  }
}
