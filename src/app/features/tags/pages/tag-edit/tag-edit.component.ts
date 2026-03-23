import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CommonModule } from '@angular/common';
import { TagService } from '../../services/tag.service';
import { Tag, UpdateTagRequest } from '../../models/tag';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ContactService } from 'src/app/features/contacts/services/contact.service';
import { Contact, ContactPage } from 'src/app/features/contacts/models/contact';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-tag-edit',
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TablerIconsModule,
    CommonModule,
  ],
  templateUrl: './tag-edit.component.html',
  styleUrl: './tag-edit.component.scss',
})
export class TagEditComponent implements OnInit {
  tagForm: FormGroup;
  isLoading = false;
  isSaving = false;
  tag: Tag | null = null;
  contacts: Contact[] = [];
  contactsLoading = false;
  contactsHasMore = true;
  private readonly contactsPageSize = 50;
  private contactsPage = 0;
  private readonly contactSearchSubject = new Subject<string>();
  contactSearch = '';


  constructor(
    public dialogRef: MatDialogRef<TagEditComponent>,
    private fb: FormBuilder,
    private tagService: TagService,
    private contactService: ContactService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { tag: Tag }
  ) {
    this.tag = data.tag;
    this.isLoading = true;
    const normalizedColor = this.normalizeColor(data.tag.colorCode || data.tag.color || '#007bff');
    this.tagForm = this.fb.group({
      name: [data.tag.name, [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      color: [normalizedColor],
      description: [data.tag.description || '', [Validators.maxLength(255)]],
      contactIds: [data.tag.contactIds || []]
    });

    this.contactSearchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value) => {
        this.contactSearch = value;
        this.loadContacts(true);
      });
  }

  ngOnInit(): void {
    this.loadContacts(true);
    this.loadTagDetails();
  }

  onSubmit(): void {
    if (this.tagForm.valid) {
      this.isSaving = true;
      const formValue = this.tagForm.value;

      const tagData: UpdateTagRequest = {
        name: formValue.name,
        colorCode: this.normalizeColor(formValue.color),
        description: formValue.description || undefined,
        contactIds: formValue.contactIds || []
      };

      this.tagService.updateTag(this.tag!.id.toString(), tagData).subscribe({
        next: (tag) => {
          this.snackBar.open('Tag updated successfully', 'Close', { duration: 3000 });
          this.dialogRef.close({ event: 'Update' });
        },
        error: (error) => {
          console.error('Error updating tag:', error);
          this.snackBar.open('Error updating tag', 'Close', { duration: 3000 });
          this.isSaving = false;
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

  private loadTagDetails(): void {
    if (!this.tag) {
      this.isLoading = false;
      return;
    }

    this.tagService.getTagById(this.tag.id.toString()).subscribe({
      next: (fullTag) => {
        this.tag = fullTag;
        this.tagForm.patchValue({
          name: fullTag.name,
          color: this.normalizeColor(fullTag.colorCode || fullTag.color || '#007bff'),
          description: fullTag.description || '',
          contactIds: fullTag.contactIds || []
        });
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.tagForm.controls).forEach(key => {
      const control = this.tagForm.get(key);
      control?.markAsTouched();
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
}
