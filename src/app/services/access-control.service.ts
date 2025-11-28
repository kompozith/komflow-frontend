import { Injectable } from '@angular/core';
import { PermissionService } from './permission.service';

@Injectable({
  providedIn: 'root'
})
export class AccessControlService {
  constructor(private permissionService: PermissionService) {}

  /**
   * Check if user has a specific role
   */
  hasRole(role: string): boolean {
    return this.permissionService.hasRole(role);
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    return this.permissionService.hasAnyRole(roles);
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(permission: string): boolean {
    return this.permissionService.hasPermission(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(perms: string[]): boolean {
    return this.permissionService.hasAnyPermission(perms);
  }

  /**
    * Access logic:
    * - If user has ANY required role → access granted (role priority)
    * - Else if user has ANY required permission → access granted
    * - Else → denied
   */
  canAccess(config: { roles?: string[], permissions?: string[] }): boolean {
    const { roles, permissions } = config;

    // Check roles if specified
    if (roles && roles.length > 0) {
      if (this.hasAnyRole(roles)) {
        return true;
      }
    }

    // Check permissions if specified
    if (permissions && permissions.length > 0) {
      if (this.hasAnyPermission(permissions)) {
        return true;
      }
    }

    // 3. If neither role nor permission match → deny
    return false;
  }
}