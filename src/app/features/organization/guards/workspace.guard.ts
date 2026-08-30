import { inject } from '@angular/core';
import { CanActivateChildFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { WorkspaceService } from '../services/workspace.service';

/**
 * Ensures we know whether the logged-in user has at least one workspace.
 * Never blocks navigation itself — FullComponent shows a non-dismissible
 * "create workspace" modal on top of the app whenever
 * WorkspaceService.needsWorkspace() is true, which this guard makes sure
 * gets a chance to become true/false as soon as possible after login.
 */
export const workspaceGuard: CanActivateChildFn = () => {
  const workspaceService = inject(WorkspaceService);

  if (workspaceService.hasCheckedWorkspaces()) {
    return true;
  }

  return workspaceService.loadMyWorkspaces().pipe(
    map(() => true),
    // Do not block navigation on a transient network error — the modal
    // simply won't show until the next successful check.
    catchError(() => of(true)),
  );
};
