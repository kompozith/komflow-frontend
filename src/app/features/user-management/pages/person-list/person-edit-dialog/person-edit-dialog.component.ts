import { Component, Inject } from '@angular/core';
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
import { MatSnackBar } from '@angular/material/snack-bar';
import { PersonService } from '../../../../personnel/services/person.service';
import { UpdatePersonRequest } from '../../../../personnel/models/person';

@Component({
  selector: 'app-person-edit-dialog',
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
  templateUrl: './person-edit-dialog.component.html',
})
export class PersonEditDialogComponent {
  personForm: FormGroup;
  isSaving = false;

  constructor(
    public dialogRef: MatDialogRef<PersonEditDialogComponent>,
    private fb: FormBuilder,
    private personService: PersonService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { personId: number }
  ) {
    this.personForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: [''],
      lastName: [''],
      language: [''],
    });

    this.loadPerson();
  }

  loadPerson(): void {
    this.personService.getPersonById(this.data.personId).subscribe({
      next: (person) => {
        this.personForm.patchValue({
          email: person.email,
          firstName: person.firstName || '',
          lastName: person.lastName || '',
          language: person.language || '',
        });
      },
      error: (error) => {
        console.error('Error loading person:', error);
        this.snackBar.open('Error loading person', 'Close', { duration: 3000 });
      }
    });
  }

  save(): void {
    if (this.personForm.invalid) {
      this.personForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const payload: UpdatePersonRequest = {
      email: this.personForm.value.email,
      firstName: this.personForm.value.firstName || undefined,
      lastName: this.personForm.value.lastName || undefined,
      language: this.personForm.value.language || undefined,
    };

    this.personService.updatePerson(this.data.personId, payload).subscribe({
      next: () => {
        this.snackBar.open('Person updated successfully', 'Close', { duration: 3000 });
        this.dialogRef.close({ event: 'Update' });
      },
      error: (error) => {
        console.error('Error updating person:', error);
        this.snackBar.open('Error updating person', 'Close', { duration: 3000 });
        this.isSaving = false;
      }
    });
  }

  close(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }
}
