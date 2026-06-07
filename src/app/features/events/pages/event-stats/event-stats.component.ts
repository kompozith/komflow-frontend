import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { MaterialModule } from 'src/app/material.module';
import { EventRegistrationStatsComponent } from '../../components/event-registration-stats/event-registration-stats.component';
import { EventService } from 'src/app/features/core/services/event.service';

@Component({
  selector: 'app-event-stats',
  standalone: true,
  imports: [RouterModule, MaterialModule, EventRegistrationStatsComponent],
  template: `
    @if (eventName) {
      <p class="text-muted f-s-13 mb-3 d-flex align-items-center gap-1">
        <mat-icon class="f-s-16">event</mat-icon>
        {{ eventName }}
      </p>
    }
    <app-event-registration-stats [eventId]="eventId"></app-event-registration-stats>
  `,
})
export class EventStatsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private eventService = inject(EventService);

  eventId   = 0;
  eventName = '';

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngOnInit(): void {
    this.eventId = Number(this.route.snapshot.paramMap.get('id')) || 0;
    if (this.eventId) {
      this.eventService.getEventById(this.eventId).subscribe({
        next: e => this.eventName = e.title,
        error: () => { /* silencieux, le nom est optionnel */ },
      });
    }
  }
}
