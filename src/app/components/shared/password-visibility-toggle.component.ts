import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-password-visibility-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      (click)="toggleVisibility.emit()"
      [attr.aria-label]="isVisible() ? 'Hide password' : 'Show password'"
      class="tw:absolute tw:right-2 tw:top-1/2 tw:-translate-y-1/2 tw:flex tw:h-9 tw:w-9 tw:items-center tw:justify-center tw:rounded-full tw:border-0 tw:bg-transparent tw:text-on-surface-variant/70 tw:outline-none tw:transition-colors tw:hover:bg-surface-variant tw:focus-visible:ring-2 tw:focus-visible:ring-primary/30"
    >
      @if (isVisible()) {
        <svg class="tw:h-5 tw:w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.9 10.9 0 0 0 3.208-4.09c.28-.62.28-1.322 0-1.941C17.958 5.18 14.657 3 10 3a9.9 9.9 0 0 0-3.958.813l-2.762-2.593ZM7.53 6.47l1.3 1.3a2.25 2.25 0 0 1 2.9 2.9l1.3 1.3a3.75 3.75 0 0 0-5.5-5.5Z" />
          <path d="M2.06 6.66 4.7 9.3a3.75 3.75 0 0 0 5 5l1.87 1.87A9.9 9.9 0 0 1 10 17c-4.657 0-7.958-2.18-9.542-5.723a2.15 2.15 0 0 1 0-1.941 11.4 11.4 0 0 1 1.602-2.677Z" />
        </svg>
      } @else {
        <svg class="tw:h-5 tw:w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M10 3c-4.657 0-7.958 2.18-9.542 5.723a2.15 2.15 0 0 0 0 1.941C1.958 14.207 5.343 17 10 17s7.958-2.18 9.542-5.723a2.15 2.15 0 0 0 0-1.941C17.958 5.18 14.657 3 10 3Zm0 10.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" clip-rule="evenodd" />
        </svg>
      }
    </button>
  `,
})
export class PasswordVisibilityToggleComponent {
  /**
   * Whether the password is currently visible
   */
  isVisible = input.required<boolean>();

  /**
   * Emitted when the visibility toggle is clicked
   */
  toggleVisibility = output<void>();
}