import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface OrganizationProfile {
  id: number;
  name: string;
  slug: string;
  planCode: string;
  active: boolean;
  trialEndsAt?: string;
  createdAt: string;
}

export interface UpdateOrganizationRequest {
  name: string;
  slug?: string;
}

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/organizations`;

  getMyOrganization(): Observable<OrganizationProfile> {
    return this.http.get<OrganizationProfile>(`${this.base}/me`);
  }

  updateMyOrganization(req: UpdateOrganizationRequest): Observable<OrganizationProfile> {
    return this.http.put<OrganizationProfile>(`${this.base}/me`, req);
  }
}
