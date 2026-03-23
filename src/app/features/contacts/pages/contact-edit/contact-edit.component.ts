import { Component } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CommonModule } from '@angular/common';
import { ContactService } from '../../services/contact.service';
import { ContactDetails, UpdateContactRequest } from '../../models/contact';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TagService } from '../../../tags/services/tag.service';
import { Tag } from '../../../tags/models/tag';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of, Observable } from 'rxjs';
import { PersonService } from '../../../personnel/services/person.service';
import { GeoCity, GeoCountry, GeoService } from '../../../core/services/geo.service';
import { CountryISO, NgxIntlTelInputModule, SearchCountryField } from 'ngx-intl-tel-input';
import { PhoneNumberService } from '../../../personnel/services/phone-number.service';
import { PhoneNumber } from '../../../personnel/models/person';

@Component({
  selector: 'app-contact-edit',
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TablerIconsModule,
    CommonModule,
    NgxIntlTelInputModule,
  ],
  templateUrl: './contact-edit.component.html',
  styleUrl: './contact-edit.component.scss',
})
export class ContactEditComponent {
  contactForm: FormGroup;
  isLoading = false;
  isSaving = false;
  contact: ContactDetails | null = null;
  availableTags: Tag[] = [];
  readonly languageOptions = [
    { value: 'fr', label: 'Francais' },
    { value: 'en', label: 'English' },
  ];
  countries: GeoCountry[] = [];
  cities: GeoCity[] = [];

  // Phone management
  existingPhones: PhoneNumber[] = [];
  deletedPhoneIds: number[] = [];
  pendingPhones: Array<{ formControl: FormControl }> = [];
  readonly selectedPhoneCountryISO = CountryISO.Cameroon;
  readonly CountryISO = CountryISO;
  readonly SearchCountryField = SearchCountryField;

