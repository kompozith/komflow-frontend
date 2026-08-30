import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-auth-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-hero">
      <div class="auth-hero__logo">
        <img
          src="/assets/images/logos/light-logo.svg"
          alt="Komflow"
          class="auth-hero__logo-img"
        />
      </div>

      <div class="auth-hero__body">
        <h2 class="auth-hero__headline">
          Turn every<br />
          <span class="auth-hero__headline-accent">conversation</span><br />
          into sales
        </h2>
        <p class="auth-hero__desc">
          The way you communicate with your leads is the key.<br />
          Stop wasting time and money going across multiple inboxes.
        </p>
      </div>

      <div class="auth-hero__illustration">
        <img
          src="/assets/images/backgrounds/auth-hero-illustration.svg"
          alt=""
          aria-hidden="true"
          class="auth-hero__illustration-img"
        />
      </div>
    </div>
  `,
})
export class AuthHeroComponent {}
