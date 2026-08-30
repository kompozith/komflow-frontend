import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation, effect, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { CoreService } from 'src/app/services/core.service';
import { AppSettings } from 'src/app/config';
import { filter } from 'rxjs/operators';
import { NavigationEnd, Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './vertical/sidebar/sidebar.component';
import { TablerIconsModule } from 'angular-tabler-icons';
import { HeaderComponent } from './vertical/header/header.component';
import { TabBarComponent } from './tab-bar/tab-bar.component';
import { AuthService } from 'src/app/features/authentication/services/auth.service';
import { AuthUser } from 'src/app/features/user-management/models/user';
import { UserProfileService } from 'src/app/services/user-profile.service';
import { environment } from 'src/environments/environment';
import { WorkspaceService } from 'src/app/features/organization/services/workspace.service';
import { CreateWorkspaceModalComponent } from 'src/app/features/organization/components/create-workspace-modal/create-workspace-modal.component';
import { SidenavService } from './sidenav.service';

const BELOWMONITOR = 'screen and (max-width: 1023px)';

@Component({
    selector: 'app-full',
    imports: [
        RouterModule,
        CommonModule,
        SidebarComponent,
        TablerIconsModule,
        HeaderComponent,
        TabBarComponent,
        CreateWorkspaceModalComponent,
    ],
    templateUrl: './full.component.html',

    encapsulation: ViewEncapsulation.None
})
export class FullComponent implements OnInit {
    private settings = inject(CoreService);
    private router = inject(Router);
    private breakpointObserver = inject(BreakpointObserver);
    private cdr = inject(ChangeDetectorRef);
    private authService = inject(AuthService);
    private userProfileService = inject(UserProfileService);
    workspaceService = inject(WorkspaceService);
    sidenavService = inject(SidenavService);

    readonly assetVersion = environment.appVersion || '1.0.0';

    currentUser: AuthUser | null = null;

  @ViewChild('content', { static: true }) content!: ElementRef<HTMLDivElement>;
  private layoutChangesSubscription = Subscription.EMPTY;

  get options() {
    return this.settings.getOptions();
  }

    /** Inserted by Angular inject() migration for backwards compatibility */
    constructor(...args: unknown[]);

  constructor() {
    this.htmlElement = document.querySelector('html')!;
    this.layoutChangesSubscription = this.breakpointObserver
      .observe([BELOWMONITOR])
      .subscribe((state) => {
        this.sidenavService.setIsOver(state.breakpoints[BELOWMONITOR]);
      });

    // Re-apply theme classes to <html> whenever options change (e.g. the navbar's theme toggle).
    effect(() => this.receiveOptions(this.settings.getOptions()));

    // This is for scroll to top
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((e) => {
        this.content.nativeElement.scrollTo({ top: 0 });
      });
  }

  private htmlElement!: HTMLHtmlElement;

  ngOnInit(): void {
      this.authService.currentUser$.subscribe(user => {
         this.currentUser = user;
         this.cdr.detectChanges();
      });
  }

  ngOnDestroy() {
    this.layoutChangesSubscription.unsubscribe();
  }

  receiveOptions(options: AppSettings): void {
    this.toggleDarkTheme(options);
    this.toggleColorsTheme(options);
  }

  toggleDarkTheme(options: AppSettings) {
    if (options.theme === 'dark') {
      this.htmlElement.classList.add('dark-theme');
      this.htmlElement.classList.remove('light-theme');
    } else {
      this.htmlElement.classList.remove('dark-theme');
      this.htmlElement.classList.add('light-theme');
    }
  }

  toggleColorsTheme(options: AppSettings) {
     // Remove any existing theme class dynamically
     this.htmlElement.classList.forEach((className) => {
       if (className.endsWith('_theme')) {
         this.htmlElement.classList.remove(className);
       }
     });

     // Add the selected theme class
     this.htmlElement.classList.add(options.activeTheme);
   }

   getUserInitials(): string {
     return this.userProfileService.getUserInitials(this.currentUser);
   }

   getUserProfileImage(): string | null {
     return this.userProfileService.getUserProfileImage(this.currentUser);
   }

   getUserBadgeClass(): string {
     return this.userProfileService.getUserBadgeClass(this.currentUser?.id);
   }
}
