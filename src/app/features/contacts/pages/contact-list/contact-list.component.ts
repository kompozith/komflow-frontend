import {
  Component,
  OnInit,
} from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ContactService } from '../../services/contact.service';
import { Contact, ContactFilters } from '../../models/contact';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { DeleteContactDialogComponent } from './delete-contact-dialog/delete-contact-dialog.component';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import {MatTableDataSource} from "@angular/material/table";
import { TagService } from '../../../tags/services/tag.service';
import { Tag } from '../../../tags/models/tag';
import { SkeletonTableComponent } from 'src/app/shared/components/skeleton-table/skeleton-table.component';

@Component({
  selector: 'app-contact-list',
  templateUrl: './contact-list.component.html',
  styleUrls: ['./contact-list.component.scss'],
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TablerIconsModule,
    CommonModule,
    MatMenuModule,
    MatIconModule,
    BadgeComponent,
    SkeletonTableComponent,
  ],
})
export class ContactListComponent implements OnInit {


  displayedColumns: string[] = [
    'rowNumber',
    'name',
    'email',
    'phone',
    'tags',
    'createdAt',
    'actions',
  ];

  dataSource = new MatTableDataSource<Contact>([]);
   totalElements = 0;
   totalPages = 0;
   currentPage = 0;
   pageSize = 10;
  isLoading = false;
  isImporting = false;


  // Filters
  searchText = '';
  selectedTagIds: number[] = [];
  selectedEnabled: boolean | '' = '';
  createdAtFrom: string | null = null;
  createdAtTo: string | null = null;
  availableTags: Tag[] = [];

  // Search debounce
  private searchSubject = new Subject<string>();

  constructor(
      public dialog: MatDialog,
      private router: Router,
      private contactService: ContactService,
      private tagService: TagService,
      private snackBar: MatSnackBar
    ) {}

