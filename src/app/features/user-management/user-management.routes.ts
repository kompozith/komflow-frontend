import { Routes } from '@angular/router';

import { PersonListComponent } from './pages/person-list/person-list.component';

export const UserManagementRoutes: Routes = [
  {
    path: '',
    component: PersonListComponent,
    data: {
      title: 'User Management',
      urls: [{ title: 'User Management' }],
    },
  },
];
