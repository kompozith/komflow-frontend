import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthUser } from '../models/auth-user';
import { LoginRequest } from '../models/login-request';
import { LoginResponse } from '../models/login-response';
import { RegisterRequest } from '../models/register-request';
import { PasswordResetVerifyResponse } from '../models/password-reset-verify-response';
import { PasswordResetCompleteResponse } from '../models/password-reset-complete-response';
import { AUTH_API, AUTH_CONFIG } from '../auth.constants';
import { Router } from '@angular/router';
import { PermissionService } from '../../../services/permission.service';
import { WorkspaceService } from '../../organization/services/workspace.service';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumbers?: any[];
  permissions: string[];
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private permissionService = inject(PermissionService);
  private workspaceService = inject(WorkspaceService);

  private readonly API_BASE_URL = `${environment.apiUrl}/auth`;

  private currentUserSubject = new BehaviorSubject<AuthUser | null>(this.getSavedUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // Reference to any active auto-logout timer so we can clear/reset it when tokens update
  private logoutTimer: any | null = null;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    // Check token expiration on service initialization
    this.checkTokenExpiration();
  }

  private getDefaultHeaders(): { [key: string]: string } {
    return {
      'Content-Type': 'application/json',
      'accept': '*/*'
    };
  }

  /** Check whether an organization workspace slug is still available. */
  checkOrganizationSlugAvailability(slug: string): Observable<boolean> {
    const params = new HttpParams().set('slug', slug);
    return this.http
      .get<{ available: boolean }>(`${this.API_BASE_URL}/organizations/slug-availability`, { params })
      .pipe(map((response) => response.available));
  }

  /**
   * Register a new user and create their organisation.
   * On success, the session is set automatically (auto-login).
   */
  register(request: RegisterRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_BASE_URL}/signup`, request, {
      headers: this.getDefaultHeaders(),
      withCredentials: true
    }).pipe(
      tap(response => {
        this.setSession(response, false);
        if (response.permissions) {
          this.permissionService.updatePermissions(response.permissions.permissions);
          this.permissionService.updateRoles(response.permissions.roles);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Login user with email/phone and password
   */
  login(credentials: LoginRequest, rememberMe: boolean = false): Observable<LoginResponse> {
    const loginData = {
      login: credentials.emailOrPhone,
      password: credentials.password
    };

    return this.http.post<LoginResponse>(`${this.API_BASE_URL}/login`, loginData, {
      headers: this.getDefaultHeaders(),
      withCredentials: true
    }).pipe(
      tap(response => {
        this.setSession(response, rememberMe);
        // Set permissions and roles from login response
        if (response.permissions) {
          this.permissionService.updatePermissions(response.permissions.permissions);
          this.permissionService.updateRoles(response.permissions.roles);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Logout user and clear session.
   *
   * Sends a POST request to the backend to invalidate the server-side session/token.
   * Regardless of the HTTP result (success or failure) the client-side session is cleared
   * to ensure the user is logged out locally.
   */
  logout(): void {
    // Call backend logout endpoint. Use subscribe so callers don't need to change (keeps void signature).
    this.http.post(`${this.API_BASE_URL}/logout`, {}, { headers: this.getDefaultHeaders(), withCredentials: true }).pipe(
      tap(() => {
        // Successfully logged out on server (no-op here)
      }),
      catchError(err => {
        // Log the error but continue to clear client session
        console.error('Logout request failed:', err);
        // Return an observable so the stream completes and subscribe error handler runs.
        return throwError(() => err);
      })
    ).subscribe({
      next: () => {
        this.clearSession();
        this.currentUserSubject.next(null);
        this.isAuthenticatedSubject.next(false);
        // Clear permissions on logout
        this.clearPermissions();
        this.router.navigate(['/authentication/login']);
      },
      error: () => {
        // Even if the server call failed, ensure client session is cleared
        this.clearSession();
        this.currentUserSubject.next(null);
        this.isAuthenticatedSubject.next(false);
        // Clear permissions on logout
        this.clearPermissions();
      }
    });
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    const isAuth = this.isAuthenticatedSubject.value;
    return isAuth;
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get stored authentication token
   */
  getToken(): string | null {
    return this.getStorageItem(AUTH_CONFIG.TOKEN_KEY);
  }

  /**
   * Refresh token using refresh token in Authorization header
   */
  refreshToken(): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.API_BASE_URL}/refresh`,
      {},
      { headers: this.getDefaultHeaders(), withCredentials: true }
    ).pipe(
      tap(response => {
        this.updateAccessToken(response.accessToken, response.expiresIn);
        // Update permissions and roles from refresh response if available
        if (response.permissions) {
          this.permissionService.updatePermissions(response.permissions.permissions);
          this.permissionService.updateRoles(response.permissions.roles);
        }
      }),
      catchError(err => {
        this.logout();
        return throwError(() => new Error('Session expired. Please log in again.'));
      })
    );
  }

  /**
   * Initiate password reset (Step 1)
   * - Checks whether the contact exists and triggers backend to send OTP.
   * - contactType expected values: 'PHONE' | 'EMAIL' (match backend enum).
   */
  initiatePasswordReset(contact: string, contactType: 'PHONE' | 'EMAIL' = 'PHONE'): Observable<any> {
    const body = { contact, contactType };
    return this.http.post<any>(`${this.API_BASE_URL}/password-reset/initiate`, body, { headers: this.getDefaultHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Verify password reset OTP (Step 2)
   * - Returns a reset token on successful verification.
   */
  verifyPasswordReset(contact: string, otpCode: string): Observable<PasswordResetVerifyResponse> {
    const body = { contact, otpCode };
    return this.http.post<PasswordResetVerifyResponse>(`${this.API_BASE_URL}/password-reset/verify`, body, { headers: this.getDefaultHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Complete password reset (Step 3)
   * - Consume the resetToken and set the new password.
   * - On success the user can then login with the new password.
   */
  completePasswordReset(resetToken: string, newPassword: string): Observable<PasswordResetCompleteResponse> {
    const body = { resetToken, newPassword };
    return this.http.post<PasswordResetCompleteResponse>(`${this.API_BASE_URL}/password-reset/complete`, body, { headers: this.getDefaultHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  private updateAccessToken(token: string, expiresIn: number): void {
    const rememberMe = this.getStorageItem(AUTH_CONFIG.REMEMBER_KEY) === 'true';
    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
    // Protect against invalid/missing expiresIn coming from backend - fallback to 1 hour
    const safeExpires = Number.isFinite(Number(expiresIn)) && Number(expiresIn) > 0 ? Number(expiresIn) : 3600;
    const expirationTime = Date.now() + safeExpires * 1000;
    storage.setItem(`${AUTH_CONFIG.TOKEN_KEY_EXPIRES}`, expirationTime.toString());

    this.isAuthenticatedSubject.next(true);

    // Reset auto logout timer using the safe value
    this.setupAutoLogout(safeExpires);
  }

  /**
   * Private methods
   */
  private setSession(response: LoginResponse, rememberMe: boolean): void {
    const storage = rememberMe ? localStorage : sessionStorage;

    // Tokens
    storage.setItem(AUTH_CONFIG.TOKEN_KEY, response.accessToken);
    // Refresh token is stored in HttpOnly cookie by backend

    // Workspace list — read the accessToken's organizationId claim (activeOrgId)
    // and store the workspace list alongside the token.
    this.workspaceService.activeOrgId.set(this.workspaceService.decodeOrgIdFromToken(response.accessToken));
    this.workspaceService.hydrateFromLogin(response.workspaces);

    // User - map backend user to AuthUser format
    const authUser: AuthUser = {
      id: response.user.email, // Email is the sole identifier
      firstName: response.user.firstName,
      lastName: response.user.lastName,
      email: response.user.email,
      phone: response.user.phoneNumbers?.[0]?.number, // Take first phone number if available
      role: response.permissions?.roles?.[0] || 'USER', // Use first role from permissions
      permissions: response.permissions?.permissions || [], // Set permissions
      accountStatus: 'ACTIVE', // Default status
      profilePicture: undefined
    };

    storage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(authUser));

    // Remember
    storage.setItem(AUTH_CONFIG.REMEMBER_KEY, rememberMe.toString());

    // Expiration - guard against missing/invalid expiresIn
    const safeExpires = Number.isFinite(Number(response.expiresIn)) && Number(response.expiresIn) > 0 ? Number(response.expiresIn) : 3600;
    const expirationTime = Date.now() + safeExpires * 1000;
    storage.setItem(`${AUTH_CONFIG.TOKEN_KEY_EXPIRES}`, expirationTime.toString());

    this.currentUserSubject.next(authUser);
    this.isAuthenticatedSubject.next(true);

    this.setupAutoLogout(safeExpires);
  }

  private clearSession(): void {
    // Clear both storages to be safe
    [localStorage, sessionStorage].forEach(storage => {
      storage.removeItem(AUTH_CONFIG.TOKEN_KEY);
      // Refresh token is HttpOnly cookie, cleared server-side on logout
      storage.removeItem(AUTH_CONFIG.USER_KEY);
      storage.removeItem(AUTH_CONFIG.REMEMBER_KEY);
      storage.removeItem(`${AUTH_CONFIG.TOKEN_KEY_EXPIRES}`);
    });
    this.workspaceService.clear();
  }

  private getSavedUser(): AuthUser | null {
    const userData = this.getStorageItem(AUTH_CONFIG.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  private hasValidToken(): boolean {
    const token = this.getToken();
    const expiration = this.getStorageItem(`${AUTH_CONFIG.TOKEN_KEY_EXPIRES}`);

    if (!token || !expiration) {
      return false;
    }

    const expirationTime = parseInt(expiration, 10);
    const isValid = Date.now() < expirationTime;
    return isValid;
  }

  private checkTokenExpiration(): void {
    // Calculate remaining time until token expiry and setup auto-logout for that remaining time.
    // If there is no token or the token is already expired, clear session state without calling
    // logout() which triggers a backend request. This avoids racing with a fresh login flow that
    // may run during app initialization.
    const token = this.getToken();
    const expiration = this.getStorageItem(`${AUTH_CONFIG.TOKEN_KEY_EXPIRES}`);

    if (!token || !expiration) {
      // No token found — ensure local subjects reflect signed-out state but don't call server logout.
      this.clearSession();
      this.currentUserSubject.next(null);
      this.isAuthenticatedSubject.next(false);
      return;
    }

    const expirationTime = parseInt(expiration, 10);
    const remainingMs = expirationTime - Date.now();

    if (remainingMs <= 0) {
      // Token already expired — clear session locally.
      this.clearSession();
      this.currentUserSubject.next(null);
      this.isAuthenticatedSubject.next(false);
      return;
    }

    // Setup auto-logout timer with remaining seconds (rounded up).
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    this.setupAutoLogout(remainingSeconds);
  }

  private setupAutoLogout(expiresIn: number): void {
    // Clear existing timer if present
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }

    // Ensure we use a sane default if expiresIn is invalid
    const safeExpires = Number.isFinite(Number(expiresIn)) && Number(expiresIn) > 0 ? Number(expiresIn) : 3600; // default 1 hour in seconds
    const ms = safeExpires * 1000; // Convert seconds to milliseconds

    this.logoutTimer = setTimeout(() => {
      this.logout();
    }, ms);
  }

  private getStorageItem(key: string): string | null {
    // Check both storages, prioritize localStorage for rememberMe users
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.status === 0 || error.error instanceof ErrorEvent) {
      errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
    } else {
      const apiError = error.error || {};
      const apiCode = typeof apiError.error === 'string' ? apiError.error : null;
      const apiMessage = typeof apiError.message === 'string' ? apiError.message : null;

      if (apiCode === 'INVALID_CREDENTIALS' || error.status === 401) {
        errorMessage = 'Identifiants incorrects.';
      } else if (error.status === 404) {
        errorMessage = apiMessage ?? 'Ressource introuvable.';
      } else if (error.status === 409) {
        errorMessage = apiMessage ?? 'Un compte avec ces informations existe déjà.';
      } else if (apiCode === 'ACCESS_DENIED' || error.status === 403) {
        errorMessage = 'Compte désactivé ou accès refusé.';
      } else if (apiMessage === 'INVALID_DATA') {
        errorMessage = 'Données invalides. Vérifiez le formulaire.';
      } else if (apiMessage) {
        errorMessage = apiMessage;
      } else {
        switch (error.status) {
          case 400: errorMessage = 'Requête invalide.'; break;
          case 429: errorMessage = 'Trop de tentatives. Réessayez plus tard.'; break;
          case 500: errorMessage = 'Erreur serveur. Réessayez plus tard.'; break;
          default:  errorMessage = `Erreur inattendue (${error.status}).`;
        }
      }
    }

    console.error('AuthService Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  private clearPermissions(): void {
    this.permissionService.clearPermissions();
    this.permissionService.clearRoles();
  }

  /**
   * Load user profile and permissions from backend
   */
  private loadUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${environment.apiUrl}/users/profile`).pipe(
      tap(profile => {
        // Set permissions in PermissionService
        this.permissionService.updatePermissions(profile.permissions);
      }),
      catchError(err => {
        console.error('Failed to load user profile:', err);
        // Clear permissions on error
        this.permissionService.clearPermissions();
        return throwError(() => err);
      })
    );
  }

  private loadUserPermissions(): Observable<any> {
    return this.permissionService.loadUserPermissions();
  }
}

