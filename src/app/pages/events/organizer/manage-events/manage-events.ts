import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import {
  EventListItem,
  EventTicketTypeModel,
  UpdateEventModel,
  UpdateTicketTypeModel,
} from '../../../../app-model/model';
import { ExploreService } from '../../../../core/services/explore-service/explore-service';
import { OrganizerService } from '../../../../core/services/organizer-service/organizer-service';
import { ToastService } from '../../../../core/services/toast-service/toast-service';
import {
  ConfirmModal,
  ConfirmModalData,
} from '../../../../shared/modals/confirm-modal/confirm-modal';
import {
  ManageModal,
  ManageModalData,
  ManageModalResult,
} from '../../../../shared/modals/manage-modal/manage-modal';

type StatusFilter = '' | 'draft' | 'published' | 'completed' | 'cancelled';

// One ticket type inside the edit panel, with its own small form.
interface EditableTicket {
  uuid: string;
  sold: number;
  form: FormGroup;
}

@Component({
  selector: 'app-manage-events',
  imports: [RouterLink, DatePipe, NgClass, ReactiveFormsModule],
  templateUrl: './manage-events.html',
  styleUrl: './manage-events.css',
  host: { '(document:keydown.escape)': 'onEscape()' },
})
export class ManageEvents {
  private exploreService = inject(ExploreService);
  private organizerService = inject(OrganizerService);
  private formBuilder = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private toastService = inject(ToastService);

  // =========================
  // List state
  // =========================

  events = signal<EventListItem[]>([]);
  isLoading = signal(true);
  loadError = signal('');
  // GET /events/me returns every event the user owns and takes no
  // parameters, so search and the status chips filter the list here.
  query = signal('');
  statusFilter = signal<StatusFilter>('');

  publishingId = signal<string | null>(null);
  deletingId = signal<string | null>(null);

