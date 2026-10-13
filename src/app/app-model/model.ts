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
  video_url: string;
  organizer: EventOrganizerModel;
  categories: EventCategoryModel[];
  image_url: string | null;
  ticket_types: EventTicketTypeModel[];
  created_at: string;
  updated_at: string;
}

export interface EventOrganizerModel {
  uuid: string;
  first_name: string;
  last_name: string;
  organization: string;
}

export interface EventCategoryModel {
  uuid: string;
  name: string;
  created_at: string;
}

export interface EventTicketTypeModel {
  uuid: string;
  name: string;
  price: number;
  total_quantity: number;
  sold_quantity: number;
  available_quantity: number;
}

export interface EventCategories {
  uuid: string;
  name: string;
  created_at: string;
}

export interface CreateCategory {
  name: string;
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

export interface BookingModel {
  event_id: string;
  ticket_type_id: string;
  quantity: number;
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

export interface UpdateEventModel {
  title?: string;
  host_name?: string;
  description?: string;
  location?: string;
  event_date?: string;
  duration?: string;
  event_type?: string;
  status?: string;
  video_url?: string;
  category_ids?: string[];
}

export interface UpdateTicketTypeModel {
  name?: string;
  price?: number;
  total_quantity?: number;
}
