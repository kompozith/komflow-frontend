import { ChangeDetectionStrategy, Component, computed, signal, inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, AbstractControl, ValidationErrors, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/features/authentication/services/auth.service';
import { PasswordResetCompleteResponse } from '../../models/password-reset-complete-response';
import { AuthLayoutComponent } from '../../components/auth-layout/auth-layout.component';
import { DsTextFieldComponent } from 'src/app/shared/components/ui/ds-text-field/ds-text-field.component';
import { DsButtonComponent } from 'src/app/shared/components/ui/ds-button/ds-button.component';
import { DsAlertComponent } from 'src/app/shared/components/ui/ds-alert/ds-alert.component';

@Component({
  selector: 'app-password-reset-complete',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, FormsModule, ReactiveFormsModule, AuthLayoutComponent, DsTextFieldComponent, DsButtonComponent, DsAlertComponent],
  templateUrl: './password-reset-complete.component.html',
})
export class PasswordResetCompleteComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form = new FormGroup({
    newPassword: new FormControl('', { validators: [Validators.required, Validators.minLength(8)], updateOn: 'blur' }),
    confirmPassword: new FormControl('', { validators: [Validators.required], updateOn: 'blur' })
  }, { validators: this.passwordsMatchValidator.bind(this) });

  isLoading = signal(false);
  error = signal<string | null>(null);
  resetToken: string | null = null;

  private formStatus = toSignal(this.form.statusChanges, { initialValue: this.form.status });

  /** Cross-field error, shown separately since it lives on the FormGroup, not a single control. */
  showPasswordMismatch = computed(() => {
    this.formStatus();
    return this.form.controls.confirmPassword.touched && !!this.form.errors?.['passwordMismatch'];
  });

  ngOnInit(): void {
    this.resetToken = this.route.snapshot.queryParams['resetToken'] || null;

    this.form.valueChanges.subscribe(() => {
      if (this.error()) {
        this.error.set(null);
      }
    });
  }

  passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const group = control as FormGroup;
    const np = group.get('newPassword')?.value;
    const cp = group.get('confirmPassword')?.value;
    return np && cp && np === cp ? null : { passwordMismatch: true };
  }

  submit(): void {
    this.error.set(null);
    if (this.form.invalid || !this.resetToken) {
      Object.values(this.form.controls).forEach(c => c.markAsTouched());
      if (!this.resetToken) { this.error.set('Reset token missing'); }
      return;
    }
    this.isLoading.set(true);
    const newPassword = this.form.value.newPassword as string;
    this.authService.completePasswordReset(this.resetToken, newPassword).subscribe({
      next: (res: PasswordResetCompleteResponse) => {
        this.router.navigate(['/authentication/login'], { queryParams: { reset: 'success' } });
      },
      error: (err) => {
        this.error.set(err?.message || 'Failed to reset password');
        this.isLoading.set(false);
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }
}