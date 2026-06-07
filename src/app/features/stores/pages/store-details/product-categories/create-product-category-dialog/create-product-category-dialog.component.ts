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
import { StoreManagementFacade } from '../../../../services/store-management.facade';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-create-product-category-dialog',
  imports: [
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    MaterialModule,
    FormsModule,
    TablerIconsModule,
  ],
  templateUrl: './create-product-category-dialog.component.html',
  styleUrl: './create-product-category-dialog.component.scss',
})
export class CreateProductCategoryDialogComponent {
  dialogRef = inject<MatDialogRef<CreateProductCategoryDialogComponent>>(MatDialogRef);
  private storeManagementFacade = inject(StoreManagementFacade);
  private snackBar = inject(MatSnackBar);
  data = inject(MAT_DIALOG_DATA);

  action: string;
  local_data: any;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    this.action = 'Add';
    this.local_data = { name: '', description: '' };
  }

  doAction(): void {
    const categoryData = {
      name: this.local_data.name,
      description: this.local_data.description || '',
    };

    this.storeManagementFacade.createStoreProductCategory(this.data.storeId, categoryData).subscribe({
      next: (response) => {
        this.snackBar.open('Product category created successfully!', 'Close', { duration: 3000 });
        this.dialogRef.close({ event: 'Create' });
      },
      error: (error) => {
        console.error('Error creating product category:', error);
        this.snackBar.open('Error creating product category', 'Close', { duration: 3000 });
      }
    });
  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }
}