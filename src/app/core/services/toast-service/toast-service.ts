import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastsSignal = signal<Toast[]>([]);
  toasts = this.toastsSignal.asReadonly();
  private counter = 0;

  show(message: string, type: Toast['type'] = 'info', duration = 3000) {
    const id = ++this.counter;
    const toast: Toast = { id, message, type, duration };
    this.toastsSignal.update((list) => [...list, toast]);

    setTimeout(() => this.remove(id), duration);
  }

  remove(id: number) {
    this.toastsSignal.update((list) => list.filter((t) => t.id !== id));
  }

  clear() {
    this.toastsSignal.set([]);
  }
}
