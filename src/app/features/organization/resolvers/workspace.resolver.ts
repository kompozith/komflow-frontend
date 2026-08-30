import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { WorkspaceService } from '../services/workspace.service';

/**
 * Reads `:workspaceSlug` from the URL and makes sure WorkspaceService's
 * active workspace matches it before the route activates — the technical
 * counterpart to workspaceGuard (which only loads the workspace list).
 *
 * Never blocks navigation: an unknown slug or a transient error redirects to
 * the user's actual active workspace (or to the slug-less landing route)
 * rather than stranding them on a dead route.
 */
export const workspaceResolver: ResolveFn<boolean> = (route) => {
  const workspaceService = inject(WorkspaceService);
  const router = inject(Router);

  const slug = route.paramMap.get('workspaceSlug');
  if (!slug) {
    return of(true);
  }

  const ready = workspaceService.hasCheckedWorkspaces()
    ? of(workspaceService.workspaces())
    : workspaceService.loadMyWorkspaces();

  return ready.pipe(
    switchMap((workspaces) => {
      const target = workspaces.find((w) => w.orgSlug === slug);

      if (!target) {
        redirectToKnownWorkspace(router, workspaceService);
        return of(false);
      }

      if (workspaceService.activeOrgId() === target.orgId) {
        return of(true);
      }

      return workspaceService.switchWorkspace(target.orgId).pipe(
        map(() => true),
        catchError(() => of(true)),
      );
    }),
    catchError(() => {
      redirectToKnownWorkspace(router, workspaceService);
      return of(false);
    }),
  );
};

function redirectToKnownWorkspace(router: Router, workspaceService: WorkspaceService): void {
  const fallbackSlug = workspaceService.activeWorkspace()?.orgSlug;
  router.navigate(fallbackSlug ? ['/', fallbackSlug, 'contacts'] : ['/']);
}
