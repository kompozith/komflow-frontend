import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CountryISO, NgxIntlTelInputModule, SearchCountryField } from 'ngx-intl-tel-input';
import { MessageService } from '../../services/message.service';
import { MessageChannel } from '../../models/message';

export interface SendTestDialogData {
  messageId: string;
  channel: MessageChannel;
}

@Component({
  selector: 'app-send-test-dialog',
  templateUrl: './send-test-dialog.component.html',
  styleUrl: './send-test-dialog.component.scss',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    MatDialogModule,
    TablerIconsModule,
    NgxIntlTelInputModule,
  ],
})
export class SendTestDialogComponent {
  form: FormGroup;
  isSending = false;
  MessageChannel = MessageChannel;
  CountryISO = CountryISO;
  SearchCountryField = SearchCountryField;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<SendTestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SendTestDialogData
  ) {
    const validators = this.isEmailChannel
      ? [Validators.required, Validators.email]
      : [Validators.required];

    this.form = this.fb.group({
      recipient: ['', validators],
    });
  }

  get isEmailChannel(): boolean {
    return this.data.channel === MessageChannel.EMAIL;
  }

  get isPhoneChannel(): boolean {
    return this.data.channel === MessageChannel.SMS || this.data.channel === MessageChannel.WHATSAPP;
  }

  get channelLabel(): string {
    switch (this.data.channel) {
      case MessageChannel.EMAIL:    return 'Email';
      case MessageChannel.SMS:      return 'SMS';
      case MessageChannel.WHATSAPP: return 'WhatsApp';
      default: return 'recipient';
    }
  }

  onSend(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSending = true;

    const rawValue = this.form.value.recipient;

    // ngx-intl-tel-input retourne un objet avec e164Number (ex: +237695620020)
    const recipient: string = this.isPhoneChannel
      ? ((rawValue as any)?.e164Number ?? String(rawValue).trim())
      : String(rawValue).trim();

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
