import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { NavigationStart, Router, provideRouter } from '@angular/router';
import { Observable, of } from 'rxjs';
import { routes } from './app.routes';
import { AuthService } from './features/authentication/services/auth.service';
import { AccessControlService } from './services/access-control.service';
import { PermissionService } from './services/permission.service';
import {
  WorkspaceService,
  WorkspaceSummary,
} from './features/organization/services/workspace.service';

const ACME: WorkspaceSummary = {
  orgId: 1,
  orgName: 'Acme',
  orgSlug: 'acme',
  planCode: 'FREE',
  myRole: 'OWNER',
  myStatus: 'ACTIVE',
  isOwner: true,
};

/**
 * Only the surface app.routes.ts and workspaceGuard read — enough to drive
 * route matching without HTTP.
 */
class FakeWorkspaceService {
  readonly workspaces = signal<WorkspaceSummary[]>([]);
  readonly activeOrgId = signal<number | null>(null);
  readonly activeWorkspace = computed(
    () => this.workspaces().find((w) => w.orgId === this.activeOrgId()) ?? null,
  );
  readonly hasCheckedWorkspaces = signal(true);

  loadMyWorkspaces(): Observable<WorkspaceSummary[]> {
    return of(this.workspaces());
  }

  switchWorkspace(orgId: number): Observable<unknown> {
    this.activeOrgId.set(orgId);
    return of({});
  }

  workspacePath(...segments: (string | number)[]): (string | number)[] {
    const slug = this.activeWorkspace()?.orgSlug;
    return slug ? ['/', slug, ...segments] : ['/', ...segments];
  }
}

describe('app routes', () => {
  let router: Router;
  let workspaceService: FakeWorkspaceService;
  let navigationStarts: string[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideLocationMocks(),
        { provide: WorkspaceService, useClass: FakeWorkspaceService },
        { provide: AuthService, useValue: { isAuthenticated: () => true } },
        { provide: AccessControlService, useValue: { canAccess: () => true } },
        {
          provide: PermissionService,
          useValue: { permissions$: of([]), hasAnyPermission: () => true },
        },
      ],
    });

    router = TestBed.inject(Router);
    workspaceService = TestBed.inject(WorkspaceService) as unknown as FakeWorkspaceService;

    navigationStarts = [];
    router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        navigationStarts.push(event.url);
      }
    });
  });

  it('settles on the slug-less tree when the user has no workspace yet', async () => {
    await router.navigateByUrl('/');

    expect(router.url).toBe('/contacts');
    // The regression: `/contacts` used to match `:workspaceSlug`, whose
    // resolver navigated back to `/`, looping until the browser froze.
    expect(navigationStarts.length).toBe(1);
  });

  it('does not read a section path as a workspace slug', async () => {
    workspaceService.workspaces.set([ACME]);
    workspaceService.activeOrgId.set(ACME.orgId);

    await router.navigateByUrl('/contacts');

    expect(router.url).toBe('/contacts');
    expect(navigationStarts.length).toBe(1);
  });

  it('sends a user who has a workspace to their prefixed tree from the root', async () => {
    workspaceService.workspaces.set([ACME]);
    workspaceService.activeOrgId.set(ACME.orgId);

    await router.navigateByUrl('/');

    expect(router.url).toBe('/acme/contacts');
    expect(navigationStarts.length).toBe(1);
  });

  it('keeps a valid workspace-prefixed url', async () => {
    workspaceService.workspaces.set([ACME]);
    workspaceService.activeOrgId.set(ACME.orgId);

    await router.navigateByUrl('/acme/contacts');

    expect(router.url).toBe('/acme/contacts');
    expect(navigationStarts.length).toBe(1);
  });

  it('redirects an unknown slug once instead of bouncing', async () => {
    await router.navigateByUrl('/not-a-workspace/contacts');

    expect(router.url).toBe('/contacts');
    // One redirect, not a cycle.
    expect(navigationStarts.length).toBe(2);
  });

  it('redirects an unknown slug to the active workspace when there is one', async () => {
    workspaceService.workspaces.set([ACME]);
    workspaceService.activeOrgId.set(ACME.orgId);

    await router.navigateByUrl('/not-a-workspace/contacts');

    expect(router.url).toBe('/acme/contacts');
    expect(navigationStarts.length).toBe(2);
  });
});
