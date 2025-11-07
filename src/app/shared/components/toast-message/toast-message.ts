import { Component, inject } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { ToastService } from '../../../core/services/toast-service';

@Component({
  selector: 'app-toast-message',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="fixed top-4 right-4 flex flex-col gap-2 z-9999">
      @for (toast of toastService.toasts(); track toast.id) {
      <div
        class="rounded-lg shadow-lg px-4 py-3 text-white cursor-pointer transition-all duration-300 hover:scale-105"
        [ngClass]="{
          'bg-green-600': toast.type === 'success',
          'bg-red-600': toast.type === 'error',
          'bg-blue-600': toast.type === 'info',
          'bg-yellow-400 text-black': toast.type === 'warning'
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
