import { Component, Inject } from '@angular/core';
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
  availableTags: any[] = []; // TODO: Load from service

  constructor(
    public dialogRef: MatDialogRef<ContactEditComponent>,
    private fb: FormBuilder,
    private contactService: ContactService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { contact: ContactDetails }
  ) {
    this.contact = data.contact;
    this.contactForm = this.fb.group({
      firstName: [data.contact.person.firstName, [Validators.required, Validators.minLength(2)]],
      lastName: [data.contact.person.lastName, [Validators.required, Validators.minLength(2)]],
      email: [data.contact.person.email, [Validators.required, Validators.email]],
      phone: [data.contact.person.phoneNumber || ''],
      tagIds: [data.contact.tags?.map(tag => tag.id) || []]
    });
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      this.isSaving = true;
      const formValue = this.contactForm.value;

      const contactData: UpdateContactRequest = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        phone: formValue.phone || undefined,
        tagIds: formValue.tagIds || []
      };

      this.contactService.updateContact(this.contact!.id.toString(), contactData).subscribe({
        next: (contact) => {
          this.snackBar.open('Contact updated successfully', 'Close', { duration: 3000 });
          this.dialogRef.close({ event: 'Update' });
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
    this.dialogRef.close({ event: 'Cancel' });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.contactForm.controls).forEach(key => {
      const control = this.contactForm.get(key);
      control?.markAsTouched();
    });
  }
}
