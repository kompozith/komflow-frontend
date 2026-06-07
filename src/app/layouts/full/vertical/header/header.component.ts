import { Component, Output, EventEmitter, Input, ViewEncapsulation, OnInit, OnDestroy, inject } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { MatDialog } from '@angular/material/dialog';
import { navItems } from '../sidebar/sidebar-data';
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

interface apps {
  id: number;
  img: string;
  title: string;
  subtitle: string;
  link: string;
}

interface quicklinks {
  id: number;
  title: string;
  link: string;
}

@Component({
    selector: 'app-header',
    imports: [
        RouterModule,
        CommonModule,
        NgScrollbarModule,
        TablerIconsModule,
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


  @Input() showToggle = true;
  @Input() toggleChecked = false;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleMobileFilterNav = new EventEmitter<void>();
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
      link: '/theme-pages/account-setting',
    },
    {
      id: 2,
      img: '/assets/images/svgs/icon-lifebuoy.svg',
      title: 'Help Center',
      subtitle: 'FAQ and guidance',
      link: '/theme-pages/faq',
    },
    {
      id: 3,
      img: '/assets/images/svgs/icon-tasks.svg',
      title: 'User Management',
      subtitle: 'Users and access',
      link: '/user-management',
    },
  ];

  apps: apps[] = [
    {
      id: 1,
      img: '/assets/images/svgs/icon-dd-mobile.svg',
      title: 'Contacts',
      subtitle: 'Manage recipients',
      link: '/contacts',
    },
    {
      id: 2,
      img: '/assets/images/svgs/icon-dd-message-box.svg',
      title: 'Messages',
      subtitle: 'Templates and content',
      link: '/messages',
    },
    {
      id: 3,
      img: '/assets/images/svgs/icon-dd-date.svg',
      title: 'Campaigns',
      subtitle: 'Plan and send',
      link: '/campaigns',
    },
    {
      id: 4,
      img: '/assets/images/svgs/icon-dd-application.svg',
      title: 'Tags',
      subtitle: 'Segmentation',
      link: '/tags',
    },
    {
      id: 5,
      img: '/assets/images/svgs/icon-dd-invoice.svg',
      title: 'Files',
      subtitle: 'Attachments library',
      link: '/files',
    },
    {
      id: 6,
      img: '/assets/images/svgs/icon-dd-lifebuoy.svg',
      title: 'Audit Log',
      subtitle: 'Track activity',
      link: '/audit',
    },
    {
      id: 7,
      img: '/assets/images/svgs/icon-account.svg',
      title: 'Users',
      subtitle: 'People and roles',
      link: '/user-management',
    },
    {
      id: 8,
      img: '/assets/images/svgs/icon-lifebuoy.svg',
      title: 'Help',
      subtitle: 'FAQs and support',
      link: '/theme-pages/faq',
    },
  ];

  quicklinks: quicklinks[] = [
    {
      id: 1,
      title: 'All Contacts',
      link: '/contacts',
    },
    {
      id: 2,
      title: 'Message Templates',
      link: '/messages',
    },
    {
      id: 3,
      title: 'Campaigns',
      link: '/campaigns',
    },
    {
      id: 4,
      title: 'Tags',
      link: '/tags',
    },
    {
      id: 5,
      title: 'User Management',
      link: '/user-management',
    },
    {
      id: 6,
      title: 'Files',
      link: '/files',
    },
    {
      id: 7,
      title: 'Audit Log',
      link: '/audit',
    },
    {
      id: 8,
      title: 'Settings',
      link: '/theme-pages/account-setting',
    },
  ];
}

@Component({
    selector: 'search-dialog',
    imports: [RouterModule, MaterialModule, TablerIconsModule, FormsModule],
    templateUrl: 'search-dialog.component.html'
})
export class AppSearchDialogComponent {
  searchText: string = '';
  navItems = navItems;

  navItemsData = navItems.filter((navitem) => navitem.displayName);
}
