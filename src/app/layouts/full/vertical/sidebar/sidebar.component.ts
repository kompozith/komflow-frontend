import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { BrandingComponent } from './branding.component';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { WorkspaceSwitcherComponent } from 'src/app/shared/components/workspace-switcher/workspace-switcher.component';

@Component({
    selector: 'app-sidebar',
    imports: [BrandingComponent, TablerIconsModule, MaterialModule, WorkspaceSwitcherComponent],
    templateUrl: './sidebar.component.html'
})
export class SidebarComponent implements OnInit {
  constructor() { }
  @Input() showToggle = true;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  ngOnInit(): void { }
}