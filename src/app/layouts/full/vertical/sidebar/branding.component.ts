import { Component } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-branding',
  imports: [],
  template: `
    <a href="/" class="logodark">
      <img
        [src]="'./assets/images/logos/dark-logo.svg?v=' + assetVersion"
        class="brand-logo align-middle m-2"
        alt="Komflow Logo"
      />
    </a>

    <a href="/" class="logolight">
      <img
        [src]="'./assets/images/logos/light-logo.svg?v=' + assetVersion"
        class="brand-logo align-middle m-2"
        alt="Komflow Logo"
      />
    </a>
  `,
})
export class BrandingComponent {
  options = this.settings.getOptions();
  readonly assetVersion = environment.appVersion || '1.0.0';

  constructor(private settings: CoreService) {}

  get appName(): string {
    return 'Komflow';
  }
}
