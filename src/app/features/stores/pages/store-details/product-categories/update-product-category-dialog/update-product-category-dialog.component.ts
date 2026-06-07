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
import { ProductCategory } from '../../../../models/product-category';

@Component({
  selector: 'app-update-product-category-dialog',
  imports: [
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    MaterialModule,
    FormsModule,
    TablerIconsModule,
  ],
  templateUrl: './update-product-category-dialog.component.html',
  styleUrl: './update-product-category-dialog.component.scss',
})
export class UpdateProductCategoryDialogComponent {
  dialogRef = inject<MatDialogRef<UpdateProductCategoryDialogComponent>>(MatDialogRef);
  private storeManagementFacade = inject(StoreManagementFacade);
  private snackBar = inject(MatSnackBar);
  data = inject<{
    category: ProductCategory;
    storeId: string;
}>(MAT_DIALOG_DATA);

  action: string;
  local_data: any;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    this.action = 'Update';
    this.local_data = {
      name: this.data.category.name,
      description: this.data.category.description || ''
    };
  }

  doAction(): void {
    const categoryData = {
      name: this.local_data.name,
      description: this.local_data.description || '',
      storeId: this.data.storeId
    };

    this.storeManagementFacade.updateStoreProductCategory(this.data.storeId, this.data.category.id, categoryData).subscribe({
      next: (response) => {
        this.snackBar.open('Product category updated successfully!', 'Close', { duration: 3000 });
        this.dialogRef.close({ event: 'Update' });
      },
      error: (error) => {
        console.error('Error updating product category:', error);
        this.snackBar.open('Error updating product category', 'Close', { duration: 3000 });
      }
    });
  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }
}