  ngOnInit(): void {
    this.loadContacts();
    this.loadTags();

    // Setup search debounce
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchText => {
      this.searchText = searchText;
      this.loadContacts();
    });
  }


  getContactInitials(firstName: string | null | undefined, lastName: string | null | undefined): string {
    return ((firstName?.charAt(0) ?? '') + (lastName?.charAt(0) ?? '')).toUpperCase();
  }

  getContactBadgeClass(contactId: string): string {
    // Use badge-like classes with dark text and light backgrounds
    const badgeClasses = [
      'bg-light-primary text-primary',
      'bg-light-success text-success',
      'bg-light-warning text-warning',
      'bg-light-error text-error',
      'bg-light text-info'
    ];

    // Improved djb2 hash function for better distribution
    let hash = 5381;
    for (let i = 0; i < contactId.length; i++) {
      const char = contactId.charCodeAt(i);
      hash = ((hash << 5) + hash) + char; // hash * 33 + char
    }

    // Ensure positive index with better distribution
    const index = Math.abs(hash) % badgeClasses.length;
    return badgeClasses[index];
  }

  getStartIndex(): number {
    return (this.currentPage * this.pageSize) + 1;
  }

  getEndIndex(): number {
    const endIndex = (this.currentPage + 1) * this.pageSize;
    return Math.min(endIndex, this.totalElements);
  }

  loadContacts(pageIndex: number = 0): void {
    // Prevent multiple simultaneous requests
    if (this.isLoading) {
      return;
    }
    this.isLoading = true;

    const filters: ContactFilters = {
      page: pageIndex,
      size: this.pageSize,
      search: this.searchText || undefined,
      enabled: this.selectedEnabled === '' ? undefined : this.selectedEnabled,
      createdAtFrom: this.createdAtFrom ? this.formatDate(this.createdAtFrom) : undefined,
      createdAtTo: this.createdAtTo ? this.formatDate(this.createdAtTo) : undefined,
      tagIds: this.selectedTagIds.length > 0 ? this.selectedTagIds : undefined,
    };

    this.contactService.getContacts(filters).subscribe({
       next: (response) => {
         this.dataSource.data = response.content;
         this.totalElements = response.totalElements;
         this.totalPages = response.totalPages;
         this.currentPage = response.number;
         this.pageSize = response.size;
         this.isLoading = false;

         // No paginator updates needed for custom pagination
       },
      error: (error) => {
        console.error('Error loading contacts:', error);
        this.snackBar.open('Error loading contacts', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }


  onPageChange(event: PageEvent): void {
    const pageIndex = event.pageIndex;
    const newPageSize = event.pageSize;

    // Only reload if something actually changed
    if (pageIndex !== this.currentPage || newPageSize !== this.pageSize) {
      this.pageSize = newPageSize;
      this.loadContacts(pageIndex);
    }
  }

  onPageSizeChange(newPageSize: number): void {
    this.pageSize = newPageSize;
    this.loadContacts(0); // Reset to first page when page size changes
  }

  onSearchChange(searchText: string): void {
    this.searchSubject.next(searchText);
  }

  onTagFilterChange(tagIds: number[]): void {
    this.selectedTagIds = tagIds || [];
    this.loadContacts();
  }

  onEnabledFilterChange(value: boolean | ''): void {
    this.selectedEnabled = value;
    this.loadContacts();
  }

  onDateFilterChange(): void {
    this.loadContacts();
  }

  exportContacts(format: 'csv' | 'xlsx'): void {
    const filters = this.getCurrentFilters();

    this.contactService.exportContacts(format, filters).subscribe({
      next: (blob) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `contacts-${timestamp}.${format}`;
        this.downloadBlob(blob, fileName);
        this.snackBar.open(`Contacts exported to ${format.toUpperCase()}`, 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error exporting contacts:', error);
        this.snackBar.open('Error exporting contacts', 'Close', { duration: 3000 });
      }
    });
  }

  triggerImport(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  onImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0] ? input.files[0] : null;

    if (!file) {
      return;
    }

    const fileName = file.name.toLowerCase();
    const isSupported = fileName.endsWith('.csv') || fileName.endsWith('.xlsx');
    if (!isSupported) {
      this.snackBar.open('Unsupported file type. Use CSV or XLSX.', 'Close', { duration: 3500 });
      input.value = '';
      return;
    }

    this.isImporting = true;
    this.contactService.importContacts(file).subscribe({
      next: (result) => {
        const updated = result.updatedCount ?? 0;
        const skipped = result.skippedCount ?? 0;
        const details = `${result.importedCount} imported, ${updated} updated, ${skipped} skipped, ${result.failedCount} failed`;
        this.snackBar.open(`Import completed: ${details}`, 'Close', { duration: 4500 });

        if (result.errors && result.errors.length > 0) {
          console.warn('Contact import errors:', result.errors);
        }

        this.loadContacts(this.currentPage);
        this.isImporting = false;
        input.value = '';
      },
      error: (error) => {
        console.error('Error importing contacts:', error);
        this.snackBar.open('Error importing contacts', 'Close', { duration: 3500 });
        this.isImporting = false;
        input.value = '';
      }
    });
  }

  createContact(): void {
    this.router.navigate(['contacts/create']);
  }

  editContact(contact: Contact): void {
    this.router.navigate(['contacts/edit', contact.id]);
  }

  viewContactDetails(contact: Contact): void {
    this.router.navigate(['contacts/details', contact.id]);
  }

  deleteContact(contact: Contact): void {
    const dialogRef = this.dialog.open(DeleteContactDialogComponent, {
      width: '500px',
      data: { contact }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.event === 'Delete') {
        this.loadContacts(this.currentPage);
      }
    });
  }

  private loadTags(): void {
    this.tagService.getTags({ page: 0, size: 200 }).subscribe({
      next: (response) => {
        this.availableTags = response.content || [];
      },
      error: (error) => {
        console.error('Error loading tags:', error);
        this.snackBar.open('Error loading tags', 'Close', { duration: 3000 });
      }
    });
  }

  private formatDate(dateValue: string): string {
    return new Date(dateValue).toISOString();
  }

  private getCurrentFilters(): ContactFilters {
    return {
      search: this.searchText || undefined,
      enabled: this.selectedEnabled === '' ? undefined : this.selectedEnabled,
      createdAtFrom: this.createdAtFrom ? this.formatDate(this.createdAtFrom) : undefined,
      createdAtTo: this.createdAtTo ? this.formatDate(this.createdAtTo) : undefined,
      tagIds: this.selectedTagIds.length > 0 ? this.selectedTagIds : undefined,
    };
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
