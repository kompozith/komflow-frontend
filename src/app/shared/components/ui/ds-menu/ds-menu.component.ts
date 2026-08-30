import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  ViewChild,
  computed,
  contentChild,
  input,
  signal,
} from '@angular/core';
import {
  Overlay,
  OverlayRef,
  ConnectedPosition,
} from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ViewContainerRef, inject } from '@angular/core';

export type DsMenuPosition = 'below' | 'above';

/**
 * Positioned dropdown panel: click the trigger to open a CDK-overlay panel
 * anchored to it, closes on backdrop click or Escape. Replaces mat-menu across
 * the shell (workspace switcher, header notifications/profile) without pulling
 * in MatMenuModule's MDC chrome.
 *
 * Usage:
 *   <ds-menu [position]="'above'" [panelWidth]="'254px'">
 *     <button trigger (click)="menu.toggle()">...</button>
 *     <ng-template #panel>...menu content...</ng-template>
 *   </ds-menu>
 */
@Component({
  selector: 'ds-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ds-menu.component.html',
})
export class DsMenuComponent {
  private overlay = inject(Overlay);
  private viewContainerRef = inject(ViewContainerRef);

  position = input<DsMenuPosition>('below');
  panelWidth = input<string | undefined>(undefined);
  panelClass = input<string>('');

  @ViewChild('triggerHost', { static: true }) triggerHost!: ElementRef<HTMLElement>;
  panelTemplate = contentChild.required<TemplateRef<unknown>>('panel');

  readonly isOpen = signal(false);

  private overlayRef: OverlayRef | null = null;

  private connectedPositions = computed<ConnectedPosition[]>(() => {
    const below: ConnectedPosition = {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 4,
    };
    const above: ConnectedPosition = {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -4,
    };
    return this.position() === 'above' ? [above, below] : [below, above];
  });

  toggle(): void {
    this.isOpen() ? this.close() : this.open();
  }

  open(): void {
    if (this.isOpen()) {
      return;
    }
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.triggerHost)
      .withPositions(this.connectedPositions())
      .withFlexibleDimensions(false)
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      width: this.panelWidth(),
    });

    this.overlayRef.backdropClick().subscribe(() => this.close());
    this.overlayRef.keydownEvents().subscribe((event) => {
      if (event.key === 'Escape') {
        this.close();
      }
    });

    const portal = new TemplatePortal(this.panelTemplate(), this.viewContainerRef);
    this.overlayRef.attach(portal);
    this.isOpen.set(true);
  }

  close(): void {
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.isOpen.set(false);
  }
}
