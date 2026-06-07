import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from 'src/app/material.module';
import { AppEvent, EventService } from 'src/app/features/core/services/event.service';

@Component({
  selector: 'app-delete-event-dialog',
  imports: [
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MaterialModule,
    FormsModule,
  ],
  templateUrl: './delete-event-dialog.component.html',
  styleUrl: './delete-event-dialog.component.scss',
})
export class DeleteEventDialogComponent {
  dialogRef = inject<MatDialogRef<DeleteEventDialogComponent>>(MatDialogRef);
  private eventService = inject(EventService);
  private snackBar = inject(MatSnackBar);
  data = inject<{
    event: AppEvent;
}>(MAT_DIALOG_DATA);

  action = 'Delete';
  confirmationText = '';
  localData: AppEvent;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    const data = this.data;

    this.localData = { ...data.event };
  }

  get isConfirmationValid(): boolean {
    return this.confirmationText === this.localData.title;
  }

  get event(): AppEvent {
    return this.localData;
  }

  doAction(): void {
    if (!this.isConfirmationValid) {
      return;
    }

    this.eventService.deleteEvent(this.event.id).subscribe({
      next: () => {
        this.snackBar.open('Evenement supprime', 'Fermer', { duration: 2500 });
        this.dialogRef.close({ event: 'Delete' });
      },
      error: () => {
        this.snackBar.open('Suppression impossible', 'Fermer', { duration: 3000 });
      },
    });
  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }
}
