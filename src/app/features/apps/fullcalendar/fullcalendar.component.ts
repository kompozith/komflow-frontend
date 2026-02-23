import {
  Component,
  ChangeDetectionStrategy,
  Inject,
  signal,
  DOCUMENT,
} from '@angular/core';
import { CommonModule, NgSwitch } from '@angular/common';
import {
  MatDialog,
  MatDialogRef,
  MatDialogConfig,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormGroup,
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
    imports: [
        MaterialModule,
        FormsModule,
        ReactiveFormsModule,
        CommonModule,
        MatNativeDateModule,
        MatDialogModule,
        MatDatepickerModule,  TablerIconsModule
    ],
    providers: [provideNativeDateAdapter()],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarDialogComponent {
  options!: UntypedFormGroup;

  constructor(
    public dialogRef: MatDialogRef<CalendarDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
}

@Component({
    selector: 'app-fullcalendar',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './fullcalendar.component.html',
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

  config: MatDialogConfig = {
    disableClose: false,
    width: '',
    height: '',
    position: {
      top: '',
      bottom: '',
      left: '',
      right: '',
    },
    data: {
      action: '',
      event: [],
    },
  };

  actions: CalendarEventAction[] = [
    {
      label: '<span class="text-white link m-l-5">Edit</span>',
      onClick: ({ event }: { event: CalendarEvent }): void => {
        this.openEventForm('edit', event);
      },
    },
    {
      label: '<span class="text-danger m-l-5">Delete</span>',
      onClick: ({ event }: { event: CalendarEvent }): void => {
        this.deleteEvent(event);
      },
    },
  ];

  refresh: Subject<any> = new Subject();
  events = signal<CalendarEvent[] | any>([]);

  constructor(
    public dialog: MatDialog,
    @Inject(DOCUMENT) doc: any,
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
    this.config.data = { event, action };
    this.dialogRef.set(this.dialog.open(CalendarDialogComponent, this.config));

    this.dialogRef()
      .afterClosed()
      .subscribe((result: string) => {
        this.lastCloseResult.set(result);
        this.dialogRef.set(null);
        this.refresh.next(result);
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
    const eventId = this.extractEventId(eventToDelete);
    if (!eventId) {
      return;
    }

    const confirmed = window.confirm('Delete this event?');
    if (!confirmed) {
      return;
    }

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
      color: event.allDay ? colors.blue : colors.yellow,
      actions: this.actions,
      allDay: !!event.allDay,
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
    const endDateTime = this.extractDateTimeParts(formEvent.end, formEvent.endDate, formEvent.endTime);

    return {
      title: formEvent.title,
      description: formEvent.description || '',
      location: formEvent.location || '',
      startDate: startDateTime.date,
      startTime: startDateTime.time,
      endDate: endDateTime ? endDateTime.date : null,
      endTime: endDateTime ? endDateTime.time : null,
      timezone: formEvent.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      allDay: !!formEvent.allDay,
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
