import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MessageService } from '../../services/message.service';
import { MessageChannel } from '../../models/message';

export interface SendTestDialogData {
  messageId: string;
  channel: MessageChannel;
}

@Component({
  selector: 'app-send-test-dialog',
  templateUrl: './send-test-dialog.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    MatDialogModule,
    TablerIconsModule,
  ],
})
export class SendTestDialogComponent {
  form: FormGroup;
  isSending = false;
  MessageChannel = MessageChannel;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<SendTestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SendTestDialogData
  ) {
    const isEmail = data.channel === MessageChannel.EMAIL;
    this.form = this.fb.group({
      recipient: [
        '',
        [
          Validators.required,
          isEmail ? Validators.email : Validators.pattern(/^\+?[0-9\s\-()]{6,20}$/),
        ],
      ],
    });
  }

  get isEmailChannel(): boolean {
    return this.data.channel === MessageChannel.EMAIL;
  }

  get channelLabel(): string {
    switch (this.data.channel) {
      case MessageChannel.EMAIL: return 'Email';
      case MessageChannel.SMS: return 'SMS';
      case MessageChannel.WHATSAPP: return 'WhatsApp';
      default: return 'recipient';
    }
  }

  get channelIcon(): string {
    switch (this.data.channel) {
      case MessageChannel.EMAIL: return 'mail';
      case MessageChannel.SMS: return 'message-circle';
      case MessageChannel.WHATSAPP: return 'brand-whatsapp';
      default: return 'send';
    }
  }

  get inputPlaceholder(): string {
    return this.isEmailChannel ? 'ex: test@example.com' : 'ex: +33612345678';
  }

  get inputLabel(): string {
    return this.isEmailChannel ? 'Adresse e-mail' : 'Numéro de téléphone';
  }

  onSend(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSending = true;
    const recipient: string = this.form.value.recipient.trim();

    this.messageService.testMessageDirect(this.data.messageId, recipient).subscribe({
      next: () => {
        this.snackBar.open('Message de test envoyé avec succès', 'OK', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        const msg = err?.error?.message || 'Erreur lors de l\'envoi du test';
        this.snackBar.open(msg, 'Fermer', { duration: 4000 });
        this.isSending = false;
      },
    });
  }
}
