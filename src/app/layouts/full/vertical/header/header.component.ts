import { Component, Output, EventEmitter, Input, ViewEncapsulation, OnInit, OnDestroy, inject } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { MatDialog } from '@angular/material/dialog';
import { TAB_BAR_ITEMS } from '../../tab-bar/tab-bar.component';
import { TranslateService } from '@ngx-translate/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { AppSettings } from 'src/app/config';
import { LogoutComponent } from 'src/app/features/authentication/pages/logout/logout.component';
import { UserProfileService } from 'src/app/services/user-profile.service';
import { WorkspaceService } from 'src/app/features/organization/services/workspace.service';
import { BrandingComponent } from '../sidebar/branding.component';

interface notifications {
  id: number;
  img: string;
  title: string;
  subtitle: string;
}

interface profiledd {
  id: number;
  img: string;
  title: string;
  subtitle: string;
  link: string;
}

@Component({
    selector: 'app-header',
    imports: [
        RouterModule,
        CommonModule,
        NgScrollbarModule,
        TablerIconsModule,
        BrandingComponent,
        MaterialModule,
    ],
    templateUrl: './header.component.html',
    encapsulation: ViewEncapsulation.None
})
export class HeaderComponent {
  private settings = inject(CoreService);
  private vsidenav = inject(CoreService);
  dialog = inject(MatDialog);
  private translate = inject(TranslateService);
  private userProfileService = inject(UserProfileService);
  workspaceService = inject(WorkspaceService);


  @Input() showToggle = true;
  @Input() toggleChecked = false;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  showFiller = false;

  public selectedLanguage: any;

  public languages: any[] = [
    {
      language: 'English',
      code: 'en',
      type: 'US',
      icon: '/assets/images/flag/icon-flag-en.svg',
    },
    {
      language: 'Français',
      code: 'fr',
      icon: '/assets/images/flag/icon-flag-fr.svg',
    },
  ];

  @Output() optionsChange = new EventEmitter<AppSettings>();

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
     const translate = this.translate;

     // Initialize language from saved preference or default to English
     const savedLanguage = this.settings.getLanguage();
     this.selectedLanguage = this.languages.find(lang => lang.code === savedLanguage) || this.languages[0];
     // Set default language and use saved language
     translate.setDefaultLang('en');
     translate.use(savedLanguage);
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

  get options() {
    return this.settings.getOptions();
  }

  openDialog() {
    const dialogRef = this.dialog.open(AppSearchDialogComponent);

    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }

  private emitOptions() {
    this.optionsChange.emit(this.options);
  }

  setlightDark(theme: string) {
    this.settings.setOptions({ theme });
    this.emitOptions();
  }

  changeLanguage(lang: any): void {
     this.translate.use(lang.code);
     this.settings.setLanguage(lang.code);
     this.selectedLanguage = lang;
     this.emitOptions();
   }

   getUserInitials(): string {
     return this.userProfileService.getUserInitials();
   }

   getUserProfileImage(): string | null {
     return this.userProfileService.getUserProfileImage();
   }

   getUserDisplayName(): string {
     return this.userProfileService.getUserDisplayName();
   }

   getUserEmail(): string {
     return this.userProfileService.getUserEmail();
   }

   getUserBadgeClass(): string {
     return this.userProfileService.getUserBadgeClass();
   }

  notifications: notifications[] = [
    {
      id: 1,
      img: '/assets/images/profile/user-1.jpg',
      title: 'Roman Joined thes Team!',
      subtitle: 'Congratulate him',
    },
    {
      id: 2,
      img: '/assets/images/profile/user-2.jpg',
      title: 'New message received',
      subtitle: 'Salma sent you new message',
    },
    {
      id: 3,
      img: '/assets/images/profile/user-3.jpg',
      title: 'New Payment received',
      subtitle: 'Check your earnings',
    },
    {
      id: 4,
      img: '/assets/images/profile/user-4.jpg',
      title: 'Jolly completed tasks',
      subtitle: 'Assign her new tasks',
    },
    {
      id: 5,
      img: '/assets/images/profile/user-5.jpg',
      title: 'Roman Joined the Team!',
      subtitle: 'Congratulatse him',
    },
  ];

  profiledd: profiledd[] = [
    {
      id: 1,
      img: '/assets/images/svgs/icon-account.svg',
      title: 'Settings',
      subtitle: 'Account preferences',
      link: 'organization',
    },
    {
      id: 2,
      img: '/assets/images/svgs/icon-tasks.svg',
      title: 'User Management',
      subtitle: 'Users and access',
      link: 'user-management',
    },
  ];
}

@Component({
    selector: 'search-dialog',
    imports: [RouterModule, MaterialModule, TablerIconsModule, FormsModule],
    templateUrl: 'search-dialog.component.html'
})
export class AppSearchDialogComponent {
  private workspaceService = inject(WorkspaceService);

  searchText: string = '';
  navItemsData = TAB_BAR_ITEMS.map((item) => ({
    displayName: item.displayName,
    iconName: item.iconName,
    routeLabel: item.route,
    routerLink: this.workspaceService.workspacePath(item.route),
  }));
}
