import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
   // {
   //   navCap: 'Home',
   // },
   // {
   //   displayName: 'Dashboard',
   //   iconName: 'aperture',
   //   roles: ['ADMIN', 'SUPER_ADMIN'],
   //   route: '/dashboards/dashboard1',
   // },
   {
     navCap: 'Bulk',
   },
   {
      displayName: 'Contacts',
      iconName: 'phone',
      route: 'contacts',
      roles: ['ADMIN', 'SUPER_ADMIN'],
      permissions: ['CONTACT_LIST']
   },
   {
      displayName: 'Tags',
      iconName: 'tag',
      route: 'tags',
      roles: ['ADMIN', 'SUPER_ADMIN'],
      permissions: ['TAG_LIST']
   },
   {
      displayName: 'Messages',
      iconName: 'message-2',
      route: 'messages',
      roles: ['ADMIN', 'SUPER_ADMIN'],
      permissions: ['MESSAGE_LIST']
   },
   {
      displayName: 'Campaigns',
      iconName: 'send',
      route: 'campaigns',
      roles: ['ADMIN', 'SUPER_ADMIN'],
      permissions: ['CAMPAIGN_LIST']
   },
   {
      displayName: 'Event Management',
      iconName: 'calendar-event',
      route: 'events',
      roles: ['ADMIN', 'SUPER_ADMIN'],
      permissions: ['MESSAGE_LIST']
   },
   {
      displayName: 'Calendar',
      iconName: 'calendar-month',
      route: 'apps/calendar',
      roles: ['ADMIN', 'SUPER_ADMIN'],
      permissions: ['MESSAGE_LIST']
   },
   {
     navCap: 'IAM',
   },
   {
     displayName: 'User Management',
     iconName: 'users',
     route: 'user-management',
     roles: ['ADMIN', 'SUPER_ADMIN'],
   },
   {
     displayName: 'Role Management',
     iconName: 'shield-check',
     route: 'roles',
     roles: ['ADMIN', 'SUPER_ADMIN'],
     permissions: ['PERSONNEL_VIEW']
   },
   {
      displayName: 'Audit Log',
      iconName: 'clipboard-list',
      route: 'audit',
   },
   {
     navCap: 'Storage',
   },
   {
      displayName: 'Files',
      iconName: 'file',
      route: 'files',
   },
   {
     navCap: 'Abonnement',
   },
   {
      displayName: 'Mon organisation',
      iconName: 'building',
      route: 'organization',
      roles: ['ADMIN', 'SUPER_ADMIN'],
   },
   {
      displayName: 'Membres',
      iconName: 'users',
      route: 'organization/members',
      roles: ['ADMIN', 'SUPER_ADMIN'],
   },
   {
      displayName: 'Facturation & Quotas',
      iconName: 'credit-card',
      route: 'billing',
      roles: ['ADMIN', 'SUPER_ADMIN'],
   },
];
