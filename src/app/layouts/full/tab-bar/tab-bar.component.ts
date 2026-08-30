import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { AccessControlService } from 'src/app/services/access-control.service';
import { WorkspaceService } from 'src/app/features/organization/services/workspace.service';

export interface TabBarItem {
  displayName: string;
  iconName: string;
  route: string;
  roles?: string[];
  permissions?: string[];
}

/**
 * In-scope product features only — this deliberately does not mirror the
 * full sidebar-data.ts template nav (dashboards/forms/charts/etc. are demo
 * scaffolding, not part of the product).
 */
export const TAB_BAR_ITEMS: TabBarItem[] = [
  { displayName: 'Contacts', iconName: 'phone', route: 'contacts', permissions: ['CONTACT_LIST'] },
  { displayName: 'Messages', iconName: 'message-2', route: 'messages', permissions: ['MESSAGE_LIST'] },
  { displayName: 'Campaigns', iconName: 'send', route: 'campaigns', permissions: ['CAMPAIGN_LIST'] },
  { displayName: 'Events', iconName: 'calendar-event', route: 'events', permissions: ['MESSAGE_LIST'] },
  { displayName: 'Tags', iconName: 'tag', route: 'tags', permissions: ['TAG_LIST'] },
  { displayName: 'Files', iconName: 'file', route: 'files' },
  { displayName: 'Settings', iconName: 'settings', route: 'organization' },
];

@Component({
  selector: 'app-tab-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, TablerIconsModule],
  templateUrl: './tab-bar.component.html',
  styleUrl: './tab-bar.component.scss',
})
export class TabBarComponent {
  private accessControlService = inject(AccessControlService);
  workspaceService = inject(WorkspaceService);

  items = computed(() =>
    TAB_BAR_ITEMS.filter((item) => this.hasAccess(item)),
  );

  private hasAccess(item: TabBarItem): boolean {
    if (!item.roles && !item.permissions) {
      return true;
    }
    return this.accessControlService.canAccess({ roles: item.roles, permissions: item.permissions });
  }
}
