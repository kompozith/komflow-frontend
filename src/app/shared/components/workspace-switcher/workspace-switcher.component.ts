import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DsMenuComponent } from 'src/app/shared/components/ui/ds-menu/ds-menu.component';
import { WorkspaceService, WorkspaceSummary } from 'src/app/features/organization/services/workspace.service';

/** Design-system color tokens (see tailwind.css), never raw hex — one per role. */
const ROLE_COLOR_CLASSES: Record<string, string> = {
  OWNER:  'tw:bg-primary',
  ADMIN:  'tw:bg-secondary',
  MEMBER: 'tw:bg-tertiary',
  VIEWER: 'tw:bg-error',
};

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Propriétaire', ADMIN: 'Admin', MEMBER: 'Membre', VIEWER: 'Lecteur',
};

@Component({
  selector: 'app-workspace-switcher',
  standalone: true,
  imports: [CommonModule, TablerIconsModule, RouterModule, DsMenuComponent],
  templateUrl: './workspace-switcher.component.html',
  styleUrl: './workspace-switcher.component.scss',
})
export class WorkspaceSwitcherComponent implements OnInit {
  /** 'dropdown' (default): today's trigger + Material menu. 'inline': always-visible list, for the sidebar panel. */
  @Input() mode: 'dropdown' | 'inline' = 'dropdown';

  readonly service = inject(WorkspaceService);
  private router   = inject(Router);
  private snackBar = inject(MatSnackBar);

  get active(): WorkspaceSummary | null { return this.service.activeWorkspace(); }
  get activeWorkspaces()  { return this.service.workspaces().filter(w => w.myStatus === 'ACTIVE'); }
  get pendingWorkspaces() { return this.service.workspaces().filter(w => w.myStatus === 'INVITED'); }
  get activeInitials(): string { return this.initials(this.active?.orgName ?? '?'); }
  get activeColorClass(): string { return this.roleColorClass(this.active?.myRole ?? 'MEMBER'); }

  ngOnInit(): void {
    if (this.service.workspaces().length === 0) {
      this.service.loadMyWorkspaces().subscribe();
    }
  }

  switchTo(ws: WorkspaceSummary): void {
    if (ws.orgId === this.service.activeOrgId()) return;
    this.service.switchWorkspace(ws.orgId).subscribe({
      next: () => {
        this.snackBar.open(`Espace « ${ws.orgName} » activé`, '✓', { duration: 1500 });
        // Navigate into the new workspace's slug-prefixed URL rather than
        // reloading — a hard reload would re-request the OLD slug's URL
        // under the NEW org's auth context, which is exactly the mismatch
        // the workspace-slug-in-URL design is meant to prevent.
        this.router.navigate(['/', ws.orgSlug, 'contacts']);
      },
      error: () => this.snackBar.open('Erreur lors du changement d\'espace', 'Fermer', { duration: 4000 }),
    });
  }

  goAccept(ws: WorkspaceSummary): void {
    this.router.navigate(['/accept-invite'], { queryParams: { orgId: ws.orgId } });
  }

  initials(name: string): string {
    return name.split(/\s+/).map(w => w[0]).join('').toUpperCase().substring(0, 2) || '?';
  }

  roleColorClass(role: string): string { return ROLE_COLOR_CLASSES[role] ?? 'tw:bg-outline'; }
  roleLabel(role: string): string { return ROLE_LABELS[role] ?? role; }
}
