import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { BillingService, BillingOverview, QuotaUsage } from '../../services/billing.service';

interface QuotaDisplay extends QuotaUsage {
  icon: string;
  color: 'primary' | 'accent' | 'warn';
}

const QUOTA_META: Record<string, { icon: string; color: 'primary' | 'accent' | 'warn' }> = {
  EMAIL:     { icon: 'mail',           color: 'primary' },
  SMS:       { icon: 'message',        color: 'accent'  },
  WHATSAPP:  { icon: 'brand-whatsapp', color: 'accent'  },
  CAMPAIGNS: { icon: 'send',           color: 'primary' },
};

@Component({
  selector: 'app-billing-overview',
  standalone: true,
  imports: [CommonModule, MaterialModule, TablerIconsModule],
  templateUrl: './billing-overview.component.html',
  styleUrls: [],
})
export class BillingOverviewComponent implements OnInit {
  private billingService = inject(BillingService);

  overview: BillingOverview | null = null;
  quotas: QuotaDisplay[] = [];
  loading = true;
  error = false;

  ngOnInit(): void {
    this.billingService.getOverview().subscribe({
      next: (data) => {
        this.overview = data;
        this.quotas = data.quotas.map(q => ({
          ...q,
          icon:  QUOTA_META[q.metric]?.icon  ?? 'chart-bar',
          color: QUOTA_META[q.metric]?.color ?? 'primary',
        }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = true;
      }
    });
  }

  formatPrice(cts: number): string {
    if (cts === 0) return 'Gratuit';
    return `${(cts / 100).toFixed(2)} € / mois`;
  }

  quotaLabel(q: QuotaUsage): string {
    return q.limit < 0 ? `${q.used} / illimité` : `${q.used} / ${q.limit}`;
  }

  quotaPct(q: QuotaUsage): number {
    return q.limit <= 0 ? 0 : Math.min(100, Math.round(q.pct * 100));
  }

  statusClass(status: string): string {
    return { ACTIVE: 'text-success', TRIALING: 'text-info', PAST_DUE: 'text-warning', CANCELED: 'text-danger' }[status] ?? 'text-muted';
  }
}
