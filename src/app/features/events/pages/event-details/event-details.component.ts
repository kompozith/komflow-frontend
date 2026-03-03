import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from 'src/app/material.module';
import { AppEvent, EventMode, EventService } from 'src/app/features/core/services/event.service';
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
  private eventId = 0;

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
}
