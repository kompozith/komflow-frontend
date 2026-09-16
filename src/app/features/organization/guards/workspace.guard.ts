import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChildFn, Router, UrlTree } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { WorkspaceService } from '../services/workspace.service';

/**
 * Guards both route trees:
 *
 * - Slug-less tree (no `:workspaceSlug`): only makes sure we know whether the
 *   logged-in user has at least one workspace, and never blocks navigation —
 *   FullComponent shows a non-dismissible "create workspace" modal on top of
 *   the app whenever WorkspaceService.needsWorkspace() is true.
 * - Workspace-prefixed tree: additionally checks `:workspaceSlug` against the
 *   user's workspaces and switches the active workspace to match it.
 *
 * An unknown slug or a transient error redirects to the user's actual active
 * workspace (or to the slug-less landing route) rather than stranding them on
 * a dead route. The redirect is returned as a UrlTree instead of being issued
 * with router.navigate() so the router owns the transition and can detect a
 * redirect cycle — an imperative navigate() from inside a guard/resolver is
 * invisible to that detection and freezes the browser instead of erroring.
 */
export const workspaceGuard: CanActivateChildFn = (childRoute) => {
  const workspaceService = inject(WorkspaceService);
  const router = inject(Router);

  const slug = readWorkspaceSlug(childRoute);

  const ready = workspaceService.hasCheckedWorkspaces()
    ? of(workspaceService.workspaces())
    : workspaceService.loadMyWorkspaces();

  if (!slug) {
    // Do not block navigation on a transient network error — the modal
    // simply won't show until the next successful check.
    return ready.pipe(
      map(() => true),
      catchError(() => of(true)),
    );
  }

  return ready.pipe(
    switchMap((workspaces) => {
      const target = workspaces.find((w) => w.orgSlug === slug);

      if (!target) {
        return of(fallbackUrl(router, workspaceService));
      }

      if (workspaceService.activeOrgId() === target.orgId) {
        return of(true);
      }

      return workspaceService.switchWorkspace(target.orgId).pipe(
        map(() => true),
        catchError(() => of(true)),
      );
    }),
    catchError(() => of(fallbackUrl(router, workspaceService))),
  );
};

/**
 * `:workspaceSlug` is declared on the parent route, and the default
 * `paramsInheritanceStrategy` ('emptyOnly') does not copy it onto the child
 * snapshot this guard receives, so walk up to find it.
 */
function readWorkspaceSlug(route: ActivatedRouteSnapshot | null): string | null {
  for (let current = route; current; current = current.parent) {
    const slug = current.paramMap.get('workspaceSlug');
    if (slug) {
      return slug;
    }
  }
  return null;
}

/**
 * Lands on the slug-less tree when there is no active workspace yet, which is
 * a terminal route: the guard above returns `true` for it instead of
 * redirecting again.
 */
function fallbackUrl(router: Router, workspaceService: WorkspaceService): UrlTree {
  const fallbackSlug = workspaceService.activeWorkspace()?.orgSlug;
  return router.createUrlTree(fallbackSlug ? ['/', fallbackSlug, 'contacts'] : ['/contacts']);
}
