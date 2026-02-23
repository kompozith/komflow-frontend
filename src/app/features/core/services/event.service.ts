import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface AppEvent {
  id: number;
  title: string;
  description?: string | null;
  location?: string | null;
  startDate: string;
  startTime: string;
  endDate?: string | null;
  endTime?: string | null;
  startAt?: string;
  endAt?: string | null;
  timezone?: string | null;
  allDay: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  startTime: string;
  endDate?: string | null;
  endTime?: string | null;
  startAt?: string;
  endAt?: string | null;
  timezone?: string;
  allDay?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private apiUrl = `${environment.apiUrl}/events`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    });
  }

  listEvents(rangeStart?: string, rangeEnd?: string): Observable<AppEvent[]> {
    let params = new HttpParams();
    if (rangeStart) params = params.set('rangeStart', rangeStart);
    if (rangeEnd) params = params.set('rangeEnd', rangeEnd);
    return this.http.get<AppEvent[]>(this.apiUrl, { params, headers: this.getAuthHeaders() });
  }

  listFutureEvents(from?: string): Observable<AppEvent[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    return this.http.get<AppEvent[]>(`${this.apiUrl}/future`, { params, headers: this.getAuthHeaders() });
  }

  createEvent(payload: CreateEventRequest): Observable<AppEvent> {
    return this.http.post<AppEvent>(this.apiUrl, payload, { headers: this.getAuthHeaders() });
  }

  updateEvent(id: number, payload: CreateEventRequest): Observable<AppEvent> {
    return this.http.put<AppEvent>(`${this.apiUrl}/${id}`, payload, { headers: this.getAuthHeaders() });
  }

  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}
