import { Injectable, signal } from '@angular/core';

/**
 * Replaces the MatSidenav ViewChild coupling that used to live in FullComponent.
 * isOver reflects the current mobile/desktop breakpoint (set by FullComponent's
 * BreakpointObserver subscription); isOpen drives whether the sidebar is visible.
 */
@Injectable({ providedIn: 'root' })
export class SidenavService {
  readonly isOpen = signal(true);
  readonly isOver = signal(false);

  toggle(): void {
    this.isOpen.update((v) => !v);
  }

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  /** Called whenever the mobile/desktop breakpoint changes. */
  setIsOver(isOver: boolean): void {
    this.isOver.set(isOver);
    if (isOver) {
      // Mobile always starts collapsed — the user opens it explicitly via the toggle button.
      this.close();
    }
  }
}
