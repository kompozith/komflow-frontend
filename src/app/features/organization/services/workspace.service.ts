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

const WORKSPACES_STORAGE_KEY = 'auth_workspaces';

// ── Service ───────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  // ── Store réactif ────────────────────────────────────────────────────────
  private readonly savedWorkspaces = this.readSavedWorkspaces();
  readonly workspaces   = signal<WorkspaceSummary[]>(this.savedWorkspaces ?? []);
  readonly activeOrgId  = signal<number | null>(this.readOrgIdFromToken());
  readonly activeWorkspace = computed(() =>
    this.workspaces().find(w => w.orgId === this.activeOrgId()) ?? null
  );

  /**
   * True once we know (from a login response, a completed /workspaces fetch,
   * or a restored session with a saved workspace list) whether the user has
   * zero workspaces — drives the blocking "create workspace" modal. Starts
   * `false` only for a brand-new session with nothing saved yet, so the
   * modal never flashes before that knowledge is available.
   */
  readonly hasCheckedWorkspaces = signal(this.savedWorkspaces !== null);
  readonly needsWorkspace = computed(
    () => this.hasCheckedWorkspaces() && this.workspaces().length === 0,
  );

  /**
   * Voluntary open request (e.g. "Créer un espace" in the workspace
   * switcher), separate from needsWorkspace — which reflects a real
   * blocking state the user can't dismiss. showCreateWorkspaceModal is the
   * single source FullComponent renders from; it's dismissible only when
   * the user already has at least one workspace.
   */
  private readonly createWorkspaceModalRequested = signal(false);
  readonly showCreateWorkspaceModal = computed(
    () => this.needsWorkspace() || this.createWorkspaceModalRequested(),
  );

  openCreateWorkspaceModal(): void {
    this.createWorkspaceModalRequested.set(true);
  }

  /** No-op while needsWorkspace() is true — that state is never dismissible. */
  closeCreateWorkspaceModal(): void {
    this.createWorkspaceModalRequested.set(false);
  }

  /** Called by AuthService right after login/register with the server's workspace list. */
  hydrateFromLogin(workspaces: WorkspaceSummary[] | undefined): void {
    this.workspaces.set(workspaces ?? []);
    this.hasCheckedWorkspaces.set(true);
    this.saveWorkspaces(workspaces ?? []);
  }

  /** Called by AuthService on logout/session clear. */
  clear(): void {
    this.workspaces.set([]);
    this.activeOrgId.set(null);
    this.hasCheckedWorkspaces.set(false);
    localStorage.removeItem(WORKSPACES_STORAGE_KEY);
    sessionStorage.removeItem(WORKSPACES_STORAGE_KEY);
  }

  // ── API calls ────────────────────────────────────────────────────────────

  loadMyWorkspaces(): Observable<WorkspaceSummary[]> {
    return this.http.get<WorkspaceSummary[]>(`${this.base}/workspaces`).pipe(
      tap(ws => {
        this.workspaces.set(ws);
        this.hasCheckedWorkspaces.set(true);
        this.saveWorkspaces(ws);
      })
    );
  }

  createWorkspace(name: string, slug?: string): Observable<WorkspaceSummary> {
    return this.http.post<{ accessToken: string; workspace: WorkspaceSummary }>(
      `${this.base}/workspaces`, { name, slug }
    ).pipe(
      tap(resp => {
        this.replaceToken(resp.accessToken);
        this.activeOrgId.set(resp.workspace.orgId);
        this.hasCheckedWorkspaces.set(true);
        this.workspaces.update(ws => {
          const next = [...ws, resp.workspace];
          this.saveWorkspaces(next);
          return next;
        });
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
        this.hasCheckedWorkspaces.set(true);
        this.workspaces.update(ws => {
          const next = [...ws, resp.workspace];
          this.saveWorkspaces(next);
          return next;
        });
      })
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private replaceToken(newToken: string): void {
    const key = AUTH_CONFIG.TOKEN_KEY;
    if (localStorage.getItem(key))     localStorage.setItem(key, newToken);
    if (sessionStorage.getItem(key)) sessionStorage.setItem(key, newToken);
  }

  /** Mirrors whichever storage AuthService is currently using for the token. */
  private saveWorkspaces(workspaces: WorkspaceSummary[]): void {
    const json = JSON.stringify(workspaces);
    const usesLocal = !!localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    const storage = usesLocal ? localStorage : sessionStorage;
    storage.setItem(WORKSPACES_STORAGE_KEY, json);
  }

  /** Returns null when nothing has been saved yet (distinct from an empty, but known, list). */
  private readSavedWorkspaces(): WorkspaceSummary[] | null {
    const raw = localStorage.getItem(WORKSPACES_STORAGE_KEY)
              ?? sessionStorage.getItem(WORKSPACES_STORAGE_KEY);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as WorkspaceSummary[];
    } catch {
      return null;
    }
  }

  private readOrgIdFromToken(): number | null {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY)
                ?? sessionStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    return token ? this.decodeOrgIdFromToken(token) : null;
  }

  /** Reads the organizationId claim from any JWT, e.g. a freshly-issued login token. */
  decodeOrgIdFromToken(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload['organizationId'] ?? null;
    } catch { return null; }
  }

  /**
   * Builds a router.navigate()-ready commands array prefixed with the active
   * workspace's slug, e.g. workspacePath('contacts', 'edit', id) ->
   * ['/', 'acme', 'contacts', 'edit', id]. Falls back to the slug-less root
   * when there is no active workspace yet (e.g. mid-onboarding).
   */
  workspacePath(...segments: (string | number)[]): (string | number)[] {
    const slug = this.activeWorkspace()?.orgSlug;
    return slug ? ['/', slug, ...segments] : ['/', ...segments];
  }
}
