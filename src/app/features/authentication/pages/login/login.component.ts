import { Component, signal, inject, OnInit } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { AuthService } from 'src/app/features/authentication/services/auth.service';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MaterialModule } from '../../../../material.module';
import { BrandingComponent } from '../../../../layouts/full/vertical/sidebar/branding.component';
import { MatInputModule } from '@angular/material/input';
import { PasswordVisibilityToggleComponent } from '../../../../components/shared/password-visibility-toggle.component';
import { LoginRequest } from '../../models/login-request';
import { AuthHeroComponent } from '../../components/auth-hero/auth-hero.component';

@Component({
    selector: 'app-login',
    imports: [RouterModule, MaterialModule, MatInputModule, FormsModule, ReactiveFormsModule, BrandingComponent, PasswordVisibilityToggleComponent, AuthHeroComponent],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class AppLoginComponent implements OnInit {
   private authService = inject(AuthService);
   private settings = inject(CoreService);
   private router = inject(Router);
   private route = inject(ActivatedRoute);

  // UI state management
  isLoading = signal(false);
  loginError = signal<string | null>(null);
  passwordVisible = signal(false);

  options = this.settings.getOptions();

  // Initialize controls with username/email login
  // updateOn: 'change' makes validation errors appear on every input change
  form = new FormGroup({
    email: new FormControl('', { validators: [Validators.required], updateOn: 'change' }),
    password: new FormControl('', { validators: [Validators.required], updateOn: 'change' }),
    rememberMe: new FormControl(false)
  });

  ngOnInit(): void {
     this.form.updateValueAndValidity();

     // Clear global error when user starts typing in any field
     this.form.valueChanges.subscribe(() => {
       if (this.loginError()) {
         this.loginError.set(null);
       }
     });
   }

   get f() {
     return this.form.controls;
   }


  submit(): void {
    this.loginError.set(null);

    if (this.form.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading.set(true);

    const formValue = this.form.value;
    const loginData: LoginRequest = {
      emailOrPhone: formValue.email || '',
      password: formValue.password || ''
    };

    const returnUrl: string = this.route.snapshot.queryParams['returnUrl'] || '/contacts';

    this.authService.login(loginData, formValue.rememberMe || false).subscribe({
      next: (response) => {
        this.router.navigateByUrl(returnUrl).then(navigated => {
          if (!navigated) {
            this.router.navigate(['/contacts']);
          }
        }).catch(() => {
          this.router.navigate(['/contacts']);
        });
      },
      error: (error) => {
        this.loginError.set(error.message || 'Login failed. Please try again.');
        this.isLoading.set(false);
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update(visible => !visible);
  }

  /** Hide mat-error while the user is actively typing by clearing touched state. */
  onFieldInput(fieldName: string): void {
    this.form.get(fieldName)?.markAsUntouched();
  }

  /** Trigger error display once the field loses focus. */
  onFieldBlur(fieldName: string): void {
    const control = this.form.get(fieldName);
    if (control) {
      control.markAsTouched();
      control.updateValueAndValidity();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }
}
