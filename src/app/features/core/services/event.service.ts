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
  bannerImageUrl?: string | null;
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
  registrationWorkflowSteps?: EventRegistrationWorkflowStep[];
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
  bannerImageUrl?: string;
  highlights?: string[];
  agenda?: EventAgendaItem[];
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  startAt?: string;
  endAt?: string | null;
  timezone?: string;
  registrationWorkflowSteps?: EventRegistrationWorkflowStepInput[];
}

export type EventWorkflowRecipientType = 'REGISTRANT' | 'ADMIN';
export type EventWorkflowStepType = 'SEND_MESSAGE' | 'DELAY' | 'CONDITION';
export type EventWorkflowConditionType = 'CONTACT_HAS_EMAIL' | 'CONTACT_HAS_PHONE';

export interface EventRegistrationWorkflowStep {
  id?: number;
  messageId?: number | null;
  messageTitle?: string | null;
  messageChannel?: string | null;
  stepType?: EventWorkflowStepType;
  recipientType?: EventWorkflowRecipientType;
  delayMinutes?: number | null;
  conditionType?: EventWorkflowConditionType | null;
  conditionValue?: string | null;
  position?: number | null;
  enabled?: boolean;
  recipientEmails?: string | null;
}

export interface EventRegistrationWorkflowStepInput {
  messageId?: number | null;
  stepType?: EventWorkflowStepType;
  recipientType?: EventWorkflowRecipientType;
  delayMinutes?: number | null;
  conditionType?: EventWorkflowConditionType | null;
  conditionValue?: string | null;
  position?: number | null;
  enabled?: boolean;
  recipientEmails?: string | null;
}

// ── Statistiques d'inscription ───────────────────────────────────────────────

export interface DailyRegistrationCount {
  date: string;  // "yyyy-MM-dd"
  count: number;
}

export interface EventRegistrationStats {
  totalRegistrations: number;
  activeRegistrations: number;
  // Fenêtre 7 jours
  newLast7Days: number;
  previous7Days: number;
  growthRateWeek: number;
  // Fenêtre 30 jours
  newLast30Days: number;
  previous30Days: number;
  growthRateMonth: number;
  // Dernière inscription
  lastRegistrationAt?: string;
  // Tendance journalière (60 jours)
  dailyTrend: DailyRegistrationCount[];
  // Répartitions
  countByCivility: Record<string, number>;
  countByAgeRange: Record<string, number>;
  countByCountry: Record<string, number>;
  countByLanguage: Record<string, number>;
  countByProfession: Record<string, number>;
  // Champs pour le filtre dynamique
  newInPeriod: number;
  previousPeriodCount: number;
  growthRatePeriod: number;
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

  private getToken(): string | null {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
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

  /** Charge initiale des statistiques d'inscription (REST) */
  getEventRegistrationStats(id: number, from?: string, to?: string): Observable<EventRegistrationStats> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to)   params = params.set('to', to);
    return this.http.get<EventRegistrationStats>(
      `${this.apiUrl}/${id}/registration-stats`,
      { params, headers: this.getAuthHeaders() }
    );
  }

  /**
   * Flux SSE des statistiques d'inscription.
   * Se déclenche uniquement lorsqu'une inscription survient côté backend.
   * Le teardown ferme proprement le EventSource à la destruction du composant.
   */
  streamEventRegistrationStats(id: number): Observable<EventRegistrationStats> {
    return new Observable<EventRegistrationStats>(observer => {
      const token = this.getToken();
      const url = `${this.apiUrl}/${id}/registration-stats/stream${token ? '?token=' + encodeURIComponent(token) : ''}`;
      const source = new EventSource(url);

      source.onmessage = (event: MessageEvent) => {
        try {
          observer.next(JSON.parse(event.data) as EventRegistrationStats);
        } catch {
          // payload malformé, on ignore silencieusement
        }
      };

      source.onerror = () => {
        // EventSource gère la reconnexion automatiquement.
        // On ne complete pas l'Observable pour maintenir le flux actif.
        observer.error('sse_error');
      };

      return () => source.close();
    });
  }
}
