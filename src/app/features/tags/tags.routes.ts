import { Routes } from '@angular/router';
import { PermissionGuard } from '../../guards/permission.guard';

import { TagListComponent } from './pages/tag-list/tag-list.component';

export const TagsRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: TagListComponent,
        canActivate: [PermissionGuard],
        data: {
          title: 'Tag List',
          permissions: ['TAG_LIST'],
          urls: [
            { title: 'Tags', url: 'tags' },
            { title: 'All Tags' },
          ],
        },
      },
    ],
  },
];
