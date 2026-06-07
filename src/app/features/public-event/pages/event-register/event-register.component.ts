import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
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
export class EventRegisterComponent implements OnInit, AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private geoService = inject(GeoService);
  private publicEventService = inject(PublicEventService);
  private titleService = inject(Title);
  private metaService = inject(Meta);

  slug = '';
  event: PublicEventDetails | null = null;
  isLoading = true;
  hasError = false;
  isExpired = false;
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
  selectedPhoneCountryISO: CountryISO = CountryISO.Cameroon;
  private hasUserSelectedPhoneCountry = false;
  private dropdownRepositionRaf: number | null = null;
  private introStickyRaf: number | null = null;
  private introStickyResizeObserver: ResizeObserver | null = null;
  private readonly introStickyTopOffset = 24;
  private readonly onCapturedScroll = () => {
    this.schedulePhoneDropdownReposition();
    this.scheduleIntroStickyReposition();
  };
  private readonly onWindowLoad = () => {
    this.refreshIntroStickyObserver();
    this.scheduleIntroStickyReposition();
  };
  CountryISO = CountryISO;
  SearchCountryField = SearchCountryField;

  form = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [null as any, [Validators.required]],
  });

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  @HostListener('window:resize')
  onViewportResize(): void {
    this.schedulePhoneDropdownReposition();
    this.refreshIntroStickyObserver();
    this.scheduleIntroStickyReposition();
  }

  @HostListener('window:scroll')
  onViewportScroll(): void {
    this.schedulePhoneDropdownReposition();
    this.scheduleIntroStickyReposition();
  }

  ngOnInit(): void {
    this.selectedPhoneCountryISO = this.resolveCountryISO(this.detectBrowserCountryCode());
    this.slug = this.route.snapshot.params['slug'] || '';
    if (!this.slug) {
      this.isLoading = false;
      this.hasError = true;
      return;
    }

    this.publicEventService.getEventDetails(this.slug).subscribe({
      next: (details) => {
        this.event = details;
        this.isExpired = this.computeIsExpired(details);
        this.scheduleDisplay = this.mapScheduleForDisplay(details.schedule) || this.buildScheduleDisplay(details);
        this.isLoading = false;
        this.applyEventSeoTags(details);
        setTimeout(() => {
          this.refreshIntroStickyObserver();
          this.scheduleIntroStickyReposition();
        }, 0);
      },
      error: () => {
        this.isLoading = false;
        this.hasError = true;
        this.resetIntroStickyStyles();
      },
    });

    this.detectRegistrationMetadata();
  }

  ngAfterViewInit(): void {
    document.addEventListener('scroll', this.onCapturedScroll, true);
    window.addEventListener('load', this.onWindowLoad, { once: true });
    this.refreshIntroStickyObserver();
    this.scheduleIntroStickyReposition();
  }

  ngOnDestroy(): void {
    document.removeEventListener('scroll', this.onCapturedScroll, true);
    window.removeEventListener('load', this.onWindowLoad);
    if (this.introStickyResizeObserver) {
      this.introStickyResizeObserver.disconnect();
      this.introStickyResizeObserver = null;
    }
    if (this.dropdownRepositionRaf !== null) {
      cancelAnimationFrame(this.dropdownRepositionRaf);
      this.dropdownRepositionRaf = null;
    }
    if (this.introStickyRaf !== null) {
      cancelAnimationFrame(this.introStickyRaf);
      this.introStickyRaf = null;
    }
    this.removeEventSeoTags();
  }

  private applyEventSeoTags(event: PublicEventDetails): void {
    const pageUrl = window.location.href;
    const description = (event.subtitle || event.description || '').replace(/<[^>]*>/g, '').trim().slice(0, 200);

    this.titleService.setTitle(`${event.title} - Komflow`);

    const ogTags: { property: string; content: string }[] = [
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: pageUrl },
      { property: 'og:title', content: event.title },
      { property: 'og:site_name', content: 'Komflow' },
    ];

    if (description) {
      ogTags.push({ property: 'og:description', content: description });
      this.metaService.updateTag({ name: 'description', content: description });
    }

    if (event.bannerImageUrl) {
      ogTags.push({ property: 'og:image', content: event.bannerImageUrl });
      ogTags.push({ property: 'og:image:width', content: '1200' });
      ogTags.push({ property: 'og:image:height', content: '630' });
      this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
      this.metaService.updateTag({ name: 'twitter:image', content: event.bannerImageUrl });
    } else {
      this.metaService.updateTag({ name: 'twitter:card', content: 'summary' });
    }

    ogTags.forEach((tag) => this.metaService.updateTag({ property: tag.property, content: tag.content }));
    this.metaService.updateTag({ name: 'twitter:title', content: event.title });
    if (description) {
      this.metaService.updateTag({ name: 'twitter:description', content: description });
    }
  }

  private removeEventSeoTags(): void {
    this.titleService.setTitle('Komflow - Communication Platform');
    ['og:type', 'og:url', 'og:title', 'og:description', 'og:image', 'og:image:width', 'og:image:height', 'og:site_name'].forEach((p) =>
      this.metaService.removeTag(`property='${p}'`)
    );
    ['description', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'].forEach((n) =>
      this.metaService.removeTag(`name='${n}'`)
    );
  }

  goToStep(step: number): void {
    if (step < 1 || step > 3) {
      return;
    }
    if (step === 2 && this.currentStep === 1) {
      this.currentStep = 2;
      setTimeout(() => {
        this.refreshIntroStickyObserver();
        this.scheduleIntroStickyReposition();
      }, 0);
      return;
    }
    if (step === 1 || (step === 3 && this.currentStep === 3)) {
      this.currentStep = step;
      setTimeout(() => {
        this.refreshIntroStickyObserver();
        this.scheduleIntroStickyReposition();
      }, 0);
    }
  }

  onPhoneFieldInteraction(): void {
    setTimeout(() => this.schedulePhoneDropdownReposition(), 0);
  }

  onPhoneFieldPointerDown(event: PointerEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }

    const isCountryTrigger = !!target.closest('.iti__selected-flag, .iti__flag-container');
    if (!isCountryTrigger) {
      return;
    }

    this.positionPhoneCountryDropdownPredictively();
  }

  onPhoneCountryChange(country: { iso2?: string } | null): void {
    const iso2 = (country?.iso2 || '').trim();
    if (!iso2) {
      return;
    }

    this.hasUserSelectedPhoneCountry = true;
    this.selectedPhoneCountryISO = this.resolveCountryISO(iso2);
  }

  onPhoneValueChange(phoneValue: { countryCode?: string } | null): void {
    const countryCode = (phoneValue?.countryCode || '').trim();
    if (!countryCode) {
      return;
    }

    this.hasUserSelectedPhoneCountry = true;
    this.selectedPhoneCountryISO = this.resolveCountryISO(countryCode);
  }

  goToEvent(): void {
    if (!this.slug) {
      return;
    }
    this.router.navigate(['/event', this.slug]);
  }

  resetFormStep(): void {
    this.currentStep = 2;
    setTimeout(() => {
      this.refreshIntroStickyObserver();
      this.scheduleIntroStickyReposition();
    }, 0);
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
        setTimeout(() => {
          this.refreshIntroStickyObserver();
          this.scheduleIntroStickyReposition();
        }, 0);
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
        if (!this.hasUserSelectedPhoneCountry) {
          this.selectedPhoneCountryISO = this.resolveCountryISO(countryCode);
        }

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
        this.selectedPhoneCountryISO = this.resolveCountryISO('');
        console.error('Error loading country from timezone metadata:', error);
      },
    });
  }

  private resolveCountryISO(countryCode: string): CountryISO {
    const normalizedCode = (countryCode || '').trim().toLowerCase();
    if (!normalizedCode) {
      return CountryISO.Cameroon;
    }

    const countryIsoValues = Object.values(CountryISO) as string[];
    return countryIsoValues.includes(normalizedCode)
      ? (normalizedCode as CountryISO)
      : CountryISO.Cameroon;
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

  private schedulePhoneDropdownReposition(): void {
    if (this.dropdownRepositionRaf !== null) {
      cancelAnimationFrame(this.dropdownRepositionRaf);
    }
    this.dropdownRepositionRaf = requestAnimationFrame(() => {
      this.dropdownRepositionRaf = null;
      this.positionPhoneCountryDropdownIfOpen();
    });
  }

  private refreshIntroStickyObserver(): void {
    if (this.introStickyResizeObserver) {
      this.introStickyResizeObserver.disconnect();
      this.introStickyResizeObserver = null;
    }

    if (window.innerWidth < 981) {
      this.resetIntroStickyStyles();
      return;
    }

    const host = this.hostRef.nativeElement;
    const activeLayout = host.querySelector('.step-section .register-layout') as HTMLElement | null;
    const introPanel = activeLayout?.querySelector('.intro-panel') as HTMLElement | null;
    const rightColumn = activeLayout?.querySelector('.event-panel, .form-panel') as HTMLElement | null;
    const card = host.querySelector('.register-card') as HTMLElement | null;

    if (!activeLayout || !introPanel || !rightColumn || !card) {
      this.resetIntroStickyStyles();
      return;
    }

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    this.introStickyResizeObserver = new ResizeObserver(() => this.scheduleIntroStickyReposition());
    this.introStickyResizeObserver.observe(activeLayout);
    this.introStickyResizeObserver.observe(introPanel);
    this.introStickyResizeObserver.observe(rightColumn);
    this.introStickyResizeObserver.observe(card);
  }

  private scheduleIntroStickyReposition(): void {
    if (this.introStickyRaf !== null) {
      cancelAnimationFrame(this.introStickyRaf);
    }

    this.introStickyRaf = requestAnimationFrame(() => {
      this.introStickyRaf = null;
      this.updateIntroStickyPosition();
    });
  }

  private updateIntroStickyPosition(): void {
    const host = this.hostRef.nativeElement;
    const activeLayout = host.querySelector('.step-section .register-layout') as HTMLElement | null;
    const introPanel = activeLayout?.querySelector('.intro-panel') as HTMLElement | null;
    const rightColumn = activeLayout?.querySelector('.event-panel, .form-panel') as HTMLElement | null;

    if (!activeLayout || !introPanel || !rightColumn || window.innerWidth < 981) {
      this.resetIntroStickyStyles();
      return;
    }

    const layoutRect = activeLayout.getBoundingClientRect();
    const scrollTop = window.scrollY || window.pageYOffset || 0;
    const layoutTop = layoutRect.top + scrollTop;
    const layoutHeight = Math.max(activeLayout.offsetHeight, rightColumn.offsetHeight, introPanel.offsetHeight);
    const introHeight = introPanel.offsetHeight;
    const maxOffset = Math.max(0, layoutHeight - introHeight);
    const desiredOffset = scrollTop + this.introStickyTopOffset - layoutTop;
    const clampedOffset = Math.min(Math.max(desiredOffset, 0), maxOffset);

    introPanel.style.transform = `translateY(${Math.round(clampedOffset)}px)`;
    introPanel.style.willChange = 'transform';
  }

  private resetIntroStickyStyles(): void {
    const host = this.hostRef.nativeElement;
    const introPanels = host.querySelectorAll('.register-layout .intro-panel') as NodeListOf<HTMLElement>;
    introPanels.forEach((panel) => {
      panel.style.transform = '';
      panel.style.willChange = '';
    });
  }

  private positionPhoneCountryDropdownPredictively(): void {
    const host = this.hostRef.nativeElement;
    const phoneField = host.querySelector('.phone-field') as HTMLElement | null;
    const trigger = phoneField?.querySelector('.iti') as HTMLElement | null;
    if (!phoneField || !trigger) {
      return;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const spaceAbove = Math.max(0, triggerRect.top);
    const spaceBelow = Math.max(0, viewportHeight - triggerRect.bottom);
    const estimatedMenuHeight = 320;
    const shouldOpenUp = spaceBelow < estimatedMenuHeight + 12 && spaceAbove > spaceBelow;

    phoneField.classList.toggle('dropdown-up', shouldOpenUp);
  }

  private detectBrowserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  }

  private detectBrowserLanguage(): string {
    const language = navigator.language || 'fr';
    return language.toLowerCase().startsWith('fr') ? 'fr' : 'en';
  }

  private detectBrowserCountryCode(): string {
    const locale = navigator.language || '';
    const localeParts = locale.split('-');
    return localeParts.length > 1 ? localeParts[1] : '';
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

  private capitalizeFirst(value: string | null | undefined): string | undefined {
    if (!value) return undefined;
    return value.charAt(0).toUpperCase() + value.slice(1);
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
      singleDateTime: this.capitalizeFirst(schedule.singleDateTime),
      sameDayDate: this.capitalizeFirst(schedule.sameDayDate),
      sameDayTimeRange: schedule.sameDayTimeRange || undefined,
      startDateTime: this.capitalizeFirst(schedule.startDateTime),
      endDateTime: this.capitalizeFirst(schedule.endDateTime),
    };
  }

  private formatDate(value: Date): string {
    const formatted = new Intl.DateTimeFormat(this.clientLocale, {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: this.clientTimezone,
    }).format(value);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
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
    const formatted = new Intl.DateTimeFormat(this.clientLocale, {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: this.clientTimezone,
    }).format(value);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
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

  private computeIsExpired(event: PublicEventDetails): boolean {
    const refDate = event.endsAt || event.startsAt;
    if (!refDate) return false;
    return new Date(refDate) < new Date();
  }
}
