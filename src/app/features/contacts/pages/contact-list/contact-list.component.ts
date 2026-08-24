import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy, OnInit, TemplateRef, ViewChild, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ContactService } from '../../services/contact.service';
import { Contact, ContactFilters } from '../../models/contact';
import { DeleteContactDialogComponent } from './delete-contact-dialog/delete-contact-dialog.component';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { TagService } from '../../../tags/services/tag.service';
import { Tag } from '../../../tags/models/tag';
import { SkeletonTableComponent } from 'src/app/shared/components/skeleton-table/skeleton-table.component';
import { DsPaginationComponent } from 'src/app/shared/components/ui/ds-pagination/ds-pagination.component';
import { SidebarFiltersService } from 'src/app/layouts/full/vertical/sidebar/sidebar-filters.service';

@Component({
  selector: 'app-contact-list',
  templateUrl: './contact-list.component.html',
  styleUrls: ['./contact-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TablerIconsModule,
    CommonModule,
    SkeletonTableComponent,
    DsPaginationComponent,
    DeleteContactDialogComponent,
  ],
})
export class ContactListComponent implements OnInit, AfterViewInit, OnDestroy {
  private router = inject(Router);
  private contactService = inject(ContactService);
  private tagService = inject(TagService);
  private snackBar = inject(MatSnackBar);
  private elementRef = inject(ElementRef<HTMLElement>);
  private sidebarFilters = inject(SidebarFiltersService);

  @ViewChild('filtersPanel') filtersPanelTemplate!: TemplateRef<unknown>;

  contacts = signal<Contact[]>([]);
  totalElements = signal(0);
  totalPages = signal(0);
  currentPage = signal(0);
  pageSize = signal(10);
  isLoading = signal(false);
  isImporting = signal(false);
  viewMode = signal<'list' | 'grid'>('list');
  selectedContactIds = signal<Set<number>>(new Set());

  // Filters
  searchText = '';
  selectedTagIds: number[] = [];
  selectedEnabled: boolean | '' = '';
  createdAtFrom: string | null = null;
  createdAtTo: string | null = null;
  availableTags: Tag[] = [];

  // Tags filter dropdown open state
  tagsDropdownOpen = signal(false);

  // Export menu open state
  exportMenuOpen = signal(false);

  // Row actions dropdown: id of the contact whose action menu is open, or null
  openActionsMenuId = signal<number | null>(null);

  // Delete confirmation dialog state
  contactPendingDelete = signal<Contact | null>(null);

  // Search debounce
  private searchSubject = new Subject<string>();

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;
    const host = this.elementRef.nativeElement;

