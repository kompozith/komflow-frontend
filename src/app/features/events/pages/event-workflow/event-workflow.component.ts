
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from 'src/app/material.module';
import { AppEvent, CreateEventRequest, EventService } from 'src/app/features/core/services/event.service';
import { EventFormComponent } from '../../components/event-form/event-form.component';

@Component({
  selector: 'app-event-workflow',
  standalone: true,
  imports: [MaterialModule, EventFormComponent],
  templateUrl: './event-workflow.component.html',
})
export class EventWorkflowComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventService = inject(EventService);
  private snackBar = inject(MatSnackBar);

  event: AppEvent | null = null;
  loading = true;
  saving = false;
  private eventId = 0;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngOnInit(): void {
    this.eventId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.eventId) {
      this.router.navigate(['/events']);
      return;
    }
    this.loadEvent();
  }

  update(payload: CreateEventRequest): void {
    if (!this.eventId) return;

    this.saving = true;
    this.eventService.updateEvent(this.eventId, payload).subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open("Workflow d'inscription mis a jour", 'Fermer', { duration: 2500 });
        this.router.navigate(['/events/details', this.eventId]);
      },
      error: () => {
        this.saving = false;
        this.snackBar.open("Echec de mise a jour du workflow", 'Fermer', { duration: 3000 });
      },
    });
  }

  cancel(): void {
    if (!this.eventId) {
      this.router.navigate(['/events']);
      return;
    }
    this.router.navigate(['/events/details', this.eventId]);
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
}
