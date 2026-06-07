import { Component, OnDestroy, OnInit, AfterViewInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';

import { FileService } from '../../services/file.service';
import {
  FileFilters,
  FileItem,
  FileListResponse,
  FileMediaType,
  OrphanCleanupResult,
} from '../../models/file';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { SkeletonTableComponent } from 'src/app/shared/components/skeleton-table/skeleton-table.component';
import { MediaPreviewService } from 'src/app/shared/services/media-preview.service';

@Component({
  selector: 'app-files-list',
  templateUrl: './files-list.component.html',
  styleUrls: ['./files-list.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    TablerIconsModule,
    MatMenuModule,
    MatIconModule,
    BadgeComponent,
    SkeletonTableComponent,
  ],
})
export class FilesListComponent implements OnInit, OnDestroy, AfterViewInit {
  private router = inject(Router);
  private fileService = inject(FileService);
  private snackBar = inject(MatSnackBar);
  private mediaPreviewService = inject(MediaPreviewService);

  @ViewChild(MatSort) sort: MatSort | undefined;

  displayedColumns: string[] = [
    'select',
    'preview',
    'name',
    'mediaType',
    'createdAt',
    'actions',
  ];

  dataSource: FileItem[] = [];
  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  pageSize = 8;
  isLoading = false;
  groupedByMediaType: Partial<Record<FileMediaType, number>> = {};

  searchText = '';
  selectedMediaType: FileMediaType | '' = '';
  orphanOnly = false;
  sortBy = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';
  viewMode: 'table' | 'grid' = 'grid';

  selectedFileIds = new Set<number>();

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  FileMediaType = FileMediaType;
  gridSkeletonItems = Array.from({ length: 8 }, (_, i) => i);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngOnInit(): void {
    this.loadFiles();

    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((searchText) => {
        this.searchText = searchText;
        this.loadFiles(0);
      });
  }

  ngAfterViewInit(): void {
    if (this.sort) {
      this.sort.sortChange.subscribe(() => {
        this.sortBy = this.sort?.active || 'createdAt';
        this.sortDirection = this.sort?.direction || 'desc';
        this.loadFiles(this.currentPage);
      });
    }
  }

  get selectedCount(): number {
    return this.selectedFileIds.size;
  }

  get allCurrentPageSelected(): boolean {
    return this.dataSource.length > 0 && this.dataSource.every((file) => this.selectedFileIds.has(file.id));
  }

  get someCurrentPageSelected(): boolean {
    if (this.dataSource.length === 0) {
      return false;
    }
    const selectedOnPage = this.dataSource.filter((file) => this.selectedFileIds.has(file.id)).length;
    return selectedOnPage > 0 && selectedOnPage < this.dataSource.length;
  }

  getStartIndex(): number {
    return this.currentPage * this.pageSize + 1;
  }

  getEndIndex(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  loadFiles(pageIndex: number = this.currentPage): void {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    const filters: FileFilters = {
      page: pageIndex,
      size: this.pageSize,
      sort: [`${this.sortBy},${this.sortDirection}`],
      search: this.searchText || undefined,
      mediaType: this.selectedMediaType || undefined,
      orphanOnly: this.orphanOnly,
    };

    this.fileService.getFiles(filters).subscribe({
      next: (response: FileListResponse) => {
        this.dataSource = response.files.content;
        this.totalElements = response.files.totalElements;
        this.totalPages = response.files.totalPages;
        this.currentPage = response.files.number;
        this.pageSize = response.files.size;
        this.groupedByMediaType = response.groupedByMediaType || {};
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading files:', error);
        this.isLoading = false;
        this.snackBar.open('Error loading files', 'Close', { duration: 3000 });
      },
    });
  }

  onPageChange(event: PageEvent): void {
    const pageIndex = event.pageIndex;
    const newPageSize = event.pageSize;

    if (newPageSize !== this.pageSize) {
      this.pageSize = newPageSize;
      this.loadFiles(0);
      return;
    }

    if (pageIndex !== this.currentPage) {
      this.loadFiles(pageIndex);
    }
  }

  onSearchChange(searchText: string): void {
    this.searchSubject.next(searchText);
  }

  onMediaTypeFilterChange(mediaType: FileMediaType | ''): void {
    this.selectedMediaType = mediaType;
    this.loadFiles(0);
  }

  onOrphanOnlyChange(orphanOnly: boolean): void {
    this.orphanOnly = orphanOnly;
    this.loadFiles(0);
  }

  onViewModeChange(viewMode: 'table' | 'grid'): void {
    this.viewMode = viewMode;
  }

  uploadFiles(): void {
    this.router.navigate(['files/upload']);
  }

  toggleSelectAllCurrentPage(checked: boolean): void {
    if (checked) {
      this.dataSource.forEach((file) => this.selectedFileIds.add(file.id));
    } else {
      this.dataSource.forEach((file) => this.selectedFileIds.delete(file.id));
    }
  }

  toggleFileSelection(fileId: number, checked: boolean): void {
    if (checked) {
      this.selectedFileIds.add(fileId);
    } else {
      this.selectedFileIds.delete(fileId);
    }
  }

  isSelected(fileId: number): boolean {
    return this.selectedFileIds.has(fileId);
  }

  clearSelection(): void {
    this.selectedFileIds.clear();
  }

  bulkDeleteSelected(): void {
    const fileIds = Array.from(this.selectedFileIds);
    if (fileIds.length === 0) {
      this.snackBar.open('No files selected', 'Close', { duration: 2500 });
      return;
    }

    this.fileService.bulkDeleteFiles(fileIds, true).subscribe({
      next: (response) => {
        this.handleDeleteResult(response.data, true);
        this.selectedFileIds.clear();
        this.loadFiles(this.currentPage);
      },
      error: (error) => {
        console.error('Error deleting selected files:', error);
        this.snackBar.open('Bulk delete failed', 'Close', { duration: 3000 });
      },
    });
  }

  deleteOrphans(): void {
    this.fileService.deleteOrphanFiles(this.searchText || undefined, this.selectedMediaType || undefined).subscribe({
      next: (response) => {
        this.handleDeleteResult(response.data, false);
        this.selectedFileIds.clear();
        this.loadFiles(0);
      },
      error: (error) => {
        console.error('Error deleting orphan files:', error);
        this.snackBar.open('Error deleting orphan files', 'Close', { duration: 3000 });
      },
    });
  }

  private handleDeleteResult(result: OrphanCleanupResult, isBulk: boolean): void {
    const skipped = result.skippedReferencedFileIds?.length ?? 0;
    const failed = result.failedFileIds?.length ?? 0;

    const summary = isBulk
      ? `Bulk delete: DB ${result.deletedInDatabase}, storage ${result.deletedInStorage}, skipped ${skipped}, failed ${failed}`
      : `Orphan cleanup: DB ${result.deletedInDatabase}, storage ${result.deletedInStorage}, failed ${failed}`;

    this.snackBar.open(summary, 'Close', { duration: 5000 });
  }

  downloadFile(file: FileItem): void {
    this.fileService.downloadFile(file.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading file:', error);
        this.snackBar.open('Error downloading file', 'Close', { duration: 3000 });
      },
    });
  }

  canPreview(file: FileItem): boolean {
    return (
      file.mediaType === FileMediaType.DOCUMENT ||
      file.mediaType === FileMediaType.IMAGE ||
      file.mediaType === FileMediaType.VIDEO
    );
  }

  previewFile(file: FileItem): void {
    if (!this.canPreview(file)) {
      return;
    }

    if (!this.mediaPreviewService.openInNewTab(file.url)) {
      this.snackBar.open('Unable to open preview in a new tab', 'Close', {
        duration: 3000,
      });
    }
  }

  deleteSingleFile(file: FileItem): void {
    this.fileService.bulkDeleteFiles([file.id], true).subscribe({
      next: (response) => {
        this.handleDeleteResult(response.data, true);
        this.selectedFileIds.delete(file.id);
        this.loadFiles(this.currentPage);
      },
      error: (error) => {
        console.error('Error deleting file:', error);
        this.snackBar.open('Delete failed', 'Close', { duration: 3000 });
      },
    });
  }

  isImage(file: FileItem): boolean {
    return file.mediaType === FileMediaType.IMAGE;
  }

  isVideo(file: FileItem): boolean {
    return file.mediaType === FileMediaType.VIDEO;
  }

  getPreviewImageUrl(file: FileItem): string {
    return `${file.url}?thumbnail=true`;
  }

  getFileIcon(file: FileItem): string {
    return this.fileService.getFileIcon(file.mediaType);
  }

  getMediaTypeColor(mediaType: FileMediaType): 'primary' | 'success' | 'warning' | 'error' | 'outline' | 'info' {
    switch (mediaType) {
      case FileMediaType.IMAGE:
        return 'success';
      case FileMediaType.VIDEO:
        return 'info';
      case FileMediaType.AUDIO:
        return 'warning';
      case FileMediaType.DOCUMENT:
        return 'primary';
      case FileMediaType.ARCHIVE:
        return 'outline';
      default:
        return 'outline';
    }
  }

  getMediaTypeCount(mediaType: FileMediaType): number {
    return this.groupedByMediaType[mediaType] ?? 0;
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }
}
