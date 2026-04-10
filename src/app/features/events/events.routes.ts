import { Routes } from '@angular/router';
import { PermissionGuard } from '../../guards/permission.guard';
import { EventListComponent } from './pages/event-list/event-list.component';
import { EventCreateComponent } from './pages/event-create/event-create.component';
import { EventEditComponent } from './pages/event-edit/event-edit.component';
import { EventDetailsComponent } from './pages/event-details/event-details.component';
import { EventWorkflowComponent } from './pages/event-workflow/event-workflow.component';
import { EventStatsComponent } from './pages/event-stats/event-stats.component';

export const EventsRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: EventListComponent,
        canActivate: [PermissionGuard],
        data: {
          title: 'Event Management',
          permissions: ['MESSAGE_LIST'],
          urls: [
            { title: 'Events', url: 'events' },
            { title: 'Manage Events' },
          ],
        },
      },
      {
        path: 'create',
        component: EventCreateComponent,
        canActivate: [PermissionGuard],
        data: {
          title: 'Create Event',
          permissions: ['MESSAGE_CREATE'],
          urls: [
            { title: 'Events', url: 'events' },
            { title: 'Create Event' },
          ],
        },
      },
      {
        path: 'edit/:id',
        component: EventEditComponent,
        canActivate: [PermissionGuard],
        data: {
          title: 'Edit Event',
          permissions: ['MESSAGE_UPDATE'],
          urls: [
            { title: 'Events', url: 'events' },
            { title: 'Edit Event' },
          ],
        },
      },
      {
        path: 'details/:id',
        component: EventDetailsComponent,
        canActivate: [PermissionGuard],
        data: {
          title: 'Event Details',
          permissions: ['MESSAGE_SHOW'],
          urls: [
            { title: 'Events', url: 'events' },
            { title: 'Event Details' },
          ],
        },
      },
      {
        path: 'workflow/:id',
        component: EventWorkflowComponent,
        canActivate: [PermissionGuard],
        data: {
          title: 'Event Workflow',
          permissions: ['MESSAGE_UPDATE'],
          urls: [
            { title: 'Events', url: 'events' },
            { title: 'Workflow' },
          ],
        },
      },
      {
        path: 'details/:id/stats',
        component: EventStatsComponent,
        canActivate: [PermissionGuard],
        data: {
          title: 'Statistiques des inscriptions',
          permissions: ['MESSAGE_SHOW'],
          urls: [
            { title: 'Events', url: 'events' },
            { title: 'Détails', url: 'events/details/:id' },
            { title: 'Statistiques' },
          ],
        },
      },
    ],
  },
];
