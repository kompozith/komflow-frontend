import { Routes } from '@angular/router';
import { PermissionGuard } from '../../guards/permission.guard';

import { AuditListComponent } from './pages/audit-list/audit-list.component';

export const AuditRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: AuditListComponent,
        canActivate: [PermissionGuard],
        data: {
          title: 'Audit Log',
          permissions: ['AUDIT_VIEW', 'AUDIT_LIST', 'PERSONNEL_VIEW'],
          urls: [
            { title: 'Audit', url: 'audit'},
            { title: 'All Logs' },
          ],
        },
      },
    ],
  },
];
