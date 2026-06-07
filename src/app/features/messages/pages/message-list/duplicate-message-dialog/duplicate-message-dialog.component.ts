import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { MaterialModule } from 'src/app/material.module';
import { MessageService } from '../../../services/message.service';
import { Message } from '../../../models/message';

export interface DuplicateMessageDialogData {
  message: Message;
}

@Component({
  selector: 'app-duplicate-message-dialog',
  templateUrl: './duplicate-message-dialog.component.html',
  imports: [ReactiveFormsModule, MaterialModule, MatDialogModule],
})
export class DuplicateMessageDialogComponent {
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private snackBar = inject(MatSnackBar);
  dialogRef = inject<MatDialogRef<DuplicateMessageDialogComponent>>(MatDialogRef);
  data = inject<DuplicateMessageDialogData>(MAT_DIALOG_DATA);

  form: FormGroup;
  isDuplicating = false;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    const data = this.data;

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
