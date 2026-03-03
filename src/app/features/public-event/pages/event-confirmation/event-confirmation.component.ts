import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';

@Component({
  selector: 'app-event-confirmation',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './event-confirmation.component.html',
  styleUrl: './event-confirmation.component.scss',
})
export class EventConfirmationComponent implements OnInit {
  slug = '';
  status = 'UPDATED';
  email = '';
  name = '';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.slug = this.route.snapshot.params['slug'] || 'komflow-growth-summit-2026';
    this.status = this.route.snapshot.queryParamMap.get('status') || 'UPDATED';
    this.email = this.route.snapshot.queryParamMap.get('email') || '';
    this.name = this.route.snapshot.queryParamMap.get('name') || '';
  }

  backToEvent(): void {
    this.router.navigate(['/event', this.slug]);
  }
}

