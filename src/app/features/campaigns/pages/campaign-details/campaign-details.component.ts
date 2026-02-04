import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { CampaignService } from '../../services/campaign.service';
import { CampaignDetails, CampaignEvent, CampaignStatus } from '../../models/campaign';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { BadgeComponent, BadgeVariant } from 'src/app/shared/components/badge/badge.component';
import { TablerIconsModule } from 'angular-tabler-icons';
import { SubmitCampaignDialogComponent } from 'src/app/features/campaigns/pages/campaign-details/submit-campaign-dialog.component';

@Component({
  selector: 'app-campaign-details',
  imports: [MaterialModule, CommonModule, BadgeComponent, TablerIconsModule, SubmitCampaignDialogComponent],
  templateUrl: './campaign-details.component.html',
  styleUrl: './campaign-details.component.scss'
})
export class CampaignDetailsComponent implements OnInit, OnDestroy {
  campaign: CampaignDetails | null = null;
  isLoading = true;
  isSubmitting = false;
  campaignId: number = 0;

  CampaignStatus = CampaignStatus;
  isStreaming = false;
  progress = { total: 0, processed: 0, success: 0, failed: 0 };
  liveLogs: { timestamp: string; type: string; message: string }[] = [];
  private eventSource: EventSource | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private campaignService: CampaignService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.campaignId = +this.route.snapshot.params['id'];
    this.loadCampaignDetails();
  }

  ngOnDestroy(): void {
    this.stopEventStream();
  }

  loadCampaignDetails(): void {
    this.isLoading = true;
    this.campaignService.getCampaignDetails(this.campaignId).subscribe({
      next: (campaign) => {
        this.campaign = campaign;
        this.isLoading = false;
        if (campaign.status === CampaignStatus.RUNNING) {
          this.startEventStream();
        }
      },
      error: (error) => {
        console.error('Error loading campaign details:', error);
        this.snackBar.open('Error loading campaign details', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  submitCampaign(): void {
    if (!this.campaign || this.campaign.status !== CampaignStatus.DRAFT || this.isSubmitting) return;

    const dialogRef = this.dialog.open(SubmitCampaignDialogComponent, {
      data: { campaignName: this.campaign.name }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.isSubmitting = true;
      this.resetDeliveryReport();
      this.campaignService.submitCampaign(this.campaignId).subscribe({
        next: (response) => {
          this.snackBar.open(response.message || 'Campaign submitted successfully', 'Close', { duration: 3000 });
          this.loadCampaignDetails();
          this.startEventStream();
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Error submitting campaign:', error);
          this.snackBar.open('Error submitting campaign', 'Close', { duration: 3000 });
          this.isSubmitting = false;
        }
      });
    });
  }

  canSubmit(): boolean {
    return this.campaign?.status === CampaignStatus.DRAFT;
  }

  get isInSubmission(): boolean {
    return this.isSubmitting || this.campaign?.status === CampaignStatus.RUNNING;
  }

  get hasDeliveryReport(): boolean {
    return this.progress.total > 0 || this.liveLogs.length > 0;
  }

  getStatusColor(status: CampaignStatus): BadgeVariant {
    switch (status) {
      case CampaignStatus.DRAFT: return 'secondary';
      case CampaignStatus.SCHEDULED: return 'info';
      case CampaignStatus.RUNNING: return 'warning';
      case CampaignStatus.PARTIAL_SUCCESS: return 'warning';
      case CampaignStatus.SUCCESS: return 'success';
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
      'PARTIAL_SUCCESS': 'bg-warning',
      'SUCCESS': 'bg-success',
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
      'PARTIAL_SUCCESS': 'alert-circle',
      'SUCCESS': 'check-circle',
      'COMPLETED': 'check-circle',
      'CANCELLED': 'x',
      'FAILED': 'alert-triangle'
    };
    return statusIcons[status] || 'circle';
  }

  getHighlightedContent(): string {
    if (!this.campaign) return '';
    let content = this.campaign.message.content;

    // Highlight variables in the content
    const variableRegex = /\{\{([^}]+)\}\}/g;
    content = content.replace(variableRegex, '<span class="variable-highlight">{{$1}}</span>');

    return content;
  }

  goBack(): void {
    this.router.navigate(['/campaigns/list']);
  }

  private startEventStream(): void {
    if (this.eventSource) {
      return;
    }

    this.eventSource = this.campaignService.getCampaignEvents(this.campaignId);
    this.isStreaming = true;

    const handleEvent = (event: MessageEvent) => {
      try {
        const payload: CampaignEvent = JSON.parse(event.data);
        this.applyEvent(payload);
      } catch (e) {
        console.warn('Failed to parse campaign event', e);
      }
    };

    this.eventSource.addEventListener('STARTED', handleEvent);
    this.eventSource.addEventListener('IN_PROGRESS', handleEvent);
    this.eventSource.addEventListener('SUCCESS', handleEvent);
    this.eventSource.addEventListener('FAILED', handleEvent);
    this.eventSource.addEventListener('COMPLETED', handleEvent);

    this.eventSource.onerror = () => {
      this.appendLog('ERROR', 'Connection lost. Retrying...', new Date().toISOString());
    };
  }

  private stopEventStream(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isStreaming = false;
    }
  }

  private resetDeliveryReport(): void {
    this.progress = { total: 0, processed: 0, success: 0, failed: 0 };
    this.liveLogs = [];
  }

  private applyEvent(event: CampaignEvent): void {
    if (event.total !== undefined) {
      this.progress.total = event.total;
    }
    if (event.processed !== undefined) {
      this.progress.processed = event.processed;
    }
    if (event.successCount !== undefined) {
      this.progress.success = event.successCount;
    }
    if (event.failureCount !== undefined) {
      this.progress.failed = event.failureCount;
    }

    if (event.type === 'SUCCESS') {
      this.appendLog('SUCCESS', this.formatContactMessage(event), event.timestamp);
    } else if (event.type === 'FAILED') {
      this.appendLog('FAILED', this.formatContactMessage(event), event.timestamp);
    } else if (event.type === 'STARTED') {
      this.appendLog('STARTED', `Campaign started. ${event.total ?? 0} recipients queued.`, event.timestamp);
    } else if (event.type === 'COMPLETED') {
      this.appendLog('COMPLETED', 'Campaign completed.', event.timestamp);
      if (this.campaign && event.status) {
        this.campaign.status = event.status;
      }
      this.stopEventStream();
    }
  }

  private formatContactMessage(event: CampaignEvent): string {
    const contactPart = event.contactId ? `Contact #${event.contactId}` : 'Contact';
    if (event.type === 'SUCCESS') {
      const recipient = event.recipient ? ` (${event.recipient})` : '';
      return `${contactPart} sent${recipient}.`;
    }
    return `${contactPart} failed${event.message ? `: ${event.message}` : '.'}`;
  }

  private appendLog(type: string, message: string, timestamp: string): void {
    this.liveLogs = [{ timestamp, type, message }, ...this.liveLogs].slice(0, 200);
  }
}
