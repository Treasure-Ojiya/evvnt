import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, Location, NgClass } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  Observable,
  Subscription,
  catchError,
  map,
  of,
  switchMap,
  throwError,
} from 'rxjs';
import { BookingPayment, EventModel } from '../../app-model/model';
import { ExploreService } from '../../core/services/explore-service/explore-service';
import { BookingService } from '../../core/services/booking-service/booking-service';
import { ToastService } from '../../core/services/toast-service/toast-service';

const MAX_PER_ORDER = 10;

type AttendeeGroup = FormGroup<{
  name: FormControl<string>;
  phone: FormControl<string>;
  email: FormControl<string>;
}>;

// Rejects values that are only spaces.
function notBlank(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  return typeof value === 'string' && value.length > 0 && value.trim() === ''
    ? { notBlank: true }
    : null;
}

/**
 * Checkout. Opened with ?event=...&ticket=...&qty=...[&booking=...].
 * One details form per ticket. On desktop everything is on one screen
 * (forms left, summary and payment right); on a phone it goes step by step:
 * details, review, payment.
 */
@Component({
  selector: 'app-payment',
  imports: [DatePipe, NgClass, ReactiveFormsModule, RouterLink],
  templateUrl: './payments.html',
  styleUrl: './payments.css',
})
export class Payment {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private formBuilder = inject(NonNullableFormBuilder);
  private exploreService = inject(ExploreService);
  private bookingService = inject(BookingService);
  private toastService = inject(ToastService);

  // =========================
  // State
  // =========================

  readonly steps = [
    { id: 1, label: 'Details' },
    { id: 2, label: 'Review' },
    { id: 3, label: 'Payment' },
  ] as const;

  // Only used on small screens. Large screens show everything at once.
  step = signal<1 | 2 | 3>(1);

  event = signal<EventModel | null>(null);
  isLoading = signal(true);
  loadError = signal('');

  ticketId = signal('');
  quantity = signal(1);
  // The most tickets this order can have: 10, or what is left.
  maxQuantity = signal(1);
  private bookingParam: string | null = null;

  attendees = new FormArray<AttendeeGroup>([]);
  sameContact = signal(false);
  private mirrorSub: Subscription | null = null;

  isPaying = signal(false);
  paymentStarted = signal<BookingPayment | null>(null);

  // =========================
  // Derived state
  // =========================

  ticket = computed(
    () =>
      this.event()?.ticket_types.find((t) => t.uuid === this.ticketId()) ??
      null,
  );

  unitPrice = computed(() => this.ticket()?.price ?? 0);
  total = computed(() => this.unitPrice() * this.quantity());
  isFree = computed(() => !!this.ticket() && this.total() === 0);

  constructor() {
    this.load();
  }

  // =========================
  // Loading
  // =========================

  load(): void {
    const params = this.route.snapshot.queryParamMap;
    const eventId = params.get('event');
    const ticketId = params.get('ticket');
    const requested = Number(params.get('qty') ?? 1);

    this.bookingParam = params.get('booking');
    this.isLoading.set(true);
    this.loadError.set('');

    if (!eventId || !ticketId) {
      this.fail('This checkout link is incomplete.');
      return;
    }

    this.ticketId.set(ticketId);

    this.exploreService.getEvent(eventId).subscribe({
      next: (event) => {
        const ticket = event.ticket_types.find((t) => t.uuid === ticketId);

        if (!ticket) {
          this.fail('That ticket is no longer available.');
          return;
        }

        if (new Date(event.event_date).getTime() < Date.now()) {
          this.fail('This event has already taken place.');
          return;
        }

        if (ticket.available_quantity <= 0) {
          this.fail('This ticket is sold out.');
          return;
        }

        const quantity = Math.min(
          Math.max(1, Math.round(requested) || 1),
          Math.min(MAX_PER_ORDER, ticket.available_quantity),
        );

        this.event.set(event);
        this.quantity.set(quantity);
        this.maxQuantity.set(
          Math.min(MAX_PER_ORDER, ticket.available_quantity),
        );
        this.buildAttendees(quantity);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load checkout:', error);
        this.fail(
          error?.status === 404
            ? 'We could not find this event.'
            : 'We could not load checkout. Please try again.',
        );
      },
    });
  }

  private fail(message: string): void {
    this.loadError.set(message);
    this.isLoading.set(false);
  }

  // =========================
  // Attendee forms
  // =========================

  private buildAttendees(count: number): void {
    this.attendees.clear();

    for (let i = 0; i < count; i++) {
      this.attendees.push(this.createAttendee());
    }
  }

