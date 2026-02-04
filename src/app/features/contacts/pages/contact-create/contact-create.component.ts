import { Component, Inject, Optional } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule, ReactiveFormsModule, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CommonModule } from '@angular/common';
import { ContactService } from '../../services/contact.service';
import { CreateContactRequest } from '../../models/contact';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TagService } from '../../../tags/services/tag.service';
import { Tag } from '../../../tags/models/tag';
import { Router } from '@angular/router';
import { PersonService } from '../../../personnel/services/person.service';
import { Person } from '../../../personnel/models/person';

@Component({
  selector: 'app-contact-create',
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
  templateUrl: './contact-create.component.html',
  styleUrl: './contact-create.component.scss',
})
export class ContactCreateComponent {
  contactForm: FormGroup;
  isLoading = false;
  availableTags: Tag[] = [];
  availablePersons: Person[] = [];
  personSearch = '';
  personMode: 'existing' | 'new' = 'existing';

  constructor(
    @Optional() public dialogRef: MatDialogRef<ContactCreateComponent> | null,
    private fb: FormBuilder,
    private contactService: ContactService,
    private tagService: TagService,
    private personService: PersonService,
    private snackBar: MatSnackBar,
    private router: Router,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.contactForm = this.fb.group({
      personId: [null],
      enabled: [true],
      lastMessageReceivedAt: [''],
      tagIds: [[]],
      newPerson: this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        firstName: [''],
        lastName: [''],
        language: [''],
        phoneNumbers: this.fb.array([]),
      }),
    });

    this.setPersonMode('existing');
    this.loadTags();
    this.loadPersons();
    this.addPhoneNumber();
  }

  doAction(): void {
    if (this.contactForm.valid && this.isPersonSelectionValid()) {
      this.isLoading = true;
      const formValue = this.contactForm.value;

      const contactData: CreateContactRequest = {
        enabled: !!formValue.enabled,
        lastMessageReceivedAt: formValue.lastMessageReceivedAt
          ? new Date(formValue.lastMessageReceivedAt).toISOString()
          : null,
        tagIds: formValue.tagIds || [],
      };

      if (this.personMode === 'existing') {
        contactData.personId = Number(formValue.personId);
      } else {
        const personForm = formValue.newPerson;
        contactData.person = {
          email: personForm.email,
          firstName: personForm.firstName || undefined,
          lastName: personForm.lastName || undefined,
          language: personForm.language || undefined,
        };
        contactData.phoneNumbers = (personForm.phoneNumbers || [])
          .filter((p: any) => p.number)
          .map((p: any) => ({
            number: p.number,
            isWhatsapp: !!p.isWhatsapp,
          }));
      }

      this.contactService.createContact(contactData).subscribe({
        next: () => {
          this.snackBar.open('Contact created successfully', 'Close', { duration: 3000 });
          if (this.dialogRef) {
            this.dialogRef.close({ event: 'Create' });
          } else {
            this.router.navigate(['/contacts/list']);
          }
        },
        error: (error) => {
          console.error('Error creating contact:', error);
          this.snackBar.open('Error creating contact', 'Close', { duration: 3000 });
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  closeDialog(): void {
    if (this.dialogRef) {
      this.dialogRef.close({ event: 'Cancel' });
    } else {
      this.router.navigate(['/contacts/list']);
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.contactForm.controls).forEach(key => {
      const control = this.contactForm.get(key);
      control?.markAsTouched();
    });
  }

  private loadTags(): void {
    this.tagService.getTags({ page: 0, size: 200 }).subscribe({
      next: (response) => {
        this.availableTags = response.content || [];
      },
      error: (error) => {
        console.error('Error loading tags:', error);
        this.snackBar.open('Error loading tags', 'Close', { duration: 3000 });
      }
    });
  }

  private loadPersons(): void {
    this.personService.getPersons(0, 200).subscribe({
      next: (response) => {
        this.availablePersons = response.content || [];
      },
      error: (error) => {
        console.error('Error loading persons:', error);
        this.snackBar.open('Error loading persons', 'Close', { duration: 3000 });
      }
    });
  }

  setPersonMode(mode: 'existing' | 'new'): void {
    this.personMode = mode;
    const newPersonGroup = this.contactForm.get('newPerson');
    if (mode === 'existing') {
      this.contactForm.get('personId')?.setValidators([Validators.required]);
      this.contactForm.get('personId')?.updateValueAndValidity();
      newPersonGroup?.disable({ emitEvent: false });
    } else {
      this.contactForm.get('personId')?.clearValidators();
      this.contactForm.get('personId')?.setValue(null);
      this.contactForm.get('personId')?.updateValueAndValidity();
      newPersonGroup?.enable({ emitEvent: false });
    }
  }

  get phoneNumbers(): FormArray {
    return this.contactForm.get('newPerson.phoneNumbers') as FormArray;
  }

  addPhoneNumber(): void {
    this.phoneNumbers.push(this.fb.group({
      number: ['', Validators.required],
      isWhatsapp: [false],
    }));
  }

  removePhoneNumber(index: number): void {
    if (this.phoneNumbers.length > 1) {
      this.phoneNumbers.removeAt(index);
    }
  }

  private isPersonSelectionValid(): boolean {
    if (this.personMode === 'existing') {
      return !!this.contactForm.get('personId')?.value;
    }
    return this.contactForm.get('newPerson')?.valid ?? false;
  }
}
