import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type DsButtonVariant = 'primary' | 'outline';
export type DsButtonType = 'button' | 'submit';

@Component({
  selector: 'ds-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tw:contents' },
  templateUrl: './ds-button.component.html',
})
export class DsButtonComponent {
  variant = input<DsButtonVariant>('primary');
  type = input<DsButtonType>('button');
  disabled = input(false);
  loading = input(false);
  loadingText = input<string>('');
  /**
   * Relative flex share when this button sits in a row next to other
   * ds-buttons (e.g. "Back" + "Next"). Leave unset for a solo button — it
   * stays full-width via `.ds-btn`'s own `w-full`. Only set this when there
   * are multiple buttons sharing one flex row that need a size ratio;
   * applying flex-grow to a solo button inside a flex-column parent (e.g. a
   * <form>) makes flexbox recompute its height from the distributed space
   * instead of respecting `.ds-btn`'s fixed height.
   */
  grow = input<1 | 2 | 3 | undefined>(undefined);

  classes = computed(() => {
    const variantClass = this.variant() === 'primary' ? 'ds-btn--primary' : 'ds-btn--outline';
    const growClass = this.grow() ? `ds-btn--grow-${this.grow()}` : '';
    return `ds-btn ${growClass} ${variantClass}`.trim();
  });
}
