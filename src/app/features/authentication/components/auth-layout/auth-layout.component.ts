import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BrandingComponent } from '../../../../layouts/full/vertical/sidebar/branding.component';
import { AuthHeroComponent } from '../auth-hero/auth-hero.component';

/**
 * Shared two-column shell for every authentication page: a light form panel
 * on the left (logo, title, subtitle, then the page's own form projected via
 * ng-content) and the dark hero panel on the right. Only the form content
 * changes between login, register, and password-reset pages.
 */
@Component({
  selector: 'app-auth-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BrandingComponent, AuthHeroComponent],
  templateUrl: './auth-layout.component.html',
})
export class AuthLayoutComponent {
  title = input.required<string>();
  subtitle = input<string>('');
}
