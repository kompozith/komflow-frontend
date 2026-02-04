import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  CreatePersonRequest,
  Person,
  PersonDetails,
  PersonPage,
  UpdatePersonRequest
} from '../models/person';

@Injectable({
  providedIn: 'root',
})
export class PersonService {
  private apiUrl = `${environment.apiUrl}/personnel/persons`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  getPersons(page: number = 0, size: number = 50, search?: string): Observable<PersonPage> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (search) params = params.set('search', search);
    return this.http.get<PersonPage>(this.apiUrl, { params, headers: this.getAuthHeaders() });
  }

  getPersonById(id: number): Observable<PersonDetails> {
    return this.http.get<PersonDetails>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  createPerson(payload: CreatePersonRequest): Observable<Person> {
    return this.http.post<Person>(this.apiUrl, payload, { headers: this.getAuthHeaders() });
  }

  updatePerson(id: number, payload: UpdatePersonRequest): Observable<Person> {
    return this.http.put<Person>(`${this.apiUrl}/${id}`, payload, { headers: this.getAuthHeaders() });
  }
}
