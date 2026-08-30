import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type DsAlertVariant = 'error' | 'success';

@Component({
  selector: 'ds-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ds-alert.component.html',
})
export class DsAlertComponent {
  variant = input<DsAlertVariant>('error');

  classes = computed(() => `ds-alert ds-alert--${this.variant()}`);
}
