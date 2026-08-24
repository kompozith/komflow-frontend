import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { WorkspaceService } from '../../services/workspace.service';
import { AuthService } from 'src/app/features/authentication/services/auth.service';
import { DsTextFieldComponent } from 'src/app/shared/components/ui/ds-text-field/ds-text-field.component';
import { DsButtonComponent } from 'src/app/shared/components/ui/ds-button/ds-button.component';
import { DsAlertComponent } from 'src/app/shared/components/ui/ds-alert/ds-alert.component';
import { TablerIconsModule } from 'angular-tabler-icons';

function slugPattern(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value ?? '';
  return value && !/^[a-z0-9-]+$/.test(value) ? { slugPattern: true } : null;
}

/**
 * Create-workspace modal. Rendered by FullComponent whenever
 * WorkspaceService.showCreateWorkspaceModal() is true — either because the
 * user has no workspace yet (needsWorkspace(), non-dismissible: it stays up
 * until createWorkspace() succeeds) or because they voluntarily opened it
 * from the workspace switcher (dismissible via close()).
 */
@Component({
  selector: 'app-create-workspace-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DsTextFieldComponent, DsButtonComponent, DsAlertComponent, TablerIconsModule],
  templateUrl: './create-workspace-modal.component.html',
})
export class CreateWorkspaceModalComponent {
  private workspaceService = inject(WorkspaceService);
  private authService = inject(AuthService);
  private router = inject(Router);

  dismissible = computed(() => !this.workspaceService.needsWorkspace());

  close(): void {
    this.workspaceService.closeCreateWorkspaceModal();
  }

  isLoading = signal(false);
  error = signal<string | null>(null);

  private slugManuallyEdited = false;

  /** Drives the live availability indicator next to the slug field. */
  slugCheckState = signal<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');

  form = new FormGroup({
    name: new FormControl('', { validators: [Validators.required, Validators.minLength(2)], updateOn: 'change' }),
    slug: new FormControl('', { validators: [slugPattern], updateOn: 'change' }),
  });

  private formStatus = toSignal(this.form.statusChanges, { initialValue: this.form.status });

  /** Blocks submission until the slug's availability has been checked and confirmed available. */
  canSubmit = computed(() => this.formStatus() === 'VALID' && this.slugCheckState() === 'available');

  constructor() {
    this.form.controls.name.valueChanges.subscribe((name) => {
      if (this.slugManuallyEdited) {
        return;
      }
      this.form.controls.slug.setValue(this.toSlug(name ?? ''));
    });

    this.form.controls.slug.valueChanges.subscribe((value) => {
      const cleaned = this.toSlug(value ?? '');
      if (cleaned !== value) {
        this.form.controls.slug.setValue(cleaned, { emitEvent: false });
      }
    });

    // Single shared debounce: one availability check per pause in typing.
    this.form.controls.slug.valueChanges
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
          return this.authService.checkOrganizationSlugAvailability(value).pipe(catchError(() => of(null)));
        }),
      )
      .subscribe((available) => {
        const control = this.form.controls.slug;
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

  markSlugManuallyEdited(): void {
    this.slugManuallyEdited = true;
  }

  submit(): void {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.canSubmit()) {
      return;
    }

    this.isLoading.set(true);

    this.workspaceService
      .createWorkspace(this.form.controls.name.value!, this.form.controls.slug.value || undefined)
      .subscribe({
        next: (workspace) => {
          this.router.navigate(['/', workspace.orgSlug, 'contacts']);
        },
        error: (err) => {
          this.error.set(err?.message ?? 'Une erreur est survenue. Veuillez réessayer.');
          this.isLoading.set(false);
        },
        complete: () => {
          this.isLoading.set(false);
        },
      });
  }

  private toSlug(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 60);
  }
}
