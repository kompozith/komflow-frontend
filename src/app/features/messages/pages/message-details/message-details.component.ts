import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MessageService } from '../../services/message.service';
import { Message, MessageAttachment, MessageChannel, Variable } from '../../models/message';
import { BadgeComponent, BadgeVariant } from '../../../../shared/components/badge/badge.component';
import { normalizeVariableKey, renderTemplatePreviewHtml } from '../../utils/message-rich-text.util';
import { MediaPreviewService } from 'src/app/shared/services/media-preview.service';
import { SendTestDialogComponent } from '../../components/send-test-dialog/send-test-dialog.component';

@Component({
  selector: 'app-message-details',
  templateUrl: './message-details.component.html',
  styleUrls: ['./message-details.component.scss'],
  imports: [
    MaterialModule,
    TablerIconsModule,
    CommonModule,
    BadgeComponent,
  ],
})
export class MessageDetailsComponent implements OnInit {
  private sanitizer = inject(DomSanitizer);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private mediaPreviewService = inject(MediaPreviewService);

  message: Message | null = null;
  isLoading = false;
  messageId: string = '';
  variables: Variable[] = [];
  private failedPreviews = new Set<string>();
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

  // Enums for template
  MessageChannel = MessageChannel;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {}

  ngOnInit(): void {
    this.messageId = this.route.snapshot.params['id'];
    if (this.messageId) {
      this.loadVariables();
      this.loadMessage();
    }
  }

  loadVariables(): void {
    this.messageService.getVariables().subscribe({
      next: (variables) => {
        this.variables = variables;
      },
      error: (error) => {
        console.error('Error loading variables:', error);
        this.variables = [];
      }
    });
  }

  loadMessage(): void {
    this.isLoading = true;
    this.messageService.getMessageById(this.messageId).subscribe({
      next: (message) => {
        this.message = message;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading message:', error);
        this.snackBar.open('Error loading message', 'Close', { duration: 3000 });
        this.isLoading = false;
        this.router.navigate(['/messages']);
      }
    });
  }

  onEdit(): void {
    this.router.navigate(['/messages/edit', this.messageId]);
  }

  onBack(): void {
    this.router.navigate(['/messages']);
  }

  openSendTestDialog(): void {
    if (!this.message) return;
    this.dialog.open(SendTestDialogComponent, {
      width: '440px',
      data: { messageId: this.messageId, channel: this.message.channel },
    });
  }

  getChannelIcon(channel: MessageChannel): string {
    switch (channel) {
      case MessageChannel.EMAIL: return 'mail';
      case MessageChannel.SMS: return 'message-circle';
      case MessageChannel.WHATSAPP: return 'brand-whatsapp';
      default: return 'message';
    }
  }

  getChannelColor(channel: MessageChannel): BadgeVariant {
    switch (channel) {
      case MessageChannel.EMAIL: return 'info';
      case MessageChannel.SMS: return 'success';
      case MessageChannel.WHATSAPP: return 'warning';
      default: return 'primary';
    }
  }

  getChannelBadgeClass(channel: MessageChannel): string {
    switch (channel) {
      case MessageChannel.EMAIL: return 'bg-light-info text-info';
      case MessageChannel.SMS: return 'bg-light-success text-success';
      case MessageChannel.WHATSAPP: return 'bg-light-warning text-warning';
      default: return 'bg-light-primary text-primary';
    }
  }

  getHighlightedContent(): string {
    if (!this.message) return '';
    return renderTemplatePreviewHtml(this.message.content, (token) => this.getVariableValue(token), 'variable-highlight');
  }

  getDetectedVariables(): Variable[] {
    if (!this.message) return [];
    const detectedKeys = new Set<string>();

    const regex = /\{\{[^{}]+\}\}/g;
    let match;
    while ((match = regex.exec(this.message.content)) !== null) {
      detectedKeys.add(this.normalizeVariableKey(match[0]));
    }

    return this.variables.filter(v => detectedKeys.has(this.normalizeVariableKey(v.key)));
  }

  getAttachments(): MessageAttachment[] {
    return this.message?.attachments ?? [];
  }

  openAttachment(attachment: MessageAttachment): void {
    if (!attachment?.url) return;
    this.mediaPreviewService.openInNewTab(attachment.url);
  }

  isImageAttachment(attachment: MessageAttachment): boolean {
    const value = `${attachment?.name ?? ''} ${attachment?.url ?? ''}`.toLowerCase();
    return /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/.test(value);
  }

