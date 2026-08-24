import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/features/authentication/services/auth.service';
import { PasswordResetVerifyResponse } from '../../models/password-reset-verify-response';
import { AuthLayoutComponent } from '../../components/auth-layout/auth-layout.component';
import { DsButtonComponent } from 'src/app/shared/components/ui/ds-button/ds-button.component';
import { DsAlertComponent } from 'src/app/shared/components/ui/ds-alert/ds-alert.component';

@Component({
  selector: 'app-password-reset-verify',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, FormsModule, ReactiveFormsModule, AuthLayoutComponent, DsButtonComponent, DsAlertComponent],
  templateUrl: './password-reset-verify.component.html',
})
export class PasswordResetVerifyComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Form with 6 individual digit controls - updateOn: 'blur' for validation
  form = new FormGroup({
    digit1: new FormControl<string>('', { validators: [Validators.required, Validators.pattern(/^[0-9]$/)], updateOn: 'blur' }),
    digit2: new FormControl<string>('', { validators: [Validators.required, Validators.pattern(/^[0-9]$/)], updateOn: 'blur' }),
    digit3: new FormControl<string>('', { validators: [Validators.required, Validators.pattern(/^[0-9]$/)], updateOn: 'blur' }),
    digit4: new FormControl<string>('', { validators: [Validators.required, Validators.pattern(/^[0-9]$/)], updateOn: 'blur' }),
    digit5: new FormControl<string>('', { validators: [Validators.required, Validators.pattern(/^[0-9]$/)], updateOn: 'blur' }),
    digit6: new FormControl<string>('', { validators: [Validators.required, Validators.pattern(/^[0-9]$/)], updateOn: 'blur' }),
  });

  // UI signals
  isLoading = signal(false);
  error = signal<string | null>(null);
  contact: string | null = null;

  ngOnInit(): void {
    this.contact = this.route.snapshot.queryParams['contact'] || null;
    
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

  onDigitInput(event: any, currentIndex: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    
    // Mark field as untouched to hide error while typing
    const fieldName = `digit${currentIndex}`;
    this.form.get(fieldName)?.markAsUntouched();

    // Only allow numbers
    if (value && !/^[0-9]$/.test(value)) {
      input.value = '';
      return;
    }

    // Move to next input if value entered
    if (value && currentIndex < 6) {
      const nextInput = document.getElementById(`digit${currentIndex + 1}`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  onDigitKeyDown(event: KeyboardEvent, currentIndex: number): void {
    const input = event.target as HTMLInputElement;

    // Handle backspace
    if (event.key === 'Backspace' && !input.value && currentIndex > 1) {
      const prevInput = document.getElementById(`digit${currentIndex - 1}`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
  }
  
  onDigitBlur(currentIndex: number): void {
    const fieldName = `digit${currentIndex}`;
    // Trigger validation on blur
    const control = this.form.get(fieldName);
    if (control) {
      control.updateValueAndValidity();
      control.markAsTouched();
    }
  }

  onDigitPaste(event: ClipboardEvent, startIndex: number): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text');
    
    if (!pastedData) return;

    // Remove non-numeric characters
    const digits = pastedData.replace(/\D/g, '');
    
    if (digits.length === 0) return;

    // Build patch object dynamically
    const patchData: any = {};
    let currentIndex = startIndex;
    
    for (let i = 0; i < digits.length && currentIndex <= 6; i++) {
      patchData[`digit${currentIndex}`] = digits[i];
      currentIndex++;
    }

    // Apply all values at once
    this.form.patchValue(patchData);

    // Focus on the next empty input or the last filled one
    const nextIndex = Math.min(currentIndex, 6);
    const nextInput = document.getElementById(`digit${nextIndex}`) as HTMLInputElement;
    if (nextInput) {
      nextInput.focus();
    }
  }

  private getOtpCode(): string {
    return Object.keys(this.form.controls)
      .sort()
      .map(key => this.form.get(key)?.value || '')
      .join('');
  }

  submit(): void {
    this.error.set(null);

    if (this.form.invalid || !this.contact) {
      Object.values(this.form.controls).forEach(control => control.markAsTouched());
      return;
    }

    this.isLoading.set(true);
    const otpCode = this.getOtpCode();

    this.authService.verifyPasswordReset(this.contact, otpCode).subscribe({
      next: (res: PasswordResetVerifyResponse) => {
        const resetToken = res?.resetToken;
        if (resetToken) {
          this.router.navigate(['/authentication/password-reset/complete'], { queryParams: { resetToken } });
        } else {
          this.error.set('Invalid response from server');
        }
      },
      error: (err) => {
        this.error.set(err?.message || 'Failed to verify OTP');
        this.isLoading.set(false);
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }
}
