import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrganizationService, OrganizationProfile } from '../../services/organization.service';
import { BadgeComponent, BadgeVariant } from 'src/app/shared/components/badge/badge.component';
import { RouterModule } from '@angular/router';

function slugPattern(c: AbstractControl): ValidationErrors | null {
  const v: string = c.value ?? '';
  return v && !/^[a-z0-9-]+$/.test(v) ? { slugPattern: true } : null;
}

const PLAN_VARIANT: Record<string, BadgeVariant> = {
  FREE: 'secondary', STARTER: 'info', PRO: 'primary', ENTERPRISE: 'success',
};

@Component({
  selector: 'app-organization-settings',
  standalone: true,
  imports: [CommonModule, MaterialModule, TablerIconsModule, ReactiveFormsModule, BadgeComponent, RouterModule],
  templateUrl: './organization-settings.component.html',
})
export class OrganizationSettingsComponent implements OnInit {
  private orgService = inject(OrganizationService);
  private snackBar   = inject(MatSnackBar);

  org: OrganizationProfile | null = null;
  loading  = true;
  saving   = false;

  form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    slug: new FormControl('', [slugPattern]),
  });

  get f() { return this.form.controls; }

  planVariant(code: string): BadgeVariant {
    return PLAN_VARIANT[code] ?? 'secondary';
  }

  ngOnInit(): void {
    this.orgService.getMyOrganization().subscribe({
      next: (org) => {
        this.org = org;
        this.form.patchValue({ name: org.name, slug: org.slug });
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  autoSlug(): void {
    const name: string = this.f['name'].value ?? '';
    if (name && !this.f['slug'].dirty) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      this.f['slug'].setValue(slug.substring(0, 60));
    }
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    this.orgService.updateMyOrganization({
      name: this.f['name'].value!,
      slug: this.f['slug'].value || undefined,
    }).subscribe({
      next: (updated) => {
        this.org = updated;
        this.saving = false;
        this.snackBar.open('Organisation mise à jour.', '✓', { duration: 3000 });
        // Reset slug dirty state
        this.f['slug'].markAsPristine();
      },
      error: (err) => {
        this.saving = false;
        const msg = err?.error?.message ?? 'Erreur lors de la mise à jour.';
        this.snackBar.open(msg, 'Fermer', { duration: 5000 });
      },
    });
  }
}
