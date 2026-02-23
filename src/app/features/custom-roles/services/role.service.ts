import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  CreateRoleRequest,
  PermissionEntry,
  PermissionPage,
  Policy,
  Role,
  RoleDetail,
  RoleFilters,
  RolePage,
  RoleType,
  UpdateRoleRequest,
} from '../models/role';

interface BackendRoleDto {
  id: number;
  name: string;
  type?: RoleType;
  active?: boolean;
  description?: string;
  permissionCodeList?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface BackendPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

interface BackendPermissionDto {
  code: string;
  name: string;
  description: string;
  category: string;
}

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private apiUrl = `${environment.apiUrl}/roles`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    });
  }

  getRoles(filters: RoleFilters = {}): Observable<RolePage> {
    let params = new HttpParams();
    if (filters.page !== undefined) params = params.set('page', filters.page.toString());
    if (filters.size !== undefined) params = params.set('size', filters.size.toString());
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortDirection) params = params.set('sortDirection', filters.sortDirection);
    if (filters.search) params = params.set('search', filters.search);

    return this.http
      .get<BackendPage<BackendRoleDto>>(this.apiUrl, { params, headers: this.getAuthHeaders() })
      .pipe(
        map((page) => ({
          ...page,
          content: (page.content || []).map((item) => this.mapRole(item)),
        }))
      );
  }

  getRoleById(id: string): Observable<RoleDetail> {
    return this.http
      .get<BackendRoleDto>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(
        switchMap((item) =>
          this.getPolicies().pipe(
            map((catalog) => this.mapRoleDetail(item, catalog))
          )
        )
      );
  }

  createRole(role: CreateRoleRequest): Observable<Role> {
    const payload: BackendRoleDto = {
      id: 0,
      name: role.name,
      type: role.type || 'CUSTOM',
      active: true,
      description: role.description,
      permissionCodeList: role.policyIds || [],
    };

    return this.http
      .post<BackendRoleDto>(this.apiUrl, payload, { headers: this.getAuthHeaders() })
      .pipe(map((item) => this.mapRole(item)));
  }

  updateRole(id: string, role: UpdateRoleRequest): Observable<Role> {
    return this.getRoleById(id).pipe(
      map((existing) => ({
        id: Number(existing.id),
        name: role.name ?? existing.name,
        type: role.type ?? existing.type,
        active: role.isActive ?? existing.isActive,
        description: role.description ?? existing.description,
        permissionCodeList: existing.permissions?.map((permission) => permission.code) || [],
      })),
      switchMap((payload) =>
        this.http.put<BackendRoleDto>(`${this.apiUrl}/${id}`, payload, { headers: this.getAuthHeaders() })
      ),
      map((item) => this.mapRole(item))
    );
  }

  deleteRole(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  getPolicies(resource?: string): Observable<Policy[]> {
    return this.http
      .get<BackendPermissionDto[]>(`${this.apiUrl}/permissions`, { headers: this.getAuthHeaders() })
      .pipe(
        map((permissions) =>
          (permissions || [])
            .filter((permission) => !resource || permission.category?.toLowerCase() === resource.toLowerCase())
            .map((permission) => ({
              id: permission.code,
              name: permission.name || permission.code,
              description: permission.description || '',
              policyRule: permission.code,
              type: 'ALLOW' as const,
              resource: permission.category?.toLowerCase() || 'general',
              action: permission.code,
              priority: 1,
              isActive: true,
              conditionData: '',
              createdAt: '',
              updatedAt: '',
            }))
        )
      );
  }

  getRolePermissions(
    roleId: string,
    filters: {
      page?: number;
      size?: number;
      search?: string;
      category?: string;
      sortBy?: string;
      sortDirection?: 'asc' | 'desc';
    } = {}
  ): Observable<PermissionPage> {
    let params = new HttpParams();
    if (filters.page !== undefined) params = params.set('page', filters.page.toString());
    if (filters.size !== undefined) params = params.set('size', filters.size.toString());
    if (filters.search) params = params.set('search', filters.search);
    if (filters.category && filters.category !== 'all') params = params.set('category', filters.category);
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortDirection) params = params.set('sortDirection', filters.sortDirection);

    return this.http
      .get<BackendPage<BackendPermissionDto>>(`${this.apiUrl}/${roleId}/permissions`, {
        params,
        headers: this.getAuthHeaders(),
      })
      .pipe(
        map((page) => ({
          ...page,
          content: (page.content || []).map((permission) => this.mapBackendPermissionToEntry(permission)),
        }))
      );
  }

  assignPoliciesToRole(roleId: string, policyIds: string[]): Observable<void> {
    return this.http
      .put(`${this.apiUrl}/${roleId}/permissions`, { permissionCodeList: policyIds }, { headers: this.getAuthHeaders() })
      .pipe(map(() => void 0));
  }

  private mapRole(item: BackendRoleDto): Role {
    const permissions = this.toPermissionEntries(item.permissionCodeList || []);
    const roleType: RoleType = item.type || 'CUSTOM';
    return {
      id: `${item.id}`,
      name: item.name,
      type: roleType,
      displayName: item.name,
      description: item.description || '',
      systemRole: roleType,
      isSystem: roleType === 'SYSTEM',
      isActive: item.active ?? true,
      userCount: 0,
      policyCount: permissions.length,
      createdBy: 'system',
      createdByName: 'System',
      createdAt: item.createdAt || '',
      updatedAt: item.updatedAt || '',
      permissions,
    };
  }

  private mapRoleDetail(item: BackendRoleDto, policyCatalog: Policy[]): RoleDetail {
    const base = this.mapRole(item);
    const policyMap = new Map(policyCatalog.map((policy) => [policy.id, policy]));
    const permissions = (base.permissions || []).map((permission) => {
      const policy = policyMap.get(permission.code);
      return {
        code: permission.code,
        name: policy?.name || permission.name,
        description: policy?.description || permission.description,
        resource: policy?.resource || permission.resource,
      };
    });

    const policies = permissions.map((permission) => ({
      id: permission.code,
      name: permission.name,
      description: permission.description,
      policyRule: permission.code,
      type: 'ALLOW' as const,
      resource: permission.resource,
      action: permission.code,
      priority: 1,
      isActive: true,
      conditionData: '',
      createdAt: base.createdAt,
      updatedAt: base.updatedAt,
    }));

    return {
      ...base,
      permissions,
      policies,
      source: 'BACKEND_ROLE_API',
    };
  }

  private toPermissionEntries(permissionCodes: string[]): PermissionEntry[] {
    return (permissionCodes || []).map((code) => ({
      code,
      name: code,
      description: 'Assigned permission',
      resource: code.includes('_') ? code.split('_')[0].toLowerCase() : 'general',
    }));
  }

  private mapBackendPermissionToEntry(permission: BackendPermissionDto): PermissionEntry {
    return {
      code: permission.code,
      name: permission.name || permission.code,
      description: permission.description || '',
      resource: permission.category?.toLowerCase() || 'general',
    };
  }
}
