import { Component, inject } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import {
  FormGroup,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../../material.module';
import { BrandingComponent } from '../../../../layouts/full/vertical/sidebar/branding.component';

@Component({
  selector: 'app-boxed-forgot-password',
  imports: [
    RouterModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    BrandingComponent,
  ],
  templateUrl: './boxed-forgot-password.component.html',
})
export class AppBoxedForgotPasswordComponent {
  private settings = inject(CoreService);
  private router = inject(Router);

  options = this.settings.getOptions();

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  form = new FormGroup({
    email: new FormControl('', [Validators.required]),
  });

  get f() {
    return this.form.controls;
  }

  submit() {
    // console.log(this.form.value);
    this.router.navigate(['/dashboards/dashboard1']);
  }
}
