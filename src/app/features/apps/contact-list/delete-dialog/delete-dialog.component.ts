import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
@Component({
    selector: 'app-delete-dialog',
    imports: [MatButtonModule, MatDialogModule],
    templateUrl: './delete-dialog.component.html',
})
export class AppDeleteDialogComponent {
  dialogRef = inject<MatDialogRef<AppDeleteDialogComponent>>(MatDialogRef);
  data = inject<{
    message: string;
}>(MAT_DIALOG_DATA);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
