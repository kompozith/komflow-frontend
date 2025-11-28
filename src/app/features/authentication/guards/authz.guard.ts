import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AccessControlService } from '../../../services/access-control.service';

@Injectable({
  providedIn: 'root'
})
export class AuthzGuard implements CanActivate, CanActivateChild {
  constructor(
    private accessControlService: AccessControlService,
    private router: Router
  ) {}

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
        // Redirect to access denied page or login
        this.router.navigate(['/authentication/login']);
        return false;
      }
    }

    return true;
  }
}