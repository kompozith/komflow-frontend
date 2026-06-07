import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CalendarEvent } from 'angular-calendar';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { EgretCalendarEvent } from '../event.model';
import { MaterialModule } from 'src/app/material.module';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { TablerIconsModule } from 'angular-tabler-icons';

interface DialogData {
  event?: CalendarEvent;
  action?: string;
  date?: Date;
}

@Component({
    selector: 'app-calendar-form-dialog',
    templateUrl: './calendar-form-dialog.component.html',
    imports: [
        MaterialModule,
        FormsModule,
        ReactiveFormsModule,
        MatDatepickerModule,
        TablerIconsModule
    ],
    providers: [provideNativeDateAdapter()],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarFormDialogComponent {
  dialogRef = inject<MatDialogRef<CalendarFormDialogComponent>>(MatDialogRef);
  private data = inject<DialogData>(MAT_DIALOG_DATA);
  private formBuilder = inject(UntypedFormBuilder);

  event = signal<any>(null);
  dialogTitle = signal<string>('');
  action = signal<any>('add');
  eventForm: UntypedFormGroup;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    const data = this.data;

    this.event.set(data.event);
    this.action.set(data.action);

    if (this.action() === 'edit' && this.event()) {
      this.dialogTitle.set('Edit Event');
    } else {
      this.dialogTitle.set('Add Event');
      this.event.set(
        new EgretCalendarEvent({
          start: data.date,
          end: data.date,
          title: '',
        })
      );
    }

    this.eventForm = this.buildEventForm(this.event());
  }

  buildEventForm(event: any): UntypedFormGroup {
    const start = event?.start ? new Date(event.start) : new Date();
    const end = event?.end ? new Date(event.end) : start;

    return this.formBuilder.group({
      id: new UntypedFormControl(event?.meta?.id ?? null),
      title: new UntypedFormControl(event?.title ?? '', [Validators.required, Validators.maxLength(200)]),
      description: new UntypedFormControl(event?.meta?.description ?? ''),
      location: new UntypedFormControl(event?.meta?.location ?? ''),
      startDate: new UntypedFormControl(this.toDateInputValue(start), [Validators.required]),
      startTime: new UntypedFormControl(this.toTimeInputValue(start), [Validators.required]),
      endDate: new UntypedFormControl(this.toDateInputValue(end), [Validators.required]),
      endTime: new UntypedFormControl(this.toTimeInputValue(end), [Validators.required]),
      timezone: new UntypedFormControl(event?.meta?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone),
      color: this.formBuilder.group({
        primary: new UntypedFormControl(event?.color?.primary ?? '#5d87ff'),
        secondary: new UntypedFormControl(event?.color?.secondary ?? '#ecf2ff'),
      }),
    });
  }

  onSave(): void {
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      return;
    }

    const value = this.eventForm.value;
    const start = this.combineDateAndTime(value.startDate, value.startTime);
    const end = this.combineDateAndTime(value.endDate, value.endTime);

    if (!start || !end) {
      this.eventForm.markAllAsTouched();
      return;
    }

    if (end.getTime() < start.getTime()) {
      this.eventForm.get('endDate')?.setErrors({ beforeStart: true });
      return;
    }

    this.dialogRef.close({
      action: 'save',
      event: {
        ...value,
        start,
        end,
      },
    });
  }

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toTimeInputValue(date: Date): string {
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private combineDateAndTime(dateValue: string, timeValue: string): Date | null {
    if (!dateValue || !timeValue) {
      return null;
    }
    const combined = new Date(`${dateValue}T${timeValue}:00`);
    return Number.isNaN(combined.getTime()) ? null : combined;
  }
}
