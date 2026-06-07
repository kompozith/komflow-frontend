import { Component, OnInit, Input, ChangeDetectorRef, OnChanges, inject } from '@angular/core';
import { navItems } from './sidebar-data';
import { Router } from '@angular/router';
import { NavService } from '../../../../services/nav.service';
import { MediaMatcher } from '@angular/cdk/layout';
import { AppHorizontalNavItemComponent } from './nav-item/nav-item.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-horizontal-sidebar',
  imports: [AppHorizontalNavItemComponent, CommonModule],
  templateUrl: './sidebar.component.html',
})
export class AppHorizontalSidebarComponent implements OnInit {
  navService = inject(NavService);
  router = inject(Router);

  navItems = navItems;
  parentActive = '';

  mobileQuery: MediaQueryList;
  private _mobileQueryListener: () => void;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    const media = inject(MediaMatcher);
    const changeDetectorRef = inject(ChangeDetectorRef);

    this.mobileQuery = media.matchMedia('(min-width: 1100px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
    this.router.events.subscribe(
      () => (this.parentActive = this.router.url.split('/')[1])
    );
  }

  ngOnInit(): void {
    this.parentActive = this.router.url.split('/')[1];

    this.router.events.subscribe(() => {
      this.parentActive = this.router.url.split('/')[1];
    });
  }
}
