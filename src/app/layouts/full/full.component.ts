import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectorRef, Component, OnInit, ViewChild, ViewEncapsulation, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatSidenav, MatSidenavContent } from '@angular/material/sidenav';
import { CoreService } from 'src/app/services/core.service';
import { AppSettings } from 'src/app/config';
import { filter } from 'rxjs/operators';
import { NavigationEnd, Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './vertical/sidebar/sidebar.component';
import { TablerIconsModule } from 'angular-tabler-icons';
import { HeaderComponent } from './vertical/header/header.component';
import { TabBarComponent } from './tab-bar/tab-bar.component';
import { LogoutComponent } from 'src/app/features/authentication/pages/logout/logout.component';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from 'src/app/features/authentication/services/auth.service';
import { AuthUser } from 'src/app/features/user-management/models/user';
import { UserProfileService } from 'src/app/services/user-profile.service';
import { environment } from 'src/environments/environment';
import { WorkspaceService } from 'src/app/features/organization/services/workspace.service';
import { CreateWorkspaceModalComponent } from 'src/app/features/organization/components/create-workspace-modal/create-workspace-modal.component';

const MOBILE_VIEW = 'screen and (max-width: 768px)';
const BELOWMONITOR = 'screen and (max-width: 1023px)';

@Component({
    selector: 'app-full',
    imports: [
        RouterModule,
        MaterialModule,
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
    dialog = inject(MatDialog);
    private router = inject(Router);
    private breakpointObserver = inject(BreakpointObserver);
    private cdr = inject(ChangeDetectorRef);
    private authService = inject(AuthService);
    private userProfileService = inject(UserProfileService);
    workspaceService = inject(WorkspaceService);

    readonly assetVersion = environment.appVersion || '1.0.0';

    currentUser: AuthUser | null = null;

   @ViewChild('leftsidenav')
   public sidenav: MatSidenav;
  @ViewChild('content', { static: true }) content!: MatSidenavContent;
  private layoutChangesSubscription = Subscription.EMPTY;
  private isMobileScreen = false;

  get options() {
    return this.settings.getOptions();
  }

  logout(
    enterAnimationDuration: string,
    exitAnimationDuration: string
  ): void {
    this.dialog.open(LogoutComponent, {
      width: '290px',
      enterAnimationDuration,
      exitAnimationDuration,
    });
  }

  get isOver(): boolean {
    return this.isMobileScreen;
  }

    /** Inserted by Angular inject() migration for backwards compatibility */
    constructor(...args: unknown[]);

  constructor() {
    this.htmlElement = document.querySelector('html')!;
    this.layoutChangesSubscription = this.breakpointObserver
      .observe([MOBILE_VIEW, BELOWMONITOR])
      .subscribe((state) => {
        const updatedOptions = { ...this.options, sidenavOpened: true };
        this.settings.setOptions(updatedOptions);
        this.isMobileScreen = state.breakpoints[BELOWMONITOR];
      });

    // Initialize project theme with options
    this.receiveOptions(this.options);

    // This is for scroll to top
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((e) => {
        this.content.scrollTo({ top: 0 });
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

  toggleCollapsed() {
    // No-op: the mini/collapsed sidebar layout was removed along with the
    // vertical nav list — kept as a method since HeaderComponent still emits it.
  }

  onSidenavClosedStart() {}

  onSidenavOpenedChange(isOpened: boolean) {
    const updatedOptions = {
      ...this.options,
      sidenavOpened: isOpened
    };
    this.settings.setOptions(updatedOptions);
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
