import { Component, signal, inject, OnInit } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../../material.module';
import { BrandingComponent } from '../../../../layouts/full/vertical/sidebar/branding.component';
import { AuthService } from 'src/app/features/authentication/services/auth.service';
import { NgxIntlTelInputModule, CountryISO, SearchCountryField } from 'ngx-intl-tel-input';
import { MatInputModule } from '@angular/material/input';
import { AuthHeroComponent } from '../../components/auth-hero/auth-hero.component';

@Component({
  selector: 'app-password-reset-initiate',
  imports: [RouterModule, MaterialModule, MatInputModule, FormsModule, ReactiveFormsModule, NgxIntlTelInputModule, BrandingComponent, AuthHeroComponent],
  templateUrl: './password-reset-initiate.component.html',
  styleUrls: ['../login/login.component.scss']
})
export class PasswordResetInitiateComponent implements OnInit {
  private authService = inject(AuthService);
  private settings = inject(CoreService);
  private router = inject(Router);

  options = this.settings.getOptions();
  CountryISO = CountryISO;
  SearchCountryField = SearchCountryField;

  // Mirror login: email/phone tab switch using signals
  activeMode = signal<'email' | 'phone'>('email');

  form = new FormGroup({
    email: new FormControl('', { validators: [], updateOn: 'change' }),
    phoneNumber: new FormControl(null, { validators: [], updateOn: 'change' }),
  });

  isLoading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    // Ensure validators match active tab on init
    this.updateValidators(this.activeMode());
    this.form.updateValueAndValidity();
    
    // Clear general error when user starts typing in any field
    this.form.valueChanges.subscribe(() => {
      if (this.error()) {
        this.error.set(null);
      }
    });
  }

  get f() {
    return this.form.controls;
  }

  setMode(mode: 'email' | 'phone') {
    this.activeMode.set(mode);
    this.updateValidators(mode);
  }

  private updateValidators(mode: 'email' | 'phone') {
    const emailControl = this.form.get('email');
    const phoneControl = this.form.get('phoneNumber');

    if (mode === 'email') {
      emailControl?.setValidators([Validators.required, Validators.email]);
      phoneControl?.clearValidators();
      phoneControl?.setValue(null);
    } else {
      phoneControl?.setValidators([Validators.required]);
      emailControl?.clearValidators();
      emailControl?.setValue('');
    }

    emailControl?.updateValueAndValidity();
    phoneControl?.updateValueAndValidity();

    try {
      this.form.updateValueAndValidity();
    } catch { /* ignore */ }
  }

  private formatPhoneNumber(phoneObject: any): string {
    if (!phoneObject) return '';

    if (typeof phoneObject === 'string') return phoneObject;
    if (phoneObject.internationalNumber) return phoneObject.internationalNumber.replace(/\s/g, '').replace(/^\+/, '');
    if (phoneObject.number && phoneObject.dialCode) return `${phoneObject.dialCode}${phoneObject.number}`;
    return '';
  }

  onFieldInput(fieldName: string): void {
    this.form.get(fieldName)?.markAsUntouched();
  }

  onFieldBlur(fieldName: string): void {
    const control = this.form.get(fieldName);
    if (control) {
      control.markAsTouched();
      control.updateValueAndValidity();
    }
  }

  submit(): void {
    this.error.set(null);

    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isLoading.set(true);

    const contact = this.activeMode() === 'email'
      ? (this.form.value.email as string || '')
      : this.formatPhoneNumber(this.form.value.phoneNumber);

    const contactType: 'EMAIL' | 'PHONE' = this.activeMode() === 'email' ? 'EMAIL' : 'PHONE';

    this.authService.initiatePasswordReset(contact, contactType).subscribe({
      next: () => {
        this.router.navigate(['/authentication/password-reset/verify'], { queryParams: { contact } });
      },
      error: (err) => {
        this.error.set(err?.message || 'Unable to initiate password reset');
        this.isLoading.set(false);
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }
}