  private createAttendee(): AttendeeGroup {
    return this.formBuilder.group({
      name: ['', [Validators.required, notBlank]],
      phone: [
        '',
        [Validators.required, Validators.pattern(/^\+?[0-9\s-]{7,15}$/)],
      ],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  // Drops one ticket (and its form) before paying. The total follows.
  removeTicket(index: number): void {
    if (this.attendees.length <= 1) {
      return;
    }

    this.attendees.removeAt(index);
    this.quantity.set(this.attendees.length);
    this.refreshSameContact();
  }

  // Adds a ticket back, up to the limit.
  addTicket(): void {
    if (this.attendees.length >= this.maxQuantity()) {
      return;
    }

    this.attendees.push(this.createAttendee());
    this.quantity.set(this.attendees.length);
    this.refreshSameContact();
  }

  // The first form may have changed, so copy its phone and email again.
  private refreshSameContact(): void {
    if (this.sameContact()) {
      this.toggleSameContact(true);
    }
  }

  // Lets one email and phone number cover every ticket.
  toggleSameContact(checked: boolean): void {
    this.sameContact.set(checked);
    this.mirrorSub?.unsubscribe();
    this.mirrorSub = null;

    const [first, ...others] = this.attendees.controls;

    if (!first) {
      return;
    }

    if (checked) {
      const copy = () =>
        others.forEach((group) =>
          group.patchValue(
            {
              phone: first.controls.phone.value,
              email: first.controls.email.value,
            },
            { emitEvent: false },
          ),
        );

      others.forEach((group) => {
        group.controls.phone.disable({ emitEvent: false });
        group.controls.email.disable({ emitEvent: false });
      });

      copy();
      this.mirrorSub = first.valueChanges.subscribe(copy);
    } else {
      others.forEach((group) => {
        group.controls.phone.enable({ emitEvent: false });
        group.controls.email.enable({ emitEvent: false });
      });
    }
  }

  fieldError(group: AttendeeGroup, name: 'name' | 'phone' | 'email'): string {
    const control = group.controls[name];

    if (!control.touched || !control.errors) {
      return '';
    }

    switch (name) {
      case 'name':
        return 'Enter the full name.';
      case 'phone':
        return 'Enter a valid phone number, e.g. +2348012345678.';
      default:
        return 'Enter a valid email address.';
    }
  }

  // The values for the review step (includes mirrored, disabled fields).
  summaries(): { name: string; phone: string; email: string }[] {
    return this.attendees.getRawValue();
  }

  get formValid(): boolean {
    return this.attendees.valid;
  }

  // =========================
  // Steps (small screens)
  // =========================

  next(): void {
    if (this.step() === 1) {
      if (this.attendees.invalid) {
        this.attendees.markAllAsTouched();
        return;
      }

      this.step.set(2);
    } else if (this.step() === 2) {
      this.step.set(3);
    }

    this.scrollToTop();
  }

  back(): void {
    if (this.step() > 1) {
      this.step.update((s) => (s - 1) as 1 | 2 | 3);
      this.scrollToTop();
    }
  }

  editDetails(): void {
    this.step.set(1);
    this.scrollToTop();
  }

  goBack(): void {
    this.location.back();
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // =========================
  // Pay
  // =========================

  submit(): void {
    if (this.isPaying()) {
      return;
    }

    if (this.attendees.invalid) {
      this.attendees.markAllAsTouched();
      this.step.set(1);
      return;
    }

    this.isPaying.set(true);

    this.resolveOrder()
      .pipe(
        switchMap((orderId) =>
          this.isFree()
            ? of(null)
            : this.bookingService.bookingPayment(orderId),
        ),
      )
      .subscribe({
        next: (payment) => {
          this.isPaying.set(false);

          if (payment) {
            this.openCheckout(payment);
          } else {
            this.finishFree();
          }
        },
        error: (error) => {
          console.error('Checkout failed:', error);
          this.isPaying.set(false);
          this.toastService.show(
            typeof error?.error?.detail === 'string'
              ? error.error.detail
              : 'We could not start your payment. Please try again.',
            'error',
            5000,
          );
        },
      });
  }

  // A booking made earlier is reused when it matches this ticket and quantity.
  // Otherwise a new one is created for what was chosen here, and the old
  // pending one is cancelled so it does not linger.
  private resolveOrder(): Observable<string> {
    const event = this.event();
    const ticket = this.ticket();

    if (!event || !ticket) {
      return throwError(() => new Error('Checkout is not ready.'));
    }

    const create = () =>
      this.bookingService
        .createBooking({
          event_id: event.uuid,
          ticket_type_id: ticket.uuid,
          quantity: this.quantity(),
        })
        .pipe(map((booking) => booking.uuid));

    if (!this.bookingParam) {
      return create();
    }

    return this.bookingService.getBookings().pipe(
      map((list) => list.find((b) => b.uuid === this.bookingParam)),
      switchMap((existing) => {
        const pending = existing?.status.toLowerCase() === 'pending';

        if (!existing || !pending) {
          return create();
        }

        if (
          existing.ticket_type_id === ticket.uuid &&
          existing.quantity === this.quantity()
        ) {
          return of(existing.uuid);
        }

        // The ticket or quantity changed here, so the saved booking is
        // replaced by a new one and the old one is cancelled.
        return create().pipe(
          switchMap((newId) =>
            this.bookingService.cancelBooking(existing.uuid).pipe(
              map(() => newId),
              catchError(() => of(newId)),
            ),
          ),
        );
      }),
    );
  }

  // TODO(Paystack): open the Paystack checkout here using `payment.reference`
  // and the buyer's email, then confirm the result with the backend. Until
  // that is connected, the page shows the reference that was created.
  private openCheckout(payment: BookingPayment): void {
    this.paymentStarted.set(payment);
    this.scrollToTop();
  }

  private finishFree(): void {
    this.toastService.show(
      "You're in! Your spot is reserved.",
      'success',
      4000,
    );
    this.router.navigate(['/my-booking']);
  }

  // =========================
  // Template helpers
  // =========================

  formatPrice(amount: number): string {
    return amount === 0 ? 'Free' : `₦${amount.toLocaleString('en-NG')}`;
  }
}
