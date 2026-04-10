import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from 'src/app/material.module';
import {
  AppEvent,
  EventMode,
  EventRegistrationWorkflowStep,
  EventService,
  EventWorkflowConditionType,
  EventWorkflowRecipientType,
} from 'src/app/features/core/services/event.service';
import { DeleteEventDialogComponent } from '../../components/delete-event-dialog/delete-event-dialog.component';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './event-details.component.html',
  styleUrl: './event-details.component.scss',
})
export class EventDetailsComponent implements OnInit {
  event: AppEvent | null = null;
  loading = true;
  eventId = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.eventId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.eventId) {
      this.router.navigate(['/events']);
      return;
    }
    this.loadEvent();
  }

  deleteEvent(): void {
    if (!this.event) return;

    const dialogRef = this.dialog.open(DeleteEventDialogComponent, {
      width: '560px',
      data: { event: this.event },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.event === 'Delete') {
        this.router.navigate(['/events']);
      }
    });
  }

  getModeLabel(mode?: EventMode | null): string {
    return mode === 'ONLINE' ? 'En ligne' : 'Sur site';
  }

  getPublicEventUrl(): string | null {
    if (!this.event?.slug) {
      return null;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/event/${this.event.slug}`;
  }

  copyPublicLink(): void {
    const link = this.getPublicEventUrl();
    if (!link) {
      this.snackBar.open('Slug manquant: lien public indisponible', 'Fermer', { duration: 2500 });
      return;
    }

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(link).then(
        () => this.snackBar.open('Lien public copie', 'Fermer', { duration: 2000 }),
        () => this.snackBar.open('Impossible de copier le lien', 'Fermer', { duration: 2500 })
      );
      return;
    }

    this.snackBar.open('Copie non supportee dans ce navigateur', 'Fermer', { duration: 2500 });
  }

  getWorkflowSteps(): EventRegistrationWorkflowStep[] {
    return this.event?.registrationWorkflowSteps ?? [];
  }

  hasWorkflow(): boolean {
    return this.getWorkflowSteps().length > 0;
  }

  getWorkflowStepLabel(step: EventRegistrationWorkflowStep): string {
    switch (step.stepType) {
      case 'DELAY':
        return `Attendre ${step.delayMinutes ?? 0} minute(s)`;
      case 'CONDITION':
        return this.getConditionLabel(step.conditionType);
      case 'SEND_MESSAGE':
      default:
        return step.messageTitle || 'Envoyer un message';
    }
  }

  getWorkflowStepMeta(step: EventRegistrationWorkflowStep): string {
    switch (step.stepType) {
      case 'DELAY':
        return 'Pause avant la suite du workflow';
      case 'CONDITION':
        return `Verification sur ${this.getRecipientLabel(step.recipientType)}`;
      case 'SEND_MESSAGE':
      default:
        return [step.messageChannel || '', this.getRecipientLabel(step.recipientType)].filter(Boolean).join(' - ');
    }
  }

  getWorkflowBadgeClass(step: EventRegistrationWorkflowStep): string {
    switch (step.stepType) {
      case 'DELAY':
        return 'bg-light-warning text-warning';
      case 'CONDITION':
        return 'bg-light-info text-info';
      case 'SEND_MESSAGE':
      default:
        return 'bg-light-success text-success';
    }
  }

  getWorkflowStepIcon(step: EventRegistrationWorkflowStep): string {
    switch (step.stepType) {
      case 'DELAY':
        return 'schedule';
      case 'CONDITION':
        return 'alt_route';
      case 'SEND_MESSAGE':
      default:
        return 'mark_email_read';
    }
  }

  editEvent(): void {
    if (!this.event?.id) {
      this.snackBar.open('Evenement invalide pour la modification', 'Fermer', { duration: 2500 });
      return;
    }
    this.router.navigate(['/events/edit', this.event.id]).then((navigated) => {
      if (!navigated) {
        this.snackBar.open('Navigation vers la modification impossible', 'Fermer', { duration: 2500 });
      }
    });
  }

  private loadEvent(): void {
    this.loading = true;
    this.eventService.getEventById(this.eventId).subscribe({
      next: (event) => {
        this.event = event;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Evenement introuvable', 'Fermer', { duration: 3000 });
        this.router.navigate(['/events']);
      },
    });
  }

  private getRecipientLabel(recipientType?: EventWorkflowRecipientType | null): string {
    switch (recipientType) {
      case 'ADMIN':
        return 'Admin';
      case 'REGISTRANT':
      default:
        return 'Participant';
    }
  }

  private getConditionLabel(conditionType?: EventWorkflowConditionType | null): string {
    switch (conditionType) {
      case 'CONTACT_HAS_PHONE':
        return 'Condition: le contact a un telephone';
      case 'CONTACT_HAS_EMAIL':
      default:
        return 'Condition: le contact a un email';
    }
  }
}
