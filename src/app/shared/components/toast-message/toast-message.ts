import { Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { ToastService } from '../../../core/services/toast-service/toast-service';

@Component({
  selector: 'app-toast-message',
  standalone: true,
  imports: [NgClass],
  template: `
    <div
      class="fixed top-4 right-4 z-9999 flex w-full max-w-sm flex-col gap-2"
      aria-live="polite"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          role="status"
          class="cursor-pointer rounded-lg px-4 py-3 text-sm font-bold shadow-lg transition-all duration-300"
          [ngClass]="{
            'bg-success-dark text-white!': toast.type === 'success',
            'bg-danger-dark text-white!': toast.type === 'error',
            'bg-brand-dark text-white!': toast.type === 'info',
            'bg-accent text-ink!': toast.type === 'warning',
          }"
          (click)="toastService.remove(toast.id)"
        >
          {{ toast.message }}
        </div>
      }
    </div>
  `,
  styles: ``,
})
export class ToastMessage {
  toastService = inject(ToastService);
}
