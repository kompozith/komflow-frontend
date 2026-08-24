import { Injectable, TemplateRef, signal } from '@angular/core';

/**
 * Lets a routed page project its own filter markup into the shared sidebar,
 * bridging the router-outlet boundary that <ng-content> can't cross. A page
 * component sets its <ng-template> on init and clears it on destroy.
 */
@Injectable({ providedIn: 'root' })
export class SidebarFiltersService {
  readonly template = signal<TemplateRef<unknown> | null>(null);

  set(template: TemplateRef<unknown> | null): void {
    this.template.set(template);
  }

  clear(): void {
    this.template.set(null);
  }
}
