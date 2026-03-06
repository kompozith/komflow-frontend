import { CommonModule } from '@angular/common';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatChipEditedEvent, MatChipInputEvent } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from 'src/app/material.module';
import { GeoCity, GeoCountry, GeoService } from 'src/app/features/core/services/geo.service';
import { AppEvent, CreateEventRequest, EventAgendaItem, EventMode } from 'src/app/features/core/services/event.service';
import { MessageEditorComponent } from 'src/app/features/messages/components/message-editor/message-editor.component';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, MessageEditorComponent],
  templateUrl: './event-form.component.html',
  styleUrls: ['./event-form.component.scss'],
})
export class EventFormComponent implements OnChanges, OnInit {
  @Input() initialEvent: AppEvent | null = null;
  @Input() submitLabel = 'Enregistrer';
  @Input() submitting = false;
  @Output() formSubmitted = new EventEmitter<CreateEventRequest>();
  @Output() cancelled = new EventEmitter<void>();

  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  readonly eventModes: Array<{ value: EventMode; label: string }> = [
    { value: 'ONSITE', label: 'Sur site' },
    { value: 'ONLINE', label: 'En ligne' },
  ];
  highlights: string[] = [];
  countries: GeoCountry[] = [];
  cities: GeoCity[] = [];
  readonly todayDate = new Date();
  private readonly defaultTimezone = this.resolveDefaultTimezone();

  form = this.fb.group(
    {
      title: ['', [Validators.required]],
      subtitle: [''],
      description: [''],
      mode: ['ONSITE' as EventMode, [Validators.required]],
      location: [''],
      address: [''],
      meetingUrl: [''],
      country: [''],
      city: [''],
      startDate: [null as Date | null, [Validators.required]],
      endDate: [null as Date | null, [Validators.required]],
      startTime: ['09:00', [Validators.required]],
      endTime: ['10:00', [Validators.required]],
      timezone: [this.defaultTimezone, [Validators.required]],
    },
    { validators: [this.endDateAfterStartDateValidator(), this.startDateNotInPastValidator()] }
  );