    if (this.tagsDropdownOpen() && !host.querySelector('[data-tags-dropdown]')?.contains(target)) {
      this.tagsDropdownOpen.set(false);
    }
    if (this.exportMenuOpen() && !host.querySelector('[data-export-menu]')?.contains(target)) {
      this.exportMenuOpen.set(false);
    }
    if (this.openActionsMenuId() !== null && !host.querySelector('[data-actions-menu-open]')?.contains(target)) {
      this.closeActionsMenu();
    }
  }

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

  ngAfterViewInit(): void {
    this.sidebarFilters.set(this.filtersPanelTemplate);
  }

  ngOnDestroy(): void {
    this.sidebarFilters.clear();
  }

  getContactInitials(firstName: string | null | undefined, lastName: string | null | undefined): string {
    return ((firstName?.charAt(0) ?? '') + (lastName?.charAt(0) ?? '')).toUpperCase();
  }

  /** Converts a 2-letter ISO country code to its flag emoji; falls back to the raw value otherwise. */
  countryFlag(country: string | null | undefined): string {
    if (!country || country.length !== 2) return '';
    const codePoints = country.toUpperCase().split('').map(c => 0x1F1E6 - 65 + c.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }

  toggleContactSelection(contactId: number): void {
    this.selectedContactIds.update(ids => {
      const next = new Set(ids);
      if (next.has(contactId)) next.delete(contactId); else next.add(contactId);
      return next;
    });
  }

  isContactSelected(contactId: number): boolean {
    return this.selectedContactIds().has(contactId);
  }

  areAllContactsSelected(): boolean {
    return this.contacts().length > 0 && this.contacts().every(c => this.isContactSelected(c.id));
  }

  toggleSelectAll(): void {
    const allSelected = this.areAllContactsSelected();
    this.selectedContactIds.set(allSelected ? new Set() : new Set(this.contacts().map(c => c.id)));
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

  loadContacts(pageIndex: number = 0): void {
    // Prevent multiple simultaneous requests
    if (this.isLoading()) {
      return;
    }
    this.isLoading.set(true);

    const filters: ContactFilters = {
      page: pageIndex,
      size: this.pageSize(),
      search: this.searchText || undefined,
      enabled: this.selectedEnabled === '' ? undefined : this.selectedEnabled,
      createdAtFrom: this.createdAtFrom ? this.formatDate(this.createdAtFrom) : undefined,
      createdAtTo: this.createdAtTo ? this.formatDate(this.createdAtTo) : undefined,
      tagIds: this.selectedTagIds.length > 0 ? this.selectedTagIds : undefined,
    };

    this.contactService.getContacts(filters).subscribe({
      next: (response) => {
        this.contacts.set(response.content);
        this.totalElements.set(response.totalElements);
        this.totalPages.set(response.totalPages);
        this.currentPage.set(response.number);
        this.pageSize.set(response.size);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading contacts:', error);
        this.snackBar.open('Error loading contacts', 'Close', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  onPageChange(pageIndex: number): void {
    if (pageIndex !== this.currentPage()) {
      this.loadContacts(pageIndex);
    }
  }

  onPageSizeChange(newPageSize: number): void {
    this.pageSize.set(newPageSize);
    this.loadContacts(0); // Reset to first page when page size changes
  }

  onSearchChange(searchText: string): void {
    this.searchSubject.next(searchText);
  }

  isTagSelected(tagId: number): boolean {
    return this.selectedTagIds.includes(tagId);
  }

  toggleTagsDropdown(): void {
    this.tagsDropdownOpen.update((open) => !open);
  }

  closeTagsDropdown(): void {
    this.tagsDropdownOpen.set(false);
  }

  toggleTagFilter(tagId: number): void {
    const isSelected = this.selectedTagIds.includes(tagId);
    this.selectedTagIds = isSelected
      ? this.selectedTagIds.filter((id) => id !== tagId)
      : [...this.selectedTagIds, tagId];
    this.onTagFilterChange(this.selectedTagIds);
  }

  onTagFilterChange(tagIds: number[]): void {
    this.selectedTagIds = tagIds || [];
    this.loadContacts();
  }

  onEnabledFilterChange(value: string): void {
    this.selectedEnabled = value === '' ? '' : value === 'true';
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

    this.isImporting.set(true);
    this.contactService.importContacts(file).subscribe({
      next: (result) => {
        const updated = result.updatedCount ?? 0;
        const skipped = result.skippedCount ?? 0;
        const details = `${result.importedCount} imported, ${updated} updated, ${skipped} skipped, ${result.failedCount} failed`;
        this.snackBar.open(`Import completed: ${details}`, 'Close', { duration: 4500 });

        if (result.errors && result.errors.length > 0) {
          console.warn('Contact import errors:', result.errors);
        }

        this.loadContacts(this.currentPage());
        this.isImporting.set(false);
        input.value = '';
      },
      error: (error) => {
        console.error('Error importing contacts:', error);
        this.snackBar.open('Error importing contacts', 'Close', { duration: 3500 });
        this.isImporting.set(false);
        input.value = '';
      }
    });
  }

  createContact(): void {
    this.router.navigate(['contacts/create']);
  }

  editContact(contact: Contact): void {
    this.closeActionsMenu();
    this.router.navigate(['contacts/edit', contact.id]);
  }

  viewContactDetails(contact: Contact): void {
    this.closeActionsMenu();
    this.router.navigate(['contacts/details', contact.id]);
  }

  toggleActionsMenu(contact: Contact): void {
    this.openActionsMenuId.update((openId) => (openId === contact.id ? null : contact.id));
  }

  closeActionsMenu(): void {
    this.openActionsMenuId.set(null);
  }

  deleteContact(contact: Contact): void {
    this.closeActionsMenu();
    this.contactPendingDelete.set(contact);
  }

  onDeleteCancelled(): void {
    this.contactPendingDelete.set(null);
  }

  onDeleteConfirmed(): void {
    this.contactPendingDelete.set(null);
    this.loadContacts(this.currentPage());
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
