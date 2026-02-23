import { Routes } from '@angular/router';
import { RolesListComponent } from './pages/roles-list/roles-list.component';
import { RoleDetailsComponent } from './pages/role-details/role-details.component';

export const RolesRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: RolesListComponent,
        data: {
          title: 'Roles & Permissions',
          urls: [
            { title: 'Access Control', url: 'roles' },
            { title: 'Roles & Permissions' },
          ],
        },
      },
      {
        path: 'details/:id',
        component: RoleDetailsComponent,
        data: {
          title: 'Role Details',
          urls: [
            { title: 'Access Control', url: 'roles' },
            { title: 'Role Details' },
          ],
        },
      },
    ],
  },
];
