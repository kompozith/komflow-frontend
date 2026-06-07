import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { ContactService } from '../../../services/contact.service';
import { Contact } from '../../../models/contact';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-delete-contact-dialog',
  template: `
    <h2 mat-dialog-title>Delete Contact</h2>
    <mat-dialog-content>
      <p>Are you sure you want to delete the contact <strong>{{ data.contact.person.firstName }} {{ data.contact.person.lastName }}</strong>?</p>
      <p class="text-muted">This action cannot be undone.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-flat-button color="warn" (click)="onConfirm()" [disabled]="isDeleting">
        @if (isDeleting) {
          <mat-spinner diameter="20"></mat-spinner>
        }
        @if (!isDeleting) {
          <span>Delete</span>
        }
      </button>
    </mat-dialog-actions>
    `,
  imports: [MaterialModule, MatDialogModule],
})
export class DeleteContactDialogComponent {
  dialogRef = inject<MatDialogRef<DeleteContactDialogComponent>>(MatDialogRef);
  data = inject<{
    contact: Contact;
}>(MAT_DIALOG_DATA);
  private contactService = inject(ContactService);
  private snackBar = inject(MatSnackBar);

  isDeleting = false;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    this.isDeleting = true;
    this.contactService.deleteContact(this.data.contact.id.toString()).subscribe({
      next: () => {
        this.snackBar.open('Contact deleted successfully', 'Close', { duration: 3000 });
        this.dialogRef.close({ event: 'Delete' });
      },
      error: (error) => {
        console.error('Error deleting contact:', error);
        this.snackBar.open('Error deleting contact', 'Close', { duration: 3000 });
        this.isDeleting = false;
      }
    });
  }
}
