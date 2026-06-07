import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule } from '@angular/forms';
import { TablerIconsModule } from 'angular-tabler-icons';
import { RoleService } from '../../../services/role.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-confirm-delete-dialog',
  imports: [
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MaterialModule,
    FormsModule,
    TablerIconsModule,
  ],
  templateUrl: './confirm-delete-dialog.component.html',
})
export class ConfirmDeleteDialogComponent {
  dialogRef = inject<MatDialogRef<ConfirmDeleteDialogComponent>>(MatDialogRef);
  private roleService = inject(RoleService);
  private snackBar = inject(MatSnackBar);
  data = inject(MAT_DIALOG_DATA);

  action: string;
  local_data: any;
  confirmationText: string = '';

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    const data = this.data;

    this.action = 'Delete';
    this.local_data = { ...data.role };
  }

  get isConfirmationValid(): boolean {
    return this.confirmationText === this.local_data.name;
  }

  doAction(): void {
    if (!this.isConfirmationValid) {
      return;
    }

    const roleId = this.local_data.id || this.data.id;
    this.roleService.deleteRole(roleId).subscribe({
      next: () => {
        this.snackBar.open('Role deleted successfully!', 'Close', { duration: 3000 });
        this.dialogRef.close({ event: 'Delete' });
      },
      error: (error) => {
        console.error('Error deleting role:', error);
        this.snackBar.open('Error deleting role', 'Close', { duration: 3000 });
      }
    });
  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }
}