import { Routes } from '@angular/router';
import { PermissionGuard } from '../../guards/permission.guard';

import { FilesListComponent } from './pages/files-list/files-list.component';

export const FilesRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'list',
        component: FilesListComponent,
        canActivate: [PermissionGuard],
        data: {
          title: 'Files',
          permissions: ['MESSAGE_LIST'],
          urls: [
            { title: 'Files', url: 'files' },
            { title: 'All Files' },
          ],
        },
      },
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
    ],
  },
];
