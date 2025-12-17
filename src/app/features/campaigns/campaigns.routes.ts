import { Routes } from '@angular/router';
import { PermissionGuard } from '../../guards/permission.guard';

import { CampaignListComponent } from './pages/campaign-list/campaign-list.component';
import { CampaignCreateComponent } from './pages/campaign-create/campaign-create.component';

export const CampaignsRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'list',
        component: CampaignListComponent,
        canActivate: [PermissionGuard],
        data: {
          title: 'Campaign List',
          permissions: ['CAMPAIGN_LIST'],
          urls: [
            { title: 'Campaigns', url: 'campaigns/list' },
            { title: 'All Campaigns' },
          ],
        },
      },
      {
        path: 'create',
        component: CampaignCreateComponent,
        canActivate: [PermissionGuard],
        data: {
          title: 'Create Campaign',
          permissions: ['CAMPAIGN_CREATE'],
          urls: [
            { title: 'Campaigns', url: 'campaigns/list' },
            { title: 'Create Campaign' },
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
