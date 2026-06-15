import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '../../../../material.module';
import { WorkspaceService } from '../../services/workspace.service';

function slugPattern(c: AbstractControl): ValidationErrors | null {
  const v: string = c.value ?? '';
  return v && !/^[a-z0-9-]+$/.test(v) ? { slugPattern: true } : null;
}

@Component({
  selector: 'app-create-organization',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="container-fluid py-4" style="max-width: 640px; margin: 0 auto;">
      <div class="d-flex align-items-center gap-3 mb-4">
        <button mat-icon-button (click)="back()" color="primary">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div>
          <h4 class="m-0 f-w-700">Créer un nouvel espace</h4>
          <span class="f-s-13 text-muted">Chaque espace est un environnement isolé avec ses propres données</span>
        </div>
      </div>

      <mat-card class="cardWithShadow">
        <mat-card-content class="p-4">
          <form [formGroup]="form" (ngSubmit)="submit()">

            <mat-label class="f-s-13 f-w-600 mb-2 d-block">Nom de l'espace *</mat-label>
            <mat-form-field appearance="outline" class="w-100" color="primary">
              <input matInput formControlName="name"
                     placeholder="Mon Entreprise SAS"
                     (blur)="autoSlug()" />
              @if (f['name'].touched && f['name'].errors?.['required']) {
                <mat-error>Nom obligatoire</mat-error>
              }
              @if (f['name'].touched && f['name'].errors?.['minlength']) {
                <mat-error>Minimum 2 caractères</mat-error>
              }
            </mat-form-field>

            <mat-label class="f-s-13 f-w-600 mb-1 d-block">
              Identifiant URL
              <span class="f-s-12 text-muted f-w-400">(optionnel)</span>
            </mat-label>
            <mat-form-field appearance="outline" class="w-100" color="primary">
              <span matTextPrefix class="text-muted f-s-13">app/</span>
              <input matInput formControlName="slug"
                     placeholder="mon-entreprise"
                     (input)="f['slug'].markAsDirty()" />
              @if (f['slug'].touched && f['slug'].errors?.['slugPattern']) {
                <mat-error>Uniquement minuscules, chiffres et tirets</mat-error>
              }
            </mat-form-field>

            <div class="p-3 rounded bg-light-primary mt-2 mb-3 d-flex gap-2 align-items-start">
              <mat-icon class="text-primary f-s-18 mt-1">info_outline</mat-icon>
              <span class="f-s-13 text-muted">
                Vous serez automatiquement <strong>OWNER</strong> de ce nouvel espace.
                Vous pourrez y inviter des membres depuis les paramètres.
              </span>
            </div>

            <button mat-flat-button color="primary" class="w-100" type="submit" [disabled]="loading">
              @if (loading) {
                <mat-spinner diameter="18" class="d-inline-block me-2"></mat-spinner>
              }
              Créer l'espace
            </button>

          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class CreateOrganizationComponent {
  private wsService = inject(WorkspaceService);
  private router    = inject(Router);
  private snackBar  = inject(MatSnackBar);

  loading = false;

  form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    slug: new FormControl('', [slugPattern]),
  });

  get f() { return this.form.controls; }

  autoSlug(): void {
    const name = this.f['name'].value ?? '';
    if (name && !this.f['slug'].dirty) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      this.f['slug'].setValue(slug.substring(0, 60));
    }
  }

  back(): void {
    this.router.navigate(['/organization']);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;

    this.wsService.createWorkspace(
      this.f['name'].value!,
      this.f['slug'].value || undefined
    ).subscribe({
      next: (ws) => {
        this.snackBar.open(`Espace « ${ws.orgName} » créé !`, '✓', { duration: 3000 });
        this.router.navigate(['/contacts']);
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.message ?? 'Erreur lors de la création de l\'espace.';
        this.snackBar.open(msg, 'Fermer', { duration: 5000 });
      },
    });
  }
}
