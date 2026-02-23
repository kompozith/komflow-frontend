export type RoleType = 'SYSTEM' | 'CUSTOM';

export interface PermissionEntry {
  code: string;
  name: string;
  description: string;
  resource: string;
}

export interface PermissionPage {
  content: PermissionEntry[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface Role {
  id: string;
  name: string;
  type: RoleType;
  displayName: string;
  description: string;
  systemRole?: string;
  isSystem: boolean;
  isActive: boolean;
  userCount: number;
  policyCount: number;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  permissions?: PermissionEntry[];
}

export interface RoleDetail extends Role {
  policies: Policy[];
  permissions: PermissionEntry[];
  source: 'BACKEND_ROLE_API';
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  policyRule: string;
  type: 'ALLOW' | 'DENY';
  resource: string;
  action: string;
  priority: number;
  isActive: boolean;
  conditionData: string;
  createdAt: string;
  updatedAt: string;
}

export interface RolePage {
  content: Role[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface CreateRoleRequest {
  name: string;
  type?: RoleType;
  displayName?: string;
  description: string;
  policyIds?: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  type?: RoleType;
  displayName?: string;
  description?: string;
  isActive?: boolean;
}

export interface RoleFilters {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  search?: string;
  isActive?: boolean;
  isSystem?: boolean;
}
