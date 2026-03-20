import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { MessageService } from 'src/app/features/messages/services/message.service';
import { Message } from 'src/app/features/messages/models/message';
import { ContactService } from 'src/app/features/contacts/services/contact.service';
import { Contact } from 'src/app/features/contacts/models/contact';
import { debounceTime, distinctUntilChanged, finalize, map, of, switchMap } from 'rxjs';

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
  contactSearchLoading = false;
  contacts: Contact[] = [];

  form = this.fb.group({
    contactId: ['', [Validators.required]],
    contactSearch: new FormControl<string | Contact>('', { nonNullable: true }),
  });

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private contactService: ContactService,
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<EventWorkflowTestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { messageId: number }
  ) {}

  ngOnInit(): void {
    this.loadMessage();
    this.setupContactSearch();
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

  displayContact(contact: Contact | string | null): string {
    if (!contact || typeof contact === 'string') {
      return contact || '';
    }

    const firstName = contact.person?.firstName || '';
    const lastName = contact.person?.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const email = contact.person?.email || '';
    return fullName ? `${fullName}${email ? ' - ' + email : ''}` : email;
  }

  onContactSelected(event: MatAutocompleteSelectedEvent): void {
    const contact = event.option.value as Contact;
    this.form.patchValue(
      {
        contactId: String(contact.id),
        contactSearch: contact,
      },
      { emitEvent: false }
    );
  }

  onContactInput(): void {
    const selectedContact = this.form.get('contactSearch')?.value;
    if (typeof selectedContact === 'string') {
      this.form.get('contactId')?.setValue('');
    }
  }

  get contactSearchTermLength(): number {
    const value = this.form.get('contactSearch')?.value;
    return typeof value === 'string' ? value.trim().length : 0;
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

  private setupContactSearch(): void {
    this.form
      .get('contactSearch')
      ?.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((value) => {
          if (typeof value !== 'string') {
            return of([]);
          }

          const search = value.trim();
          if (search.length < 2) {
            this.contacts = [];
            return of([]);
          }

          this.contactSearchLoading = true;
          return this.contactService.getContacts({ page: 0, size: 10, search }).pipe(
            finalize(() => {
              this.contactSearchLoading = false;
            }),
            map((response) => response.content || [])
          );
        })
      )
      .subscribe({
        next: (contacts) => {
          this.contacts = contacts;
        },
        error: () => {
          this.contacts = [];
          this.contactSearchLoading = false;
          this.snackBar.open('Impossible de rechercher les contacts.', 'Fermer', { duration: 3000 });
        },
      });
  }
}