  isPdfAttachment(attachment: MessageAttachment): boolean {
    const value = `${attachment?.name ?? ''} ${attachment?.url ?? ''}`.toLowerCase();
    return /\.pdf($|\?)/.test(value);
  }

  getPdfPreviewUrl(attachment: MessageAttachment): SafeResourceUrl {
    const baseUrl = attachment?.url ?? '';
    const separator = baseUrl.includes('?') ? '&' : '#';
    return this.sanitizer.bypassSecurityTrustResourceUrl(`${baseUrl}${separator}toolbar=0&navpanes=0&scrollbar=0`);
  }

  markPreviewFailed(attachment: MessageAttachment): void {
    this.failedPreviews.add(this.getAttachmentKey(attachment));
  }

  hasPreviewFailed(attachment: MessageAttachment): boolean {
    return this.failedPreviews.has(this.getAttachmentKey(attachment));
  }

  getAttachmentIcon(attachment: MessageAttachment): string {
    const ext = this.getAttachmentExtension(attachment);
    if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) return 'description';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'table_chart';
    if (['ppt', 'pptx'].includes(ext)) return 'slideshow';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'folder_zip';
    if (['txt', 'md'].includes(ext)) return 'article';
    if (ext === 'pdf') return 'picture_as_pdf';
    return 'insert_drive_file';
  }

  getAttachmentTypeLabel(attachment: MessageAttachment): string {
    const ext = this.getAttachmentExtension(attachment);
    return ext ? ext.toUpperCase() : 'FILE';
  }

  private getAttachmentKey(attachment: MessageAttachment): string {
    return `${attachment?.id ?? ''}|${attachment?.name ?? ''}|${attachment?.url ?? ''}`;
  }

  private normalizeVariableKey(key: string): string {
    return normalizeVariableKey(key);
  }

  private getVariableValue(variableKey: string): string {
    const key = this.normalizeVariableKey(variableKey);
    if (key.startsWith('{{event')) {
      if (!this.message?.event) {
        return '[Event requis]';
      }
      const lowered = key.toLowerCase();
      switch (key) {
        case '{{eventTitle}}':
          return this.message.event.title || '';
        case '{{eventStartDate}}':
          return this.message.event.startDate || '';
        case '{{eventStartTime}}':
          return this.normalizeTime(this.message.event.startTime);
        case '{{eventEndDate}}':
          return this.message.event.endDate || '';
        case '{{eventEndTime}}':
          return this.normalizeTime(this.message.event.endTime);
        case '{{eventLocation}}':
          return this.message.event.location || '';
        case '{{eventTimezone}}':
          return this.message.event.timezone || '';
        case '{{eventLocalTime}}':
          return this.formatEventDateTime(this.message.event.startDate, this.message.event.startTime, this.message.event.startAt);
        case '{{eventEndLocalTime}}':
          return this.formatEventDateTime(this.message.event.endDate, this.message.event.endTime, this.message.event.endAt);
        default:
          if (lowered === '{{eventtitle}}') return this.message.event.title || '';
          if (lowered === '{{eventstartdate}}') return this.message.event.startDate || '';
          if (lowered === '{{eventstarttime}}') return this.normalizeTime(this.message.event.startTime);
          if (lowered === '{{eventenddate}}') return this.message.event.endDate || '';
          if (lowered === '{{eventendtime}}') return this.normalizeTime(this.message.event.endTime);
          if (lowered === '{{eventlocation}}') return this.message.event.location || '';
          if (lowered === '{{eventtimezone}}') return this.message.event.timezone || '';
          if (lowered === '{{eventlocaltime}}') return this.formatEventDateTime(this.message.event.startDate, this.message.event.startTime, this.message.event.startAt);
          if (lowered === '{{eventendlocaltime}}') return this.formatEventDateTime(this.message.event.endDate, this.message.event.endTime, this.message.event.endAt);
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

  getLinkedEventDateTime(): string {
    if (!this.message?.event) {
      return '';
    }
    return this.formatEventDateTime(this.message.event.startDate, this.message.event.startTime, this.message.event.startAt);
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

  private getAttachmentExtension(attachment: MessageAttachment): string {
    const value = (attachment?.name || attachment?.url || '').toLowerCase();
    const sanitized = value.split('?')[0].split('#')[0];
    const lastDot = sanitized.lastIndexOf('.');
    if (lastDot < 0 || lastDot === sanitized.length - 1) {
      return '';
    }
    return sanitized.substring(lastDot + 1);
  }

}
