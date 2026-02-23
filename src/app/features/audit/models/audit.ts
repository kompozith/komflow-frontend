// src/app/features/audit/models/audit.ts

export interface AuditLog {
  id: string | number;
  timestamp: string;
  userId?: string;
  username?: string;
  action: AuditAction | string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  channel?: string;
  userLocation?: string;
  success: boolean;
}

export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  FILE_UPLOAD = 'FILE_UPLOAD',
  FILE_DOWNLOAD = 'FILE_DOWNLOAD',
  CAMPAIGN_SEND = 'CAMPAIGN_SEND',
  CAMPAIGN_CANCEL = 'CAMPAIGN_CANCEL',
  BULK_OPERATION = 'BULK_OPERATION',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  SETTINGS_CHANGE = 'SETTINGS_CHANGE',
  OTHER = 'OTHER'
}

export interface AuditLogPage {
  totalElements: number;
  totalPages: number;
  size: number;
  content: AuditLog[];
  number: number;
  sort: any;
  numberOfElements: number;
  pageable: any;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface AuditFilters {
  page?: number;
  size?: number;
  sort?: string[];
  search?: string;
  userId?: string;
  username?: string;
  action?: AuditAction | string;
  resource?: string;
  resourceId?: string;
  dateFrom?: string;
  dateTo?: string;
  ipAddress?: string;
}

export interface AuditStats {
  totalLogs: number;
  logsByAction: { [key in AuditAction]: number };
  logsByResource: { [key: string]: number };
  recentActivity: number;
  failedOperations: number;
  topUsers: Array<{ userId: string; username: string; count: number }>;
}

export interface AuditExportRequest {
  filters: AuditFilters;
  format: 'CSV' | 'JSON' | 'PDF';
  includeMetadata: boolean;
}
