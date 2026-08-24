import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { TablerIconsModule } from 'angular-tabler-icons';
import { AuthLayoutComponent } from '../../components/auth-layout/auth-layout.component';
import { PasswordRulesComponent } from '../../components/password-rules/password-rules.component';
import { AuthService } from '../../services/auth.service';
import { WorkspaceService } from 'src/app/features/organization/services/workspace.service';
import { DsTextFieldComponent } from 'src/app/shared/components/ui/ds-text-field/ds-text-field.component';
import { DsButtonComponent } from 'src/app/shared/components/ui/ds-button/ds-button.component';
import { DsAlertComponent } from 'src/app/shared/components/ui/ds-alert/ds-alert.component';
import {
  hasPasswordDigit,
  hasPasswordLowercase,
  hasPasswordMinLength,
  hasPasswordSpecialChar,
  hasPasswordUppercase,
  passwordPolicyValidator,
} from '../../utils/password-validation';

/** Valide que la valeur ne contient que des lettres minuscules, chiffres et tirets. */
function slugPattern(control: AbstractControl): ValidationErrors | null {
  const val: string = control.value ?? '';
  if (val && !/^[a-z0-9-]+$/.test(val)) {
    return { slugPattern: true };
  }
  return null;
}

/** Turns free text into a URL-friendly slug: lowercase, spaces/symbols collapsed to hyphens. */
function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}

@Component({
  selector: 'app-side-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    PasswordRulesComponent,
    AuthLayoutComponent,
    DsTextFieldComponent,
    DsButtonComponent,
    DsAlertComponent,
    TablerIconsModule,
  ],
  templateUrl: './side-register.component.html',
})
export class AppSideRegisterComponent {
  private authService = inject(AuthService);
  private workspaceService = inject(WorkspaceService);
  private router = inject(Router);

  isLoading = signal(false);
  registerError = signal<string | null>(null);
  currentStep = signal<1 | 2>(1);

  /** Tracks whether the slug was last set by the auto-generator or typed by hand. */
  private slugManuallyEdited = false;

  /** Drives the live availability indicator next to the slug field. */
  slugCheckState = signal<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');

  private readonly step1Fields = ['firstName', 'lastName', 'email', 'password'] as const;
  private readonly step2Fields = ['organizationName', 'organizationSlug'] as const;

  form = new FormGroup({
    firstName: new FormControl('', { validators: [Validators.required], updateOn: 'change' }),
    lastName: new FormControl('', { validators: [Validators.required], updateOn: 'change' }),
    email: new FormControl('', {
      validators: [Validators.required, Validators.email],
      updateOn: 'change',
    }),
    password: new FormControl('', {
      validators: [Validators.required, passwordPolicyValidator],
      updateOn: 'change',
    }),
    organizationName: new FormControl('', {
      validators: [Validators.required, Validators.minLength(2)],
      updateOn: 'change',
    }),
    organizationSlug: new FormControl('', {
      validators: [slugPattern],
      updateOn: 'change',
    }),
  });

  get f() {
    return this.form.controls;
  }

  constructor() {
    // Regenerate the slug live as the organization name is typed, unless the
    // user has taken over editing the slug field themselves.
    this.form.controls.organizationName.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((name) => {
        if (!this.slugManuallyEdited) {
          this.form.controls.organizationSlug.setValue(toSlug(name ?? ''), { emitEvent: true });
        }
      });

    // Strip spaces/invalid characters as the user types directly into the slug field.
    this.form.controls.organizationSlug.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => {
        const cleaned = toSlug(value ?? '');
        if (cleaned !== value) {
          this.form.controls.organizationSlug.setValue(cleaned, { emitEvent: false });
        }
      });

    // Single shared debounce: one availability check per pause in typing,
    // regardless of how many keystrokes land inside the 400ms window.
    // (An AsyncValidatorFn re-triggers per keystroke with no shared debounce
    // window, which fired one request per character — this pipe fixes that.)
    this.form.controls.organizationSlug.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((slug) => {
          const value: string = slug ?? '';
          if (!value) {
            this.slugCheckState.set('idle');
            return of(null);
          }
          if (!/^[a-z0-9-]+$/.test(value)) {
            this.slugCheckState.set('invalid');
            return of(null);
          }
          this.slugCheckState.set('checking');
          return this.authService.checkOrganizationSlugAvailability(value).pipe(
            catchError(() => of(null)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((available) => {
        const control = this.form.controls.organizationSlug;
        if (available === null) {
          return;
        }
        if (available) {
          this.slugCheckState.set('available');
          if (control.errors?.['slugTaken']) {
            const { slugTaken, ...rest } = control.errors;
            control.setErrors(Object.keys(rest).length ? rest : null);
          }
        } else {
          this.slugCheckState.set('taken');
          control.setErrors({ ...control.errors, slugTaken: true });
        }
      });
  }

  private passwordValue = toSignal(this.form.controls.password.valueChanges, {
    initialValue: this.form.controls.password.value ?? '',
  });

  /** Hide the password rules checklist until the user starts typing a password. */
  showPasswordRules = computed(() => !!this.passwordValue());

  hasMinLength = computed(() => hasPasswordMinLength(this.passwordValue() ?? ''));
  hasLowercase = computed(() => hasPasswordLowercase(this.passwordValue() ?? ''));
  hasUppercase = computed(() => hasPasswordUppercase(this.passwordValue() ?? ''));
  hasDigit = computed(() => hasPasswordDigit(this.passwordValue() ?? ''));
  hasSpecialChar = computed(() => hasPasswordSpecialChar(this.passwordValue() ?? ''));

  /** Once the user types directly into the slug field, stop overwriting it from the name field. */
  markSlugManuallyEdited(): void {
    this.slugManuallyEdited = true;
  }

  /** Step 1 submit ("Next"): validate the account fields, then advance to step 2. */
  goToNextStep(): void {
    this.registerError.set(null);

    if (!this.isStepValid(this.step1Fields)) {
      this.markFieldsTouched(this.step1Fields);
      return;
    }

    this.currentStep.set(2);
  }

  /** Step 2 back button: return to step 1 without losing entered values. */
  goToPreviousStep(): void {
    this.registerError.set(null);
    this.currentStep.set(1);
  }

  /** Routes to the right action depending on the active step. */
  handleSubmit(): void {
    if (this.currentStep() === 1) {
      this.goToNextStep();
      return;
    }
    this.submit();
  }

  private submit(): void {
    this.registerError.set(null);

    if (!this.isStepValid(this.step2Fields)) {
      this.markFieldsTouched(this.step2Fields);
      return;
    }

    this.isLoading.set(true);

    this.authService
      .register({
        firstName: this.f['firstName'].value!,
        lastName: this.f['lastName'].value!,
        email: this.f['email'].value!,
        password: this.f['password'].value!,
        organizationName: this.f['organizationName'].value!,
        organizationSlug: this.f['organizationSlug'].value || undefined,
      })
      .subscribe({
        next: () => {
          this.router.navigate(this.workspaceService.workspacePath('contacts'));
        },
        error: (err) => {
          this.registerError.set(err?.message ?? 'Une erreur est survenue. Veuillez réessayer.');
          this.isLoading.set(false);
        },
        complete: () => {
          this.isLoading.set(false);
        },
      });
  }

  private isStepValid(fields: readonly string[]): boolean {
    return fields.every((name) => this.form.get(name)?.valid ?? false);
  }

  private markFieldsTouched(fields: readonly string[]): void {
    fields.forEach((name) => this.form.get(name)?.markAsTouched());
  }
}
