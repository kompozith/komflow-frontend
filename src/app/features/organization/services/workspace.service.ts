import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AUTH_CONFIG } from '../../authentication/auth.constants';

// ── Types ─────────────────────────────────────────────────────────────────

export type WorkspaceRole   = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type MemberStatus    = 'INVITED' | 'ACTIVE' | 'SUSPENDED';

export interface WorkspaceSummary {
  orgId:    number;
  orgName:  string;
  orgSlug:  string;
  planCode: string;
  myRole:   WorkspaceRole;
  myStatus: MemberStatus;
  isOwner:  boolean;
}

export interface MemberDto {
  id:               number;
  orgId:            number;
  userId:           number;
  username:         string;
  email:            string;
  firstName:        string;
  lastName:         string;
  role:             WorkspaceRole;
  status:           MemberStatus;
  extraPermissions: string[];
  invitedEmail:     string;
  createdAt:        string;
}

export interface InviteMemberRequest {
  email:            string;
  role:             WorkspaceRole;
  extraPermissions?: string[];
}

export interface UpdateMemberRequest {
  role?:             WorkspaceRole;
  extraPermissions?: string[];
}

// ── Service ───────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  // ── Store réactif ────────────────────────────────────────────────────────
  readonly workspaces   = signal<WorkspaceSummary[]>([]);
  readonly activeOrgId  = signal<number | null>(this.readOrgIdFromToken());
  readonly activeWorkspace = computed(() =>
    this.workspaces().find(w => w.orgId === this.activeOrgId()) ?? null
  );

  // ── API calls ────────────────────────────────────────────────────────────

  loadMyWorkspaces(): Observable<WorkspaceSummary[]> {
    return this.http.get<WorkspaceSummary[]>(`${this.base}/workspaces`).pipe(
      tap(ws => this.workspaces.set(ws))
    );
  }

  createWorkspace(name: string, slug?: string): Observable<WorkspaceSummary> {
    return this.http.post<{ accessToken: string; workspace: WorkspaceSummary }>(
      `${this.base}/workspaces`, { name, slug }
    ).pipe(
      tap(resp => {
        this.replaceToken(resp.accessToken);
        this.activeOrgId.set(resp.workspace.orgId);
        this.workspaces.update(ws => [...ws, resp.workspace]);
      }),
      map(resp => resp.workspace)
    );
  }

  /**
   * Switche vers un autre espace.
   * Remplace le JWT stocké par le nouveau token (organizationId mis à jour).
   */
  switchWorkspace(orgId: number): Observable<{ accessToken: string; workspace: WorkspaceSummary }> {
    return this.http.post<{ accessToken: string; workspace: WorkspaceSummary }>(
      `${this.base}/workspaces/${orgId}/switch`, {}
    ).pipe(
      tap(resp => {
        this.replaceToken(resp.accessToken);
        this.activeOrgId.set(orgId);
        // Mettre à jour le store
        this.workspaces.update(ws =>
          ws.map(w => w.orgId === orgId ? resp.workspace : w)
        );
      })
    );
  }

  leaveWorkspace(orgId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/workspaces/${orgId}/leave`).pipe(
      tap(() => {
        this.workspaces.update(ws => ws.filter(w => w.orgId !== orgId));
        if (this.activeOrgId() === orgId) this.activeOrgId.set(null);
      })
    );
  }

  // ── Membres ──────────────────────────────────────────────────────────────

  listMembers(orgId: number): Observable<MemberDto[]> {
    return this.http.get<MemberDto[]>(`${this.base}/organizations/${orgId}/members`);
  }

  inviteMember(orgId: number, req: InviteMemberRequest): Observable<MemberDto> {
    return this.http.post<MemberDto>(`${this.base}/organizations/${orgId}/members/invite`, req);
  }

  updateMember(orgId: number, memberId: number, req: UpdateMemberRequest): Observable<MemberDto> {
    return this.http.put<MemberDto>(`${this.base}/organizations/${orgId}/members/${memberId}`, req);
  }

  revokeMember(orgId: number, memberId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/organizations/${orgId}/members/${memberId}`);
  }

  acceptInvitation(token: string): Observable<{ accessToken: string; workspace: WorkspaceSummary }> {
    return this.http.post<{ accessToken: string; workspace: WorkspaceSummary }>(
      `${this.base}/invitations/accept?token=${encodeURIComponent(token)}`, {}
    ).pipe(
      tap(resp => {
        this.replaceToken(resp.accessToken);
        this.activeOrgId.set(resp.workspace.orgId);
        this.workspaces.update(ws => [...ws, resp.workspace]);
      })
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private replaceToken(newToken: string): void {
    const key = AUTH_CONFIG.TOKEN_KEY;
    if (localStorage.getItem(key))     localStorage.setItem(key, newToken);
    if (sessionStorage.getItem(key)) sessionStorage.setItem(key, newToken);
  }

  private readOrgIdFromToken(): number | null {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY)
                ?? sessionStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload['organizationId'] ?? null;
    } catch { return null; }
  }
}
