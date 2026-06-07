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
  selector: 'app-create-role-dialog',
  imports: [
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    MaterialModule,
    FormsModule,
    TablerIconsModule,
  ],
  templateUrl: './create-role-dialog.component.html',
  styleUrl: './create-role-dialog.component.scss',
})
export class CreateRoleDialogComponent {
  dialogRef = inject<MatDialogRef<CreateRoleDialogComponent>>(MatDialogRef);
  private roleService = inject(RoleService);
  private snackBar = inject(MatSnackBar);
  data = inject(MAT_DIALOG_DATA);

  action: string;
  local_data: any;
  roleTypes: RoleType[] = ['CUSTOM'];

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    this.action = 'Add';
    this.local_data = { name: '', type: 'CUSTOM', description: '' };
  }

  doAction(): void {
    const roleData = {
      name: this.local_data.name,
      type: 'CUSTOM' as RoleType,
      description: this.local_data.description || '',
    };

    this.roleService.createRole(roleData).subscribe({
      next: (response) => {
        this.snackBar.open('Role created successfully!', 'Close', { duration: 3000 });
        this.dialogRef.close({ event: 'Create' });
      },
      error: (error) => {
        console.error('Error creating role:', error);
        this.snackBar.open('Error creating role', 'Close', { duration: 3000 });
      }
    });
  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }
}
