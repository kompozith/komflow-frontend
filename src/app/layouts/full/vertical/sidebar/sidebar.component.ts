import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { WorkspaceSwitcherComponent } from 'src/app/shared/components/workspace-switcher/workspace-switcher.component';
import { SidebarFiltersService } from './sidebar-filters.service';

@Component({
    selector: 'app-sidebar',
    imports: [CommonModule, TablerIconsModule, MaterialModule, WorkspaceSwitcherComponent],
    templateUrl: './sidebar.component.html'
})
export class SidebarComponent implements OnInit {
  filtersService = inject(SidebarFiltersService);

  constructor() { }
  @Input() showToggle = true;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  ngOnInit(): void { }
}