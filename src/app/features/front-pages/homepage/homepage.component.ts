import { MediaMatcher } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { IconModule } from 'src/app/icon/icon.module';
import { BrandingComponent } from 'src/app/layouts/full/vertical/sidebar/branding.component';
import { MaterialModule } from 'src/app/material.module';
import { WorkspaceService } from 'src/app/features/organization/services/workspace.service';

@Component({
  selector: 'app-homepage',
  imports: [MaterialModule, BrandingComponent, RouterLink,
    IconModule, RouterOutlet, CommonModule],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.scss'
})
export class HomepageComponent {
  private route = inject(ActivatedRoute);

  @ViewChild('customizerRight') customizerRight!: MatSidenav;
  selected: string = ''; // default selected
  mobileQuery: MediaQueryList;
  isMobileView = false;
  hideCloserBtn: boolean = true;
  private router = inject(Router)
  private workspaceService = inject(WorkspaceService);
  private mediaMatcher: MediaQueryList = matchMedia(`(max-width: 1199px)`);
  showBackToTop: boolean;
  isTopbarFixed: boolean;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {   
    const media = inject(MediaMatcher);
    this.mobileQuery = media.matchMedia('(max-width: 1199px)');
    this.isMobileView = this.mobileQuery.matches;

    this.mobileQuery.addEventListener('change', (e) => {

      this.isMobileView = e.matches;
      this.closeSidenavIfNeeded();
    });
  }
  closeSidenavIfNeeded() {
    if (!this.isMobileView && this.customizerRight?.opened) {
      this.customizerRight.close();
    }
  }
  isOver(): boolean {
    return this.mediaMatcher.matches;
  }

  isActiveRoute(route: string): boolean {
    return this.router.url.includes(`/front-pages/${route}`);
  }
  hideCloser() {
    this.hideCloserBtn = false;
  }
  getNavigate() {
    this.router.navigate(this.workspaceService.workspacePath('dashboards', 'dashboard1'))
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showBackToTop = window.scrollY > 300;
    this.isTopbarFixed = scrollY > 45;
  }
}
