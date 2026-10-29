import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart-service/cart-service';
import { CartItem } from '../../app-model/model';
import { FeatureCard } from '../../shared/components/feature-card/feature-card';

@Component({
  selector: 'app-queue',
  imports: [DatePipe, RouterLink, FeatureCard],
  templateUrl: './queue.html',
  styleUrl: './queue.css',
})
export class Queue implements OnInit {
  private cartService = inject(CartService);
  private router = inject(Router);

  items = signal<CartItem[]>([]);
  isLoading = signal(true);
  loadError = signal('');

  totalItems = computed(() =>
    this.items().reduce((sum, i) => sum + i.quantity, 0),
  );

  ngOnInit(): void {
    this.loadQueue();
  }

  loadQueue(): void {
    this.isLoading.set(true);
    this.loadError.set('');
    this.cartService.getCart().subscribe({
      next: (items) => {
        this.items.set(items);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load queue:', error);
        this.loadError.set('We could not load your queue. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  removeItem(item: CartItem): void {
    this.cartService.removeFromCart(item.uuid).subscribe({
      next: () =>
        this.items.update((list) => list.filter((i) => i.uuid !== item.uuid)),
      error: () => console.error('Failed to remove item'),
    });
  }

  goToPayment(item: CartItem): void {
    this.router.navigate(['/payment'], { queryParams: { cart: item.uuid } });
  }

  formatAmount(item: CartItem): string {
    const total = item.ticket_type.price * item.quantity;
    return total === 0 ? 'Free' : `₦${total.toLocaleString('en-NG')}`;
  }

  month(iso: string): string {
    return new Date(iso).toLocaleDateString('en-NG', { month: 'short' });
  }

  day(iso: string): string {
    return String(new Date(iso).getDate());
  }

  formsNeeded(item: CartItem): number {
    return item.forms_needed;
  }
}
