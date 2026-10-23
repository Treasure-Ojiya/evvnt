import { Component, inject, OnInit } from '@angular/core';
import { OrganizerService } from '../../../../core/services/organizer-service/organizer-service';
import { BookingOrderIdAttendees } from '../../../../app-model/model';

@Component({
  selector: 'app-orders',
  imports: [],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders implements OnInit {
  private organizerService = inject(OrganizerService);

  orderAttendees: BookingOrderIdAttendees[] = [];

  ngOnInit(): void {
    // TODO: call getBookingOrders / getOrderAttendees as appropriate
  }

  // Fetch the list of booking orders for the organizer
  getBookingOrders(eventId: string): void {
    this.organizerService.getEventOrders(eventId).subscribe({
      next: (orders) => {
        console.log('Booking Orders:', orders);
        // Handle the booking orders as needed
      },
      error: (error) => {
        console.error('Error fetching booking orders:', error);
      },
    });
  }

  // Fetch the attendees for a specific booking order
  getOrderAttendees(orderId: string): void {
    this.organizerService.getEventOrderAttendees(orderId).subscribe({
      next: (attendees) => {
        console.log('Order Attendees:', attendees);
        this.orderAttendees = attendees;
      },
      error: (error) => {
        console.error('Error fetching order attendees:', error);
      },
    });
  }
}
