import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule } from '@angular/forms';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MessageService } from '../../../services/message.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Message } from '../../../models/message';

@Component({
  selector: 'app-delete-message-dialog',
  imports: [
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MaterialModule,
    FormsModule,
    TablerIconsModule,
  ],
  templateUrl: './delete-message-dialog.component.html',
  styleUrl: './delete-message-dialog.component.scss',
})
export class DeleteMessageDialogComponent {
  dialogRef = inject<MatDialogRef<DeleteMessageDialogComponent>>(MatDialogRef);
  private messageService = inject(MessageService);
  private snackBar = inject(MatSnackBar);
  data = inject(MAT_DIALOG_DATA);

  action: string;
  local_data: any;
  confirmationText: string = '';

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    const data = this.data;

    this.action = 'Delete';
    this.local_data = { ...data.message };
  }

  get isConfirmationValid(): boolean {
    return this.confirmationText === this.local_data.title;
  }

  get message(): Message {
    return this.local_data;
  }

  doAction(): void {
    if (!this.isConfirmationValid) {
      return;
    }

    const messageId = this.local_data.id || this.data.id;
    this.messageService.deleteMessage(messageId).subscribe({
      next: () => {
        this.snackBar.open('Message deleted successfully!', 'Close', { duration: 3000 });
        this.dialogRef.close({ event: 'Delete' });
      },
      error: (error) => {
        console.error('Error deleting message:', error);
        this.snackBar.open('Error deleting message', 'Close', { duration: 3000 });
      }
    });
  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }
}