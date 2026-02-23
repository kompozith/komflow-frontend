import { Component, OnDestroy, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuditService } from '../../services/audit.service';
import { AuditLog, AuditLogPage, AuditFilters, AuditAction } from '../../models/audit';
import { BadgeComponent, BadgeVariant } from '../../../../shared/components/badge/badge.component';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';

@Component({
  selector: 'app-audit-list',
  templateUrl: './audit-list.component.html',
  styleUrls: ['./audit-list.component.scss'],
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TablerIconsModule,
    CommonModule,
    MatIconModule,
    BadgeComponent,
  ],
})
export class AuditListComponent implements OnInit, OnDestroy {
  logs: AuditLog[] = [];
  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  pageSize = 8;
  isLoading = false;

  searchText = '';
  selectedAction: AuditAction | '' = '';
  selectedResource: string | '' = '';
  dateFrom: Date | null = null;
  dateTo: Date | null = null;
  sortBy = 'timestamp';
  sortDirection: 'asc' | 'desc' = 'desc';

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  AuditAction = AuditAction;
  logSkeletonItems = Array.from({ length: 6 }, (_, i) => i);

  constructor(
      private auditService: AuditService,
      private snackBar: MatSnackBar
    ) {}

  ngOnInit(): void {
    this.loadAuditLogs();

    // Setup search debounce
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchText => {
      this.searchText = searchText;
      this.loadAuditLogs(0);
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  getStartIndex(): number {
    return this.totalElements === 0 ? 0 : (this.currentPage * this.pageSize) + 1;
  }

  getEndIndex(): number {
    const endIndex = (this.currentPage + 1) * this.pageSize;
    return Math.min(endIndex, this.totalElements);
  }

  loadAuditLogs(pageIndex: number = this.currentPage): void {
    if (this.isLoading) {
      return;
    }
    this.isLoading = true;

    const filters: AuditFilters = {
      page: pageIndex,
      size: this.pageSize,
      sort: [`${this.sortBy},${this.sortDirection}`],
      search: this.searchText || undefined,
      action: this.selectedAction || undefined,
      resource: this.selectedResource || undefined,
      dateFrom: this.toIsoInstant(this.dateFrom),
      dateTo: this.toIsoInstant(this.dateTo, true),
    };

    this.auditService.getAuditLogs(filters).subscribe({
       next: (response: AuditLogPage) => {
         this.logs = response.content;
         this.totalElements = response.totalElements;
         this.totalPages = response.totalPages;
         this.currentPage = response.number;
         this.pageSize = response.size;
         this.isLoading = false;
       },
      error: (error) => {
        console.error('Error loading audit logs:', error);
        this.snackBar.open('Error loading audit logs', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }


  onPageChange(event: PageEvent): void {
    const pageIndex = event.pageIndex;
    const newPageSize = event.pageSize;

    if (newPageSize !== this.pageSize) {
      this.pageSize = newPageSize;
      this.loadAuditLogs(0);
      return;
    }

    if (pageIndex !== this.currentPage) {
      this.loadAuditLogs(pageIndex);
    }
  }

  onSearchChange(searchText: string): void {
    this.searchSubject.next(searchText);
  }

  onActionFilterChange(action: AuditAction | ''): void {
    this.selectedAction = action;
    this.loadAuditLogs(0);
  }

  onResourceFilterChange(resource: string | ''): void {
    this.selectedResource = resource;
    this.loadAuditLogs(0);
  }

  onDateRangeChange(): void {
    this.loadAuditLogs(0);
  }

  onSortChange(sortBy: string): void {
    if (this.sortBy === sortBy) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortDirection = sortBy === 'timestamp' ? 'desc' : 'asc';
    }
    this.loadAuditLogs(0);
  }

  onSortDirectionChange(direction: 'asc' | 'desc'): void {
    if (this.sortDirection === direction) {
      return;
    }
    this.sortDirection = direction;
    this.loadAuditLogs(0);
  }

  getActionColor(action: AuditAction | string): BadgeVariant {
    return this.auditService.getActionColor(action);
  }

  getActionIcon(action: AuditAction | string): string {
    return this.auditService.getActionIcon(action);
  }

  getResourceDisplayName(resource: string): string {
    return this.auditService.getResourceDisplayName(resource);
  }

  getActionLabel(action: AuditAction | string): string {
    return this.auditService.formatActionLabel(action);
  }

  getUserInitial(log: AuditLog): string {
    const value = (log.username || log.userId || 'S').trim();
    return value.charAt(0).toUpperCase();
  }

  trackByLogId(_: number, item: AuditLog): string | number {
    return item.id;
  }

  private toIsoInstant(value?: string | Date | null, endOfDay: boolean = false): string | undefined {
    if (!value) {
      return undefined;
    }

    const parsed = value instanceof Date ? new Date(value.getTime()) : new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return undefined;
    }

    if (endOfDay) {
      parsed.setHours(23, 59, 59, 999);
    }
    return parsed.toISOString();
  }

  exportAuditLogs(): void {
    this.snackBar.open('Export functionality coming soon!', 'Close', { duration: 3000 });
  }
}
