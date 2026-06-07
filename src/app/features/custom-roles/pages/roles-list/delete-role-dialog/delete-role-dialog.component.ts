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
import { TablerIconsModule } from 'angular-tabler-icons';
import { RoleService } from '../../../services/role.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-delete-role-dialog',
  imports: [
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    MaterialModule,
    TablerIconsModule,
  ],
  templateUrl: './delete-role-dialog.component.html',
  styleUrl: './delete-role-dialog.component.scss',
})
export class DeleteRoleDialogComponent {
  dialogRef = inject<MatDialogRef<DeleteRoleDialogComponent>>(MatDialogRef);
  private roleService = inject(RoleService);
  private snackBar = inject(MatSnackBar);
  data = inject(MAT_DIALOG_DATA);

  action: string;
  local_data: any;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    const data = this.data;

    this.action = 'Delete';
    this.local_data = { ...data.role };
  }

  confirmDelete(): void {
    // Just close with confirmation, actual deletion will happen in the next dialog
    this.dialogRef.close({ event: 'ConfirmDelete', role: this.local_data });
  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }
}
