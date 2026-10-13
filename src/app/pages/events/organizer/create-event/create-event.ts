import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  OnInit,
} from '@angular/core';

import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, of, switchMap, tap } from 'rxjs';

import { CommonModule, DatePipe } from '@angular/common';

import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { MatCardModule } from '@angular/material/card';

import {
  provideNativeDateAdapter,
  MatNativeDateModule,
} from '@angular/material/core';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import {
  CreateEventModel,
  CreateTicketTypeModel,
  EventCategories,
  CreateCategory,
} from '../../../../app-model/model';

import { CreateService } from '../../../../core/services/create-service/create-service';
import { ToastService } from '../../../../core/services/toast-service/toast-service';

@Component({
  selector: 'app-create-event',

  imports: [
    CommonModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule,
  ],

  templateUrl: './create-event.html',

  styleUrl: './create-event.css',

  providers: [provideNativeDateAdapter()],

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateEvent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private eventService = inject(CreateService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  // =========================
  // UI State
  // =========================

  submitted = false;
  isSubmitting = false;
  submitMode: 'draft' | 'publish' | null = null;

  // Set once the event exists, so a failed publish can be retried without
  // creating a duplicate.
  private createdEventId: string | null = null;
  formError = '';

  selectedImage: File | null = null;
  selectedVideo: File | null = null;

  // =========================
  // Categories
  // =========================

  categories: EventCategories[] = [];

  isLoadingCategories = false;

  showCreateCategory = false;

  isCreatingCategory = false;

  categoryError = '';

  // =========================
  // Event Form
  // =========================

  eventForm = this.formBuilder.group({
    title: ['', Validators.required],

    host_name: ['', Validators.required],

    description: ['', Validators.required],

    location: ['', Validators.required],

    event_date: [null as Date | null, Validators.required],

    event_time: ['', Validators.required],

    duration: ['', Validators.required],

    event_type: ['free', Validators.required],

    video_url: [''],

    category_ids: this.formBuilder.control<string[]>([], {
      validators: Validators.required,
    }),

    new_category_name: [''],

    ticket_types: this.formBuilder.array([this.createTicket()]),
  });

  // =========================
  // Lifecycle
  // =========================

  constructor() {}

  ngOnInit(): void {
    this.loadCategories();
  }

  // =========================
  // Ticket Form
  // =========================

  createTicket(): FormGroup {
    return this.formBuilder.group({
      name: ['', Validators.required],

      price: [0, [Validators.required, Validators.min(0)]],

      total_quantity: [1, [Validators.required, Validators.min(1)]],
    });
  }

  get ticketTypes(): FormArray {
    return this.eventForm.get('ticket_types') as FormArray;
  }

  addTicket(): void {
    this.ticketTypes.push(this.createTicket());
  }

  removeTicket(index: number): void {
    if (this.ticketTypes.length === 1) {
      return;
    }

    this.ticketTypes.removeAt(index);
  }

  // =========================
  // Categories
  // =========================

  loadCategories(): void {
    this.isLoadingCategories = true;
    this.categoryError = '';

    this.eventService.getEventCategory().subscribe({
      next: (categories) => {
        this.categories = categories;

        this.isLoadingCategories = false;
        this.cdr.markForCheck();
      },

      error: (error) => {
        console.error('Failed to load categories:', error);

        this.categoryError = 'Unable to load categories. Please try again.';

        this.isLoadingCategories = false;
        this.cdr.markForCheck();
      },
    });
  }

  selectCategory(categoryId: string): void {
    const control = this.eventForm.get('category_ids');

    if (!control) {
      return;
    }

    const currentIds = control.value ?? [];

    if (currentIds.includes(categoryId)) {
      control.setValue(currentIds.filter((id) => id !== categoryId));
    } else {
      control.setValue([...currentIds, categoryId]);
    }

    control.markAsTouched();
  }

  isCategorySelected(categoryId: string): boolean {
    const ids = this.eventForm.get('category_ids')?.value ?? [];

    return ids.includes(categoryId);
  }

  createCategory(): void {
    const control = this.eventForm.get('new_category_name');

    if (!control) {
      return;
    }

    const name = control.value?.trim();

    if (!name) {
      control.markAsTouched();

      return;
    }

    this.isCreatingCategory = true;
    this.categoryError = '';

    const categoryData: CreateCategory = {
      name,
    };

    this.eventService.newEventCategory(categoryData).subscribe({
      next: (category) => {
        this.categories = [...this.categories, category];

        // Automatically select
        // the newly created category.
        this.selectCategory(category.uuid);

        control.reset('');

        this.showCreateCategory = false;

        this.isCreatingCategory = false;
        this.toast.show(`Category "${category.name}" added.`, 'success');
        this.cdr.markForCheck();
      },

      error: (error) => {
        console.error('Failed to create category:', error);

        this.toast.show(
          this.errorText(error, 'Unable to create this category.'),
          'error',
          5000,
        );

        this.isCreatingCategory = false;
        this.cdr.markForCheck();
      },
    });
  }

  // =========================
  // Image
  // =========================

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    // Falls back to null so cancelling the picker clears the selection.
    this.selectedImage = input.files?.[0] ?? null;
  }

  onVideoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    // Video is optional: cancelling the picker clears it back to null.
    this.selectedVideo = input.files?.[0] ?? null;
  }

  // =========================
  // Validation Helpers
  // =========================

  hasError(controlName: string): boolean {
    const control = this.eventForm.get(controlName);

    return !!(
      control &&
      control.invalid &&
      (control.touched || this.submitted)
    );
  }

  getErrorMessage(controlName: string): string {
    const control = this.eventForm.get(controlName);

    if (!control || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      const messages: Record<string, string> = {
        title: 'Event title is required.',

        host_name: 'Host name is required.',

        description: 'Description is required.',

        location: 'Event location is required.',

        event_date: 'Event date is required.',

        event_time: 'Event time is required.',

        duration: 'Event duration is required.',

        event_type: 'Please select an event type.',

        category_ids: 'Please select at least one category.',
      };

      return messages[controlName] ?? 'This field is required.';
    }

    return 'Please enter a valid value.';
  }

  // =========================
  // Submit
  // =========================

  // publish = false saves a draft, publish = true makes the event public.
  onSubmit(publish = false): void {
    this.submitted = true;
    this.formError = '';

    this.eventForm.markAllAsTouched();
    if (this.eventForm.invalid) {
      const missing = this.invalidFieldLabels();

      this.formError = missing.length
        ? `Please fix: ${missing.join(', ')}.`
        : 'Please complete all required fields before creating your event.';

      this.scrollToFirstError();
      return;
    }

    if (!this.selectedImage) {
      this.formError = 'Please upload an event image.';
      return;
    }

    this.isSubmitting = true;
    this.submitMode = publish ? 'publish' : 'draft';

    const formValue = this.eventForm.getRawValue();

    const payload: CreateEventModel = {
      title: formValue.title!.trim(),
      host_name: formValue.host_name!.trim(),
      description: formValue.description!.trim(),
      location: formValue.location!.trim(),
      event_date: this.buildEventDate(
        formValue.event_date!,
        formValue.event_time!,
      ),
      duration: formValue.duration!.trim(),
      event_type: formValue.event_type as 'free' | 'paid',
      status: publish ? 'published' : 'draft',
      featured: false,
      category_ids: formValue.category_ids ?? [],
      ticket_types: formValue.ticket_types.map(
        (ticket): CreateTicketTypeModel => ({
          name: ticket['name']!.trim(),
          price: Number(ticket['price']),
          total_quantity: Number(ticket['total_quantity']),
        }),
      ),
    };

    const event$ = this.createdEventId
      ? of(this.createdEventId)
      : this.eventService
          .createEvent(payload, this.selectedImage, this.selectedVideo)
          .pipe(
            tap((created) => (this.createdEventId = created.uuid)),
            map((created) => created.uuid),
          );

    event$
      .pipe(
        switchMap((id) =>
          publish
            ? this.eventService.publishEvent(id).pipe(map(() => id))
            : of(id),
        ),
      )
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.submitMode = null;
          this.createdEventId = null;
          this.cdr.markForCheck();

          this.toast.show(
            publish ? 'Event published.' : 'Draft saved.',
            'success',
          );
          this.router.navigate(['/events/organizer/manage-events']);
        },

        error: (error) => {
          console.error('Create or publish failed:', error);

          // Missing fields stay on the form as an inline message. Problems
          // reported by the server are shown as a toast.
          this.formError = '';

          this.toast.show(
            this.createdEventId
              ? `Your event was saved as a draft, but it could not be published: ${this.errorText(error, 'please try again')}`
              : this.errorText(
                  error,
                  'Something went wrong while creating your event.',
                ),
            'error',
            6000,
          );

          this.isSubmitting = false;
          this.submitMode = null;
          this.cdr.markForCheck();
        },
      });
  }

  private readonly fieldLabels: Record<string, string> = {
    title: 'Title',
    host_name: 'Host name',
    description: 'Description',
    location: 'Location',
    event_date: 'Date',
    event_time: 'Time',
    duration: 'Duration',
    event_type: 'Event type',
    category_ids: 'Category',
  };

  private invalidFieldLabels(): string[] {
    const labels = Object.entries(this.fieldLabels)
      .filter(([name]) => this.eventForm.get(name)?.invalid)
      .map(([, label]) => label);

    if (this.ticketTypes.invalid) {
      labels.push('Ticket details');
    }

    return labels;
  }

  private scrollToFirstError(): void {
    setTimeout(() => {
      const field = document.querySelector<HTMLElement>(
        'input.ng-invalid, textarea.ng-invalid, select.ng-invalid',
      );

      field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      field?.focus({ preventScroll: true });
    }, 0);
  }

  private errorText(error: any, fallback: string): string {
    const detail = error?.error?.detail;

    if (typeof detail === 'string') {
      return detail;
    }

    if (Array.isArray(detail) && detail.length > 0) {
      return detail
        .map((d) => `${(d.loc ?? []).slice(1).join('.') || 'field'}: ${d.msg}`)
        .join(' | ');
    }

    return error?.error?.message ?? fallback;
  }

  private buildEventDate(date: Date, time: string): string {
    const [hours, minutes] = time.split(':').map(Number);

    const eventDate = new Date(date);

    eventDate.setHours(hours, minutes, 0, 0);

    return eventDate.toISOString();
  }
}
