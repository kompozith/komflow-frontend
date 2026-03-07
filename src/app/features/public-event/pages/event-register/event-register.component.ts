import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from 'src/app/material.module';
import { CountryISO, NgxIntlTelInputModule, SearchCountryField } from 'ngx-intl-tel-input';
import { GeoService } from '../../../core/services/geo.service';
import { PublicEventDetails, PublicEventSchedule } from '../../models/public-event';
import { PublicEventService } from '../../services/public-event.service';

@Component({
  selector: 'app-event-register',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, MaterialModule, NgxIntlTelInputModule],
  templateUrl: './event-register.component.html',
  styleUrls: ['./event-register.component.scss'],
})
export class EventRegisterComponent implements OnInit {
  slug = '';
  event: PublicEventDetails | null = null;
  isLoading = true;
  hasError = false;
  loading = false;
  currentStep = 1;
  registrationStatus: string | null = null;
  registeredName = '';
  registeredEmail = '';
  clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  clientLocale = navigator.language || 'fr-FR';
  scheduleDisplay: {
    timezoneLabel: string;
    isRangeSameDay: boolean;
    singleDateTime?: string;
    sameDayDate?: string;
    sameDayTimeRange?: string;
    startDateTime?: string;
    endDateTime?: string;
  } = {
    timezoneLabel: '',
    isRangeSameDay: false,
  };
  registrationMetadata = {
    language: 'fr',
    country: '',
    city: '',
    timezone: '',
  };
  CountryISO = CountryISO;
  SearchCountryField = SearchCountryField;

