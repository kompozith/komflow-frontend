import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ContactService } from '../../../services/contact.service';
import { Contact } from '../../../models/contact';

/**
 * Lightweight Tailwind confirmation modal for deleting a contact.
 * Page-local (not yet a shared/reusable confirm-dialog component) — lives as
 * a sibling folder to contact-list, same convention as the previous
 * MatDialog-based version it replaces.
 */
@Component({
  selector: 'app-delete-contact-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TablerIconsModule],
  templateUrl: './delete-contact-dialog.component.html',
})
export class DeleteContactDialogComponent {
  private contactService = inject(ContactService);
  private snackBar = inject(MatSnackBar);

  contact = input.required<Contact>();

  /** Emitted when the user cancels or dismisses the dialog without deleting. */
  cancelled = output<void>();
  /** Emitted after the contact has been successfully deleted. */
  deleted = output<void>();

  isDeleting = signal(false);

  onCancel(): void {
    if (this.isDeleting()) {
      return;
    }
    this.cancelled.emit();
  }

  onConfirm(): void {
    this.isDeleting.set(true);
    this.contactService.deleteContact(this.contact().id.toString()).subscribe({
      next: () => {
        this.snackBar.open('Contact deleted successfully', 'Close', { duration: 3000 });
        this.isDeleting.set(false);
        this.deleted.emit();
      },
      error: (error) => {
        console.error('Error deleting contact:', error);
        this.snackBar.open('Error deleting contact', 'Close', { duration: 3000 });
        this.isDeleting.set(false);
      }
    });
  }
}
