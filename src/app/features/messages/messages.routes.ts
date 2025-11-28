import { Routes } from '@angular/router';
import { PermissionGuard } from '../../guards/permission.guard';

import { MessageListComponent } from './pages/message-list/message-list.component';
import { MessageCreateComponent } from './pages/message-create/message-create.component';
import { MessageEditComponent } from './pages/message-edit/message-edit.component';
import { MessageDetailsComponent } from './pages/message-details/message-details.component';

export const MessagesRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'list',
        component: MessageListComponent,
        canActivate: [PermissionGuard],
        data: {
          title: 'Message List',
          permissions: ['MESSAGE_LIST'],
          urls: [
            { title: 'Messages', url: 'messages/list' },
            { title: 'All Messages' },
          ],
        },
      },
      {
        path: 'create',
        component: MessageCreateComponent,
        canActivate: [PermissionGuard],
        data: {
          title: 'Create Message',
          permissions: ['MESSAGE_CREATE'],
          urls: [
            { title: 'Messages', url: 'messages/list' },
            { title: 'Create Message' },
          ],
        },
      },
      {
        path: 'edit/:id',
        component: MessageEditComponent,
        canActivate: [PermissionGuard],
        data: {
          title: 'Edit Message',
          permissions: ['MESSAGE_UPDATE'],
          urls: [
            { title: 'Messages', url: 'messages/list' },
            { title: 'Edit Message' },
          ],
        },
      },
      {
        path: 'details/:id',
        component: MessageDetailsComponent,
        canActivate: [PermissionGuard],
        data: {
          title: 'Message Details',
          permissions: ['MESSAGE_SHOW'],
          urls: [
            { title: 'Messages', url: 'messages/list' },
            { title: 'Message Details' },
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
