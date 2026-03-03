import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  PublicEventDetails,
  PublicEventRegistrationRequest,
  PublicEventRegistrationResponse,
} from '../models/public-event';

@Injectable({ providedIn: 'root' })
export class PublicEventService {
  private baseUrl = `${environment.apiUrl}/public/events`;

  constructor(private http: HttpClient) {}

  getEventDetails(slug: string): Observable<PublicEventDetails> {
    return this.http.get<PublicEventDetails>(`${this.baseUrl}/${slug}`);
  }

  register(slug: string, payload: PublicEventRegistrationRequest): Observable<PublicEventRegistrationResponse> {
    return this.http.post<PublicEventRegistrationResponse>(`${this.baseUrl}/${slug}/register`, payload);
  }
}

