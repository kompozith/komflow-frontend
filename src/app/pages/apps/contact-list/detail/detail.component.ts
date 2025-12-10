import { Component, computed, OnInit, signal } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ContactService } from 'src/app/features/contacts/services/contact.service';
import { AppDeleteDialogComponent } from '../delete-dialog/delete-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Contact } from 'src/app/features/contacts/models/contact';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgScrollbarModule } from 'ngx-scrollbar';
@Component({
  selector: 'app-detail',
  imports: [
    MatDividerModule,
    FormsModule,
    CommonModule,
    MaterialModule,
    TablerIconsModule,
    NgScrollbarModule,
  ],
  templateUrl: './detail.component.html',
})
export class AppContactListDetailComponent implements OnInit {
  isEditing = signal<boolean>(false);
  contact = signal<any | null>(null);
  formData = signal<any | null>(null);
  selectedContact = computed(() => this.contactService.legacyGetSelectedContact());

  constructor(
    public dialog: MatDialog,
    private contactService: ContactService,
    private snackBar: MatSnackBar
  ) {}

  departments = [
    { id: 1, name: 'Sales' },
    { id: 2, name: 'Support' },
    { id: 2, name: 'Engineering' },
  ];

  ngOnInit(): void {
    this.contactService.selectedContact$.subscribe((contact) => {
      this.contact.set(contact);
      // Map the new Contact format to the form data format
      if (contact) {
        this.formData.set({
          ...contact,
          firstname: contact.person?.firstName || contact.firstname || '',
          lastname: contact.person?.lastName || contact.lastname || '',
          email: contact.person?.email || contact.email || '',
          phone: contact.person?.phoneNumbers?.[0]?.number || contact.phone || '',
          // Keep other fields for backward compatibility
          company: contact.person?.company || contact.company || '',
          address: contact.person?.address || contact.address || '',
          notes: contact.notes || '',
          department: contact.department || '',
          image: contact.image || ''
        });
      } else {
        this.formData.set(null);
      }
    });
  }

  toggleStarred(contact: any, event: Event): void {
    this.contactService.legacyToggleStarred(contact, event);
    // Note: The new backend doesn't support starred field, so this is just for UI
  }

  saveContact(): void {
    const contact = this.formData();
    if (contact) {
      // For now, just update the local list since we don't have full API integration
      // In a real implementation, you would call the API to update the contact
      const updatedList = this.contactService.legacyGetContactList().map((c: any) =>
        c.id === contact.id ? contact : c
      );
      this.contactService.legacySetContacts(updatedList);
      this.contactService.legacySetSelectedContact(contact);
      this.isEditing.set(false);
    }
  }

  track(department: any) {
    return department.id;
  }

  editContact(): void {
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.formData.set(this.contact() ? { ...this.contact() } : null);
  }

  deleteContact(contact: any): void {
    const dialogRef = this.dialog.open(AppDeleteDialogComponent, {
      width: '300px',
      data: {
        message: `Are you sure you want to delete ${contact.person?.firstName || contact.firstname} ${contact.person?.lastName || contact.lastname}?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Delete the contact via API
        this.contactService.deleteContact(contact.id.toString()).subscribe({
          next: () => {
            // Remove from local list
            const updatedList = this.contactService.legacyGetContactList().filter(c => c.id !== contact.id);
            this.contactService.legacySetContacts(updatedList);
            // Check if the deleted contact was selected and clear selection if so
            if (this.contact() && this.contact()?.id === contact.id) {
              this.contactService.legacySetSelectedContact(null);
              this.contact.set(null);
            }
          },
          error: (error) => {
            console.error('Error deleting contact:', error);
          }
        });
      }
    });
  }
}
