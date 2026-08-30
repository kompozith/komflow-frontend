import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { AuthService } from 'src/app/features/authentication/services/auth.service';
import { WorkspaceService } from 'src/app/features/organization/services/workspace.service';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { LoginRequest } from '../../models/login-request';
import { AuthLayoutComponent } from '../../components/auth-layout/auth-layout.component';
import { DsTextFieldComponent } from 'src/app/shared/components/ui/ds-text-field/ds-text-field.component';
import { DsButtonComponent } from 'src/app/shared/components/ui/ds-button/ds-button.component';
import { DsAlertComponent } from 'src/app/shared/components/ui/ds-alert/ds-alert.component';

@Component({
    selector: 'app-login',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        RouterModule,
        FormsModule,
        ReactiveFormsModule,
        AuthLayoutComponent,
        DsTextFieldComponent,
        DsButtonComponent,
        DsAlertComponent,
    ],
    templateUrl: './login.component.html',
})
export class AppLoginComponent implements OnInit {
   private authService = inject(AuthService);
   private workspaceService = inject(WorkspaceService);
   private router = inject(Router);
   private route = inject(ActivatedRoute);

  isLoading = signal(false);
  loginError = signal<string | null>(null);

  form = new FormGroup({
    email: new FormControl('', { validators: [Validators.required, Validators.email], updateOn: 'change' }),
    password: new FormControl('', { validators: [Validators.required], updateOn: 'change' }),
    rememberMe: new FormControl(false)
  });

  ngOnInit(): void {
     this.form.valueChanges.subscribe(() => {
       if (this.loginError()) {
         this.loginError.set(null);
       }
     });
   }

  submit(): void {
    this.loginError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    const formValue = this.form.value;
    const loginData: LoginRequest = {
      emailOrPhone: formValue.email || '',
      password: formValue.password || ''
    };

    const returnUrl: string | null = this.route.snapshot.queryParams['returnUrl'] || null;

    this.authService.login(loginData, formValue.rememberMe || false).subscribe({
      next: () => {
        // Only trust a returnUrl that targets the workspace the user just
        // logged into — a stale one from a previous session's slug (or the
        // slug-less pre-login state) would otherwise bounce them into a
        // mismatched/dead route.
        const activeSlug = this.workspaceService.activeWorkspace()?.orgSlug;
        const isReturnUrlSafe = !!returnUrl && !!activeSlug && returnUrl.startsWith(`/${activeSlug}/`);
        const destination = isReturnUrlSafe ? returnUrl! : null;

        const fallback = () => this.router.navigate(this.workspaceService.workspacePath('contacts'));

        if (destination) {
          this.router.navigateByUrl(destination).then(navigated => {
            if (!navigated) fallback();
          }).catch(fallback);
        } else {
          fallback();
        }
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
}
