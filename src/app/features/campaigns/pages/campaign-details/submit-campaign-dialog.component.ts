import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';

@Component({
  selector: 'app-submit-campaign-dialog',
  imports: [
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    MaterialModule
  ],
  templateUrl: './submit-campaign-dialog.component.html'
})
export class SubmitCampaignDialogComponent {
  readonly dialogRef = inject(MatDialogRef<SubmitCampaignDialogComponent>);
  readonly data = inject(MAT_DIALOG_DATA) as { campaignName: string };

  confirm(): void {
    this.dialogRef.close(true);
  }
}
