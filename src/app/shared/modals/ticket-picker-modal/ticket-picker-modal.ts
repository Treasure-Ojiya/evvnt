import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EventModel, EventTicketTypeModel } from '../../../app-model/model';
import { ExploreService } from '../../../core/services/explore-service/explore-service';

const MAX_PER_ORDER = 10;

export interface TicketPickerData {
  eventId: string;
  eventTitle: string;
  // What the booking already had, used as the starting choice.
  ticketTypeId?: string;
  quantity?: number;
}

export interface TicketPickerResult {
  ticketTypeId: string;
  quantity: number;
}

/**
 * Pop-up asking which ticket type and how many tickets, before going to the
 * payment page. Closes with a TicketPickerResult, or nothing if dismissed.
 */
@Component({
  selector: 'app-ticket-picker-modal',
  imports: [NgClass],
  templateUrl: './ticket-picker-modal.html',
  styleUrl: './ticket-picker-modal.css',
})
export class TicketPickerModal implements OnInit {
  private dialogRef =
    inject<MatDialogRef<TicketPickerModal, TicketPickerResult>>(MatDialogRef);
  private exploreService = inject(ExploreService);

  readonly data = inject<TicketPickerData>(MAT_DIALOG_DATA);

  event = signal<EventModel | null>(null);
  isLoading = signal(true);
  loadError = signal('');

  selectedId = signal<string | null>(null);
  quantity = signal(1);

  tickets = computed(() => this.event()?.ticket_types ?? []);

  selected = computed(
    () => this.tickets().find((t) => t.uuid === this.selectedId()) ?? null,
  );

  maxQuantity = computed(() => {
    const available = this.selected()?.available_quantity ?? 0;
    return Math.max(1, Math.min(MAX_PER_ORDER, available));
  });

  total = computed(() => (this.selected()?.price ?? 0) * this.quantity());

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.loadError.set('');

    this.exploreService.getEvent(this.data.eventId).subscribe({
      next: (event) => {
        this.event.set(event);

        // Start from the booked ticket if it is still on sale, otherwise
        // from the first one that is.
        const preferred = event.ticket_types.find(
          (t) => t.uuid === this.data.ticketTypeId && t.available_quantity > 0,
        );
        const first = event.ticket_types.find((t) => t.available_quantity > 0);
        const start = preferred ?? first ?? null;

        this.selectedId.set(start?.uuid ?? null);
        this.quantity.set(
          Math.min(
            Math.max(1, this.data.quantity ?? 1),
            start ? this.maxFor(start) : 1,
          ),
        );

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load tickets:', error);
        this.loadError.set('We could not load the tickets. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  select(ticket: EventTicketTypeModel): void {
    if (ticket.available_quantity <= 0) {
      return;
    }

    this.selectedId.set(ticket.uuid);
    this.quantity.set(Math.min(this.quantity(), this.maxFor(ticket)));
  }

  change(delta: number): void {
    this.quantity.set(
      Math.min(this.maxQuantity(), Math.max(1, this.quantity() + delta)),
    );
  }

  confirm(): void {
    const ticket = this.selected();

    if (!ticket) {
      return;
    }

    this.dialogRef.close({
      ticketTypeId: ticket.uuid,
      quantity: this.quantity(),
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  formatPrice(amount: number): string {
    return amount === 0 ? 'Free' : `₦${amount.toLocaleString('en-NG')}`;
  }

  private maxFor(ticket: EventTicketTypeModel): number {
    return Math.max(1, Math.min(MAX_PER_ORDER, ticket.available_quantity));
  }
}
