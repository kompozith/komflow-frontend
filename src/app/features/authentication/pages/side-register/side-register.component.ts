import { Component, inject } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../material.module';
import { BrandingComponent } from '../../../../layouts/full/vertical/sidebar/branding.component';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

/** Valide que la valeur ne contient que des lettres minuscules, chiffres et tirets. */
function slugPattern(control: AbstractControl): ValidationErrors | null {
  const val: string = control.value ?? '';
  if (val && !/^[a-z0-9-]+$/.test(val)) {
    return { slugPattern: true };
  }
  return null;
}

@Component({
  selector: 'app-side-register',
  standalone: true,
  imports: [RouterModule, MaterialModule, FormsModule, ReactiveFormsModule, BrandingComponent, CommonModule],
  templateUrl: './side-register.component.html',
})
export class AppSideRegisterComponent {
  private authService = inject(AuthService);
  private router      = inject(Router);
  private snackBar    = inject(MatSnackBar);

  loading = false;
  hidePassword = true;

  form = new FormGroup({
    firstName:        new FormControl('',  [Validators.required]),
    lastName:         new FormControl('',  [Validators.required]),
    email:            new FormControl('',  [Validators.required, Validators.email]),
    username:         new FormControl('',  [Validators.required, Validators.minLength(3)]),
    password:         new FormControl('',  [Validators.required, Validators.minLength(6), Validators.maxLength(20)]),
    organizationName: new FormControl('',  [Validators.required, Validators.minLength(2)]),
    organizationSlug: new FormControl('',  [slugPattern]),
  });

  get f() { return this.form.controls; }

  /** Génère automatiquement le slug depuis le nom de l'organisation. */
  autoSlug(): void {
    const name: string = this.f['organizationName'].value ?? '';
    if (name && !this.f['organizationSlug'].dirty) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      this.f['organizationSlug'].setValue(slug.substring(0, 60));
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Veuillez remplir tous les champs obligatoires.', 'Fermer', { duration: 4000 });
      return;
    }
    this.loading = true;

    this.authService.register({
      firstName:        this.f['firstName'].value!,
      lastName:         this.f['lastName'].value!,
      email:            this.f['email'].value!,
      username:         this.f['username'].value!,
      password:         this.f['password'].value!,
      organizationName: this.f['organizationName'].value!,
      organizationSlug: this.f['organizationSlug'].value || undefined,
    }).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Compte créé avec succès !', '✓', { duration: 3000 });
        this.router.navigate(['/contacts']);
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.message ?? 'Une erreur est survenue. Veuillez réessayer.';
        this.snackBar.open(msg, 'Fermer', { duration: 5000 });
      },
    });
  }
}
