import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CoreService } from 'src/app/services/core.service';
import { MaterialModule } from '../../../../material.module';
import { BrandingComponent } from '../../../../layouts/full/vertical/sidebar/branding.component';

@Component({
  selector: 'app-side-two-steps',
  imports: [RouterModule, MaterialModule, BrandingComponent],
  templateUrl: './side-two-steps.component.html',
})
export class AppSideTwoStepsComponent {
  private settings = inject(CoreService);

  options = this.settings.getOptions();

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}
}
