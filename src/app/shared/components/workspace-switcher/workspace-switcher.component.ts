import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WorkspaceService, WorkspaceSummary } from 'src/app/features/organization/services/workspace.service';

const ROLE_COLORS: Record<string, string> = {
  OWNER:  '#6366f1',
  ADMIN:  '#0ea5e9',
  MEMBER: '#22c55e',
  VIEWER: '#94a3b8',
};

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Propriétaire', ADMIN: 'Admin', MEMBER: 'Membre', VIEWER: 'Lecteur',
};

@Component({
  selector: 'app-workspace-switcher',
  standalone: true,
  imports: [CommonModule, MaterialModule, TablerIconsModule, RouterModule],
  templateUrl: './workspace-switcher.component.html',
  styleUrl: './workspace-switcher.component.scss',
})
export class WorkspaceSwitcherComponent implements OnInit {
  readonly service = inject(WorkspaceService);
  private router   = inject(Router);
  private snackBar = inject(MatSnackBar);

  get active(): WorkspaceSummary | null { return this.service.activeWorkspace(); }
  get activeWorkspaces()  { return this.service.workspaces().filter(w => w.myStatus === 'ACTIVE'); }
  get pendingWorkspaces() { return this.service.workspaces().filter(w => w.myStatus === 'INVITED'); }
  get activeInitials(): string { return this.initials(this.active?.orgName ?? '?'); }
  get activeColor(): string    { return this.roleColor(this.active?.myRole ?? 'MEMBER'); }

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
        // Recharger la page entière pour que tous les composants reconstruisent
        // leurs données depuis le backend avec le nouveau JWT/organizationId
        setTimeout(() => window.location.reload(), 600);
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

  roleColor(role: string): string { return ROLE_COLORS[role] ?? '#94a3b8'; }
  roleLabel(role: string): string { return ROLE_LABELS[role] ?? role; }
}
