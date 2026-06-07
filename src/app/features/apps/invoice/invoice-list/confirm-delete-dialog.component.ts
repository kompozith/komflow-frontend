import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
    selector: 'app-confirm-delete-dialog',
    templateUrl: 'confirm-delete-dialog.component.html',
    imports: [MatDialogModule, MatButtonModule]
})
export class AppConfirmDeleteDialogComponent {
  private dialogRef = inject<MatDialogRef<AppConfirmDeleteDialogComponent>>(MatDialogRef);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
