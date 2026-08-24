import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/features/authentication/services/auth.service';
import { AuthLayoutComponent } from '../../components/auth-layout/auth-layout.component';
import { DsTextFieldComponent } from 'src/app/shared/components/ui/ds-text-field/ds-text-field.component';
import { DsButtonComponent } from 'src/app/shared/components/ui/ds-button/ds-button.component';
import { DsAlertComponent } from 'src/app/shared/components/ui/ds-alert/ds-alert.component';

@Component({
  selector: 'app-password-reset-initiate',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, FormsModule, ReactiveFormsModule, AuthLayoutComponent, DsTextFieldComponent, DsButtonComponent, DsAlertComponent],
  templateUrl: './password-reset-initiate.component.html',
})
export class PasswordResetInitiateComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  form = new FormGroup({
    email: new FormControl('', { validators: [Validators.required, Validators.email], updateOn: 'change' }),
  });

  isLoading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.form.valueChanges.subscribe(() => {
      if (this.error()) {
        this.error.set(null);
      }
    });
  }

  submit(): void {
    this.error.set(null);

    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach((key) => {
        this.form.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading.set(true);

    const contact = this.form.value.email ?? '';

    this.authService.initiatePasswordReset(contact, 'EMAIL').subscribe({
      next: () => {
        this.router.navigate(['/authentication/password-reset/verify'], { queryParams: { contact } });
      },
      error: (err) => {
        this.error.set(err?.message || 'Unable to initiate password reset');
        this.isLoading.set(false);
      },
      complete: () => {
        this.isLoading.set(false);
      },
    });
  }
}
