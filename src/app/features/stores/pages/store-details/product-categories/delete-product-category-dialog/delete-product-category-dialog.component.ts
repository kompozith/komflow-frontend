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
  selector: 'app-delete-product-category-dialog',
  imports: [
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    MaterialModule,
    FormsModule,
    TablerIconsModule,
  ],
  templateUrl: './delete-product-category-dialog.component.html',
  styleUrl: './delete-product-category-dialog.component.scss',
})
export class DeleteProductCategoryDialogComponent {
  dialogRef = inject<MatDialogRef<DeleteProductCategoryDialogComponent>>(MatDialogRef);
  private storeManagementFacade = inject(StoreManagementFacade);
  private snackBar = inject(MatSnackBar);
  data = inject<{
    category: ProductCategory;
    storeId: string;
}>(MAT_DIALOG_DATA);

  confirmationText: string = '';

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  get category(): ProductCategory {
    return this.data.category;
  }

  get isConfirmationValid(): boolean {
    return this.confirmationText.trim() === this.category.name;
  }

  doAction(): void {
    this.storeManagementFacade.deleteStoreProductCategory(this.data.storeId, this.category.id).subscribe({
      next: () => {
        this.snackBar.open('Product category deleted successfully!', 'Close', { duration: 3000 });
        this.dialogRef.close({ event: 'Delete' });
      },
      error: (error) => {
        console.error('Error deleting product category:', error);
        this.snackBar.open('Error deleting product category', 'Close', { duration: 3000 });
      }
    });
  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }
}