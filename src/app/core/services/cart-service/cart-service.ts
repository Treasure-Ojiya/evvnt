import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  BookingDetailsResponse,
  CartItem,
  CartQueueRequest,
  UpdateCartItemModel,
} from '../../../app-model/model';

/**
 * The cart (shown to people as their queue): tickets they have chosen but
 * not paid for yet. Attendee details can be saved bit by bit.
 */
@Injectable({
  providedIn: 'root',
})
export class CartService {
  private http = inject(HttpClient);
  private baseUrl = environment.BASE_URL;

  // GET /cart/
  getCart(): Observable<CartItem[]> {
    return this.http.get<CartItem[]>(`${this.baseUrl}/cart/`);
  }

  // POST /cart/ (adding the same event and ticket type again updates the quantity)
  addToCart(request: CartQueueRequest): Observable<CartItem> {
    return this.http.post<CartItem>(`${this.baseUrl}/cart/`, request);
  }

  // GET /cart/{cart_item_id}
  getCartItem(cartItemId: string): Observable<CartItem> {
    return this.http.get<CartItem>(`${this.baseUrl}/cart/${cartItemId}`);
  }

  // PATCH /cart/{cart_item_id}: change the quantity and/or save attendee progress
  updateCartItem(
    cartItemId: string,
    changes: UpdateCartItemModel,
  ): Observable<CartItem> {
    return this.http.patch<CartItem>(
      `${this.baseUrl}/cart/${cartItemId}`,
      changes,
    );
  }

  // DELETE /cart/{cart_item_id}
  removeFromCart(cartItemId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/cart/${cartItemId}`);
  }

  // POST /cart/{cart_item_id}/checkout: turns the item into a booking order.
  // Every attendee form must be complete, and the cart item is deleted.
  checkoutCartItem(cartItemId: string): Observable<BookingDetailsResponse> {
    return this.http.post<BookingDetailsResponse>(
      `${this.baseUrl}/cart/${cartItemId}/checkout`,
      {},
    );
  }
}
