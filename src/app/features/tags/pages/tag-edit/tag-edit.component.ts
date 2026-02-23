import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
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

@Component({
  selector: 'app-tag-edit',
  imports: [
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
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
    this.tagForm = this.fb.group({
      name: [data.tag.name, [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      color: [data.tag.colorCode || data.tag.color || '#007bff'],
      description: [data.tag.description || '', [Validators.maxLength(255)]],
      contactIds: [data.tag.contactIds || []]
    });
  }

  ngOnInit(): void {
    this.loadContacts();
    this.loadTagDetails();
  }

  onSubmit(): void {
    if (this.tagForm.valid) {
      this.isSaving = true;
      const formValue = this.tagForm.value;

      const tagData: UpdateTagRequest = {
        name: formValue.name,
        colorCode: formValue.color,
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

  private loadContacts(): void {
    this.contactService.getContacts().subscribe({
      next: (response: ContactPage) => {
        this.contacts = response.content || [];
      },
      error: () => {
        this.contacts = [];
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
          color: fullTag.colorCode || fullTag.color || '#007bff',
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
}
