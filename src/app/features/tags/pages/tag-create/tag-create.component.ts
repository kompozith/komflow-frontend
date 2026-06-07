import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TablerIconsModule } from 'angular-tabler-icons';

import { TagService } from '../../services/tag.service';
import { CreateTagRequest } from '../../models/tag';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ContactService } from 'src/app/features/contacts/services/contact.service';
import { Contact, ContactPage } from 'src/app/features/contacts/models/contact';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-tag-create',
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TablerIconsModule
],
  templateUrl: './tag-create.component.html',
  styleUrl: './tag-create.component.scss',
})
export class TagCreateComponent {
  dialogRef = inject<MatDialogRef<TagCreateComponent>>(MatDialogRef);
  private fb = inject(FormBuilder);
  private tagService = inject(TagService);
  private contactService = inject(ContactService);
  private snackBar = inject(MatSnackBar);
  data = inject(MAT_DIALOG_DATA);

  tagForm: FormGroup;
  isLoading = false;
  contacts: Contact[] = [];
  contactsLoading = false;
  contactsHasMore = true;
  private readonly contactsPageSize = 50;
  private contactsPage = 0;
  private readonly contactSearchSubject = new Subject<string>();
  contactSearch = '';

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);


  constructor() {
    this.tagForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      color: ['#007bff'],
      description: ['', [Validators.maxLength(255)]],
      contactIds: [[]]
    });

    this.contactSearchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value) => {
        this.contactSearch = value;
        this.loadContacts(true);
      });

    this.loadContacts(true);
  }

  onSubmit(): void {
    if (this.tagForm.valid) {
      this.isLoading = true;
      const formValue = this.tagForm.value;

      const tagData: CreateTagRequest = {
        name: formValue.name,
        colorCode: this.normalizeColor(formValue.color),
        description: formValue.description || undefined,
        contactIds: formValue.contactIds || []
      };

      this.tagService.createTag(tagData).subscribe({
        next: (tag) => {
          this.snackBar.open('Tag created successfully', 'Close', { duration: 3000 });
          this.dialogRef.close({ event: 'Create' });
        },
        error: (error) => {
          console.error('Error creating tag:', error);
          this.snackBar.open('Error creating tag', 'Close', { duration: 3000 });
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }

  onContactSearchChange(value: string): void {
    this.contactSearchSubject.next((value || '').trim());
  }

  loadMoreContacts(): void {
    if (!this.contactsLoading && this.contactsHasMore) {
      this.loadContacts(false);
    }
  }

  get previewColor(): string {
    return this.normalizeColor(this.tagForm.get('color')?.value);
  }

  private loadContacts(reset: boolean): void {
    if (this.contactsLoading) {
      return;
    }

    if (reset) {
      this.contactsPage = 0;
      this.contactsHasMore = true;
      this.contacts = [];
    }

    if (!this.contactsHasMore) {
      return;
    }

    this.contactsLoading = true;
    this.contactService.getContacts({ page: this.contactsPage, size: this.contactsPageSize, search: this.contactSearch || undefined }).subscribe({
      next: (response: ContactPage) => {
        const incoming = response.content || [];
        this.contacts = reset
          ? incoming
          : [...this.contacts, ...incoming.filter((contact) => !this.contacts.some((existing) => existing.id === contact.id))];
        this.contactsHasMore = !response.last;
        this.contactsPage += 1;
        this.contactsLoading = false;
      },
      error: () => {
        this.contactsLoading = false;
        if (reset) {
          this.contacts = [];
        }
      }
    });
  }

  private normalizeColor(value: string | null | undefined): string {
    const fallback = '#007bff';
    if (!value) {
      return fallback;
    }

    const normalized = value.trim().replace(/^#/, '');
    if (/^[0-9a-fA-F]{6}$/.test(normalized)) {
      return `#${normalized}`;
    }
    if (/^[0-9a-fA-F]{8}$/.test(normalized)) {
      const rgb = normalized.toLowerCase().startsWith('ff') ? normalized.substring(2) : normalized.substring(0, 6);
      return `#${rgb}`;
    }
    return fallback;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.tagForm.controls).forEach(key => {
      const control = this.tagForm.get(key);
      control?.markAsTouched();
    });
  }
}
