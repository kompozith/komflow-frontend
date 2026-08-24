import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CoreService } from 'src/app/services/core.service';
import { WorkspaceService } from 'src/app/features/organization/services/workspace.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-branding',
  imports: [RouterModule],
  template: `
    <a [routerLink]="workspaceService.workspacePath()" class="logodark">
      <img
        [src]="'./assets/images/logos/dark-logo.svg?v=' + assetVersion"
        class="brand-logo align-middle m-2"
        alt="Komflow Logo"
      />
    </a>

    <a [routerLink]="workspaceService.workspacePath()" class="logolight">
      <img
        [src]="'./assets/images/logos/light-logo.svg?v=' + assetVersion"
        class="brand-logo align-middle m-2"
        alt="Komflow Logo"
      />
    </a>
  `,
})
export class BrandingComponent {
  private settings = inject(CoreService);
  workspaceService = inject(WorkspaceService);

  options = this.settings.getOptions();
  readonly assetVersion = environment.appVersion || '1.0.0';

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  get appName(): string {
    return 'Komflow';
  }
}