  constructor(
    private fb: FormBuilder,
    private contactService: ContactService,
    private tagService: TagService,
    private personService: PersonService,
    private phoneNumberService: PhoneNumberService,
    private geoService: GeoService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.contactForm = this.fb.group({
      personId: [null, [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      firstName: [''],
      lastName: [''],
      enabled: [true],
      civility: [''],
      profession: [''],
      ageRange: [''],
      objectives: [''],
      websiteUrl: [''],
      language: ['fr'],
      country: [''],
      city: [''],
      timezone: [''],
      tagIds: [[]],
    });

    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadContact(id);
    }

    this.loadTags();
    this.loadCountries();
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      this.isSaving = true;
      const formValue = this.contactForm.value;

      const contactData: UpdateContactRequest = {
        personId: Number(formValue.personId),
        enabled: !!formValue.enabled,
        lastMessageReceivedAt: this.contact?.lastMessageReceivedAt ?? null,
        civility: formValue.civility || null,
        profession: formValue.profession || null,
        ageRange: formValue.ageRange || null,
        objectives: formValue.objectives || null,
        websiteUrl: formValue.websiteUrl || null,
        tagIds: formValue.tagIds || []
      };

      const contactId = this.contact?.id?.toString();
      if (!contactId) {
        this.snackBar.open('Contact not loaded', 'Close', { duration: 3000 });
        this.isSaving = false;
        return;
      }

      const personId = this.contact?.person?.id;

      const personUpdate$ = this.contact?.person?.id
        ? this.personService.updatePerson(this.contact.person.id, {
            email: formValue.email,
            firstName: formValue.firstName || undefined,
            lastName: formValue.lastName || undefined,
            language: formValue.language || undefined,
            country: formValue.country || undefined,
            city: formValue.city || undefined,
            timezone: formValue.timezone || undefined,
          })
        : of(null);

      // Build phone operations
      const phoneOps$: Observable<any>[] = this.deletedPhoneIds.map(id =>
        this.phoneNumberService.deletePhoneNumber(id)
      );
      if (personId) {
        for (const entry of this.pendingPhones) {
          const formatted = this.formatPhoneNumber(entry.formControl.value);
          if (formatted) {
            phoneOps$.push(this.phoneNumberService.addPhoneNumber(personId, {
              number: formatted,
            }));
          }
        }
      }

      forkJoin([
        this.contactService.updateContact(contactId, contactData),
        personUpdate$,
        ...(phoneOps$.length > 0 ? phoneOps$ : [of(null)])
      ]).subscribe({
        next: () => {
          this.deletedPhoneIds = [];
          this.pendingPhones = [];
          this.snackBar.open('Contact mis à jour avec succès', 'Fermer', { duration: 3000 });
          this.router.navigate(['/contacts/details', contactId]);
        },
        error: (error) => {
          console.error('Error updating contact:', error);
          this.snackBar.open('Erreur lors de la mise à jour', 'Fermer', { duration: 3000 });
          this.isSaving = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    const contactId = this.contact?.id;
    if (contactId) {
      this.router.navigate(['/contacts/details', contactId]);
      return;
    }
    this.router.navigate(['/contacts']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.contactForm.controls).forEach(key => {
      const control = this.contactForm.get(key);
      control?.markAsTouched();
    });
  }

  private loadContact(id: string): void {
    this.isLoading = true;
    this.contactService.getContactById(id).subscribe({
      next: (contact) => {
        this.contact = contact;
        this.patchForm(contact);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading contact:', error);
        this.snackBar.open('Error loading contact', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  private patchForm(contact: ContactDetails): void {
    this.contactForm.patchValue({
      personId: contact.person?.id ?? null,
      email: contact.person?.email || '',
      firstName: contact.person?.firstName || '',
      lastName: contact.person?.lastName || '',
      enabled: contact.enabled,
      civility: contact.civility || '',
      profession: contact.profession || '',
      ageRange: contact.ageRange || '',
      objectives: contact.objectives || '',
      websiteUrl: contact.websiteUrl || '',
      language: contact.person?.language || 'fr',
      country: contact.person?.country || '',
      city: contact.person?.city || '',
      timezone: contact.person?.timezone || '',
      tagIds: contact.tags?.map(tag => tag.id) || [],
    });

    if (contact.person?.country) {
      this.loadCities(contact.person.country, contact.person?.city || undefined, contact.person?.timezone || undefined);
    }

    if (contact.person?.id) {
      this.loadPhoneNumbers(contact.person.id);
    }
  }

  private loadTags(): void {
    this.tagService.getTags({ page: 0, size: 200 }).subscribe({
      next: (response) => {
        this.availableTags = response.content || [];
      },
      error: (error) => {
        console.error('Error loading tags:', error);
        this.snackBar.open('Error loading tags', 'Close', { duration: 3000 });
      }
    });
  }

  private loadCountries(): void {
    this.geoService.getCountries().subscribe({
      next: (countries) => {
        this.countries = countries || [];
      },
      error: (error) => {
        console.error('Error loading countries:', error);
      }
    });
  }

  onCountryChange(countryCode: string): void {
    this.contactForm.get('city')?.setValue('');
    this.contactForm.get('timezone')?.setValue('');
    this.loadCities(countryCode);
  }

  onCityChange(cityName: string): void {
    const city = this.cities.find(item => item.name === cityName);
    this.contactForm.get('timezone')?.setValue(city?.timezone || '');
  }

  hasMultipleTimezones(): boolean {
    return !!this.contactForm.get('country')?.value && this.cities.length > 1;
  }

  // ─── Phone management ───────────────────────────────────────────────────────

  addNewPhoneField(): void {
    this.pendingPhones.push({
      formControl: new FormControl(null, [Validators.required]),
    });
  }

  removeNewPhoneField(index: number): void {
    this.pendingPhones.splice(index, 1);
  }

  markPhoneForDelete(phone: PhoneNumber): void {
    this.deletedPhoneIds.push(phone.id);
    this.existingPhones = this.existingPhones.filter(p => p.id !== phone.id);
  }

  formatPhoneNumber(phoneObject: any): string {
    if (!phoneObject) return '';
    if (typeof phoneObject === 'string') return phoneObject;
    return phoneObject.e164Number || phoneObject.internationalNumber || phoneObject.number || '';
  }

  private loadPhoneNumbers(personId: number): void {
    this.phoneNumberService.getPhoneNumbers(personId).subscribe({
      next: (phones) => { this.existingPhones = phones || []; },
      error: () => {},
    });
  }

  private loadCities(countryCode: string, cityName?: string, timezone?: string): void {
    if (!countryCode) {
      this.cities = [];
      return;
    }

    this.geoService.getCitiesByCountry(countryCode).subscribe({
      next: (cities) => {
        this.cities = cities || [];
        if (cityName) {
          this.contactForm.get('city')?.setValue(cityName);
        } else if (this.cities.length > 0) {
          this.contactForm.get('city')?.setValue(this.cities[0].name);
        }
        if (timezone) {
          this.contactForm.get('timezone')?.setValue(timezone);
        } else if (this.cities.length > 0) {
          this.contactForm.get('timezone')?.setValue(this.cities[0].timezone);
        }
      },
      error: (error) => {
        console.error('Error loading cities:', error);
        this.cities = [];
        this.snackBar.open('Unable to load cities for this country', 'Close', { duration: 3000 });
      }
    });
  }

}
