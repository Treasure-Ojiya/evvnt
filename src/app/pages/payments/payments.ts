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
import { Subscription, map, of, switchMap } from 'rxjs';
import { CartItem } from '../../app-model/model';
import { ExploreService } from '../../core/services/explore-service/explore-service';
import { CartService } from '../../core/services/cart-service/cart-service';
import { BookingService } from '../../core/services/booking-service/booking-service';
import { ToastService } from '../../core/services/toast-service/toast-service';

const MAX_PER_ORDER = 10;

type AttendeeGroup = FormGroup<{
  name: FormControl<string>;
  phone: FormControl<string>;
  email: FormControl<string>;
  confirmEmail: FormControl<string>;
}>;

function notBlank(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  return typeof value === 'string' && value.length > 0 && value.trim() === ''
    ? { notBlank: true }
    : null;
}

function emailsMatch(group: AbstractControl): ValidationErrors | null {
  const email = group.get('email')?.value;
  const confirm = group.get('confirmEmail')?.value;
  return email && confirm && email !== confirm
    ? { emailsMismatch: true }
    : null;
}

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
  private cartService = inject(CartService);
  private bookingService = inject(BookingService);
  private toastService = inject(ToastService);

  readonly steps = [
    { id: 1, label: 'Details' },
    { id: 2, label: 'Review' },
    { id: 3, label: 'Payment' },
  ] as const;

  step = signal<1 | 2 | 3>(1);

  // ============ Mode + sources ============
  mode = signal<'direct' | 'cart'>('direct');
  private cartItem = signal<CartItem | null>(null);
  eventFull = signal<{
    uuid: string;
    title: string;
    location: string;
    event_date: string;
    image_url: string | null;
    ticket_types: {
      uuid: string;
      name: string;
      price: number;
      total_quantity: number;
      sold_quantity: number;
      available_quantity: number;
    }[];
  } | null>(null);
  ticketId = signal('');

  // ============ Shared state ============
  isLoading = signal(true);
  loadError = signal('');
  quantity = signal(1);
  maxQuantity = signal(1);

  attendees = new FormArray<AttendeeGroup>([]);
  sameContact = signal(false);
  private mirrorSub: Subscription | null = null;

  isPaying = signal(false);
  paymentStarted = signal<{ reference: string; amount: number } | null>(null);

  // ============ Derived (works for both modes) ============
  ticket = computed(() => {
    if (this.mode() === 'cart') {
      const t = this.cartItem()?.ticket_type;
      return t ? { uuid: t.uuid, name: t.name, price: t.price } : null;
    }
    return (
      this.eventFull()?.ticket_types?.find((t) => t.uuid === this.ticketId()) ??
      null
    );
  });

  // add to payments.ts
  viewEvent = computed(() => {
    if (this.mode() === 'cart') {
      const c = this.cartItem();
      return c ? c.event : null;
    }
    return this.eventFull();
  });

  unitPrice = computed(() => this.ticket()?.price ?? 0);
  total = computed(() => this.unitPrice() * this.quantity());
  isFree = computed(() => !!this.ticket() && this.total() === 0);

  constructor() {
    this.load();
  }

  // ================================================
  // LOAD — branches on which query params exist
  // ================================================
  load(): void {
    const p = this.route.snapshot.queryParamMap;
    const cartId = p.get('cart');
    const eventId = p.get('event');
    const ticketId = p.get('ticket');
    const qty = Number(p.get('qty') ?? 1);

    this.isLoading.set(true);
    this.loadError.set('');

    if (cartId) {
      // ---- MODE: CART ----
      this.mode.set('cart');
      this.cartService.getCartItem(cartId).subscribe({
        next: (item) => {
          if (new Date(item.event.event_date).getTime() < Date.now()) {
            this.fail('This event has already taken place.');
            return;
          }
          this.cartItem.set(item);
          this.ticketId.set(item.ticket_type.uuid);
          this.quantity.set(item.quantity);
          this.maxQuantity.set(
            Math.min(MAX_PER_ORDER, item.ticket_type.available_quantity),
          );
          this.buildAttendees(item.quantity, item.attendees);
          this.isLoading.set(false);
        },
        error: () => this.fail('We could not load this cart item.'),
      });
      return;
    }

    if (!eventId || !ticketId) {
      this.fail('This checkout link is incomplete.');
      return;
    }

    // ---- MODE: DIRECT ----
    this.mode.set('direct');
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
          Math.max(1, Math.round(qty) || 1),
          Math.min(MAX_PER_ORDER, ticket.available_quantity),
        );
        this.eventFull.set({
          uuid: event.uuid,
          title: event.title,
          location: event.location,
          event_date: event.event_date,
          image_url: event.image_url,
          ticket_types: event.ticket_types,
        });
        this.quantity.set(quantity);
        this.maxQuantity.set(
          Math.min(MAX_PER_ORDER, ticket.available_quantity),
        );
        this.buildAttendees(quantity, []);
        this.isLoading.set(false);
      },
      error: () => this.fail('We could not load checkout. Please try again.'),
    });
  }

  private fail(message: string): void {
    this.loadError.set(message);
    this.isLoading.set(false);
  }

  // ================================================
  // Attendee forms
  // ================================================
  private buildAttendees(
    count: number,
    saved: { full_name: string; email: string; phone: string }[],
  ): void {
    this.attendees.clear();
    for (let i = 0; i < count; i++) {
      const a = saved[i];
      this.attendees.push(
        this.createAttendee(a?.full_name, a?.email, a?.phone),
      );
    }
  }

  private createAttendee(name = '', email = '', phone = ''): AttendeeGroup {
    return this.formBuilder.group(
      {
        name: [name, [Validators.required, notBlank]],
        phone: [
          phone,
          [Validators.required, Validators.pattern(/^\+?[0-9\s-]{7,15}$/)],
        ],
        email: [email, [Validators.required, Validators.email]],
        confirmEmail: [email, [Validators.required, Validators.email]],
      },
      { validators: emailsMatch },
    );
  }

  addTicket(): void {
    if (this.attendees.length >= this.maxQuantity()) return;
    this.attendees.push(this.createAttendee());
    this.quantity.set(this.attendees.length);
    this.refreshSameContact();
  }

  removeTicket(index: number): void {
    if (this.attendees.length <= 1) return;
    this.attendees.removeAt(index);
    this.quantity.set(this.attendees.length);
    this.refreshSameContact();
  }

  private refreshSameContact(): void {
    if (this.sameContact()) this.toggleSameContact(true);
  }

  toggleSameContact(checked: boolean): void {
    this.sameContact.set(checked);
    this.mirrorSub?.unsubscribe();
    this.mirrorSub = null;
    const [first, ...others] = this.attendees.controls;
    if (!first) return;

    if (checked) {
      const copy = () =>
        others.forEach((g) =>
          g.patchValue(
            {
              phone: first.controls.phone.value,
              email: first.controls.email.value,
              confirmEmail: first.controls.confirmEmail.value,
            },
            { emitEvent: false },
          ),
        );
      others.forEach((g) => {
        g.controls.phone.disable({ emitEvent: false });
        g.controls.email.disable({ emitEvent: false });
        g.controls.confirmEmail.disable({ emitEvent: false });
      });
      copy();
      this.mirrorSub = first.valueChanges.subscribe(copy);
    } else {
      others.forEach((g) => {
        g.controls.phone.enable({ emitEvent: false });
        g.controls.email.enable({ emitEvent: false });
        g.controls.confirmEmail.enable({ emitEvent: false });
      });
    }
  }

  fieldError(
    group: AttendeeGroup,
    name: 'name' | 'phone' | 'email' | 'confirmEmail',
  ): string {
    if (name === 'confirmEmail' && group.hasError('emailsMismatch')) {
      return 'Emails do not match.';
    }
    const control = group.controls[name];
    if (!control.touched || !control.errors) return '';
    switch (name) {
      case 'name':
        return 'Enter the full name.';
      case 'phone':
        return 'Enter a valid phone number, e.g. +2348012345678.';
      case 'email':
        return 'Enter a valid email address.';
      default:
        return 'Enter a valid email address.';
    }
  }

  summaries(): { name: string; phone: string; email: string }[] {
    return this.attendees.getRawValue().map((a) => ({
      name: a.name,
      phone: a.phone,
      email: a.email,
    }));
  }

  get formValid(): boolean {
    return this.attendees.valid;
  }

  // ================================================
  // Steps (mobile)
  // ================================================
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

  // ================================================
  // SUBMIT — the only place modes diverge
  // ================================================
  submit(): void {
    if (this.isPaying()) return;
    if (this.attendees.invalid) {
      this.attendees.markAllAsTouched();
      this.step.set(1);
      return;
    }

    this.isPaying.set(true);

    const order$ =
      this.mode() === 'cart' ? this.orderFromCart() : this.orderDirect();

    order$
      .pipe(
        switchMap((order) =>
          order.is_free
            ? of({ order, paystack: null })
            : this.bookingService
                .initPaystack(order.uuid)
                .pipe(map((paystack) => ({ order, paystack }))),
        ),
      )
      .subscribe({
        next: ({ order, paystack }) => {
          this.isPaying.set(false);
          if (!paystack) {
            this.toastService.show(
              "You're in! Your spot is reserved.",
              'success',
              4000,
            );
            this.router.navigate(['/queue']);
            return;
          }
          this.paymentStarted.set({
            reference: paystack.reference,
            amount: paystack.amount,
          });
          window.location.href = paystack.authorization_url;
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

  // mode: direct — create the order with attendees in one call
  private orderDirect() {
    const event = this.eventFull();
    const ticket = this.ticket();
    if (!event || !ticket) throw new Error('Checkout is not ready.');

    return this.bookingService.createBooking({
      event_id: event.uuid,
      ticket_type_id: ticket.uuid,
      quantity: this.quantity(),
      attendees: this.attendees.getRawValue().map((a) => ({
        full_name: a.name,
        email: a.email,
        confirm_email: a.confirmEmail,
        phone: a.phone,
      })),
    });
  }

  // mode: cart — save progress, then checkout the cart item (deletes it)
  private orderFromCart() {
    const id = this.cartItem()?.uuid;
    if (!id) throw new Error('Checkout is not ready.');

    return this.cartService
      .updateCartItem(id, {
        attendees: this.attendees.getRawValue().map((a) => ({
          full_name: a.name,
          email: a.email,
          phone: a.phone,
        })),
      })
      .pipe(switchMap(() => this.cartService.checkoutCartItem(id)));
  }

  // ================================================
  // Template helpers
  // ================================================
  formatPrice(amount: number): string {
    return amount === 0 ? 'Free' : `₦${amount.toLocaleString('en-NG')}`;
  }
}
