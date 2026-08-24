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
import { WorkspaceService } from 'src/app/features/organization/services/workspace.service';

@Component({
  selector: 'app-boxed-register',
  imports: [
    RouterModule,
    MaterialModule,
    FormsModule,
    BrandingComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './boxed-register.component.html',
})
export class AppBoxedRegisterComponent {
  private settings = inject(CoreService);
  private router = inject(Router);
  private workspaceService = inject(WorkspaceService);

  options = this.settings.getOptions();

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  form = new FormGroup({
    uname: new FormControl('', [Validators.required, Validators.minLength(6)]),
    email: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });

  get f() {
    return this.form.controls;
  }

  submit() {
    // console.log(this.form.value);
    this.router.navigate(this.workspaceService.workspacePath('dashboards', 'dashboard1'));
  }
}
