import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { MessageService } from 'src/app/features/messages/services/message.service';
import { Message } from 'src/app/features/messages/models/message';

@Component({
  selector: 'app-event-workflow-test-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './event-workflow-test-dialog.component.html',
  styleUrls: ['./event-workflow-test-dialog.component.scss'],
})
export class EventWorkflowTestDialogComponent implements OnInit {
  message: Message | null = null;
  messageContent: SafeHtml | null = null;
  loading = true;
  sending = false;

  form = this.fb.group({
    contactId: ['', [Validators.required]],
  });

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<EventWorkflowTestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { messageId: number }
  ) {}

  ngOnInit(): void {
    this.loadMessage();
  }

  close(): void {
    this.dialogRef.close();
  }

  sendTest(): void {
    if (this.form.invalid || !this.data?.messageId) {
      this.form.markAllAsTouched();
      return;
    }

    this.sending = true;
    const contactId = String(this.form.value.contactId || '').trim();
    this.messageService.testMessage(String(this.data.messageId), contactId).subscribe({
      next: () => {
        this.sending = false;
        this.snackBar.open('Message de test envoye.', 'Fermer', { duration: 2500 });
        this.dialogRef.close();
      },
      error: () => {
        this.sending = false;
        this.snackBar.open("Echec de l'envoi du test.", 'Fermer', { duration: 3000 });
      },
    });
  }

  private loadMessage(): void {
    this.loading = true;
    this.messageService.getMessageById(String(this.data.messageId)).subscribe({
      next: (message) => {
        this.message = message;
        this.messageContent = this.sanitizer.bypassSecurityTrustHtml(message.content || '');
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Impossible de charger le message.', 'Fermer', { duration: 3000 });
      },
    });
  }
}
