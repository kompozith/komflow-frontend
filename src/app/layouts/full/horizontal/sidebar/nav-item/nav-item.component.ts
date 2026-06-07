import { Component, OnInit, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NavService } from '../../../../../services/nav.service';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-horizontal-nav-item',
    imports: [TablerIconsModule, CommonModule, MatIconModule],
    templateUrl: './nav-item.component.html'
})
export class AppHorizontalNavItemComponent implements OnInit {
  navService = inject(NavService);
  router = inject(Router);

  @Input() depth: any;
  @Input() item: any;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    if (this.depth === undefined) {
      this.depth = 0;
    }
  }

  ngOnInit() { }
  onItemSelected(item: any) {
    if (!item.children || !item.children.length) {
      this.router.navigate([item.route]);
    }
  }
}
