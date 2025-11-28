import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CommonModule } from '@angular/common';
import { MessageService } from '../../services/message.service';
import { Message, MessageChannel, MessageType } from '../../models/message';
import { BadgeComponent, BadgeVariant } from '../../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-message-details',
  templateUrl: './message-details.component.html',
  styleUrls: [],
  imports: [
    MaterialModule,
    TablerIconsModule,
    CommonModule,
    BadgeComponent,
  ],
})
export class MessageDetailsComponent implements OnInit {
  message: Message | null = null;
  isLoading = false;
  messageId: string = '';

  // Enums for template
  MessageChannel = MessageChannel;
  MessageType = MessageType;

  constructor(
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.messageId = this.route.snapshot.params['id'];
    if (this.messageId) {
      this.loadMessage();
    }
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
        this.router.navigate(['/messages/list']);
      }
    });
  }

  onEdit(): void {
    this.router.navigate(['/messages/edit', this.messageId]);
  }

  onBack(): void {
    this.router.navigate(['/messages/list']);
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

  getTypeColor(type: MessageType): BadgeVariant {
    switch (type) {
      case MessageType.MARKETING: return 'info';
      case MessageType.TRANSACTIONAL: return 'success';
      case MessageType.NOTIFICATION: return 'warning';
      default: return 'primary';
    }
  }

}