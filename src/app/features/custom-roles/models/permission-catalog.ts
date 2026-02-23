import { PermissionEntry } from './role';

export const PERMISSION_CATALOG: PermissionEntry[] = [
  { code: 'TAG_LIST', name: 'Tags list', description: 'List all tags', resource: 'tags' },
  { code: 'TAG_CREATE', name: 'Tag create', description: 'Create a tag', resource: 'tags' },
  { code: 'TAG_SHOW', name: 'Tag show', description: 'Show a tag details', resource: 'tags' },
  { code: 'TAG_UPDATE', name: 'Tag edit', description: 'Edit a tag', resource: 'tags' },
  { code: 'TAG_DELETE', name: 'Tag delete', description: 'Delete a tag', resource: 'tags' },
  { code: 'CONTACT_LIST', name: 'Contact list', description: 'List all contacts', resource: 'contacts' },
  { code: 'CONTACT_SHOW', name: 'Contact details', description: 'Show a contact details', resource: 'contacts' },
  { code: 'CONTACT_CREATE', name: 'Contact create', description: 'Create a contact', resource: 'contacts' },
  { code: 'CONTACT_UPDATE', name: 'Contact edit', description: 'Edit a contact', resource: 'contacts' },
  { code: 'CONTACT_DELETE', name: 'Contact delete', description: 'Delete a contact', resource: 'contacts' },
  { code: 'MESSAGE_LIST', name: 'Message list', description: 'List all messages', resource: 'messages' },
  { code: 'MESSAGE_SHOW', name: 'Message details', description: 'Show a message details', resource: 'messages' },
  { code: 'MESSAGE_CREATE', name: 'Message create', description: 'Create a message', resource: 'messages' },
  { code: 'MESSAGE_UPDATE', name: 'Message edit', description: 'Edit a message', resource: 'messages' },
  { code: 'MESSAGE_DELETE', name: 'Message delete', description: 'Delete a message', resource: 'messages' },
  { code: 'MESSAGE_SEND_TO_CONTACT', name: 'Message send to contact', description: 'Send message to one contact', resource: 'messages' },
  { code: 'MESSAGE_SEND_TO_TAG', name: 'Message send to tag', description: 'Send message to tag contacts', resource: 'messages' },
  { code: 'CAMPAIGN_LIST', name: 'Campaign list', description: 'List all campaigns', resource: 'campaigns' },
  { code: 'CAMPAIGN_SHOW', name: 'Campaign details', description: 'Show a campaign details', resource: 'campaigns' },
  { code: 'CAMPAIGN_CREATE', name: 'Campaign create', description: 'Create a campaign', resource: 'campaigns' },
  { code: 'CAMPAIGN_UPDATE', name: 'Campaign edit', description: 'Edit a campaign', resource: 'campaigns' },
  { code: 'CAMPAIGN_DELETE', name: 'Campaign delete', description: 'Delete a campaign', resource: 'campaigns' },
  { code: 'CAMPAIGN_SUBMIT', name: 'Campaign submit', description: 'Submit a campaign', resource: 'campaigns' },
  { code: 'PERSONNEL_VIEW', name: 'Personnel view', description: 'View personnel information', resource: 'personnel' },
  { code: 'PERSONNEL_MANAGE', name: 'Personnel manage', description: 'Manage personnel information', resource: 'personnel' },
  { code: 'AUDIT_VIEW', name: 'Audit log view', description: 'View audit logs', resource: 'audit' },
  { code: 'AUDIT_EXPORT', name: 'Audit log export', description: 'Export audit logs', resource: 'audit' },
];

export const ALL_PERMISSION_CODES = PERMISSION_CATALOG.map((permission) => permission.code);
