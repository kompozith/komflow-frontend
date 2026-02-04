import { Routes } from '@angular/router';

import { UserListComponent } from './pages/user-list/user-list.component';
import { PersonListComponent } from './pages/person-list/person-list.component';

export const UserManagementRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'all-users',
        component: UserListComponent,
        data: {
          title: 'User List',
          urls: [
            { title: 'User Management', url: 'user-management/all-users' },
            { title: 'All Users' },
          ],
        },
      },
      {
        path: 'persons',
        component: PersonListComponent,
        data: {
          title: 'Persons',
          urls: [
            { title: 'User Management', url: 'user-management/persons' },
            { title: 'Persons' },
          ],
        },
      },
      {
        path: '',
        redirectTo: 'all-users',
        pathMatch: 'full',
      },
    ],
  },
];
