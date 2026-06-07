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
import { FormsModule } from '@angular/forms';
import { TablerIconsModule } from 'angular-tabler-icons';
import { RoleService } from '../../../services/role.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RoleType } from '../../../models/role';

@Component({
  selector: 'app-edit-role-dialog',
  imports: [
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    MaterialModule,
    FormsModule,
    TablerIconsModule,
  ],
  templateUrl: './edit-role-dialog.component.html',
  styleUrl: './edit-role-dialog.component.scss',
})
export class EditRoleDialogComponent {
  dialogRef = inject<MatDialogRef<EditRoleDialogComponent>>(MatDialogRef);
  private roleService = inject(RoleService);
  private snackBar = inject(MatSnackBar);
  data = inject(MAT_DIALOG_DATA);

  action: string;
  local_data: any;
  roleTypes: RoleType[] = ['CUSTOM'];

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    const data = this.data;

    this.action = 'Update';
    this.local_data = { ...data.role };
  }

  doAction(): void {
    if (this.local_data.isSystem) {
      this.snackBar.open('System roles cannot be modified', 'Close', { duration: 3000 });
      return;
    }

    const updateData = {
      name: this.local_data.name,
      type: 'CUSTOM' as RoleType,
      description: this.local_data.description || '',
    };

    this.roleService.updateRole(this.local_data.id, updateData).subscribe({
      next: (response) => {
        this.snackBar.open('Role updated successfully!', 'Close', { duration: 3000 });
        this.dialogRef.close({ event: 'Update' });
      },
      error: (error) => {
        console.error('Error updating role:', error);
        this.snackBar.open('Error updating role', 'Close', { duration: 3000 });
      }
    });
  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }
}
