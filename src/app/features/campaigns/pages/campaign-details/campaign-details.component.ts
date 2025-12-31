import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CampaignService } from '../../services/campaign.service';
import { CampaignDetails, CampaignStatus } from '../../models/campaign';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { BadgeComponent, BadgeVariant } from 'src/app/shared/components/badge/badge.component';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
  selector: 'app-campaign-details',
  imports: [MaterialModule, CommonModule, BadgeComponent, TablerIconsModule],
  templateUrl: './campaign-details.component.html',
  styleUrl: './campaign-details.component.scss'
})
export class CampaignDetailsComponent implements OnInit {
  campaign: CampaignDetails | null = null;
  isLoading = true;
  isSubmitting = false;
  campaignId: number = 0;

  CampaignStatus = CampaignStatus;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private campaignService: CampaignService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.campaignId = +this.route.snapshot.params['id'];
    this.loadCampaignDetails();
  }

  loadCampaignDetails(): void {
    this.isLoading = true;
    this.campaignService.getCampaignDetails(this.campaignId).subscribe({
      next: (campaign) => {
        this.campaign = campaign;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading campaign details:', error);
        this.snackBar.open('Error loading campaign details', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  submitCampaign(): void {
    if (!this.campaign || this.campaign.status !== CampaignStatus.DRAFT) return;

    if (confirm(`Are you sure you want to submit the campaign "${this.campaign.name}"?`)) {
      this.isSubmitting = true;
      this.campaignService.submitCampaign(this.campaignId).subscribe({
        next: (response) => {
          this.snackBar.open(response.message || 'Campaign submitted successfully', 'Close', { duration: 3000 });
          this.loadCampaignDetails(); // Reload to update status
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Error submitting campaign:', error);
          this.snackBar.open('Error submitting campaign', 'Close', { duration: 3000 });
          this.isSubmitting = false;
        }
      });
    }
  }

  canSubmit(): boolean {
    return this.campaign?.status === CampaignStatus.DRAFT;
  }

  getStatusColor(status: CampaignStatus): BadgeVariant {
    switch (status) {
      case CampaignStatus.DRAFT: return 'secondary';
      case CampaignStatus.SCHEDULED: return 'info';
      case CampaignStatus.RUNNING: return 'warning';
      case CampaignStatus.COMPLETED: return 'success';
      case CampaignStatus.CANCELLED: return 'outline';
      case CampaignStatus.FAILED: return 'error';
      default: return 'outline';
    }
  }

  getStatusBadgeClass(status: CampaignStatus): string {
    const statusClasses: { [key: string]: string } = {
      'DRAFT': 'bg-secondary',
      'SCHEDULED': 'bg-info',
      'RUNNING': 'bg-warning',
      'COMPLETED': 'bg-success',
      'CANCELLED': 'bg-outline',
      'FAILED': 'bg-error'
    };
    return statusClasses[status] || 'bg-secondary';
  }

  getStatusIcon(status: CampaignStatus): string {
    const statusIcons: { [key: string]: string } = {
      'DRAFT': 'edit',
      'SCHEDULED': 'clock',
      'RUNNING': 'play',
      'COMPLETED': 'check-circle',
      'CANCELLED': 'x',
      'FAILED': 'alert-triangle'
    };
    return statusIcons[status] || 'circle';
  }

  goBack(): void {
    this.router.navigate(['/campaigns/list']);
  }
}
