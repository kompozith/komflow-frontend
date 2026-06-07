import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CreatePhoneNumberRequest, PhoneNumber } from '../models/person';

@Injectable({
  providedIn: 'root',
})
export class PhoneNumberService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/personnel`;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  addPhoneNumber(personId: number, payload: CreatePhoneNumberRequest): Observable<PhoneNumber> {
    return this.http.post<PhoneNumber>(`${this.apiUrl}/${personId}/phone-numbers`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  getPhoneNumbers(personId: number): Observable<PhoneNumber[]> {
    return this.http.get<PhoneNumber[]>(`${this.apiUrl}/${personId}/phone-numbers`, {
      headers: this.getAuthHeaders()
    });
  }

  updatePhoneNumber(phoneNumberId: number, payload: CreatePhoneNumberRequest): Observable<PhoneNumber> {
    return this.http.put<PhoneNumber>(`${this.apiUrl}/phone-numbers/${phoneNumberId}`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  deletePhoneNumber(phoneNumberId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/phone-numbers/${phoneNumberId}`, {
      headers: this.getAuthHeaders()
    });
  }
}
