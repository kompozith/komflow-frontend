import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CommonModule } from '@angular/common';
import { RoleService } from '../../services/role.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PermissionEntry, PermissionPage, RoleDetail } from '../../models/role';
import { MatDialog } from '@angular/material/dialog';
import { ManagePoliciesDialogComponent } from './manage-policies-dialog/manage-policies-dialog.component';
import { PageEvent } from '@angular/material/paginator';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { SkeletonTableComponent } from '../../../../shared/components/skeleton-table/skeleton-table.component';

@Component({
  selector: 'app-role-details',
  imports: [
    MaterialModule,
    TablerIconsModule,
    CommonModule,
    SkeletonTableComponent,
  ],
  templateUrl: './role-details.component.html',
})
export class RoleDetailsComponent implements OnInit {
  roleId = '';
  role: RoleDetail | null = null;
  isLoading = true;
  isPermissionsLoading = false;
  selectedResource = 'all';
  searchText = '';
  resources: string[] = ['all'];
  permissions: PermissionEntry[] = [];
  permissionTotalElements = 0;
  permissionTotalPages = 0;
  permissionCurrentPage = 0;
  permissionPageSize = 5;

  displayedPermissionColumns: string[] = [
    'code',
    'name',
    'resource',
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private roleService: RoleService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.roleId = this.route.snapshot.params['id'];

    if (!this.roleId) {
      this.snackBar.open('Role ID not found', 'Close', { duration: 3000 });
      this.router.navigate(['/roles']);
      return;
    }

    this.loadRoleDetails();
  }

  loadRoleDetails(): void {
    this.isLoading = true;

    this.roleService.getRoleById(this.roleId).subscribe({
      next: (role) => {
        this.role = role;
        this.resources = ['all', ...Array.from(new Set((role.permissions || []).map((permission) => permission.resource))).sort()];
        this.loadPermissionsPage(0, this.permissionPageSize);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading role details:', error);
        this.snackBar.open('Error loading role details', 'Close', { duration: 3000 });
        this.isLoading = false;
        this.router.navigate(['/roles']);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/roles']);
  }

  getRoleTypeBadgeClass(isSystem: boolean): string {
    return isSystem
      ? 'bg-light-error text-error rounded-pill f-w-600 p-6 p-y-4 f-s-12'
      : 'bg-light-primary text-primary rounded-pill f-w-600 p-6 p-y-4 f-s-12';
  }

  getRoleStatusBadgeClass(isActive: boolean): string {
    return isActive
      ? 'bg-light-success text-success rounded-pill f-w-600 p-6 p-y-4 f-s-12'
      : 'bg-light-error text-error rounded-pill f-w-600 p-6 p-y-4 f-s-12';
  }

  getPermissionsCount(): number {
    return this.role?.policyCount || 0;
  }

  getFilteredPermissionsCount(): number {
    return this.permissionTotalElements;
  }

  trackPermission(_index: number, item: PermissionEntry): string {
    return item.code;
  }

  onSearchChange(value: string): void {
    this.searchText = value || '';
    this.loadPermissionsPage(0, this.permissionPageSize);
  }

  onResourceChange(resource: string): void {
    this.selectedResource = resource;
    this.loadPermissionsPage(0, this.permissionPageSize);
  }

  openManagePoliciesDialog(): void {
    if (!this.role) {
      return;
    }
    if (this.role.isSystem) {
      this.snackBar.open('System roles cannot be modified', 'Close', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(ManagePoliciesDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      data: {
        roleId: this.role.id,
        currentPolicies: this.role.policies || [],
      },
    });

    dialogRef.afterClosed().subscribe((updated) => {
      if (updated) {
        this.loadRoleDetails();
      }
    });
  }

  onStatusToggle(event: MatSlideToggleChange): void {
    if (!this.role) {
      return;
    }
    if (this.role.isSystem) {
      event.source.checked = true;
      return;
    }

    const previous = this.role.isActive;
    this.role.isActive = event.checked;

    this.roleService.updateRole(this.role.id, { isActive: event.checked }).subscribe({
      next: () => {
        this.snackBar.open('Role status updated', 'Close', { duration: 2500 });
      },
      error: (error) => {
        console.error('Error updating role status:', error);
        this.role!.isActive = previous;
        event.source.checked = previous;
        this.snackBar.open('Error updating role status', 'Close', { duration: 3000 });
      },
    });
  }

  onPermissionsPageChange(event: PageEvent): void {
    this.loadPermissionsPage(event.pageIndex, event.pageSize);
  }

  private loadPermissionsPage(pageIndex: number, pageSize: number): void {
    if (!this.roleId) {
      return;
    }

    this.isPermissionsLoading = true;

    this.roleService.getRolePermissions(this.roleId, {
      page: pageIndex,
      size: pageSize,
      search: this.searchText || undefined,
      category: this.selectedResource === 'all' ? undefined : this.selectedResource,
      sortBy: 'code',
      sortDirection: 'asc',
    }).subscribe({
      next: (response: PermissionPage) => {
        this.permissions = response.content || [];
        this.permissionTotalElements = response.totalElements || 0;
        this.permissionTotalPages = response.totalPages || 0;
        this.permissionCurrentPage = response.number ?? pageIndex;
        this.permissionPageSize = response.size || pageSize;
        this.isPermissionsLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading role permissions:', error);
        this.permissions = [];
        this.permissionTotalElements = 0;
        this.permissionTotalPages = 0;
        this.permissionCurrentPage = 0;
        this.isPermissionsLoading = false;
        this.snackBar.open('Error loading role permissions', 'Close', { duration: 3000 });
      },
    });
  }
}
