import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
    return this.http.get<PublicEventDetails>(`${this.baseUrl}/${slug}`, { headers: this.buildClientMetadataHeaders() });
  }

  register(slug: string, payload: PublicEventRegistrationRequest): Observable<PublicEventRegistrationResponse> {
    return this.http.post<PublicEventRegistrationResponse>(`${this.baseUrl}/${slug}/register`, payload, {
      headers: this.buildClientMetadataHeaders(),
    });
  }

  private buildClientMetadataHeaders(): HttpHeaders {
    const language = navigator.language || '';
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    return new HttpHeaders({
      ...(language ? { 'X-Language': language } : {}),
      ...(timezone ? { 'X-Timezone': timezone } : {}),
    });
  }
}
