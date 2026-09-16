import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { AuthGuard } from './features/authentication/guards/auth.guard';
import { AuthzGuard } from './features/authentication/guards/authz.guard';
import { workspaceGuard } from './features/organization/guards/workspace.guard';
import { WorkspaceService } from './features/organization/services/workspace.service';

// Shared children for both the slug-less tree and the workspace-prefixed
// (`:workspaceSlug/...`) tree below. Keep this the single definition: when the
// two trees drifted apart, a path present in only one of them silently fell
// through to `:workspaceSlug` and was read as a workspace slug.
const protectedChildren = [
  {
    path: 'user-management',
    loadChildren: () =>
      import('./features/user-management/user-management.routes').then(
        (m) => m.UserManagementRoutes
      ),
    data: { roles: ['ADMIN', 'SUPER_ADMIN'] }
  },
  {
    path: 'roles',
    loadChildren: () =>
      import('./features/custom-roles/roles.routes').then(
        (m) => m.RolesRoutes
      ),
    data: { roles: ['ADMIN', 'SUPER_ADMIN'], permissions: ['PERSONNEL_VIEW'] }
  },
  {
    path: 'contacts',
    loadChildren: () =>
      import('./features/contacts/contacts.routes').then(
        (m) => m.ContactsRoutes
      ),
    data: { permissions: ['CONTACT_LIST'] }
  },
  {
    path: 'tags',
    loadChildren: () =>
      import('./features/tags/tags.routes').then(
        (m) => m.TagsRoutes
      ),
    data: { permissions: ['TAG_LIST'] }
  },
  {
    path: 'messages',
    loadChildren: () =>
      import('./features/messages/messages.routes').then(
        (m) => m.MessagesRoutes
      ),
    data: { permissions: ['MESSAGE_LIST'] }
  },
  {
    path: 'events',
    loadChildren: () =>
      import('./features/events/events.routes').then(
        (m) => m.EventsRoutes
      ),
    data: { permissions: ['MESSAGE_LIST'] }
  },
  {
    path: 'campaigns',
    loadChildren: () =>
      import('./features/campaigns/campaigns.routes').then(
        (m) => m.CampaignsRoutes
      ),
    data: { permissions: ['CAMPAIGN_LIST'] }
  },
  {
    path: 'files',
    loadChildren: () =>
      import('./features/files/files.routes').then(
        (m) => m.FilesRoutes
      ),
  },
  {
    path: 'dashboards',
    loadChildren: () =>
      import('./features/dashboards/dashboards.routes').then(
        (m) => m.DashboardsRoutes
      ),
  },

  {
    path: 'forms',
    loadChildren: () =>
      import('./features/forms/forms.routes').then((m) => m.FormsRoutes),
  },
  {
    path: 'charts',
    loadChildren: () =>
      import('./features/charts/charts.routes').then((m) => m.ChartsRoutes),
  },
  {
    path: 'apps',
    loadChildren: () =>
      import('./features/apps/apps.routes').then((m) => m.AppsRoutes),
  },
  {
    path: 'widgets',
    loadChildren: () =>
      import('./features/widgets/widgets.routes').then((m) => m.WidgetsRoutes),
  },
  {
    path: 'tables',
    loadChildren: () =>
      import('./features/tables/tables.routes').then((m) => m.TablesRoutes),
  },
  {
    path: 'datatable',
    loadChildren: () =>
      import('./features/datatable/datatable.routes').then(
        (m) => m.DatatablesRoutes
      ),
  },
  {
    path: 'theme-pages',
    loadChildren: () =>
      import('./features/theme-pages/theme-pages.routes').then(
        (m) => m.ThemePagesRoutes
      ),
  },
  {
    path: 'ui-components',
    loadChildren: () =>
      import('./features/ui-components/ui-components.routes').then(
        (m) => m.UiComponentsRoutes
      ),
  },
  {
    path: 'billing',
    loadChildren: () =>
      import('./features/billing/billing.routes').then(
        (m) => m.BILLING_ROUTES
      ),
  },
  {
    path: 'organization',
    loadChildren: () =>
      import('./features/organization/organization.routes').then(
        (m) => m.ORGANIZATION_ROUTES
      ),
  },
];

export const routes: Routes = [
  {
    // Slug-less tree: /contacts, /messages, ... Used while the user has no
    // workspace yet (FullComponent shows the blocking create-workspace modal
    // as an overlay here) or while workspace selection hasn't resolved.
    //
    // Declared BEFORE the `:workspaceSlug` tree on purpose: `:workspaceSlug`
    // matches any single segment, so it would otherwise capture `/contacts`
    // as the workspace slug "contacts" and this tree would be dead code.
    // The trade-off is that a section name is reserved and cannot be used as
    // a workspace slug.
    path: '',
    canActivateChild: [AuthGuard, workspaceGuard, AuthzGuard],
    component: FullComponent,
    children: [
      {
        path: '',
        pathMatch: 'full' as const,
        // Send the user straight to their own workspace when we already know
        // it, so the slug-less tree stays the transient state it is meant to be.
        redirectTo: () => {
          const slug = inject(WorkspaceService).activeWorkspace()?.orgSlug;
          return slug ? `/${slug}/contacts` : '/contacts';
        },
      },
      ...protectedChildren,
    ],
  },
  {
    // Workspace-prefixed tree: /{workspaceSlug}/contacts, /{workspaceSlug}/messages, ...
    path: ':workspaceSlug',
    canActivateChild: [AuthGuard, workspaceGuard, AuthzGuard],
    component: FullComponent,
    children: [
      {
        path: '',
        redirectTo: 'contacts',
        pathMatch: 'full' as const,
      },
      ...protectedChildren,
    ],
  },
  {
    path: '',
    component: BlankComponent,
    children: [
      {
        path: 'authentication',
        loadChildren: () =>
          import('./features/authentication/authentication.routes').then(
            (m) => m.AuthenticationRoutes
          ),
      },
      {
        path: 'landingpage',
        loadChildren: () =>
          import('./features/theme-pages/landingpage/landingpage.routes').then(
            (m) => m.LandingPageRoutes
          ),
      },
      {
        path: 'front-pages',
        loadChildren: () =>
          import('./features/front-pages/front-pages.routes').then(
            (m) => m.FrontPagesRoutes
          ),
      },
      {
        path: 'event',
        loadChildren: () =>
          import('./features/public-event/public-event.routes').then(
            (m) => m.PublicEventRoutes
          ),
      },
      {
        path: 'accept-invite',
        loadComponent: () =>
          import('./pages/accept-invite/accept-invite.component').then(
            (m) => m.AcceptInviteComponent
          ),
        title: 'Accepter l\'invitation',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'authentication/error',
  },
];
