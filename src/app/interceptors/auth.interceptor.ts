import { Injectable, Injector, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from '../features/authentication/services/auth.service';
import { Router } from '@angular/router';
import { WorkspaceService } from '../features/organization/services/workspace.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private injector = inject(Injector);

  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Add authorization header to requests that don't already have one
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

    if (token && !request.headers.has('Authorization')) {
      request = this.addToken(request, token);
    }

    if (!this.isAuthEndpoint(request.url) && !request.headers.has('X-Workspace-Slug')) {
      const slug = this.injector.get(WorkspaceService).activeWorkspace()?.orgSlug;
      if (slug) {
        request = request.clone({ setHeaders: { 'X-Workspace-Slug': slug } });
      }
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (this.isAuthEndpoint(request.url)) {
          return throwError(() => error);
        }

        if (error.status === 401) {
          if (!token) {
            this.forceLogout();
            return throwError(() => error);
          }
          return this.handle401Error(request, next);
        }

        if (error.status === 403) {
          this.forceLogout();
          return throwError(() => error);
        }
        return throwError(() => error);
      })
    );
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private isAuthEndpoint(url: string): boolean {
    const clean = url.replace(/^https?:\/\/[^\/]+/, '');
    return clean.includes('/auth');
  }

  private forceLogout(): void {
    const auth = this.injector.get(AuthService);
    const router = this.injector.get(Router);
    auth.logout();
    router.navigate(['/authentication/login']);
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      // Get AuthService from injector to avoid circular dependency
      const authService = this.injector.get(AuthService);

      return authService.refreshToken().pipe(
        switchMap((tokenResponse: any) => {
          this.isRefreshing = false;
          const newToken = tokenResponse.accessToken;
          if (!newToken) {
            this.forceLogout();
            return throwError(() => new Error('No access token'));
          }
          this.refreshTokenSubject.next(newToken);
          return next.handle(this.addToken(request, newToken));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.error(err);
          this.forceLogout();
          return throwError(() => err);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(token => {
          return next.handle(this.addToken(request, token!));
        })
      );
    }
  }
}
