import { Injectable, signal, inject } from '@angular/core';
import { Event, NavigationEnd, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class NavService {
  private router = inject(Router);

  showClass: any = false;

  public currentUrl = signal<string | undefined>(undefined);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        this.currentUrl.set(event.urlAfterRedirects);
      }
    });
  }
}