import { Component, Inject, Optional } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CommonModule } from '@angular/common';
import { ContactService } from '../../services/contact.service';
import { ContactDetails, UpdateContactRequest } from '../../models/contact';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TagService } from '../../../tags/services/tag.service';
import { Tag } from '../../../tags/models/tag';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-contact-edit',
  imports: [
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TablerIconsModule,
    CommonModule,
  ],
  templateUrl: './contact-edit.component.html',
  styleUrl: './contact-edit.component.scss',
})
export class ContactEditComponent {
  contactForm: FormGroup;
  isLoading = false;
  isSaving = false;
  contact: ContactDetails | null = null;
  availableTags: Tag[] = [];

  constructor(
    @Optional() public dialogRef: MatDialogRef<ContactEditComponent> | null,
    private fb: FormBuilder,
    private contactService: ContactService,
    private tagService: TagService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: { contact: ContactDetails }
  ) {
    this.contactForm = this.fb.group({
      personId: [null, [Validators.required]],
      enabled: [true],
      lastMessageReceivedAt: [''],
      tagIds: [[]],
    });

    if (data?.contact) {
      this.contact = data.contact;
      this.patchForm(this.contact);
    } else {
      const id = this.route.snapshot.params['id'];
      if (id) {
        this.loadContact(id);
      }
    }

    this.loadTags();
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      this.isSaving = true;
      const formValue = this.contactForm.value;

      const contactData: UpdateContactRequest = {
        personId: Number(formValue.personId),
        enabled: !!formValue.enabled,
        lastMessageReceivedAt: formValue.lastMessageReceivedAt
          ? new Date(formValue.lastMessageReceivedAt).toISOString()
          : null,
        tagIds: formValue.tagIds || []
      };

      const contactId = this.contact?.id?.toString();
      if (!contactId) {
        this.snackBar.open('Contact not loaded', 'Close', { duration: 3000 });
        this.isSaving = false;
        return;
      }

      this.contactService.updateContact(contactId, contactData).subscribe({
        next: (contact) => {
          this.snackBar.open('Contact updated successfully', 'Close', { duration: 3000 });
          if (this.dialogRef) {
            this.dialogRef.close({ event: 'Update' });
          } else {
            this.router.navigate(['/contacts/details', contactId]);
          }
        },
        error: (error) => {
          console.error('Error updating contact:', error);
          this.snackBar.open('Error updating contact', 'Close', { duration: 3000 });
          this.isSaving = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    if (this.dialogRef) {
      this.dialogRef.close({ event: 'Cancel' });
    } else {
      this.router.navigate(['/contacts']);
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.contactForm.controls).forEach(key => {
      const control = this.contactForm.get(key);
      control?.markAsTouched();
    });
  }

  private loadContact(id: string): void {
    this.isLoading = true;
    this.contactService.getContactById(id).subscribe({
      next: (contact) => {
        this.contact = contact;
        this.patchForm(contact);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading contact:', error);
        this.snackBar.open('Error loading contact', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  private patchForm(contact: ContactDetails): void {
    this.contactForm.patchValue({
      personId: contact.person?.id ?? null,
      enabled: contact.enabled,
      lastMessageReceivedAt: contact.lastMessageReceivedAt
        ? this.toDateTimeLocal(contact.lastMessageReceivedAt)
        : '',
      tagIds: contact.tags?.map(tag => tag.id) || [],
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

  private toDateTimeLocal(iso: string): string {
    const date = new Date(iso);
    const pad = (value: number) => value.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}
