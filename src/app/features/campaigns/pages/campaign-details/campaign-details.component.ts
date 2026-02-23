import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { CampaignService } from '../../services/campaign.service';
import { CampaignDetails, CampaignEvent, CampaignMessageAttachment, CampaignStatus, CampaignSubmissionReport } from '../../models/campaign';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { BadgeComponent, BadgeVariant } from 'src/app/shared/components/badge/badge.component';
import { TablerIconsModule } from 'angular-tabler-icons';
import { SubmitCampaignDialogComponent } from 'src/app/features/campaigns/pages/campaign-details/submit-campaign-dialog.component';
import { ScheduleCampaignDialogComponent, ScheduleCampaignDialogData } from 'src/app/features/campaigns/pages/campaign-details/schedule-campaign-dialog.component';

@Component({
  selector: 'app-campaign-details',
  imports: [MaterialModule, CommonModule, BadgeComponent, TablerIconsModule, SubmitCampaignDialogComponent, ScheduleCampaignDialogComponent],
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
  reportAvailable = false;
  private eventSource: EventSource | null = null;
  private readonly mockUserValues: Record<string, string> = {
    '{{firstName}}': 'Alice',
    '{{lastName}}': 'Johnson',
    '{{email}}': 'alice.johnson@example.com',
    '{{language}}': 'fr',
    '{{country}}': 'France',
    '{{city}}': 'Paris',
    '{{contactId}}': '1024',
    '{{contactEnabled}}': 'true',
    '{{username}}': 'alice.j',
    '{{phoneNumber}}': '+33 6 12 34 56 78',
    '{{whatsappNumber}}': '+33 6 12 34 56 78',
  };

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
        this.hydrateReportFromCampaign(campaign);
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

  canSchedule(): boolean {
    return this.campaign?.status === CampaignStatus.DRAFT || this.campaign?.status === CampaignStatus.SCHEDULED;
  }

  canCancelSchedule(): boolean {
    return this.campaign?.status === CampaignStatus.SCHEDULED;
  }

  canEditCampaign(): boolean {
    if (!this.campaign) return false;

    if (this.campaign.status === CampaignStatus.DRAFT) {
      return true;
    }

    if (this.campaign.status === CampaignStatus.SCHEDULED && this.campaign.scheduledAt) {
      return new Date(this.campaign.scheduledAt).getTime() > Date.now();
    }

    return false;
  }

  isScheduled(): boolean {
    return this.campaign?.status === CampaignStatus.SCHEDULED;
  }

  editCampaign(): void {
    if (!this.campaign || !this.canEditCampaign()) return;
    this.router.navigate(['/campaigns/edit', this.campaign.id]);
  }

  openScheduleDialog(): void {
    if (!this.campaign || (!this.canSchedule() && !this.isScheduled())) return;

    const dialogData: ScheduleCampaignDialogData = {
      campaignId: this.campaign.id.toString(),
      campaignName: this.campaign.name,
      existingScheduledAt: this.campaign.scheduledAt
    };

    const dialogRef = this.dialog.open(ScheduleCampaignDialogComponent, {
      data: dialogData,
      width: '500px'
    });

    dialogRef.afterClosed().subscribe((result: { scheduledAt: string } | undefined) => {
      if (!result?.scheduledAt) return;

      this.campaignService.scheduleCampaign({
        campaignId: this.campaign!.id.toString(),
        scheduledAt: result.scheduledAt
      }).subscribe({
        next: (updatedCampaign) => {
          this.campaign = updatedCampaign as unknown as CampaignDetails;
          this.snackBar.open('Campaign scheduled successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error scheduling campaign:', error);
          this.snackBar.open('Error scheduling campaign', 'Close', { duration: 3000 });
        }
      });
    });
  }

  cancelSchedule(): void {
    if (!this.campaign || !this.canCancelSchedule() || this.isSubmitting) return;

    const dialogRef = this.dialog.open(SubmitCampaignDialogComponent, {
      data: { campaignName: this.campaign.name }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.isSubmitting = true;
      this.campaignService.cancelSchedule(this.campaignId).subscribe({
        next: (response) => {
          this.snackBar.open(response.message || 'Campaign schedule cancelled successfully', 'Close', { duration: 3000 });
          this.loadCampaignDetails();
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Error cancelling campaign schedule:', error);
          const errorMessage = error.error?.message || error.error?.error || 'Error cancelling campaign schedule';
          this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
          this.isSubmitting = false;
        }
      });
    });
  }

  get isInSubmission(): boolean {
    return this.isSubmitting || this.campaign?.status === CampaignStatus.RUNNING;
  }

  get hasDeliveryReport(): boolean {
    return this.reportAvailable || this.progress.total > 0 || this.liveLogs.length > 0;
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
      'RUNNING': 'player-play',
      'PARTIAL_SUCCESS': 'alert-circle',
      'SUCCESS': 'check',
      'COMPLETED': 'check',
      'CANCELLED': 'x',
      'FAILED': 'alert-triangle'
    };
    return statusIcons[status] || 'circle';
  }

  getHighlightedContent(): string {
    if (!this.campaign) return '';
    return this.campaign.message.content.replace(/\{\{[^{}]+\}\}/g, (token) => {
      const normalizedKey = this.normalizeVariableKey(token);
      const value = this.getVariableValue(normalizedKey);
      return `<span class="variable-highlight" title="${this.escapeHtml(normalizedKey)}">${this.escapeHtml(value)}</span>`;
    });
  }

  private normalizeVariableKey(key: string): string {
    const trimmed = (key || '').trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('{{') && trimmed.endsWith('}}')) {
      return trimmed;
    }
    return `{{${trimmed}}}`;
  }

  private getVariableValue(variableKey: string): string {
    const key = this.normalizeVariableKey(variableKey);
    if (key.startsWith('{{event')) {
      const linkedEvent = this.campaign?.message?.event;
      if (!linkedEvent) {
        return '[Event requis]';
      }
      const lowered = key.toLowerCase();
      switch (key) {
        case '{{eventTitle}}':
          return linkedEvent.title || '';
        case '{{eventStartDate}}':
          return linkedEvent.startDate || '';
        case '{{eventStartTime}}':
          return this.normalizeTime(linkedEvent.startTime);
        case '{{eventEndDate}}':
          return linkedEvent.endDate || '';
        case '{{eventEndTime}}':
          return this.normalizeTime(linkedEvent.endTime);
        case '{{eventLocation}}':
          return linkedEvent.location || '';
        case '{{eventTimezone}}':
          return linkedEvent.timezone || '';
        case '{{eventLocalTime}}':
          return this.formatEventDateTime(linkedEvent.startDate, linkedEvent.startTime, linkedEvent.startAt);
        case '{{eventEndLocalTime}}':
          return this.formatEventDateTime(linkedEvent.endDate, linkedEvent.endTime, linkedEvent.endAt);
        default:
          if (lowered === '{{eventtitle}}') return linkedEvent.title || '';
          if (lowered === '{{eventstartdate}}') return linkedEvent.startDate || '';
          if (lowered === '{{eventstarttime}}') return this.normalizeTime(linkedEvent.startTime);
          if (lowered === '{{eventenddate}}') return linkedEvent.endDate || '';
          if (lowered === '{{eventendtime}}') return this.normalizeTime(linkedEvent.endTime);
          if (lowered === '{{eventlocation}}') return linkedEvent.location || '';
          if (lowered === '{{eventtimezone}}') return linkedEvent.timezone || '';
          if (lowered === '{{eventlocaltime}}') return this.formatEventDateTime(linkedEvent.startDate, linkedEvent.startTime, linkedEvent.startAt);
          if (lowered === '{{eventendlocaltime}}') return this.formatEventDateTime(linkedEvent.endDate, linkedEvent.endTime, linkedEvent.endAt);
          return '[Variable event]';
      }
    }
    return this.mockUserValues[key] ?? `[${key}]`;
  }

  private formatEventDateTime(date?: string | null, time?: string | null, fallback?: string | null): string {
    if (date && time) {
      return `${date} ${this.normalizeTime(time)}`;
    }
    return this.formatDateTime(fallback);
  }

  private normalizeTime(value?: string | null): string {
    if (!value) return '';
    return value.length >= 5 ? value.slice(0, 5) : value;
  }

  private formatDateTime(value?: string | null): string {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString('fr-FR');
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  getMessageAttachments(): CampaignMessageAttachment[] {
    return this.campaign?.message?.attachments ?? [];
  }

  openAttachment(attachment: CampaignMessageAttachment): void {
    if (!attachment?.url) return;
    window.open(attachment.url, '_blank', 'noopener');
  }

  isImageAttachment(attachment: CampaignMessageAttachment): boolean {
    const value = `${attachment?.name ?? ''} ${attachment?.url ?? ''}`.toLowerCase();
    return /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/.test(value);
  }

  goBack(): void {
    this.router.navigate(['/campaigns']);
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
    this.reportAvailable = false;
  }

  private applyEvent(event: CampaignEvent): void {
    this.reportAvailable = true;
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

  private hydrateReportFromCampaign(campaign: CampaignDetails): void {
    const report = (campaign.submissionReport ||
      campaign.deliveryReport ||
      (campaign as unknown as { report?: CampaignSubmissionReport }).report ||
      null);

    if (!report) {
      return;
    }

    this.reportAvailable = true;
    this.progress = {
      total: report.total ?? this.progress.total,
      processed: report.processed ?? this.progress.processed,
      success: report.success ?? this.progress.success,
      failed: report.failed ?? this.progress.failed
    };

    const rawLogs = report.logs || report.events || [];
    if (rawLogs.length > 0) {
      this.liveLogs = rawLogs
        .map((log) => ({
          timestamp: log.timestamp,
          type: log.type,
          message: log.message
        }))
        .filter((log) => log.timestamp && log.type && log.message)
        .slice(0, 200);
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
