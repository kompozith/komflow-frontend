import {
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Category, filter, label } from './categories';
import { AppContactListDetailComponent } from '../detail/detail.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ContactFormDialogComponent } from '../contact-form-dialog/contact-form-dialog.component';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { MediaMatcher } from '@angular/cdk/layout';
import { ContactService } from 'src/app/features/contacts/services/contact.service';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Contact } from 'src/app/features/contacts/models/contact';

import { AppDeleteDialogComponent } from '../delete-dialog/delete-dialog.component';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-listing',
  imports: [
    CommonModule,
    FormsModule,
    AppContactListDetailComponent,
    MaterialModule,
    ReactiveFormsModule,
    TablerIconsModule,
    NgScrollbarModule,
    CommonModule,
    MatDividerModule,
  ],
  templateUrl: './listing.component.html',
})
export class AppListingComponent implements OnInit, OnDestroy {
  mobileQuery: MediaQueryList;

  private _mobileQueryListener: () => void;

  constructor(
    public dialog: MatDialog,
    public contactService: ContactService,
    private snackBar: MatSnackBar
  ) {
    const changeDetectorRef = inject(ChangeDetectorRef);
    const media = inject(MediaMatcher);
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener);
  }

  searchTerm = signal<string>('');
  private mediaMatcher: MediaQueryList = matchMedia(`(max-width: 1199px)`);
  filters: Category[] = [];
  labels: Category[] = [];
  selectedFilter: Category | null = null;
  selectedCategory: Category | null = null;
  selectedContact = signal<Contact | null>(null);
  isActiveContact: boolean = false;

  // Store contacts directly from the new API
  contacts = signal<Contact[]>([]);
  isLoading = signal<boolean>(false);

  mailnav = true;

  isOver(): boolean {
    return this.mediaMatcher.matches;
  }

  openDialog() {
    const dialogRef = this.dialog.open(AppContactListDetailComponent, {
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }

  filteredContacts = computed(() => {
    let filtered = this.contacts();

    // Apply category filter if selected
    if (
      this.selectedCategory &&
      this.selectedCategory?.name !== 'All'
    ) {
      // Filter by tags if category matches tag name
      filtered = filtered.filter(
        (contact) =>
          contact.tags?.some((tag) => tag.name === this.selectedCategory?.name)
      );
    }

    // Apply filter based on selectedFilter only if no category is selected
    if (
      !this.selectedCategory ||
      this.selectedCategory?.name === 'All'
    ) {
      if (this.selectedFilter) {
        // Note: Backend doesn't have starred/frequent fields, so these filters may not work
        // You might need to add these fields to the backend or remove these filters
        if (this.selectedFilter?.name === 'Frequent') {
          // filtered = filtered.filter((contact) => contact.frequentlycontacted);
        } else if (this.selectedFilter?.name === 'Starred') {
          // filtered = filtered.filter((contact) => contact.starred);
        }
      }
    }

    // Apply search term filter
    const searchTermLower = this.searchTerm().toLowerCase();
    filtered = filtered.filter(
      (contact) => {
        const firstName = contact.person?.firstName || '';
        const lastName = contact.person?.lastName || '';
        const email = contact.person?.email || '';
        return (
          firstName.toLowerCase().includes(searchTermLower) ||
          lastName.toLowerCase().includes(searchTermLower) ||
          email.toLowerCase().includes(searchTermLower)
        );
      }
    );
    return filtered;
  });

  ngOnInit() {
    this.loadContacts();

    // Initialize labels and filters from the data file
    this.labels = label;
    this.filters = filter;

    // Set the first filter as active by default
    const firstFilter = this.filters[0];
    if (firstFilter) {
      this.selectedFilter = firstFilter;
      this.filters = this.filters.map((f) => ({ ...f, active: f === firstFilter }));
    }
  }

  loadContacts() {
    this.isLoading.set(true);
    this.contactService.getContacts().subscribe({
      next: (response) => {
        this.contacts.set(response.content);
        this.isLoading.set(false);

        // Set the selected contact to the first contact if available
        if (response.content.length > 0) {
          this.selectedContact.set(response.content[0]);
          this.contactService.legacySetSelectedContact(response.content[0]);
        }
      },
      error: (error) => {
        console.error('Error fetching contacts:', error);
        this.isLoading.set(false);
        this.snackBar.open('Error loading contacts', 'Close', { duration: 3000 });
      }
    });
  }

  goBack() {
    this.selectedContact.set(null);
    this.isActiveContact = false;
  }

  selectContact(contact: Contact): void {
    this.isActiveContact = true;
    this.selectedContact.set(contact);
    this.contactService.legacySetSelectedContact(contact);
  }

  applyFilter(filter: Category): void {
    this.selectedFilter = filter;
    this.filters = this.filters.map((f) => ({ ...f, active: f === filter }));
    this.selectedCategory = null;
  }

  applyCategory(category: Category): void {
    this.selectedCategory = category;
    this.labels.forEach((lab) => (lab.active = lab === category));
    this.selectedFilter = null;
  }

  toggleStarred(contact: any, $event: any): void {
    // Note: The new backend doesn't support starred field, so this is just for UI
    $event.stopPropagation();
  }

  deleteContact(contact: Contact): void {
    const dialogRef = this.dialog.open(AppDeleteDialogComponent, {
      width: '300px',
      autoFocus: false,
      data: {
        message: `Are you sure you want to delete ${contact.person?.firstName} ${contact.person?.lastName}?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Delete the contact via API
        this.contactService.deleteContact(contact.id.toString()).subscribe({
          next: () => {
            // Remove from local list
            const updatedList = this.contacts().filter(c => c.id !== contact.id);
            this.contacts.set(updatedList);

            // Check if the deleted contact was selected and clear selection if so
            if (this.selectedContact() && this.selectedContact()?.id === contact.id) {
              this.contactService.legacySetSelectedContact(null);
              this.selectedContact.set(null);
            }

            this.snackBar.open(
              `${contact.person?.firstName} ${contact.person?.lastName} deleted successfully!`,
              'Close',
              {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'top',
              }
            );
          },
          error: (error) => {
            console.error('Error deleting contact:', error);
            this.snackBar.open('Error deleting contact', 'Close', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
            });
          }
        });
      }
    });
  }

  openAddContactDialog(): void {
    const dialogRef = this.dialog.open(ContactFormDialogComponent, {
      width: '400px',
      autoFocus: false,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Add the new contact to our list
        const updatedList = [result, ...this.contacts()];
        this.contacts.set(updatedList);

        this.contactService.legacySetSelectedContact(result);
        this.selectedContact.set(result);
      }
    });
  }
}
