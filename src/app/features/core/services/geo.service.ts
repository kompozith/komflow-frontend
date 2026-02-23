import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface GeoCountry {
  code: string;
  name: string;
}

export interface GeoCity {
  name: string;
  timezone: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeoService {
  private apiUrl = `${environment.apiUrl}/geo`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return new HttpHeaders({
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  getCountries(): Observable<GeoCountry[]> {
    return this.http.get<GeoCountry[]>(`${this.apiUrl}/countries`, { headers: this.getAuthHeaders() });
  }

  getCitiesByCountry(countryCode: string): Observable<GeoCity[]> {
    return this.http.get<GeoCity[]>(`${this.apiUrl}/countries/${countryCode}/cities`, { headers: this.getAuthHeaders() });
  }
}
