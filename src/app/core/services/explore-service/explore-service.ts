import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  EventCategories,
  EventListFilters,
  EventListItem,
  EventModel,
} from '../../../app-model/model';

@Injectable({
  providedIn: 'root',
})
export class ExploreService {
  constructor(private http: HttpClient) {}

  private baseUrl = environment.BASE_URL;

  getEventCategory(): Observable<EventCategories[]> {
    return this.http.get<EventCategories[]>(`${this.baseUrl}/categories/`);
  }

  getEvent(eventId: string): Observable<EventModel> {
    return this.http.get<EventModel>(`${this.baseUrl}/events/${eventId}`);
  }

  getEvents(filters: EventListFilters): Observable<EventListItem[]> {
    let params = new HttpParams();

    if (filters.search) {
      params = params.set('search', filters.search);
    }

    if (filters.location) {
      params = params.set('location', filters.location);
    }

    if (filters.category_id) {
      params = params.set('category_id', filters.category_id);
    }

    if (filters.event_type) {
      params = params.set('event_type', filters.event_type);
    }

    if (filters.featured) {
      params = params.set('featured', filters.featured);
    }

    return this.http.get<EventListItem[]>(`${this.baseUrl}/events/`, {
      params: params,
    });
  }
}
