import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';

export interface ScheduleCampaignDialogData {
  campaignId: string;
  campaignName: string;
  existingScheduledAt?: string;
}

@Component({
  selector: 'app-schedule-campaign-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    TablerIconsModule,
    MatDialogModule
  ],
  templateUrl: './schedule-campaign-dialog.component.html'
})
export class ScheduleCampaignDialogComponent {
  private dialogRef = inject(MatDialogRef<ScheduleCampaignDialogComponent>);
  private fb = inject(FormBuilder);
  
  readonly data = inject<ScheduleCampaignDialogData>(MAT_DIALOG_DATA);

  form: FormGroup = this.fb.group({
    scheduledDate: ['', Validators.required],
    scheduledTime: ['', Validators.required]
  });

  minDate: Date = new Date();

  onCancel(): void {
    this.dialogRef.close();
  }

  onSchedule(): void {
    if (this.form.valid) {
      const { scheduledDate, scheduledTime } = this.form.value;
      
      // Combine date and time into a single ISO string
      const scheduledAt = new Date(scheduledDate);
      const [hours, minutes] = scheduledTime.split(':');
      scheduledAt.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      
      this.dialogRef.close({
        scheduledAt: scheduledAt.toISOString()
      });
    }
  }
}
