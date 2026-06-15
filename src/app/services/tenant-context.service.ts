import { Injectable } from '@angular/core';
import { AUTH_CONFIG } from '../features/authentication/auth.constants';

/**
 * Décode le JWT stocké localement et expose l'organizationId du tenant courant.
 * Aucune dépendance externe (pas de bibliothèque JWT côté client nécessaire).
 */
@Injectable({ providedIn: 'root' })
export class TenantContextService {

  /** Retourne l'organizationId du tenant courant, ou null si non disponible. */
  getOrganizationId(): number | null {
    const payload = this.decodeJwtPayload();
    if (!payload) return null;
    const orgId = payload['organizationId'];
    return orgId != null ? Number(orgId) : null;
  }

  /** Retourne le payload décodé du JWT (partie claims), ou null en cas d'erreur. */
  private decodeJwtPayload(): Record<string, unknown> | null {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY)
                ?? sessionStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    if (!token) return null;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      // atob est sûr ici : on ne trusts pas le contenu, on lit juste un claim interne
      const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(json) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
