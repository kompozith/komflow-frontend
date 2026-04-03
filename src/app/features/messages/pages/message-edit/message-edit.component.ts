import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CommonModule } from '@angular/common';
import { MessageService } from '../../services/message.service';
import { Message, MessageAttachment, UpdateMessageRequest, MessageChannel } from '../../models/message';
import { MessageEditorComponent } from '../../components/message-editor/message-editor.component';
import { SendTestDialogComponent } from '../../components/send-test-dialog/send-test-dialog.component';
import { finalize } from 'rxjs/operators';
import { AppEvent, EventService } from '../../../core/services/event.service';
import { MediaPreviewService } from 'src/app/shared/services/media-preview.service';

@Component({
  selector: 'app-message-edit',
  templateUrl: './message-edit.component.html',
  styleUrls: [],
  imports: [
    MaterialModule,
    ReactiveFormsModule,
    FormsModule,
    TablerIconsModule,
    CommonModule,
    MessageEditorComponent,
  ],
})
export class MessageEditComponent implements OnInit {
  messageForm: FormGroup;
  isLoading = false;
  isSaving = false;
  isUploadingAttachment = false;
  message: Message | null = null;
  messageId: string = '';
  attachments: MessageAttachment[] = [];
  availableEvents: AppEvent[] = [];
  selectedEvent: AppEvent | null = null;
  // Enums for template
  MessageChannel = MessageChannel;
  private readonly eventVariableRegex = /\{\{event[^{}]+\}\}/i;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private eventService: EventService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private mediaPreviewService: MediaPreviewService
  ) {
    this.messageForm = this.fb.group({
      title: ['', [Validators.minLength(2), Validators.maxLength(100)]],
      content: ['', [Validators.required, Validators.maxLength(10000)]],
      channel: [MessageChannel.EMAIL, [Validators.required]],
      eventId: [null]
    });

    // Update title validators based on channel
    this.updateTitleValidators();

    // Subscribe to channel changes to update title validators
    this.messageForm.get('channel')?.valueChanges.subscribe(channel => {
      this.updateTitleValidators();
      if (channel !== MessageChannel.EMAIL) {
        this.attachments = [];
      }
    });
    this.messageForm.get('content')?.valueChanges.subscribe(() => {
      this.updateEventRequirement();
    });
    this.messageForm.get('eventId')?.valueChanges.subscribe(() => {
      this.syncSelectedEvent();
      this.updateEventRequirement();
    });
  }

  ngOnInit(): void {
    this.loadFutureEvents();
    this.messageId = this.route.snapshot.params['id'];
    if (this.messageId) {
      this.loadMessage();
    }
    this.syncSelectedEvent();
    this.updateEventRequirement();
  }

  private updateTitleValidators(): void {
    const channel = this.messageForm.get('channel')?.value;
    const titleControl = this.messageForm.get('title');

    if (channel === MessageChannel.EMAIL) {
      titleControl?.setValidators([Validators.required, Validators.minLength(2), Validators.maxLength(100)]);
    } else {
      titleControl?.setValidators([Validators.minLength(2), Validators.maxLength(100)]);
    }

    titleControl?.updateValueAndValidity();
  }

  loadMessage(): void {
    this.isLoading = true;
    this.messageService.getMessageById(this.messageId).subscribe({
      next: (message) => {
        this.message = message;
        this.populateForm(message);
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

  populateForm(message: Message): void {
    this.attachments = [...(message.attachments ?? [])];

    this.messageForm.patchValue({
      title: message.title,
      content: message.content,
      channel: message.channel,
      eventId: message.event?.id ?? null,
    });
    this.syncSelectedEvent();

    // Update validators based on the loaded channel
    this.updateTitleValidators();
    this.updateEventRequirement();
    this.loadFutureEvents();
  }

  hasEventVariables(): boolean {
    const content = this.messageForm.get('content')?.value || '';
    return this.eventVariableRegex.test(content);
  }

  private getSelectedEventFromControl(): AppEvent | null {
    const rawId = this.messageForm.get('eventId')?.value;
    if (rawId === null || rawId === undefined || rawId === '') {
      return null;
    }
    const eventId = Number(rawId);
    return this.availableEvents.find(event => event.id === eventId) ?? this.message?.event ?? null;
  }

  private syncSelectedEvent(): void {
    this.selectedEvent = this.getSelectedEventFromControl();
  }

  private updateEventRequirement(): void {
    const eventControl = this.messageForm.get('eventId');
    if (!eventControl) {
      return;
    }

    if (this.hasEventVariables()) {
      eventControl.setValidators([Validators.required]);
    } else {
      eventControl.clearValidators();
    }
    eventControl.updateValueAndValidity({ emitEvent: false });
  }

  onSubmit(): void {
    if (this.messageForm.valid) {
      this.isSaving = true;
      const formValue = this.messageForm.value;

      const messageData: UpdateMessageRequest = {
        title: formValue.title,
        content: formValue.content,
        channel: formValue.channel,
        attachments: this.attachments,
        eventId: formValue.eventId ? Number(formValue.eventId) : null,
        // No custom variables, using API variables instead
      };

      this.messageService.updateMessage(this.messageId, messageData).subscribe({
        next: (message) => {
          this.snackBar.open('Message updated successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/messages']);
        },
        error: (error) => {
          console.error('Error updating message:', error);
          this.snackBar.open('Error updating message', 'Close', { duration: 3000 });
          this.isSaving = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/messages']);
  }

  openSendTestDialog(): void {
    const channel = this.messageForm.get('channel')?.value as MessageChannel;
    this.dialog.open(SendTestDialogComponent, {
      width: '440px',
      data: { messageId: this.messageId, channel },
    });
  }

  onAttachmentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) {
      return;
    }

    this.isUploadingAttachment = true;
    const selectedFiles = Array.from(files);
    let completed = 0;

    selectedFiles.forEach((file) => {
      this.messageService.uploadAttachment(file)
        .pipe(finalize(() => {
          completed += 1;
          if (completed === selectedFiles.length) {
            this.isUploadingAttachment = false;
            input.value = '';
          }
        }))
        .subscribe({
          next: (uploaded) => {
            this.attachments = [...this.attachments, uploaded];
          },
          error: (error) => {
            console.error('Error uploading attachment:', error);
            this.snackBar.open(`Upload failed for "${file.name}"`, 'Close', { duration: 3000 });
          }
        });
    });
  }

  removeAttachment(index: number): void {
    this.attachments = this.attachments.filter((_, i) => i !== index);
  }

  openAttachment(attachment: MessageAttachment): void {
    if (!attachment?.url) return;
    this.mediaPreviewService.openInNewTab(attachment.url);
  }

  isImageAttachment(attachment: MessageAttachment): boolean {
    const value = `${attachment?.name ?? ''} ${attachment?.url ?? ''}`.toLowerCase();
    return /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/.test(value);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.messageForm.controls).forEach(key => {
      const control = this.messageForm.get(key);
      control?.markAsTouched();
    });
  }

  private loadFutureEvents(): void {
    this.eventService.listFutureEvents().subscribe({
      next: (events) => {
        const currentEvent = this.message?.event;
        const merged = [...(events || [])];
        if (currentEvent && !merged.some(event => event.id === currentEvent.id)) {
          merged.push({
            id: currentEvent.id,
            title: currentEvent.title,
            description: currentEvent.description,
            location: currentEvent.location,
            startDate: currentEvent.startDate,
            startTime: currentEvent.startTime,
            endDate: currentEvent.endDate,
            endTime: currentEvent.endTime,
            startAt: currentEvent.startAt,
            endAt: currentEvent.endAt,
            timezone: currentEvent.timezone
          });
        }
        this.availableEvents = merged.sort((a, b) => this.getEventSortValue(a) - this.getEventSortValue(b));
        this.syncSelectedEvent();
        this.updateEventRequirement();
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.availableEvents = [];
        this.selectedEvent = this.message?.event ?? null;
      }
    });
  }

  getEventLabel(event: AppEvent): string {
    const parts = [event.startDate, this.normalizeTime(event.startTime)].filter(Boolean);
    return `${event.title} - ${parts.join(' ')}`;
  }

  private getEventSortValue(event: AppEvent): number {
    const datePart = event.startDate || '';
    const timePart = event.startTime || '00:00';
    const parsed = new Date(`${datePart}T${timePart}:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getTime();
    }
    if (event.startAt) {
      const fallback = new Date(event.startAt);
      if (!Number.isNaN(fallback.getTime())) {
        return fallback.getTime();
      }
    }
    return 0;
  }

  private normalizeTime(value?: string | null): string {
    if (!value) return '';
    return value.length >= 5 ? value.slice(0, 5) : value;
  }
}

