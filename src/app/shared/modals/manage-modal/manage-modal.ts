import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EventModel } from '../../../app-model/model';
import { ExploreService } from '../../../core/services/explore-service/explore-service';

export interface ManageModalData {
  eventId: string;
}

// Closes with 'edit' when the organizer taps Edit, otherwise with nothing.
export type ManageModalResult = 'edit' | undefined;

@Component({
  selector: 'app-manage-modal',
  imports: [DatePipe, NgClass],
  templateUrl: './manage-modal.html',
  styleUrl: './manage-modal.css',
})
export class ManageModal implements OnInit {
  private exploreService = inject(ExploreService);
  private dialogRef =
    inject<MatDialogRef<ManageModal, ManageModalResult>>(MatDialogRef);
  private data = inject<ManageModalData>(MAT_DIALOG_DATA);

  event = signal<EventModel | null>(null);
  isLoading = signal(true);
  loadError = signal('');

  // GET /events/{id} returns image_url; `images` is the fallback.
  cover = computed(() => {
    const event = this.event();
    return event?.image_url ?? '';
  });

  totalSold = computed(() =>
    (this.event()?.ticket_types ?? []).reduce(
      (sum, ticket) => sum + ticket.sold_quantity,
      0,
    ),
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.loadError.set('');

    this.exploreService.getEvent(this.data.eventId).subscribe({
      next: (event) => {
        this.event.set(event);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load event details:', error);
        this.loadError.set('We could not load this event. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  edit(): void {
    this.dialogRef.close('edit');
  }

  close(): void {
    this.dialogRef.close();
  }

  formatPrice(amount: number): string {
    return amount === 0 ? 'Free' : `₦${amount.toLocaleString('en-NG')}`;
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
}
