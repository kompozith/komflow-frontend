import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface QuotaUsage {
  metric: string;
  used: number;
  limit: number;
  pct: number;
}

export interface BillingOverview {
  planCode: string;
  planLabel: string;
  subscriptionStatus: string;
  priceMonthlyCtsCents: number;
  quotas: QuotaUsage[];
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/billing`;

  getOverview(): Observable<BillingOverview> {
    return this.http.get<BillingOverview>(`${this.baseUrl}/overview`);
  }
}
