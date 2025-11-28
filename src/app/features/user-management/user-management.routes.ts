import { Routes } from '@angular/router';

import { UserListComponent } from './pages/user-list/user-list.component';

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
        path: '',
        redirectTo: 'all-users',
        pathMatch: 'full',
      },
    ],
  },
];