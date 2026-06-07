import { Component, inject } from '@angular/core';
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
    TablerIconsModule
],
  templateUrl: './person-edit-dialog.component.html',
})
export class PersonEditDialogComponent {
  dialogRef = inject<MatDialogRef<PersonEditDialogComponent>>(MatDialogRef);
  private fb = inject(FormBuilder);
  private personService = inject(PersonService);
  private snackBar = inject(MatSnackBar);
  data = inject<{
    personId: number;
}>(MAT_DIALOG_DATA);

  personForm: FormGroup;
  isSaving = false;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
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
