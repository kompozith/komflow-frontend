import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EventFormComponent } from '../../components/event-form/event-form.component';
import { CreateEventRequest, EventService } from 'src/app/features/core/services/event.service';

@Component({
  selector: 'app-event-create',
  standalone: true,
  imports: [EventFormComponent],
  templateUrl: './event-create.component.html',
})
export class EventCreateComponent {
  saving = false;

  constructor(
    private eventService: EventService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  create(payload: CreateEventRequest): void {
    this.saving = true;
    this.eventService.createEvent(payload).subscribe({
      next: (created) => {
        this.saving = false;
        this.snackBar.open('Evenement cree avec succes', 'Fermer', { duration: 2500 });
        this.router.navigate(['/events/details', created.id]);
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Echec de creation de l evenement', 'Fermer', { duration: 3000 });
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/events']);
  }
}
