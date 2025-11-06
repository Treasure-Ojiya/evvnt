import { Component, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-event-list',
  imports: [DatePipe],
  templateUrl: './event-list.html',
  styleUrl: './event-list.css',
})
export class EventList {
  // All events
  events = [
    {
      id: 1,
      title: 'National Health Forum',
      image: '/assets/hero-2.jpg',
      date: new Date(),
      price: 2000,
      category: 'Conference',
    },
    {
      id: 2,
      title: 'Medical Students Summit',
      image: '/assets/hero-2.jpg',
      date: new Date(),
      price: 0,
      category: 'Summit',
    },
    {
      id: 3,
      title: 'Healthcare Design Workshop',
      image: '/assets/hero-2.jpg',
      date: new Date(),
      price: 3000,
      category: 'Workshop',
    },
    {
      id: 4,
      title: 'Othello by Shakespeare',
      image: '/assets/hero-2.jpg',
      date: new Date(),
      price: 4000,
      category: 'Theatre',
    },
  ];

  // Filter categories
  categories = ['All', 'Conference', 'Summit', 'Workshop', 'Theatre'];

  // Selected filter category
  selectedCategory = signal('All');

  // Computed filtered events
  get filteredEvents() {
    const cat = this.selectedCategory();
    return cat === 'All'
      ? this.events
      : this.events.filter((e) => e.category === cat);
  }

  // Booking cart
  cart = signal<any[]>([]);

  bookEvent(event: any) {
    const existing = this.cart().find((e) => e.id === event.id);
    if (!existing) this.cart.update((c) => [...c, event]);
  }

  goToBooking() {
    // navigate to booking page
  }

  // Method to change filter
  filterByCategory(category: string) {
    this.selectedCategory.set(category);
  }
}
