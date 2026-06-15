import { Injectable, inject } from '@angular/core';
import { CanActivate, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AccessControlService } from '../../../services/access-control.service';

@Injectable({
  providedIn: 'root'
})
export class AuthzGuard implements CanActivate, CanActivateChild {
  private accessControlService = inject(AccessControlService);
  private router = inject(Router);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    return this.checkAccess(route);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    return this.checkAccess(childRoute);
  }

  private checkAccess(route: ActivatedRouteSnapshot): boolean {
    const data = route.data;

    // Check if route has role/permission requirements
    if (data && (data['roles'] || data['permissions'])) {
      const hasAccess = this.accessControlService.canAccess({
        roles: data['roles'],
        permissions: data['permissions']
      });

      if (!hasAccess) {
        // Redirect to forbidden page (not login — avoids redirect loop for authenticated users)
        this.router.navigate(['/authentication/forbidden']);
        return false;
      }
    }

    return true;
  }
}