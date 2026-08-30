import {
  Component,
  Input,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TablerIconsModule } from 'angular-tabler-icons';
import { WorkspaceSwitcherComponent } from 'src/app/shared/components/workspace-switcher/workspace-switcher.component';
import { SidenavService } from '../../sidenav.service';
import { BrandingComponent } from './branding.component';

@Component({
    selector: 'app-sidebar',
    imports: [CommonModule, TablerIconsModule, WorkspaceSwitcherComponent, BrandingComponent],
    templateUrl: './sidebar.component.html'
})
export class SidebarComponent implements OnInit {
  sidenavService = inject(SidenavService);

  constructor() { }
  @Input() showToggle = true;

  ngOnInit(): void { }
}
