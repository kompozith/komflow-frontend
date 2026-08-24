import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import {
  WorkspaceService,
  MemberDto,
  WorkspaceRole,
  InviteMemberRequest,
} from '../../services/workspace.service';
import { TenantContextService } from 'src/app/services/tenant-context.service';
import { BadgeComponent } from 'src/app/shared/components/badge/badge.component';
import { BadgeVariant } from 'src/app/shared/components/badge/badge.component';

const ROLE_BADGE: Record<WorkspaceRole, BadgeVariant> = {
  OWNER:  'purple',
  ADMIN:  'primary',
  MEMBER: 'success',
  VIEWER: 'secondary',
};

@Component({
  selector: 'app-members-page',
  standalone: true,
  imports: [CommonModule, MaterialModule, TablerIconsModule, ReactiveFormsModule, BadgeComponent],
  templateUrl: './members-page.component.html',
})
export class MembersPageComponent implements OnInit {
  private workspaceService = inject(WorkspaceService);
  private tenantCtx        = inject(TenantContextService);
  private snackBar         = inject(MatSnackBar);

  members  = signal<MemberDto[]>([]);
  loading  = signal(true);
  inviting = signal(false);
  showInviteForm = signal(false);

  roles: WorkspaceRole[] = ['ADMIN', 'MEMBER', 'VIEWER'];

  inviteForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    role:  new FormControl<WorkspaceRole>('MEMBER', [Validators.required]),
  });

  get orgId(): number { return this.tenantCtx.getOrganizationId()!; }

  roleBadge(role: WorkspaceRole): BadgeVariant { return ROLE_BADGE[role]; }

  statusIcon(status: string): string {
    return { ACTIVE: 'check', INVITED: 'mail', SUSPENDED: 'ban' }[status] ?? 'help-circle';
  }

  ngOnInit(): void {
    this.loadMembers();
  }

  loadMembers(): void {
    this.loading.set(true);
    this.workspaceService.listMembers(this.orgId).subscribe({
      next: (list) => { this.members.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  invite(): void {
    if (this.inviteForm.invalid) { this.inviteForm.markAllAsTouched(); return; }
    this.inviting.set(true);
    const req: InviteMemberRequest = {
      email: this.inviteForm.value.email!,
      role:  this.inviteForm.value.role!,
    };
    this.workspaceService.inviteMember(this.orgId, req).subscribe({
      next: (m) => {
        this.members.update(ms => [...ms, m]);
        this.inviting.set(false);
        this.showInviteForm.set(false);
        this.inviteForm.reset({ role: 'MEMBER' });
        this.snackBar.open(`Invitation envoyée à ${m.invitedEmail}`, '✓', { duration: 3000 });
      },
      error: (err) => {
        this.inviting.set(false);
        this.snackBar.open(err?.error?.message ?? 'Erreur lors de l\'invitation', 'Fermer', { duration: 5000 });
      },
    });
  }

  changeRole(member: MemberDto, role: WorkspaceRole): void {
    this.workspaceService.updateMember(this.orgId, member.id, { role }).subscribe({
      next: (updated) => {
        this.members.update(ms => ms.map(m => m.id === updated.id ? updated : m));
        this.snackBar.open('Rôle mis à jour', '✓', { duration: 2500 });
      },
      error: (err) => this.snackBar.open(err?.error?.message ?? 'Erreur', 'Fermer', { duration: 4000 }),
    });
  }

  revoke(member: MemberDto): void {
    if (!confirm(`Révoquer l'accès de ${this.displayName(member)} ?`)) return;
    this.workspaceService.revokeMember(this.orgId, member.id).subscribe({
      next: () => {
        this.members.update(ms => ms.map(m => m.id === member.id ? { ...m, status: 'SUSPENDED' } : m));
        this.snackBar.open('Accès révoqué', '✓', { duration: 2500 });
      },
      error: (err) => this.snackBar.open(err?.error?.message ?? 'Erreur', 'Fermer', { duration: 4000 }),
    });
  }

  displayName(m: MemberDto): string {
    return [m.firstName, m.lastName].filter(Boolean).join(' ') || m.email;
  }
}
