import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { MessageService } from '../../../services/message.service';
import { Message } from '../../../models/message';

export interface DuplicateMessageDialogData {
  message: Message;
}

@Component({
  selector: 'app-duplicate-message-dialog',
  templateUrl: './duplicate-message-dialog.component.html',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, MatDialogModule],
})
export class DuplicateMessageDialogComponent {
  form: FormGroup;
  isDuplicating = false;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<DuplicateMessageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DuplicateMessageDialogData
  ) {
    this.form = this.fb.group({
      title: [
        `Copie de ${data.message.title}`,
        [Validators.required, Validators.maxLength(255)],
      ],
    });
  }

  onDuplicate(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isDuplicating = true;
    const title: string = this.form.value.title.trim();

    this.messageService.duplicateMessage(String(this.data.message.id), title).subscribe({
      next: (created) => {
        this.snackBar.open('Message dupliqué avec succès', 'OK', { duration: 3000 });
        this.dialogRef.close({ duplicated: true, message: created });
      },
      error: (err) => {
        const msg = err?.error?.message || 'Erreur lors de la duplication';
        this.snackBar.open(msg, 'Fermer', { duration: 4000 });
        this.isDuplicating = false;
      },
    });
  }
}
