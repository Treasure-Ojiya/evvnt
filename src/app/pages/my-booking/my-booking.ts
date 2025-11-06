import { Component, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EventCard } from '../../shared/components/event-card/event-card';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-my-booking',
  imports: [DatePipe],
  templateUrl: './my-booking.html',
  styleUrl: './my-booking.css',
})
export class MyBooking {
  bookedEvents = signal<any[]>([
    {
      id: 1,
      title: 'National Health Forum',
      date: new Date(),
      image: '/assets/health.jpg',
      price: 2500,
      description:
        'An annual medical forum connecting professionals across the country.',
    },
    {
      id: 2,
      title: 'Federal Medical Students Meetup',
      date: new Date(),
      image: '/assets/students.jpg',
      price: 0,
      description: 'A free workshop for medical students nationwide.',
    },
  ]);

  constructor(private dialog: MatDialog) {}

  openDetails(event: any) {
    this.dialog.open(EventCard, {
      data: event,
      width: '500px',
      panelClass: 'event-dialog',
    });
  }

  proceedToPayment(event: any) {
    // Navigate to payment page or open payment modal
    console.log('Proceeding to payment for:', event);
  }
}
