import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from 'src/app/material.module';
import { GeoCity, GeoCountry, GeoService } from '../../../core/services/geo.service';
import { PublicEventDetails } from '../../models/public-event';
import { PublicEventService } from '../../services/public-event.service';

@Component({
  selector: 'app-event-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MaterialModule],
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
  countries: GeoCountry[] = [];
  cities: GeoCity[] = [];

  form = this.fb.group({
    civility: [''],
    firstName: [''],
    lastName: [''],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    profession: [''],
    ageRange: [''],
    language: ['fr'],
    country: [''],
    city: [''],
    timezone: [''],
    websiteUrl: [''],
    objectives: [''],
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private geoService: GeoService,
    private publicEventService: PublicEventService
  ) {}

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
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.hasError = true;
      },
    });

    this.loadCountries();
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

  goToEvent(): void {
    if (!this.slug) {
      return;
    }
    this.router.navigate(['/event', this.slug]);
  }

  resetFormStep(): void {
    this.currentStep = 2;
  }

  onCountryChange(countryCode: string): void {
    this.form.get('city')?.setValue('');
    this.form.get('timezone')?.setValue('');

    if (!countryCode) {
      this.cities = [];
      return;
    }

    this.geoService.getCitiesByCountry(countryCode).subscribe({
      next: (cities) => {
        this.cities = cities || [];
        if (this.cities.length > 0) {
          const firstCity = this.cities[0];
          this.form.get('city')?.setValue(firstCity.name);
          this.form.get('timezone')?.setValue(firstCity.timezone);
        }
      },
      error: (error) => {
        console.error('Error loading cities:', error);
        this.cities = [];
        this.snackBar.open('Unable to load cities for this country', 'Close', { duration: 3000 });
      },
    });
  }

  onCityChange(cityName: string): void {
    const city = this.cities.find(item => item.name === cityName);
    this.form.get('timezone')?.setValue(city?.timezone || '');
  }

  hasMultipleTimezones(): boolean {
    return !!this.form.get('country')?.value && this.cities.length > 1;
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
      phoneNumber: raw.phoneNumber || undefined,
      profession: raw.profession || undefined,
      ageRange: raw.ageRange || undefined,
      language: raw.language || undefined,
      country: raw.country || undefined,
      city: raw.city || undefined,
      timezone: raw.timezone || undefined,
      civility: raw.civility || undefined,
      websiteUrl: raw.websiteUrl || undefined,
      objectives: raw.objectives || undefined,
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

  private loadCountries(): void {
    this.geoService.getCountries().subscribe({
      next: (countries) => {
        this.countries = countries || [];
      },
      error: (error) => {
        console.error('Error loading countries:', error);
      },
    });
  }
}
