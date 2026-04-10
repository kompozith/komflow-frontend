import { Injectable, inject, DOCUMENT, effect, signal } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';

/**
 * Service réutilisable qui lit les CSS custom properties du thème Material
 * et expose une palette de couleurs prêtes à l'emploi pour ApexCharts.
 *
 * S'abonne au signal de thème de CoreService afin de recalculer les couleurs
 * à chaque changement (light ↔ dark, changement de palette).
 */
@Injectable({ providedIn: 'root' })
export class ChartThemeService {

  private readonly document = inject(DOCUMENT);
  private readonly coreService = inject(CoreService);

  /** Signal réactif : se met à jour à chaque changement de thème. */
  readonly palette = signal<ChartPalette>(this.readPalette());

  constructor() {
    // Relit la palette à chaque fois que l'option de thème change
    effect(() => {
      // On consomme le signal de thème pour que l'effect se réabonne
      this.coreService.getOptions();
      // MutationObserver sur <html> aurait été plus propre, mais la lecture
      // différée suffira : l'effect se déclenche après la mise à jour du DOM
      // via requestAnimationFrame pour laisser Angular appliquer la classe
      requestAnimationFrame(() => {
        this.palette.set(this.readPalette());
      });
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Helpers publics
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Couleur ApexCharts pour la grille (stroke / gridBorderColor).
   * Légèrement transparent pour ne pas masquer les données.
   */
  get gridColor(): string {
    return this.palette().outline;
  }

  /**
   * Couleur du texte pour les labels d'axes et de légendes.
   */
  get labelColor(): string {
    return this.palette().onSurface;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Lecture des CSS vars
  // ──────────────────────────────────────────────────────────────────────────

  private readPalette(): ChartPalette {
    const el = this.document.documentElement;
    const read = (varName: string): string =>
      getComputedStyle(el).getPropertyValue(varName).trim();

    return {
      primary:          read('--mat-sys-primary'),
      secondary:        read('--mat-sys-secondary'),
      tertiary:         read('--mat-sys-tertiary'),
      error:            read('--mat-sys-error'),
      primaryContainer: read('--mat-sys-primary-container'),
      secondaryContainer: read('--mat-sys-secondary-container'),
      tertiaryContainer:  read('--mat-sys-tertiary-container'),
      errorContainer:   read('--mat-sys-error-container'),
      outline:          read('--mat-sys-outline-variant'),
      onSurface:        read('--mat-sys-on-surface-variant'),
      surface:          read('--mat-sys-surface-container-low'),
      // Palette complémentaire statique (cohérence visuelle indépendante du thème)
      success:          '#13DEB9',
      warning:          '#FFAE1F',
    };
  }

  /**
   * Retourne un tableau de couleurs multiseries cohérent avec le thème actuel.
   * Ordre : primary, tertiary, secondary, success, warning, error
   */
  seriesColors(): string[] {
    const p = this.palette();
    return [
      p.primary,
      p.tertiary,
      p.secondary,
      p.success,
      p.warning,
      p.error,
    ].filter(Boolean); // retire les valeurs vides (thème pas encore résolu)
  }
}

export interface ChartPalette {
  primary: string;
  secondary: string;
  tertiary: string;
  error: string;
  primaryContainer: string;
  secondaryContainer: string;
  tertiaryContainer: string;
  errorContainer: string;
  outline: string;
  onSurface: string;
  surface: string;
  success: string;
  warning: string;
}
