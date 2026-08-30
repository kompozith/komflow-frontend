import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from 'src/app/material.module';
import { AppEvent, EventService } from 'src/app/features/core/services/event.service';
import { DeleteEventDialogComponent } from '../../components/delete-event-dialog/delete-event-dialog.component';
import { WorkspaceService } from 'src/app/features/organization/services/workspace.service';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MaterialModule],
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss'],
})
export class EventListComponent implements OnInit {
  private eventService = inject(EventService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private workspaceService = inject(WorkspaceService);

  events: AppEvent[] = [];
  loading = false;
  searchText = '';
  displayedColumns: string[] = ['title', 'mode', 'publicLink', 'startDate', 'startTime', 'location', 'updatedAt', 'actions'];

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading = true;
    this.eventService.listEvents().subscribe({
      next: (events) => {
        this.events = events || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Erreur de chargement des evenements', 'Fermer', { duration: 3000 });
      },
    });
  }

  get filteredEvents(): AppEvent[] {
    const query = this.searchText.trim().toLowerCase();
    if (!query) {
      return this.events;
    }
    return this.events.filter((event) => {
      const when = `${event.startDate || ''} ${event.endDate || ''} ${event.startTime || ''} ${event.endTime || ''}`;
      return [event.title, event.mode, event.meetingUrl, event.location, event.address, when]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }

  getModeLabel(mode?: string | null): string {
    return mode === 'ONLINE' ? 'En ligne' : 'Sur site';
  }

  viewDetails(event: AppEvent): void {
    this.router.navigate(this.workspaceService.workspacePath('events', 'details', event.id));
  }

  viewStats(event: AppEvent): void {
    this.router.navigate(this.workspaceService.workspacePath('events', event.id, 'stats'));
  }

  edit(event: AppEvent): void {
    this.router.navigate(this.workspaceService.workspacePath('events', 'edit', event.id));
  }

  getPublicEventUrl(event: AppEvent): string | null {
    if (!event.slug) {
      return null;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/event/${event.slug}`;
  }

  copyPublicLink(event: AppEvent): void {
    const link = this.getPublicEventUrl(event);
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

  remove(event: AppEvent): void {
    const dialogRef = this.dialog.open(DeleteEventDialogComponent, {
      width: '560px',
      data: { event },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.event === 'Delete') {
        this.loadEvents();
      }
    });
  }
}