  agendaForm = this.fb.array<FormGroup>([]);

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private geoService: GeoService
  ) {}

  ngOnInit(): void {
    this.hydrateForm(this.initialEvent);
    this.loadCountries();
    this.form.get('mode')?.valueChanges.subscribe((mode) => {
      this.updateModeValidators((mode as EventMode) || 'ONSITE');
    });
    this.updateModeValidators((this.form.get('mode')?.value as EventMode) || 'ONSITE');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialEvent']) {
      this.hydrateForm(this.initialEvent);
    }
  }

  get agendaControls(): FormGroup[] {
    return this.agendaForm.controls as FormGroup[];
  }

  addHighlight(event: MatChipInputEvent): void {
    this.pushHighlight(event.value || '');
    event.chipInput?.clear();
  }

  addHighlightFromIcon(input: HTMLInputElement): void {
    // Force chip edit/input blur so pending edits are committed before adding.
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }

    this.pushHighlight(input.value || '');
    input.value = '';
  }

  removeHighlight(highlight: string): void {
    this.highlights = this.highlights.filter((item) => item !== highlight);
  }

  editHighlight(previous: string, event: MatChipEditedEvent): void {
    const value = (event.value || '').trim();
    if (!value) {
      this.removeHighlight(previous);
      return;
    }

    this.highlights = this.highlights.map((item) => (item === previous ? value : item));
  }

  addAgendaItem(item?: EventAgendaItem): void {
    this.agendaForm.push(
      this.fb.group({
        time: [item?.time || ''],
        title: [item?.title || '', [Validators.required]],
        speaker: [item?.speaker || ''],
        description: [item?.description || ''],
      })
    );
  }

  removeAgendaItem(index: number): void {
    this.agendaForm.removeAt(index);
  }

  onCountryChange(countryCode: string): void {
    this.form.get('city')?.setValue('');
    this.form.get('timezone')?.setValue(this.defaultTimezone);
    this.loadCities(countryCode);
  }

  onCityChange(cityName: string): void {
    const city = this.cities.find((item) => item.name === cityName);
    this.form.get('timezone')?.setValue(city?.timezone || '');
  }

  hasMultipleTimezones(): boolean {
    return !!this.form.get('country')?.value && this.cities.length > 1;
  }

  submit(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      this.agendaForm.markAllAsTouched();
      return;
    }

    const startDate = this.formatDateForPayload(this.form.value.startDate);
    const endDate = this.formatDateForPayload(this.form.value.endDate);
    const startTime = this.form.value.startTime || '';
    const endTime = this.form.value.endTime || '';
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);
    if (endDateTime.getTime() < startDateTime.getTime()) {
      this.snackBar.open('La fin de l evenement doit etre apres le debut', 'Fermer', { duration: 3000 });
      return;
    }

    const payload: CreateEventRequest = {
      title: this.form.value.title || '',
      subtitle: this.trimOrUndefined(this.form.value.subtitle),
      description: this.trimOrUndefined(this.form.value.description),
      mode: (this.form.value.mode as EventMode) || 'ONSITE',
      location: this.trimOrUndefined(this.form.value.location),
      address: this.trimOrUndefined(this.form.value.address),
      meetingUrl: this.trimOrUndefined(this.form.value.meetingUrl),
      highlights: this.highlights,
      agenda: this.agendaForm.value
        .map((item) => ({
          time: this.trimOrUndefined(item.time),
          title: this.trimOrUndefined(item.title),
          speaker: this.trimOrUndefined(item.speaker),
          description: this.trimOrUndefined(item.description),
        }))
        .filter((item) => !!item.title),
      startDate,
      endDate,
      startTime,
      endTime,
      timezone: this.form.value.timezone || 'GMT',
    };

    this.formSubmitted.emit(payload);
  }

  cancel(): void {
    this.cancelled.emit();
  }

  private hydrateForm(event: AppEvent | null): void {
    this.highlights = event?.highlights?.filter(Boolean) || [];
    this.agendaForm.clear();

    const agendaItems = event?.agenda && event.agenda.length ? event.agenda : [];
    if (agendaItems.length) {
      agendaItems.forEach((item) => this.addAgendaItem(item));
    } else {
      this.addAgendaItem();
    }

    this.form.reset({
      title: event?.title || '',
      subtitle: event?.subtitle || '',
      description: event?.description || '',
      mode: event?.mode || 'ONSITE',
      location: event?.location || '',
      address: event?.address || '',
      meetingUrl: event?.meetingUrl || '',
      country: '',
      city: '',
      startDate: this.parseDateInput(event?.startDate || event?.eventDate || ''),
      endDate: this.parseDateInput(event?.endDate || event?.startDate || event?.eventDate || ''),
      startTime: this.toTimeInput(event?.startTime) || '09:00',
      endTime: this.toTimeInput(event?.endTime) || '10:00',
      timezone: event?.timezone || this.defaultTimezone,
    });
    this.updateModeValidators((this.form.get('mode')?.value as EventMode) || 'ONSITE');
  }

  isOnlineMode(): boolean {
    return this.form.get('mode')?.value === 'ONLINE';
  }

  isOnsiteMode(): boolean {
    return this.form.get('mode')?.value !== 'ONLINE';
  }

  private toTimeInput(value?: string | null): string {
    if (!value) return '';
    return value.length >= 5 ? value.substring(0, 5) : value;
  }

  private parseDateInput(value?: string | null): Date | null {
    if (!value) {
      return null;
    }

    const datePart = value.split('T')[0];
    const [yearStr, monthStr, dayStr] = datePart.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      return null;
    }

    const parsedDate = new Date(year, month - 1, day);
    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate;
  }

  private formatDateForPayload(value: Date | string | null | undefined): string {
    if (!value) {
      return '';
    }

    if (typeof value === 'string') {
      return value.split('T')[0];
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private trimOrUndefined(value?: string | null): string | undefined {
    if (value == null) {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }

  private loadCountries(): void {
    this.geoService.getCountries().subscribe({
      next: (countries) => {
        this.countries = countries || [];
        this.prefillCountryFromTimezone();
      },
      error: (error) => {
        console.error('Error loading countries:', error);
      },
    });
  }

  private loadCities(countryCode: string, preferredTimezone?: string): void {
    if (!countryCode) {
      this.cities = [];
      this.form.get('timezone')?.setValue(this.defaultTimezone);
      return;
    }

    this.geoService.getCitiesByCountry(countryCode).subscribe({
      next: (cities) => {
        this.cities = cities || [];
        if (this.cities.length > 0) {
          const matchedCity = preferredTimezone
            ? this.cities.find((city) => city.timezone === preferredTimezone)
            : undefined;
          const selectedCity = matchedCity || this.cities[0];
          this.form.get('city')?.setValue(selectedCity.name);
          this.form.get('timezone')?.setValue(selectedCity.timezone);
        } else {
          this.form.get('timezone')?.setValue(this.defaultTimezone);
        }
      },
      error: (error) => {
        console.error('Error loading cities:', error);
        this.cities = [];
        this.form.get('timezone')?.setValue(this.defaultTimezone);
        this.snackBar.open('Impossible de charger les villes pour ce pays', 'Fermer', { duration: 3000 });
      },
    });
  }

  private prefillCountryFromTimezone(): void {
    const selectedCountry = this.form.get('country')?.value;
    const timezone = (this.form.get('timezone')?.value || this.defaultTimezone).trim();

    if (selectedCountry || !timezone) {
      return;
    }

    this.geoService.getCountryByTimezone(timezone).subscribe({
      next: (country) => {
        if (!country?.code) {
          return;
        }
        this.form.get('country')?.setValue(country.code);
        this.loadCities(country.code, timezone);
      },
      error: () => {
        // Keep manual country selection when timezone lookup is unavailable.
      },
    });
  }

  private resolveDefaultTimezone(): string {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return timezone || 'GMT';
    } catch {
      return 'GMT';
    }
  }

  private updateModeValidators(mode: EventMode): void {
    const locationControl = this.form.get('location');
    const meetingUrlControl = this.form.get('meetingUrl');
    const urlPattern = /^https?:\/\/.+/i;

    if (mode === 'ONLINE') {
      this.form.patchValue({ location: '', address: '' }, { emitEvent: false });
      locationControl?.clearValidators();
      meetingUrlControl?.setValidators([Validators.required, Validators.pattern(urlPattern)]);
    } else {
      locationControl?.setValidators([Validators.required]);
      meetingUrlControl?.clearValidators();
    }

    locationControl?.updateValueAndValidity({ emitEvent: false });
    meetingUrlControl?.updateValueAndValidity({ emitEvent: false });
  }

  private endDateAfterStartDateValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const startDate = group.get('startDate')?.value as Date | null;
      const endDate = group.get('endDate')?.value as Date | null;
      if (!startDate || !endDate) {
        return null;
      }

      const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
      const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();
      return end < start ? { endBeforeStart: true } : null;
    };
  }

  private startDateNotInPastValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const startDate = group.get('startDate')?.value as Date | null;
      if (!startDate) {
        return null;
      }

      const selectedDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
      const today = new Date();
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      return selectedDate < todayDate ? { startDateInPast: true } : null;
    };
  }

  private pushHighlight(value: string): void {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return;
    }

    this.highlights = [...this.highlights, trimmedValue];
  }
}
