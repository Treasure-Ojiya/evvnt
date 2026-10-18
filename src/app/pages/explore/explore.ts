import {
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from '@angular/core/rxjs-interop';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  forkJoin,
  map,
  of,
  Subject,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

import {
  EventCategories,
  EventListFilters,
  EventListItem,
  EventModel,
  EventTicketTypeModel,
} from '../../app-model/model';
import { CreateService } from '../../core/services/create-service/create-service';
import { ExploreService } from '../../core/services/explore-service/explore-service';
import { BookingService } from '../../core/services/booking-service/booking-service';
import { AuthService } from '../../core/services/auth-service/auth-service';

type DateRange = 'any' | 'today' | 'week' | 'weekend' | 'month';
type PriceFilter = 'any' | 'free' | 'paid';
type SortKey = 'soonest' | 'popular';

interface FilterChip {
  label: string;
  clear: () => void;
}

@Component({
  selector: 'app-explore',
  imports: [NgClass, RouterLink],
  templateUrl: './explore.html',
  styleUrl: './explore.css',
})
export class Explore {
  constructor() {
    console.log('EXPLORE COMPONENT CREATED');

    this.loadCategories();
    this.listenToQueryParams();
    this.listenForEventRequests();
    this.loadMyBookedEvents();

    // Typing updates the URL after a short pause; the URL then drives the list.
    this.searchTyped$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((value) => this.pushSearch(value));

    // Any change to what is listed starts the list from the first page again.
    effect(() => {
      this.dateRange();
      this.sort();
      this.events();

      untracked(() => this.visibleCount.set(this.pageSize));
    });
  }

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private exploreService = inject(ExploreService);
  private createService = inject(CreateService);
  private bookingService = inject(BookingService);
  private authService = inject(AuthService);

  isLoggedIn = toSignal(this.authService.isLoggedIn$, { initialValue: false });

  // =========================
  // Filter state
  // =========================

  query = signal('');

  // What is typed in the page's own search box. It is kept apart from `query`
  // (which comes from the URL) so typing is never overwritten while the URL
  // catches up.
  searchText = signal('');
  private lastPushedSearch = '';
  private searchTyped$ = new Subject<string>();
  dateRange = signal<DateRange>('any');
  categoryId = signal('');
  price = signal<PriceFilter>('any');
  featuredOnly = signal(false);
  sort = signal<SortKey>('soonest');

  failedImages = signal<string[]>([]);

  bookingId = signal<string | null>(null);
  bookedEventIds = signal<string[]>([]);
  bookingMessages = signal<Record<string, string>>({});

  startingPrices = signal<Record<string, number>>({});

  mobileFiltersOpen = signal(false);

  readonly pageSize = 12;
  visibleCount = signal(this.pageSize);

  justBooked = signal<{ title: string; free: boolean } | null>(null);

  events = signal<EventListItem[]>([]);
  isLoading = signal(true);
  eventsError = signal('');
  private retryNonce = signal(0);

  categories = signal<EventCategories[]>([]);

  readonly dateOptions: { id: DateRange; label: string }[] = [
    { id: 'any', label: 'Any time' },
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'Next 7 days' },
    { id: 'weekend', label: 'This weekend' },
    { id: 'month', label: 'This month' },
  ];

  readonly priceOptions: { id: PriceFilter; label: string }[] = [
    { id: 'any', label: 'Any price' },
    { id: 'free', label: 'Free' },
    { id: 'paid', label: 'Paid' },
  ];

  readonly sortOptions: { id: SortKey; label: string }[] = [
    { id: 'soonest', label: 'Soonest' },
    { id: 'popular', label: 'Most popular' },
  ];

  categoryOptions = computed(() =>
    this.categories().map((c) => ({ id: c.uuid, name: c.name })),
  );

  visibleEvents = computed(() => {
    const range = this.dateRange();

    const list = this.events().filter((e) =>
      this.matchesDate(e.event_date, range),
    );

    return this.sort() === 'popular'
      ? [...list].sort((a, b) => b.tickets_sold - a.tickets_sold)
      : [...list].sort((a, b) => a.event_date.localeCompare(b.event_date));
  });

  resultCount = computed(() => this.visibleEvents().length);

  shownEvents = computed(() =>
    this.visibleEvents().slice(0, this.visibleCount()),
  );

  hasMore = computed(() => this.shownEvents().length < this.resultCount());

  activeFilters = computed<FilterChip[]>(() => {
    const chips: FilterChip[] = [];

    if (this.query()) {
      chips.push({
        label: `“${this.query()}”`,
        clear: () => this.updateParams({ search: null }),
      });
    }

    if (this.dateRange() !== 'any') {
      const label =
        this.dateOptions.find((o) => o.id === this.dateRange())?.label ?? '';
      chips.push({ label, clear: () => this.setDate('any') });
    }

    if (this.categoryId()) {
      const name =
        this.categoryOptions().find((o) => o.id === this.categoryId())?.name ??
        'Category';
      chips.push({ label: name, clear: () => this.setCategory('') });
    }

    if (this.price() !== 'any') {
      const label =
        this.priceOptions.find((o) => o.id === this.price())?.label ?? '';
      chips.push({ label, clear: () => this.setPrice('any') });
    }

    if (this.featuredOnly()) {
      chips.push({ label: 'Featured', clear: () => this.setFeatured(false) });
    }

    return chips;
  });

  private eventsRequest = computed(() => ({
    filters: {
      search: this.query().trim(),
      category_id: this.categoryId(),
      event_type: this.price() === 'any' ? undefined : this.price(),
      featured: this.featuredOnly(),
    } as EventListFilters,
    nonce: this.retryNonce(),
  }));

  private loadCategories(): void {
    this.createService.getEventCategory().subscribe({
      next: (categories) => this.categories.set(categories),
      error: (error) => console.error('Failed to load categories:', error),
    });
  }

  private listenToQueryParams(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const eventType = params.get('event_type');
      const date = params.get('date');

      const search = params.get('search') ?? '';

      this.query.set(search);

      // A change that did not come from this box (the navbar search, a link,
      // removing the filter chip) updates what the box shows.
      if (search !== this.lastPushedSearch) {
        this.lastPushedSearch = search;
        this.searchText.set(search);
      }
      this.dateRange.set(
        this.dateOptions.some((o) => o.id === date)
          ? (date as DateRange)
          : 'any',
      );
      this.categoryId.set(params.get('category_id') ?? '');
      this.price.set(
        eventType === 'free' || eventType === 'paid' ? eventType : 'any',
      );
      this.featuredOnly.set(params.get('featured') === 'true');
    });
  }

  private listenForEventRequests(): void {
    toObservable(this.eventsRequest)
      .pipe(
        debounceTime(300),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        tap(() => {
          this.isLoading.set(true);
          this.eventsError.set('');
        }),
        switchMap(({ filters }) => {
          console.log('CALLING GET EVENTS WITH:', filters);

          return this.exploreService.getEvents(filters).pipe(
            catchError((error) => {
              console.error('GET EVENTS ERROR:', error);

              this.eventsError.set(
                'We could not load events right now. Please try again.',
              );

              return of<EventListItem[]>([]);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((events) => {
        console.log('EVENTS RESPONSE:', events);

        this.events.set(events);
        this.isLoading.set(false);
        this.loadStartingPrices(events);
      });
  }

  private loadMyBookedEvents(): void {
    this.authService.isLoggedIn$
      .pipe(
        filter((loggedIn) => loggedIn),
        switchMap(() =>
          this.bookingService.getBookings().pipe(catchError(() => of([]))),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((bookings) => {
        const ids = bookings
          .filter((b) => b.status.toLowerCase() !== 'cancelled')
          .map((b) => b.event.uuid);

        this.bookedEventIds.update((current) => [
          ...new Set([...current, ...ids]),
        ]);
      });
  }

  private loadStartingPrices(events: EventListItem[]): void {
    const missing = events
      .filter((e) => e.event_type === 'paid' && e.starting_price == null)
      .filter((e) => this.startingPrices()[e.uuid] === undefined)
      .slice(0, 24);

    if (missing.length === 0) {
      return;
    }

    forkJoin(
      missing.map((e) =>
        this.exploreService.getEvent(e.uuid).pipe(
          map((full) => ({ id: e.uuid, price: this.cheapestTicket(full) })),
          catchError(() => of(null)),
        ),
      ),
    ).subscribe((results) => {
      this.startingPrices.update((current) => {
        const next = { ...current };

        for (const result of results) {
          if (result && result.price !== null) {
            next[result.id] = result.price;
          }
        }

        return next;
      });
    });
  }

  private cheapestTicket(event: EventModel): number | null {
    const available = event.ticket_types.filter(
      (t) => t.available_quantity > 0,
    );
    const pool = available.length ? available : event.ticket_types;

    return pool.length ? Math.min(...pool.map((t) => t.price)) : null;
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.searchText.set(value);
    this.searchTyped$.next(value);
  }

  // Enter searches straight away instead of waiting for the pause.
  onSearchEnter(): void {
    this.pushSearch(this.searchText());
  }

  clearSearchBox(): void {
    this.searchText.set('');
    this.pushSearch('');
  }

  private pushSearch(value: string): void {
    const search = value.trim();

    this.lastPushedSearch = search;
    this.updateParams({ search: search || null });
  }

  onSort(event: Event): void {
    this.sort.set((event.target as HTMLSelectElement).value as SortKey);
  }
  private updateParams(changes: Record<string, string | null>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: changes,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  setDate(range: DateRange): void {
    this.updateParams({ date: range === 'any' ? null : range });
  }

  setCategory(id: string): void {
    this.updateParams({ category_id: id || null });
  }

  setPrice(price: PriceFilter): void {
    this.updateParams({ event_type: price === 'any' ? null : price });
  }

  setFeatured(featured: boolean): void {
    this.updateParams({ featured: featured ? 'true' : null });
  }

  resetFilters(): void {
    this.updateParams({
      date: null,
      category_id: null,
      event_type: null,
      featured: null,
    });
  }

  clearAll(): void {
    this.updateParams({
      search: null,
      date: null,
      category_id: null,
      event_type: null,
      featured: null,
    });
  }

  isBooked(event: EventListItem): boolean {
    return this.bookedEventIds().includes(event.uuid);
  }
  bookNow(event: EventListItem): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/auth/authentication']);
      return;
    }

    if (this.bookingId() !== null || this.isBooked(event)) {
      return;
    }

    this.bookingId.set(event.uuid);
    this.justBooked.set(null);
    this.setBookingMessage(event.uuid, '');

    this.exploreService
      .getEvent(event.uuid)
      .pipe(
        switchMap((full) => {
          if (full.ticket_types.length === 0) {
            return throwError(() => new Error('NO_TICKETS'));
          }

          const ticket = this.cheapestTicketType(full);

          if (!ticket) {
            return throwError(() => new Error('SOLD_OUT'));
          }

          return this.bookingService.createBooking({
            event_id: full.uuid,
            ticket_type_id: ticket.uuid,
            quantity: 1,
          });
        }),
      )
      .subscribe({
        next: (booking) => {
          // My bookings and Profile read /bookings/me when they open, so
          // this booking shows up there as soon as the user navigates.
          this.bookedEventIds.update((ids) => [...ids, event.uuid]);
          this.justBooked.set({ title: event.title, free: booking.is_free });
          this.bookingId.set(null);
        },
        error: (error) => {
          console.error('Booking failed:', error);
          this.setBookingMessage(event.uuid, this.bookingErrorText(error));
          this.bookingId.set(null);
        },
      });
  }

  private setBookingMessage(id: string, message: string): void {
    this.bookingMessages.update((current) => ({ ...current, [id]: message }));
  }

  private bookingErrorText(error: unknown): string {
    const e = error as {
      message?: string;
      error?: { detail?: unknown; message?: string };
    };

    if (e?.message === 'NO_TICKETS') {
      return 'Booking is not open for this event yet.';
    }

    if (e?.message === 'SOLD_OUT') {
      return 'This event is sold out.';
    }

    if (typeof e?.error?.detail === 'string') {
      return e.error.detail;
    }

    return e?.error?.message ?? 'Could not book this event. Please try again.';
  }

  private cheapestTicketType(event: EventModel): EventTicketTypeModel | null {
    const available = event.ticket_types.filter(
      (t) => t.available_quantity > 0,
    );

    return available.length
      ? available.reduce((best, t) => (t.price < best.price ? t : best))
      : null;
  }

  loadMore(): void {
    this.visibleCount.update((count) => count + this.pageSize);
  }

  retry(): void {
    this.retryNonce.update((n) => n + 1);
  }

  markImageFailed(id: string): void {
    const event = this.events().find((e) => e.uuid === id);
    console.warn(
      'Event image failed to load:',
      event ? this.primaryImage(event) : id,
    );

    this.failedImages.update((ids) => (ids.includes(id) ? ids : [...ids, id]));
  }

  openFilters(): void {
    this.mobileFiltersOpen.set(true);
  }

  closeFilters(): void {
    this.mobileFiltersOpen.set(false);
  }

  priceFor(event: EventListItem): number | null {
    return event.starting_price ?? this.startingPrices()[event.uuid] ?? null;
  }

  formatPrice(amount: number): string {
    return `₦${amount.toLocaleString('en-NG')}`;
  }

  primaryImage(event: EventListItem): string {
    return event.image_url ?? '';
  }

  month(iso: string): string {
    return new Date(iso).toLocaleDateString('en-NG', { month: 'short' });
  }

  day(iso: string): string {
    return String(new Date(iso).getDate());
  }

  time(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-NG', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  isPast(event: EventListItem): boolean {
    return new Date(event.event_date).getTime() < Date.now();
  }

  private matchesDate(iso: string, range: DateRange): boolean {
    if (range === 'any') {
      return true;
    }

    const date = new Date(iso);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const msPerDay = 24 * 60 * 60 * 1000;
    const daysAway = Math.floor(
      (new Date(date).setHours(0, 0, 0, 0) - startOfToday.getTime()) / msPerDay,
    );

    switch (range) {
      case 'today':
        return daysAway === 0;
      case 'week':
        return daysAway >= 0 && daysAway <= 7;
      case 'weekend':
        return (
          daysAway >= 0 &&
          daysAway <= 7 &&
          (date.getDay() === 0 || date.getDay() === 6)
        );
      case 'month':
        return (
          date.getMonth() === startOfToday.getMonth() &&
          date.getFullYear() === startOfToday.getFullYear() &&
          daysAway >= 0
        );
    }
  }
}