  form = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [null as any, [Validators.required]],
  });

  constructor(
    private fb: FormBuilder,
    private hostRef: ElementRef<HTMLElement>,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private geoService: GeoService,
    private publicEventService: PublicEventService
  ) {}

  @HostListener('window:resize')
  onViewportResize(): void {
    this.positionPhoneCountryDropdownIfOpen();
  }

  @HostListener('window:scroll')
  onViewportScroll(): void {
    this.positionPhoneCountryDropdownIfOpen();
  }

  ngOnInit(): void {
    this.slug = this.route.snapshot.params['slug'] || '';
    if (!this.slug) {
      this.isLoading = false;
      this.hasError = true;
      return;
    }

    this.publicEventService.getEventDetails(this.slug).subscribe({
      next: (details) => {
        this.event = details;
        this.scheduleDisplay = this.mapScheduleForDisplay(details.schedule) || this.buildScheduleDisplay(details);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.hasError = true;
      },
    });

    this.detectRegistrationMetadata();
  }

  goToStep(step: number): void {
    if (step < 1 || step > 3) {
      return;
    }
    if (step === 2 && this.currentStep === 1) {
      this.currentStep = 2;
      return;
    }
    if (step === 1 || (step === 3 && this.currentStep === 3)) {
      this.currentStep = step;
    }
  }

  onPhoneFieldInteraction(): void {
    setTimeout(() => this.positionPhoneCountryDropdownIfOpen(), 0);
    setTimeout(() => this.positionPhoneCountryDropdownIfOpen(), 120);
  }

  goToEvent(): void {
    if (!this.slug) {
      return;
    }
    this.router.navigate(['/event', this.slug]);
  }

  resetFormStep(): void {
    this.currentStep = 2;
  }

  submit(): void {
    if (!this.slug || this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      if (!this.slug) {
        this.snackBar.open("Evenement invalide.", 'Fermer', { duration: 3000 });
      }
      return;
    }

    this.loading = true;
    const raw = this.form.getRawValue();
    const payload = {
      email: raw.email || '',
      firstName: raw.firstName || undefined,
      lastName: raw.lastName || undefined,
      phoneNumber: this.formatPhoneNumber(raw.phoneNumber) || undefined,
      language: this.registrationMetadata.language || undefined,
      country: this.registrationMetadata.country || undefined,
      city: this.registrationMetadata.city || undefined,
      timezone: this.registrationMetadata.timezone || undefined,
    };

    this.publicEventService.register(this.slug, payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.registrationStatus = res.status;
        this.registeredEmail = raw.email || '';
        this.registeredName = `${raw.firstName || ''} ${raw.lastName || ''}`.trim();
        this.currentStep = 3;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open("Impossible d'enregistrer l'inscription pour le moment.", 'Fermer', { duration: 3500 });
      },
    });
  }

  private detectRegistrationMetadata(): void {
    const timezone = this.detectBrowserTimezone();
    const language = this.detectBrowserLanguage();
    this.registrationMetadata = {
      ...this.registrationMetadata,
      timezone,
      language,
    };

    if (!timezone) {
      return;
    }

    this.geoService.getCountryByTimezone(timezone).subscribe({
      next: (country) => {
        const countryCode = country?.code || '';
        this.registrationMetadata = {
          ...this.registrationMetadata,
          country: countryCode,
        };

        if (!countryCode) {
          return;
        }

        this.geoService.getCitiesByCountry(countryCode).subscribe({
          next: (cities) => {
            const matchedCity = (cities || []).find(city => city.timezone === timezone);
            this.registrationMetadata = {
              ...this.registrationMetadata,
              city: matchedCity?.name || '',
            };
          },
          error: (error) => {
            console.error('Error loading cities from metadata:', error);
          },
        });
      },
      error: (error) => {
        console.error('Error loading country from timezone metadata:', error);
      },
    });
  }

  private positionPhoneCountryDropdownIfOpen(): void {
    const host = this.hostRef.nativeElement;
    const phoneField = host.querySelector('.phone-field') as HTMLElement | null;
    if (!phoneField) {
      return;
    }

    const dropdown = phoneField.querySelector('.iti__dropdown-content') as HTMLElement | null;
    const trigger = phoneField.querySelector('.iti') as HTMLElement | null;

    if (!dropdown || !trigger) {
      phoneField.classList.remove('dropdown-up');
      return;
    }

    const style = window.getComputedStyle(dropdown);
    const isOpen = style.display !== 'none' && style.visibility !== 'hidden';
    if (!isOpen) {
      phoneField.classList.remove('dropdown-up');
      return;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const spaceAbove = Math.max(0, triggerRect.top);
    const spaceBelow = Math.max(0, viewportHeight - triggerRect.bottom);
    const menuHeight = Math.min(dropdown.scrollHeight || 0, 320);
    const shouldOpenUp = spaceBelow < menuHeight + 12 && spaceAbove > spaceBelow;

    phoneField.classList.toggle('dropdown-up', shouldOpenUp);
  }

  private detectBrowserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  }

  private detectBrowserLanguage(): string {
    const language = navigator.language || 'fr';
    return language.toLowerCase().startsWith('fr') ? 'fr' : 'en';
  }

  private buildScheduleDisplay(event: PublicEventDetails): {
    timezoneLabel: string;
    isRangeSameDay: boolean;
    singleDateTime?: string;
    sameDayDate?: string;
    sameDayTimeRange?: string;
    startDateTime?: string;
    endDateTime?: string;
  } {
    const timezoneLabel = `Heure locale (${this.clientTimezone})`;
    const startsAt = event.startsAt ? new Date(event.startsAt) : null;
    const endsAt = event.endsAt ? new Date(event.endsAt) : null;

    if (!startsAt || Number.isNaN(startsAt.getTime())) {
      return { timezoneLabel, isRangeSameDay: false };
    }

    if (!endsAt || Number.isNaN(endsAt.getTime())) {
      return {
        timezoneLabel,
        isRangeSameDay: false,
        singleDateTime: this.formatDateTime(startsAt),
      };
    }

    const isRangeSameDay = this.isSameLocalDay(startsAt, endsAt);
    if (isRangeSameDay) {
      return {
        timezoneLabel,
        isRangeSameDay: true,
        sameDayDate: this.formatDate(startsAt),
        sameDayTimeRange: `${this.formatTime(startsAt)} - ${this.formatTime(endsAt)} (${this.formatDuration(startsAt, endsAt)})`,
      };
    }

    return {
      timezoneLabel,
      isRangeSameDay: false,
      startDateTime: this.formatDateTime(startsAt),
      endDateTime: this.formatDateTime(endsAt),
    };
  }

  private mapScheduleForDisplay(schedule?: PublicEventSchedule | null): {
    timezoneLabel: string;
    isRangeSameDay: boolean;
    singleDateTime?: string;
    sameDayDate?: string;
    sameDayTimeRange?: string;
    startDateTime?: string;
    endDateTime?: string;
  } | null {
    if (!schedule) {
      return null;
    }
    return {
      timezoneLabel: schedule.timezoneLabel || `Heure locale (${this.clientTimezone})`,
      isRangeSameDay: !!schedule.rangeSameDay,
      singleDateTime: schedule.singleDateTime || undefined,
      sameDayDate: schedule.sameDayDate || undefined,
      sameDayTimeRange: schedule.sameDayTimeRange || undefined,
      startDateTime: schedule.startDateTime || undefined,
      endDateTime: schedule.endDateTime || undefined,
    };
  }

  private formatDate(value: Date): string {
    return new Intl.DateTimeFormat(this.clientLocale, {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: this.clientTimezone,
    }).format(value);
  }

  private formatTime(value: Date): string {
    return new Intl.DateTimeFormat(this.clientLocale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: this.clientTimezone,
    }).format(value);
  }

  private formatDateTime(value: Date): string {
    return new Intl.DateTimeFormat(this.clientLocale, {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: this.clientTimezone,
    }).format(value);
  }

  private formatDuration(startsAt: Date, endsAt: Date): string {
    const diffInMinutes = Math.max(0, Math.round((endsAt.getTime() - startsAt.getTime()) / 60000));
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours}h${minutes.toString().padStart(2, '0')}`;
    }
    if (hours > 0) {
      return `${hours}h`;
    }
    return `${minutes}min`;
  }

  private isSameLocalDay(first: Date, second: Date): boolean {
    const firstDay = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: this.clientTimezone,
    }).format(first);
    const secondDay = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: this.clientTimezone,
    }).format(second);

    return firstDay === secondDay;
  }

  private formatPhoneNumber(phoneObject: any): string {
    if (!phoneObject) {
      return '';
    }
    if (typeof phoneObject === 'string') {
      return phoneObject.trim();
    }

    if (phoneObject.e164Number) {
      return String(phoneObject.e164Number).trim();
    }
    if (phoneObject.internationalNumber) {
      return String(phoneObject.internationalNumber).replace(/\s/g, '').trim();
    }
    if (phoneObject.number && phoneObject.dialCode) {
      return `+${String(phoneObject.dialCode).replace('+', '')}${String(phoneObject.number).replace(/\s/g, '')}`;
    }
    return '';
  }
}
