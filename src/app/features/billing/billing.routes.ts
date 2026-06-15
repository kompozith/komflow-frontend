import { Routes } from '@angular/router';

export const BILLING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/billing-overview/billing-overview.component').then(
        m => m.BillingOverviewComponent
      ),
    title: 'Facturation & Quotas',
  },
];
