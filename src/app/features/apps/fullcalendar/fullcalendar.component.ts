import {
  Component,
  ChangeDetectionStrategy,
  Inject,
  signal,
} from '@angular/core';
import { CommonModule, NgSwitch } from '@angular/common';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import {
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { CalendarFormDialogComponent } from './calendar-form-dialog/calendar-form-dialog.component';
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  addMonths,
} from 'date-fns';
import { Subject } from 'rxjs';
import {
  CalendarDateFormatter,
  CalendarEvent,
  CalendarEventAction,
  CalendarEventTimesChangedEvent,
  CalendarModule,
  CalendarView,
} from 'angular-calendar';
import { MaterialModule } from 'src/app/material.module';
import {
  MatNativeDateModule,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppEvent, CreateEventRequest, EventService } from '../../core/services/event.service';

const colors: any = {
  red: {
    primary: '#fa896b',
    secondary: '#fdede8',
  },
  blue: {
    primary: '#5d87ff',
    secondary: '#ecf2ff',
  },
  yellow: {
    primary: '#ffae1f',
    secondary: '#fef5e5',
  },
};

@Component({
    selector: 'app-calendar-dialog',
    templateUrl: './dialog.component.html',
    styleUrls: ['./fullcalendar.component.scss'],
    imports: [
      MaterialModule,
      CommonModule,
      MatDialogModule,
      TablerIconsModule,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<CalendarDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  get event(): CalendarEvent | null {
    return this.data?.event ?? null;
  }

  get hasDescription(): boolean {
    const description = this.event?.meta?.description;
    return !!description && `${description}`.trim().length > 0;
  }

  get hasLocation(): boolean {
    const location = this.event?.meta?.location;
    return !!location && `${location}`.trim().length > 0;
  }

  get timezoneLabel(): string {
    return this.event?.meta?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  formatEventDate(value?: Date): string {
    if (!value) return '-';
    return value.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  formatEventTime(value?: Date): string {
    if (!value) return '--:--';
    return value.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  onEdit(): void {
    this.dialogRef.close('edit');
  }

  onDelete(): void {
    this.dialogRef.close('delete');
  }
}

@Component({
    selector: 'app-calendar-delete-dialog',
    template: `
      <div mat-dialog-content>
        <div class="d-flex align-items-center justify-content-between m-b-16">
          <h4 class="f-s-16 f-w-600 m-b-0">Delete Event</h4>
          <button mat-icon-button mat-dialog-close class="d-flex justify-content-center" type="button">
            <i-tabler name="x" class="icon-20 d-flex"></i-tabler>
          </button>
        </div>

        <div class="rounded border p-16 bg-light-error m-b-16">
          <h5 class="f-w-600 m-b-8">{{ data?.event?.title || 'Untitled event' }}</h5>
          <p class="m-b-0 text-muted f-s-13">
            This action is permanent. The event will be removed from the calendar.
          </p>
        </div>

        <div class="d-flex justify-content-end gap-8">
          <button mat-stroked-button mat-dialog-close type="button">Cancel</button>
          <button mat-flat-button color="warn" [mat-dialog-close]="true" type="button">Delete</button>
        </div>
      </div>
    `,
    imports: [
      MaterialModule,
      CommonModule,
      MatDialogModule,
      TablerIconsModule,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarDeleteDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}

@Component({
    selector: 'app-fullcalendar',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './fullcalendar.component.html',
    styleUrls: ['./fullcalendar.component.scss'],
    imports: [
        MaterialModule,
        FormsModule,
        ReactiveFormsModule,
        NgSwitch,
        CalendarModule,
        CommonModule,
        MatDatepickerModule,
        MatDialogModule,
        MatFormFieldModule,
    ],
    providers: [provideNativeDateAdapter(), CalendarDateFormatter]
})
export class AppFullcalendarComponent {
  dialogRef = signal<MatDialogRef<CalendarDialogComponent> | any>(null);
  dialogRef2 = signal<MatDialogRef<CalendarFormDialogComponent> | any>(null);
  lastCloseResult = signal<string>('');
  view = signal<any>('month');
  viewDate = signal<Date>(new Date());
  activeDayIsOpen = signal<boolean>(true);
  isLoading = signal<boolean>(false);

  actions: CalendarEventAction[] = [
    {
      label: '<span class="text-white link m-l-5">Details</span>',
      onClick: ({ event }: { event: CalendarEvent }): void => {
        this.handleEvent('details', event);
      },
    },
    {
      label: '<span class="text-error m-l-5">Delete</span>',
      onClick: ({ event }: { event: CalendarEvent }): void => {
        this.deleteEvent(event);
      },
    },
  ];

  refresh: Subject<any> = new Subject();
  events = signal<CalendarEvent[] | any>([]);

  constructor(
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private eventService: EventService
  ) {
    this.loadEventsForCurrentView();
  }

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    if (isSameMonth(date, this.viewDate())) {
      if (
        (isSameDay(this.viewDate(), date) && this.activeDayIsOpen() === true) ||
        events.length === 0
      ) {
        this.activeDayIsOpen.set(false);
      } else {
        this.activeDayIsOpen.set(true);
        this.viewDate.set(date);
      }
    }

    if (events.length === 0) {
      this.openEventForm('add', undefined, date);
    }
  }

  eventTimesChanged({
    event,
    newStart,
    newEnd,
  }: CalendarEventTimesChangedEvent): void {
    const eventId = this.extractEventId(event);
    if (!eventId) {
      return;
    }

    const payload = this.toCreateEventPayload({
      ...event,
      start: newStart,
      end: newEnd,
    });

    this.eventService.updateEvent(eventId, payload).subscribe({
      next: () => {
        this.loadEventsForCurrentView();
      },
      error: (error) => {
        console.error('Error moving event:', error);
        this.snackBar.open('Unable to update event dates', 'Close', { duration: 3000 });
        this.loadEventsForCurrentView();
      },
    });
  }

  handleEvent(action: string, event: CalendarEvent): void {
    this.dialogRef.set(
      this.dialog.open(CalendarDialogComponent, {
        width: '560px',
        maxWidth: '96vw',
        autoFocus: false,
        data: { event, action },
      })
    );

    this.dialogRef()
      .afterClosed()
      .subscribe((result: 'edit' | 'delete' | undefined) => {
        this.lastCloseResult.set(result || '');
        this.dialogRef.set(null);

        if (result === 'edit') {
          this.openEventForm('edit', event);
          return;
        }

        if (result === 'delete') {
          this.openDeleteDialog(event);
        }
      });
  }

  addEvent(): void {
    this.openEventForm('add', undefined, this.viewDate());
  }

  private openEventForm(action: 'add' | 'edit', event?: CalendarEvent, date?: Date): void {
    this.dialogRef2.set(
      this.dialog.open(CalendarFormDialogComponent, {
        panelClass: 'calendar-form-dialog',
        autoFocus: false,
        data: {
          action,
          event,
          date: date ?? new Date(),
        },
      })
    );

    this.dialogRef2()
      .afterClosed()
      .subscribe((res: { action: any; event: any }) => {
        if (!res || res.action !== 'save') {
          return;
        }

        const payload = this.toCreateEventPayload(res.event);
        const eventId = res.event?.id ?? this.extractEventId(event);

        if (action === 'edit' && eventId) {
          this.eventService.updateEvent(eventId, payload).subscribe({
            next: () => {
              this.snackBar.open('Event updated', 'Close', { duration: 2500 });
              this.loadEventsForCurrentView();
            },
            error: (error) => {
              console.error('Error updating event:', error);
              this.snackBar.open('Unable to update event', 'Close', { duration: 3000 });
            },
          });
        } else {
          this.eventService.createEvent(payload).subscribe({
            next: () => {
              this.snackBar.open('Event created', 'Close', { duration: 2500 });
              this.loadEventsForCurrentView();
            },
            error: (error) => {
              console.error('Error creating event:', error);
              this.snackBar.open('Unable to create event', 'Close', { duration: 3000 });
            },
          });
        }
      });
  }

  deleteEvent(eventToDelete: CalendarEvent): void {
    this.openDeleteDialog(eventToDelete);
  }

  private openDeleteDialog(eventToDelete: CalendarEvent): void {
    const eventId = this.extractEventId(eventToDelete);
    if (!eventId) {
      return;
    }

    const confirmRef = this.dialog.open(CalendarDeleteDialogComponent, {
      width: '440px',
      maxWidth: '95vw',
      autoFocus: false,
      data: { event: eventToDelete },
    });

    confirmRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) {
        return;
      }
      this.deleteEventById(eventId);
    });
  }

  private deleteEventById(eventId: number): void {
    this.eventService.deleteEvent(eventId).subscribe({
      next: () => {
        this.snackBar.open('Event deleted', 'Close', { duration: 2500 });
        this.loadEventsForCurrentView();
      },
      error: (error) => {
        console.error('Error deleting event:', error);
        this.snackBar.open('Unable to delete event', 'Close', { duration: 3000 });
      },
    });
  }

  setView(view: CalendarView | any): void {
    this.view.set(view);
    this.loadEventsForCurrentView();
  }

  goToPreviousMonth(): void {
    this.viewDate.set(subMonths(this.viewDate(), 1));
    this.loadEventsForCurrentView();
  }

  goToNextMonth(): void {
    this.viewDate.set(addMonths(this.viewDate(), 1));
    this.loadEventsForCurrentView();
  }

  goToToday(): void {
    this.viewDate.set(new Date());
    this.loadEventsForCurrentView();
  }

  private loadEventsForCurrentView(): void {
    const range = this.getCurrentRange();
    this.isLoading.set(true);

    this.eventService.listEvents(range.start.toISOString(), range.end.toISOString()).subscribe({
      next: (events) => {
        this.events.set((events || []).map((event) => this.toCalendarEvent(event)));
        this.refresh.next(true);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.events.set([]);
        this.refresh.next(true);
        this.isLoading.set(false);
      },
    });
  }

  private getCurrentRange(): { start: Date; end: Date } {
    if (this.view() === 'week') {
      return {
        start: startOfWeek(this.viewDate(), { weekStartsOn: 1 }),
        end: endOfWeek(this.viewDate(), { weekStartsOn: 1 }),
      };
    }

    if (this.view() === 'day') {
      return {
        start: startOfDay(this.viewDate()),
        end: endOfDay(this.viewDate()),
      };
    }

    return {
      start: startOfMonth(this.viewDate()),
      end: endOfMonth(this.viewDate()),
    };
  }

  private toCalendarEvent(event: AppEvent): CalendarEvent {
    const start = this.toDateFromEvent(event.startDate, event.startTime, event.startAt);
    const end = this.toDateFromEvent(event.endDate, event.endTime, event.endAt);

    return {
      start,
      end: end ?? undefined,
      title: event.title,
      color: colors.yellow,
      actions: this.actions,
      draggable: true,
      resizable: {
        beforeStart: true,
        afterEnd: true,
      },
      meta: {
        id: event.id,
        description: event.description,
        location: event.location,
        timezone: event.timezone,
      },
    };
  }

  private extractEventId(event?: CalendarEvent): number | null {
    const id = event?.meta?.id;
    return typeof id === 'number' ? id : null;
  }

  private toCreateEventPayload(formEvent: any): CreateEventRequest {
    const startDateTime = this.extractDateTimeParts(formEvent.start, formEvent.startDate, formEvent.startTime)
      ?? this.extractDateTimeParts(new Date(), null, null)!;
    const endDateTime = this.extractDateTimeParts(formEvent.end, formEvent.endDate, formEvent.endTime) ?? startDateTime;

    return {
      title: formEvent.title,
      description: formEvent.description || '',
      mode: 'ONSITE',
      location: formEvent.location || '',
      startDate: startDateTime.date,
      startTime: startDateTime.time,
      endDate: endDateTime.date,
      endTime: endDateTime.time,
      timezone: formEvent.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  private extractDateTimeParts(dateValue?: Date | string | null, dateText?: string | null, timeText?: string | null): { date: string; time: string } | null {
    if (dateText && timeText) {
      return { date: dateText, time: timeText };
    }

    if (!dateValue) {
      return null;
    }

    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return {
      date: this.formatDateInput(parsed),
      time: this.formatTimeInput(parsed),
    };
  }

  private toDateFromEvent(date?: string | null, time?: string | null, fallbackIso?: string | null): Date {
    if (date) {
      const safeTime = time && time.trim().length > 0 ? time : '00:00';
      const parsed = new Date(`${date}T${safeTime}:00`);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    const fallback = fallbackIso ? new Date(fallbackIso) : new Date();
    return Number.isNaN(fallback.getTime()) ? new Date() : fallback;
  }

  private formatDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatTimeInput(date: Date): string {
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}
