import {
  Component,
  ViewChild,
  OnInit,
} from '@angular/core';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { RoleService } from '../../services/role.service';
import { Role, RoleFilters } from '../../models/role';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { BadgeComponent, BadgeVariant } from '../../../../shared/components/badge/badge.component';
import { MatDialog } from '@angular/material/dialog';
import { CreateRoleDialogComponent } from './create-role-dialog/create-role-dialog.component';
import { EditRoleDialogComponent } from './edit-role-dialog/edit-role-dialog.component';
import { DeleteRoleDialogComponent } from './delete-role-dialog/delete-role-dialog.component';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog/confirm-delete-dialog.component';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-roles-list',
  templateUrl: './roles-list.component.html',
  styleUrl: './roles-list.component.scss',
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TablerIconsModule,
    CommonModule,
    MatMenuModule,
    MatIconModule,
    BadgeComponent,
  ],
})
export class RolesListComponent implements OnInit {
  @ViewChild(MatTable, { static: true }) table: MatTable<any> = Object.create(null);
  @ViewChild(MatPaginator) paginator: MatPaginator | undefined;

  displayedColumns: string[] = [
    'rowNumber',
    'name',
    'type',
    'policyCount',
    'status',
    'actions',
  ];

  dataSource = new MatTableDataSource<Role>([]);
  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  pageSize = 10;
  isLoading = false;

  searchText = '';
  selectedStatus: 'active' | 'inactive' | '' = '';
  selectedType: 'system' | 'custom' | '' = '';
  sortBy = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  private searchSubject = new Subject<string>();

  constructor(
    public dialog: MatDialog,
    private roleService: RoleService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRoles();

    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((searchText) => {
        this.searchText = searchText;
        this.loadRoles(0);
      });
  }

  getRoleTypeVariant(isSystem: boolean): BadgeVariant {
    return isSystem ? 'info' : 'warning';
  }

  getRoleStatusVariant(isActive: boolean): BadgeVariant {
    return isActive ? 'success' : 'error';
  }

  getStartIndex(): number {
    return this.totalElements === 0 ? 0 : (this.currentPage * this.pageSize) + 1;
  }

  getEndIndex(): number {
    const endIndex = (this.currentPage + 1) * this.pageSize;
    return Math.min(endIndex, this.totalElements);
  }

  viewRoleDetails(role: Role): void {
    this.router.navigate(['/roles/details', role.id]);
  }

  createRole(): void {
    const dialogRef = this.dialog.open(CreateRoleDialogComponent, {
      width: '520px',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.event === 'Create') {
        this.loadRoles(0);
      }
    });
  }

  editRole(role: Role): void {
    if (role.isSystem) {
      this.snackBar.open('System roles cannot be modified', 'Close', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(EditRoleDialogComponent, {
      data: { role },
      width: '520px',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.event === 'Update') {
        this.loadRoles(this.currentPage);
      }
    });
  }

  openDialog(role: Role): void {
    if (role.isSystem) {
      this.snackBar.open('System roles cannot be modified', 'Close', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(DeleteRoleDialogComponent, {
      data: { role },
      width: '420px',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.event === 'ConfirmDelete') {
        this.openConfirmDeleteDialog(result.role as Role);
      }
    });
  }

  openConfirmDeleteDialog(role: Role): void {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: { role },
      width: '520px',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.event === 'Delete') {
        this.getDeletedById(role.id);
      }
    });
  }

  getDeletedById(id: string): void {
    this.roleService.deleteRole(id).subscribe({
      next: () => {
        this.loadRoles(this.currentPage);
        this.snackBar.open('Role deleted successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error deleting role:', error);
        this.snackBar.open('Error deleting role', 'Close', { duration: 3000 });
      },
    });
  }

  loadRoles(pageIndex: number = this.currentPage): void {
    this.isLoading = true;

    const filters: RoleFilters = {
      page: pageIndex,
      size: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection,
      search: this.searchText || undefined,
      isActive:
        this.selectedStatus === 'active'
          ? true
          : this.selectedStatus === 'inactive'
          ? false
          : undefined,
      isSystem:
        this.selectedType === 'system'
          ? true
          : this.selectedType === 'custom'
          ? false
          : undefined,
    };

    this.roleService.getRoles(filters).subscribe({
      next: (response) => {
        this.dataSource.data = response.content || [];
        this.totalElements = response.totalElements || 0;
        this.totalPages = response.totalPages || 0;
        this.currentPage = response.number ?? pageIndex;
        this.pageSize = response.size || this.pageSize;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        this.dataSource.data = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.currentPage = 0;
        this.isLoading = false;
        this.snackBar.open('Unable to load roles from backend permissions.', 'Close', {
          duration: 4000,
        });
      },
    });
  }

  onPageChange(event: PageEvent): void {
    const pageIndex = event.pageIndex;
    const newPageSize = event.pageSize;

    if (newPageSize !== this.pageSize) {
      this.pageSize = newPageSize;
      this.loadRoles(0);
      return;
    }

    this.loadRoles(pageIndex);
  }

  onSearchChange(searchText: string): void {
    this.searchSubject.next(searchText);
  }

  onStatusFilterChange(status: string): void {
    this.selectedStatus = status as 'active' | 'inactive' | '';
    this.loadRoles(0);
  }

  onTypeFilterChange(type: string): void {
    this.selectedType = type as 'system' | 'custom' | '';
    this.loadRoles(0);
  }

  onSortChange(sortBy: string): void {
    if (this.sortBy === sortBy) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortDirection = 'asc';
    }

    this.loadRoles(0);
  }

  onStatusToggle(role: Role, event: MatSlideToggleChange): void {
    if (role.isSystem) {
      event.source.checked = true;
      return;
    }

    const previous = role.isActive;
    role.isActive = event.checked;

    this.roleService.updateRole(role.id, { isActive: event.checked }).subscribe({
      next: () => {
        this.snackBar.open('Role status updated', 'Close', { duration: 2500 });
      },
      error: (error) => {
        console.error('Error updating role status:', error);
        role.isActive = previous;
        event.source.checked = previous;
        this.snackBar.open('Error updating role status', 'Close', { duration: 3000 });
      },
    });
  }
}
