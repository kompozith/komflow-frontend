import { Routes } from '@angular/router';

export const ORGANIZATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/organization-settings/organization-settings.component').then(
        m => m.OrganizationSettingsComponent
      ),
    title: 'Mon Organisation',
  },
  {
    path: 'members',
    loadComponent: () =>
      import('./pages/members/members-page.component').then(m => m.MembersPageComponent),
    title: 'Membres',
  },
];
