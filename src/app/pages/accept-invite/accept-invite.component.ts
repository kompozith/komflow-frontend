import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { WorkspaceService } from '../../features/organization/services/workspace.service';

@Component({
  selector: 'app-accept-invite',
  standalone: true,
  imports: [CommonModule, MaterialModule, TablerIconsModule],
  template: `
    <div class="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <mat-card class="mat-elevation-z3 text-center" style="max-width:420px;width:100%;padding:2.5rem">

        @if (state() === 'loading') {
          <mat-spinner diameter="48" class="mx-auto mb-3"></mat-spinner>
          <p class="mat-body-1 text-muted">Vérification de l'invitation…</p>
        }

        @if (state() === 'success') {
          <i-tabler name="circle-check" class="text-success" style="font-size:3rem"></i-tabler>
          <h5 class="mat-headline-6 mt-3 mb-1">Invitation acceptée !</h5>
          <p class="mat-body-2 text-muted mb-3">
            Vous avez rejoint <strong>{{ orgName() }}</strong>.<br>
            Redirection en cours…
          </p>
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        }

        @if (state() === 'error') {
          <i-tabler name="circle-x" class="text-danger" style="font-size:3rem"></i-tabler>
          <h5 class="mat-headline-6 mt-3 mb-1">Invitation invalide</h5>
          <p class="mat-body-2 text-muted mb-3">{{ errorMsg() }}</p>
          <button mat-flat-button color="primary" routerLink="/authentication/login">
            Retour à la connexion
          </button>
        }

        @if (state() === 'notoken') {
          <i-tabler name="link-off" class="text-warning" style="font-size:3rem"></i-tabler>
          <h5 class="mat-headline-6 mt-3 mb-1">Lien incomplet</h5>
          <p class="mat-body-2 text-muted mb-3">Le lien d'invitation ne contient pas de jeton valide.</p>
          <button mat-flat-button color="primary" routerLink="/">Accueil</button>
        }

      </mat-card>
    </div>
  `,
})
export class AcceptInviteComponent implements OnInit {
  private route    = inject(ActivatedRoute);
  private router   = inject(Router);
  private wsService = inject(WorkspaceService);

  state    = signal<'loading' | 'success' | 'error' | 'notoken'>('loading');
  orgName  = signal('');
  errorMsg = signal('');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) { this.state.set('notoken'); return; }

    this.wsService.acceptInvitation(token).subscribe({
      next: (resp) => {
        this.orgName.set(resp.workspace.orgName);
        this.state.set('success');
        setTimeout(() => this.router.navigate(['/contacts']), 2000);
      },
      error: (err) => {
        this.state.set('error');
        this.errorMsg.set(err?.error?.message ?? 'Le jeton est expiré ou a déjà été utilisé.');
      },
    });
  }
}