  readonly statusOptions: { id: StatusFilter; label: string }[] = [
    { id: '', label: 'All' },
    { id: 'draft', label: 'Draft' },
    { id: 'published', label: 'Published' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  hasFilters = computed(() => !!this.query().trim() || !!this.statusFilter());

  // Search and status chip applied here, newest event first.
  visibleEvents = computed(() => {
    const status = this.statusFilter();
    const term = this.query().trim().toLowerCase();

    return this.events()
      .filter((e) => !status || e.status.toLowerCase() === status)
      .filter(
        (e) =>
          !term ||
          e.title.toLowerCase().includes(term) ||
          e.location.toLowerCase().includes(term),
      )
      .sort((a, b) => b.event_date.localeCompare(a.event_date));
  });

  // =========================
  // Edit panel state
  // =========================

  editingId = signal<string | null>(null);
  isLoadingEdit = signal(false);
  isSaving = signal(false);
  isChangingCover = signal(false);
  savingTicketId = signal<string | null>(null);
  // Problems inside the edit panel (a missing field, a load failure).
  // Results of saves and other actions are shown as toasts.
  editError = signal('');

  coverUrl = signal<string | null>(null);
  tickets = signal<EditableTicket[]>([]);

  editForm = this.formBuilder.group({
    title: ['', Validators.required],
    host_name: ['', Validators.required],
    description: ['', Validators.required],
    location: ['', Validators.required],
    event_date: ['', Validators.required], // datetime-local value
    duration: ['', Validators.required],
  });

  // =========================
  // Lifecycle
  // =========================

  constructor() {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.loadError.set('');

    this.organizerService.getMyEvents().subscribe({
      next: (events) => {
        this.events.set(events);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load events:', error);
        this.loadError.set('We could not load your events. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  retry(): void {
    this.load();
  }

  onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  // Escape closes the edit panel, unless a modal is open on top of it
  // (the modal handles its own Escape).
  onEscape(): void {
    if (this.editingId() && this.dialog.openDialogs.length === 0) {
      this.closeEdit();
    }
  }

  openView(event: EventListItem): void {
    this.dialog
      .open<ManageModal, ManageModalData, ManageModalResult>(ManageModal, {
        data: { eventId: event.uuid },
        width: '640px',
        maxWidth: '95vw',
        autoFocus: 'dialog',
      })
      .afterClosed()
      .subscribe((result) => {
        if (result === 'edit') {
          this.openEdit(event);
        }
      });
  }

  askPublish(event: EventListItem): void {
    this.confirm({
      title: 'Publish this event?',
      message: `"${event.title}" will become visible to everyone and open for booking.`,
      confirmLabel: 'Yes, publish',
    }).subscribe(() => this.publish(event));
  }

  private publish(event: EventListItem): void {
    this.publishingId.set(event.uuid);

    this.organizerService.publishEvent(event.uuid).subscribe({
      next: (updated) => {
        this.events.update((list) =>
          list.map((e) =>
            e.uuid === updated.uuid ? { ...e, status: updated.status } : e,
          ),
        );
        this.toastService.show(`"${updated.title}" is now live.`, 'success');
        this.publishingId.set(null);
      },
      error: (error) => {
        console.error('Publish failed:', error);
        this.toastService.show(
          this.errorText(error, 'Could not publish this event.'),
          'error',
          5000,
        );
        this.publishingId.set(null);
      },
    });
  }

  askDelete(event: EventListItem): void {
    const sold =
      event.tickets_sold > 0
        ? ` ${event.tickets_sold} ${event.tickets_sold === 1 ? 'ticket has' : 'tickets have'} already been sold.`
        : '';

    this.confirm({
      title: 'Delete this event?',
      message: `"${event.title}" will be removed permanently.${sold} This cannot be undone.`,
      confirmLabel: 'Yes, delete',
      tone: 'danger',
    }).subscribe(() => this.delete(event));
  }

  private delete(event: EventListItem): void {
    this.deletingId.set(event.uuid);

    this.organizerService.deleteEvent(event.uuid).subscribe({
      next: () => {
        this.events.update((list) => list.filter((e) => e.uuid !== event.uuid));
        this.toastService.show(`"${event.title}" was deleted.`, 'success');
        this.deletingId.set(null);
      },
      error: (error) => {
        console.error('Delete failed:', error);
        this.toastService.show(
          this.errorText(error, 'Could not delete this event.'),
          'error',
          5000,
        );
        this.deletingId.set(null);
      },
    });
  }

  openEdit(event: EventListItem): void {
    this.editingId.set(event.uuid);
    this.isLoadingEdit.set(true);
    this.editError.set('');
    this.coverUrl.set(null);
    this.tickets.set([]);

    this.exploreService.getEvent(event.uuid).subscribe({
      next: (full) => {
        if (this.editingId() !== event.uuid) {
          return;
        }

        this.editForm.reset({
          title: full.title,
          host_name: full.host_name,
          description: full.description,
          location: full.location,
          event_date: this.toLocalInput(full.event_date),
          duration: full.duration,
        });
        this.coverUrl.set(full.image_url);
        this.tickets.set(full.ticket_types.map((t) => this.toEditable(t)));
        this.isLoadingEdit.set(false);
      },
      error: (error) => {
        if (this.editingId() !== event.uuid) {
          return;
        }

        console.error('Failed to load event for editing:', error);
        this.editError.set('We could not load this event. Please try again.');
        this.isLoadingEdit.set(false);
      },
    });
  }

  closeEdit(): void {
    this.editingId.set(null);
    this.tickets.set([]);
  }

  saveEdit(): void {
    const id = this.editingId();

    if (!id) {
      return;
    }

    this.editForm.markAllAsTouched();

    if (this.editForm.invalid) {
      this.editError.set('Please fill in every field.');
      return;
    }

    const value = this.editForm.getRawValue();

    const changes: UpdateEventModel = {
      title: value.title!.trim(),
      host_name: value.host_name!.trim(),
      description: value.description!.trim(),
      location: value.location!.trim(),
      event_date: new Date(value.event_date!).toISOString(),
      duration: value.duration!.trim(),
    };

    this.isSaving.set(true);
    this.editError.set('');

    this.organizerService.updateEvent(id, changes).subscribe({
      next: (updated) => {
        this.events.update((list) =>
          list.map((e) =>
            e.uuid === updated.uuid
              ? { ...e, title: updated.title, event_date: updated.event_date }
              : e,
          ),
        );
        this.toastService.show(
          `Saved changes to "${updated.title}".`,
          'success',
        );
        this.isSaving.set(false);
        this.closeEdit();
      },
      error: (error) => {
        console.error('Save failed:', error);
        this.toastService.show(
          this.errorText(error, 'Could not save your changes.'),
          'error',
          5000,
        );
        this.isSaving.set(false);
      },
    });
  }

  changeCover(input: HTMLInputElement): void {
    const id = this.editingId();
    const file = input.files?.[0];

    if (!id || !file) {
      return;
    }

    this.isChangingCover.set(true);
    this.editError.set('');

    this.organizerService.updateEventImage(id, file).subscribe({
      next: (updated) => {
        this.coverUrl.set(updated.image_url ?? this.coverUrl());
        this.toastService.show('Cover image updated.', 'success');
        this.isChangingCover.set(false);
        input.value = '';
      },
      error: (error) => {
        console.error('Cover update failed:', error);
        this.toastService.show(
          this.errorText(error, 'Could not update the cover image.'),
          'error',
          5000,
        );
        this.isChangingCover.set(false);
        input.value = '';
      },
    });
  }

  saveTicket(ticket: EditableTicket): void {
    const id = this.editingId();

    if (!id) {
      return;
    }

    ticket.form.markAllAsTouched();

    if (ticket.form.invalid) {
      this.editError.set(
        ticket.sold > 0
          ? `Check the ticket details. Total quantity cannot be below the ${ticket.sold} already sold.`
          : 'Check the ticket details.',
      );
      return;
    }

    const value = ticket.form.getRawValue();

    const changes: UpdateTicketTypeModel = {
      name: String(value.name).trim(),
      price: Number(value.price),
      total_quantity: Number(value.total_quantity),
    };

    this.savingTicketId.set(ticket.uuid);
    this.editError.set('');

    this.organizerService.updateTicketType(id, ticket.uuid, changes).subscribe({
      next: (updated) => {
        const fresh = updated.ticket_types.find((t) => t.uuid === ticket.uuid);

        if (fresh) {
          this.tickets.update((list) =>
            list.map((t) =>
              t.uuid === fresh.uuid ? this.toEditable(fresh) : t,
            ),
          );
        }

        this.toastService.show(`Ticket "${changes.name}" updated.`, 'success');
        this.savingTicketId.set(null);
      },
      error: (error) => {
        console.error('Ticket update failed:', error);
        this.toastService.show(
          this.errorText(error, 'Could not update this ticket.'),
          'error',
          5000,
        );
        this.savingTicketId.set(null);
      },
    });
  }

  hasFieldError(name: string): boolean {
    const control = this.editForm.get(name);
    return !!(control && control.invalid && control.touched);
  }

  hasTicketError(ticket: EditableTicket, name: string): boolean {
    const control = ticket.form.get(name);
    return !!(control && control.invalid && control.touched);
  }

  statusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  statusClasses(status: string): string {
    switch (status.toLowerCase()) {
      case 'published':
        return 'bg-success/10 text-success-dark';
      case 'completed':
        return 'bg-brand-soft text-brand-dark';
      case 'cancelled':
        return 'bg-danger/10 text-danger-dark';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  private confirm(data: ConfirmModalData) {
    return this.dialog
      .open<ConfirmModal, ConfirmModalData, boolean>(ConfirmModal, {
        data,
        width: '420px',
        maxWidth: '92vw',
        autoFocus: 'dialog',
      })
      .afterClosed()
      .pipe(filter((confirmed) => confirmed === true));
  }

  private toEditable(ticket: EventTicketTypeModel): EditableTicket {
    return {
      uuid: ticket.uuid,
      sold: ticket.sold_quantity,
      form: this.formBuilder.group({
        name: [ticket.name, Validators.required],
        price: [ticket.price, [Validators.required, Validators.min(0)]],
        // Cannot drop below what is already sold.
        total_quantity: [
          ticket.total_quantity,
          [
            Validators.required,
            Validators.min(Math.max(ticket.sold_quantity, 1)),
          ],
        ],
      }),
    };
  }

  private errorText(error: unknown, fallback: string): string {
    const e = error as { error?: { detail?: unknown; message?: string } };

    if (typeof e?.error?.detail === 'string') {
      return e.error.detail;
    }

    return e?.error?.message ?? fallback;
  }

  private toLocalInput(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');

    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
