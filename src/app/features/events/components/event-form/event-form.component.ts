import { CommonModule } from '@angular/common';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
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
import {
  AppEvent,
  CreateEventRequest,
  EventAgendaItem,
  EventMode,
  EventRegistrationWorkflowStep,
  EventRegistrationWorkflowStepInput,
  EventWorkflowConditionType,
  EventWorkflowRecipientType,
  EventWorkflowStepType,
} from 'src/app/features/core/services/event.service';
import { FileService } from 'src/app/features/files/services/file.service';
import { MessageEditorComponent } from 'src/app/features/messages/components/message-editor/message-editor.component';
import { Message } from 'src/app/features/messages/models/message';
import { MessageService } from 'src/app/features/messages/services/message.service';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { EventWorkflowTestDialogComponent } from '../event-workflow-test-dialog/event-workflow-test-dialog.component';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, MessageEditorComponent, DragDropModule],
  templateUrl: './event-form.component.html',
  styleUrls: ['./event-form.component.scss'],
})
export class EventFormComponent implements OnChanges, OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private geoService = inject(GeoService);
  private fileService = inject(FileService);
  private messageService = inject(MessageService);
  private dialog = inject(MatDialog);

  @Input() initialEvent: AppEvent | null = null;
  @Input() submitLabel = 'Enregistrer';
  @Input() submitting = false;
  @Input() workflowOnly = false;
  @Output() formSubmitted = new EventEmitter<CreateEventRequest>();
  @Output() cancelled = new EventEmitter<void>();

  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  readonly eventModes: Array<{ value: EventMode; label: string }> = [
    { value: 'ONSITE', label: 'Sur site' },
    { value: 'ONLINE', label: 'En ligne' },
  ];
  readonly workflowRecipientTypes: Array<{ value: EventWorkflowRecipientType; label: string }> = [
    { value: 'REGISTRANT', label: 'Participant' },
    { value: 'ADMIN', label: 'Admin' },
  ];
  readonly workflowStepTypes: Array<{ value: EventWorkflowStepType; label: string }> = [
    { value: 'SEND_MESSAGE', label: 'Envoyer un message' },
    { value: 'DELAY', label: 'Attendre' },
    { value: 'CONDITION', label: 'Condition' },
  ];
  readonly workflowConditionTypes: Array<{ value: EventWorkflowConditionType; label: string }> = [
    { value: 'CONTACT_HAS_EMAIL', label: 'Le contact a un email' },
    { value: 'CONTACT_HAS_PHONE', label: 'Le contact a un telephone' },
  ];
  highlights: string[] = [];
  countries: GeoCountry[] = [];
  cities: GeoCity[] = [];
  bannerUploadInProgress = false;
  workflowMessages: Message[] = [];
  workflowLoading = false;
  readonly todayDate = new Date();
  readonly maxBannerSizeBytes = 5 * 1024 * 1024;
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
      bannerImageUrl: [''],
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
  workflowStepsForm = this.fb.array<FormGroup>([]);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngOnInit(): void {
    this.hydrateForm(this.initialEvent);
    this.loadCountries();
    this.loadWorkflowMessages();
    this.form.get('mode')?.valueChanges.subscribe((mode) => {
      this.updateModeValidators((mode as EventMode) || 'ONSITE');
    });
    this.updateModeValidators((this.form.get('mode')?.value as EventMode) || 'ONSITE');
    if (this.workflowOnly) {
      this.form.clearValidators();
      this.form.updateValueAndValidity({ emitEvent: false });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialEvent']) {
      this.hydrateForm(this.initialEvent);
    }
    if (changes['workflowOnly'] && this.workflowOnly) {
      this.form.clearValidators();
      this.form.updateValueAndValidity({ emitEvent: false });
    }
  }

  get agendaControls(): FormGroup[] {
    return this.agendaForm.controls as FormGroup[];
  }

  get workflowControls(): FormGroup[] {
    return this.workflowStepsForm.controls as FormGroup[];
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

  addWorkflowStep(step?: EventRegistrationWorkflowStep): void {
    this.workflowStepsForm.push(
      this.fb.group({
        stepType: [step?.stepType || 'SEND_MESSAGE'],
        messageId: [step?.messageId ?? null],
        recipientType: [step?.recipientType || 'REGISTRANT'],
        enabled: [step?.enabled !== false],
        recipientEmails: [step?.recipientEmails || ''],
        delayMinutes: [step?.delayMinutes ?? 60],
        conditionType: [step?.conditionType || 'CONTACT_HAS_EMAIL'],
        conditionValue: [step?.conditionValue || ''],
      })
    );
  }

  removeWorkflowStep(index: number): void {
    this.workflowStepsForm.removeAt(index);
  }

  reorderWorkflowSteps(event: CdkDragDrop<FormGroup[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    const control = this.workflowStepsForm.at(event.previousIndex);
    this.workflowStepsForm.removeAt(event.previousIndex);
    this.workflowStepsForm.insert(event.currentIndex, control);
  }

  openWorkflowTest(stepIndex: number): void {
    const step = this.workflowStepsForm.at(stepIndex)?.value;
    if (!step?.messageId) {
      this.snackBar.open('Selectionnez un message avant le test.', 'Fermer', { duration: 2500 });
      return;
    }
    this.dialog.open(EventWorkflowTestDialogComponent, {
      width: '680px',
      data: { messageId: Number(step.messageId) },
    });
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

  onBannerFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Selectionnez uniquement une image (PNG, JPG, WEBP, ...).', 'Fermer', { duration: 3500 });
      if (target) {
        target.value = '';
      }
      return;
    }

    if (file.size > this.maxBannerSizeBytes) {
      this.snackBar.open('Image trop lourde. Taille maximale: 5MB.', 'Fermer', { duration: 3500 });
      if (target) {
        target.value = '';
      }
      return;
    }

    this.bannerUploadInProgress = true;
    this.fileService.uploadFile(file).subscribe({
      next: (uploadedFile) => {
        this.bannerUploadInProgress = false;
        this.form.get('bannerImageUrl')?.setValue(uploadedFile?.url || '');
      },
      error: (error) => {
        this.bannerUploadInProgress = false;
        console.error('Error uploading event banner image:', error);
        this.snackBar.open("Impossible d'uploader l'image de bannière.", 'Fermer', { duration: 3500 });
      },
    });

    if (target) {
      target.value = '';
    }
  }

  clearBannerImage(): void {
    this.form.get('bannerImageUrl')?.setValue('');
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
      bannerImageUrl: this.trimOrUndefined(this.form.value.bannerImageUrl),
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
      registrationWorkflowSteps: this.buildWorkflowPayload(),
    };

    this.formSubmitted.emit(payload);
  }

  cancel(): void {
    this.cancelled.emit();
  }

  private hydrateForm(event: AppEvent | null): void {
    this.highlights = event?.highlights?.filter(Boolean) || [];
    this.agendaForm.clear();
    this.workflowStepsForm.clear();

    const agendaItems = event?.agenda && event.agenda.length ? event.agenda : [];
    if (agendaItems.length) {
      agendaItems.forEach((item) => this.addAgendaItem(item));
    } else {
      this.addAgendaItem();
    }

    const workflowSteps = event?.registrationWorkflowSteps || [];
    if (workflowSteps.length) {
      workflowSteps.forEach((step) => this.addWorkflowStep(step));
    } else {
      this.addWorkflowStep({ recipientType: 'REGISTRANT', enabled: true });
      this.addWorkflowStep({ recipientType: 'ADMIN', enabled: true });
    }

    this.form.reset({
      title: event?.title || '',
      subtitle: event?.subtitle || '',
      description: event?.description || '',
      mode: event?.mode || 'ONSITE',
      location: event?.location || '',
      address: event?.address || '',
      meetingUrl: event?.meetingUrl || '',
      bannerImageUrl: event?.bannerImageUrl || '',
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

  private buildWorkflowPayload(): EventRegistrationWorkflowStepInput[] {
    return this.workflowStepsForm.value
      .map((step: any, index: number) => ({
        messageId: step.messageId ? Number(step.messageId) : undefined,
        stepType: (step.stepType as EventWorkflowStepType) || 'SEND_MESSAGE',
        recipientType: step.recipientType as EventWorkflowRecipientType,
        delayMinutes: step.delayMinutes ? Number(step.delayMinutes) : undefined,
        conditionType: step.conditionType as EventWorkflowConditionType,
        conditionValue: this.trimOrUndefined(step.conditionValue),
        enabled: step.enabled !== false,
        position: index + 1,
        recipientEmails: this.trimOrUndefined(step.recipientEmails),
      }))
      .filter((step: EventRegistrationWorkflowStepInput) => {
        if (step.stepType === 'SEND_MESSAGE') {
          return !!step.messageId;
        }
        return true;
      });
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

  private loadWorkflowMessages(): void {
    this.workflowLoading = true;
    this.messageService.getMessages({ page: 0, size: 200, sort: ['createdAt,desc'] }).subscribe({
      next: (page) => {
        const messages = page?.content || [];
        this.workflowMessages = messages;
        this.workflowLoading = false;
      },
      error: () => {
        this.workflowLoading = false;
        this.workflowMessages = [];
        this.snackBar.open('Impossible de charger les messages pour le workflow', 'Fermer', { duration: 3000 });
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
