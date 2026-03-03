import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export type EventMode = 'ONSITE' | 'ONLINE';

export interface AppEvent {
  id: number;
  title: string;
  slug?: string;
  subtitle?: string | null;
  description?: string | null;
  mode?: EventMode | null;
  location?: string | null;
  address?: string | null;
  meetingUrl?: string | null;
  highlights?: string[] | null;
  agenda?: EventAgendaItem[] | null;
  eventDate?: string | null;
  startDate: string;
  startTime: string;
  endDate?: string | null;
  endTime?: string | null;
  startAt?: string;
  endAt?: string | null;
  timezone?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventAgendaItem {
  time?: string;
  title?: string;
  speaker?: string;
  description?: string;
}

export interface CreateEventRequest {
  title: string;
  subtitle?: string;
  description?: string;
  mode?: EventMode;
  location?: string;
  address?: string;
  meetingUrl?: string;
  highlights?: string[];
  agenda?: EventAgendaItem[];
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  startAt?: string;
  endAt?: string | null;
  timezone?: string;
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

  getEventById(id: number): Observable<AppEvent> {
    return this.http.get<AppEvent>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  updateEvent(id: number, payload: CreateEventRequest): Observable<AppEvent> {
    return this.http.put<AppEvent>(`${this.apiUrl}/${id}`, payload, { headers: this.getAuthHeaders() });
  }

  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}
