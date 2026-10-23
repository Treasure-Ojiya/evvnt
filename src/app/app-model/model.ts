export type AccountType = 'individual' | 'organization';

export interface RegModel {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  password: string;
  account_type: AccountType;
  // Only sent for organization accounts.
  organization?: string;
}

export interface RegResult {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  uuid: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  created_at: string;
  role: string;
}

export interface LoginModel {
  email: string;
  password: string;
}

export interface LoginResult {
  status: string;
  message: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RefreshResult {
  status: string;
  message: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserModel {
  uuid: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone: string;
  created_at: string;
}

export interface UserResult {
  status: string;
  message: string;
}

export interface ForgotPasswordModel {
  email: string;
}

export interface ForgotPasswordResult {
  status: string;
  message: string;
  reset_token: string;
}

export interface ResetPasswordModel {
  token: string;
  new_password: string;
}

export interface ResetPasswordResult {
  status: string;
  message: string;
}

export interface EventListItem {
  uuid: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  duration: string;
  event_type: string;
  status: string;
  featured: boolean;
  tickets_sold: number;
  total_available: number;
  image_url: string | null;
  starting_price?: number | null;
}

export interface EventListFilters {
  search?: string;
  location?: string;
  category_id?: string;
  event_type?: 'free' | 'paid';
  featured?: boolean;
}

// =========================
// Cart (the queue)
// =========================
export interface CartQueueRequest {
  event_id: string;
  ticket_type_id: string;
  quantity: number;
}
// An attendee as saved on a cart item. Partial progress is allowed.
export interface CartAttendee {
  full_name: string;
  email: string;
  phone: string;
}
export interface CartEvent {
  uuid: string;
  title: string;
  location: string;
  event_date: string;
  image_url: string | null;
}

export interface CartTicketType {
  uuid: string;
  name: string;
  price: number;
  available_quantity: number;
}

export interface CartItem {
  uuid: string;
  event: CartEvent;
  ticket_type: CartTicketType;
  quantity: number;
  attendees: CartAttendee[];
  forms_needed: number;
  created_at: string;
  updated_at: string;
}

// Body for PATCH /cart/{cart_item_id}. Both fields are optional.
export interface UpdateCartItemModel {
  quantity?: number;
  attendees?: CartAttendee[];
}

// =========================
// Payment
// =========================
// Body for POST /bookings/. One attendee per ticket.
export interface BookingAttendeeUser {
  full_name: string;
  email: string;
  confirm_email: string; // must match email
  phone: string;
}

export interface BookingModel {
  event_id: string;
  ticket_type_id: string;
  quantity: number;
  attendees: BookingAttendeeUser[];
}

export interface BookingDetailsResponse {
  uuid: string;
  event: BookingDetails;
  ticket_type_id: string;
  quantity: number;
  total_amount: number;
  is_free: boolean;
  status: string;
  created_at: string;
}

export interface BookingDetails {
  uuid: string;
  title: string;
  location: string;
  event_date: string;
  images: string[];
}

export interface BookingPayment {
  uuid: string;
  order_id: string;
  amount: number;
  status: string;
  provider: string;
  reference: string;
  created_at: string;
}

// Response of POST /bookings/{order_id}/pay/paystack.
// Send the user to authorization_url to pay.
export interface PaystackInitResponse {
  order_id: string;
  authorization_url: string;
  access_code: string;
  reference: string;
  amount: number;
  message: string;
}

// Body for POST /bookings/{order_id}/pay.
export interface PayBookingModel {
  provider: string; // for example 'manual'
  reference: string;
}

/////////////////////////////////////////////
// Organizer Admin Models
///To create an event, the organizer must provide the following information.
export interface CreateEventModel {
  title: string;
  host_name: string;
  description: string;
  location: string;
  event_date: string;
  duration: string;
  event_type: 'free' | 'paid';
  status: 'draft' | 'published';
  featured: boolean;
  image_url?: string | null;
  category_ids?: string[]; // keep if backend accepts it
  ticket_types?: CreateTicketTypeModel[];
}
export interface CreateTicketTypeModel {
  name: string;
  price: number;
  total_quantity: number;
}

// Get/Post; An array, used to create an event(as a property in create),
// and in explore to filter events by category; the backend returns an array of EventCategories.
// and event-details to display the category of an event.
export interface EventCategories {
  uuid: string;
  name: string;
  created_at: string;
}

// Body for POST /categories/. This is what the backend expects when creating a new category. For organizers.
export interface CreateCategory {
  name: string;
}

// Body response for details of an event(post/patch). This is what the backend returns when you GET&PATCH /events/...
export interface EventModel {
  uuid: string;
  title: string;
  host_name: string;
  description: string;
  location: string;
  event_date: string;
  duration: string;
  event_type: string;
  status: string;
  featured: boolean;
  organizer: EventOrganizerModel;
  categories: EventCategories[];
  image_url: string | null;
  ticket_types: EventTicketTypeModel[];
  created_at: string;
  updated_at: string;
}

// Ticket type details for an event. Used as property of EventModel and in the event list.
export interface EventTicketTypeModel {
  uuid: string;
  name: string;
  price: number;
  total_quantity: number;
  sold_quantity: number;
  available_quantity: number;
}

//If the event is hosted by an organizer, the organizer's details are included in the event details. If user is registered an organizer
export interface EventOrganizerModel {
  uuid: string;
  first_name: string;
  last_name: string;
  organization: string;
}

// Body for PATCH /events/{event_id}. All fields are optional.
export interface UpdateEventModel {
  title?: string;
  host_name?: string;
  description?: string;
  location?: string;
  event_date?: string;
  duration?: string;
  event_type?: string;
  status?: string;
  category_ids?: string[];
}
export interface UpdateEventImageModel {
  image: File;
}
export interface UpdateTicketTypeModel {
  name?: string;
  price?: number;
  total_quantity?: number;
}

// In order(organizer-layout), the organizer can view the attendees of a booking order.
// Tabular; initiates the modal with a list of attendees for each booking order.
// The backend returns an array of BookingOrderId for each booking order.
// Each booking order has a uuid, event, ticket_type_id, quantity, total_amount,
// is_free, status, and created_at. The event property is an object with uuid,
// title, location, and event_date.
export interface BookingOrderId {
  uuid: string;
  event: BookingPropertyEvent;
  ticket_type_id: string;
  quantity: number;
  total_amount: number;
  is_free: boolean;
  status: string;
  created_at: string;
}

export interface BookingPropertyEvent {
  uuid: string;
  title: string;
  location: string;
  event_date: string;
  // image_url:string | null
}

// In order(organizer-layout), the organizer can view the attendees of a booking order.
// The backend returns an array of BookingOrderIdAttendees for each booking order.
// Each attendee has a uuid, ticket_index, full_name, email, and phone.
// The ticket_index is the index of the ticket in the booking order.
// The full_name, email, and phone are the details of the attendee.
//Opens in a modal
export interface BookingOrderIdAttendees {
  uuid: string;
  ticket_index: string;
  full_name: string;
  email: string;
  phone: string;
}
