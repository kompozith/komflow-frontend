import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CampaignService } from '../../services/campaign.service';
import { MessageService } from 'src/app/features/messages/services/message.service';
import { TagService } from 'src/app/features/tags/services/tag.service';
import { ContactService } from 'src/app/features/contacts/services/contact.service';
import { Message, MessagePage, MessageChannel } from 'src/app/features/messages/models/message';
import { Tag, TagPage } from 'src/app/features/tags/models/tag';
import { Contact, ContactPage } from 'src/app/features/contacts/models/contact';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-campaign-create',
  templateUrl: './campaign-create.component.html',
  styleUrls: [],
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    RouterModule
  ]
})
export class CampaignCreateComponent implements OnInit {
  campaignForm: FormGroup;
  isSubmitting = false;

  messages: Message[] = [];
  tags: Tag[] = [];
  contacts: Contact[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private campaignService: CampaignService,
    private messageService: MessageService,
    private tagService: TagService,
    private contactService: ContactService
  ) {
    this.campaignForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      messageId: ['', Validators.required],
      contactIds: [[]],
      tagIds: [[]],
      mailCcContactIds: [[]],
      mailCciContactIds: [[]],
      mailCcTagIds: [[]],
      mailCciTagIds: [[]],
      scheduledAt: [null]
    });
  }

  ngOnInit(): void {
    this.loadMessages();
    this.loadTags();
    this.loadContacts();
  }

  loadContacts(): void {
    this.contactService.getContacts().subscribe({
      next: (response: ContactPage) => {
        this.contacts = response.content;
      },
      error: (error) => {
        console.error('Error loading contacts:', error);
        this.snackBar.open('Error loading contacts', 'Close', { duration: 3000 });
      }
    });
  }

  loadMessages(): void {
    this.messageService.getMessages().subscribe({
      next: (response: MessagePage) => {
        this.messages = response.content;
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.snackBar.open('Error loading messages', 'Close', { duration: 3000 });
      }
    });
  }

  loadTags(): void {
    this.tagService.getTags().subscribe({
      next: (response: TagPage) => {
        this.tags = response.content;
      },
      error: (error) => {
        console.error('Error loading tags:', error);
        this.snackBar.open('Error loading tags', 'Close', { duration: 3000 });
      }
    });
  }

  getSelectedMessageChannel(): MessageChannel | null {
    const messageId = this.campaignForm.get('messageId')?.value;
    if (!messageId) return null;

    const selectedMessage = this.messages.find(msg => msg.id === messageId);
    return selectedMessage?.channel || null;
  }

  onSubmit(): void {
    if (this.campaignForm.invalid) {
      return;
    }

    this.isSubmitting = true;

    const campaignData = {
      name: this.campaignForm.value.name,
      description: this.campaignForm.value.description,
      messageId: this.campaignForm.value.messageId,
      contactIds: this.campaignForm.value.contactIds || [],
      tagIds: this.campaignForm.value.tagIds || [],
      mailCcIds: this.campaignForm.value.mailCcContactIds || [],
      mailCciIds: this.campaignForm.value.mailCciContactIds || [],
      mailCcTagIds: this.campaignForm.value.mailCcTagIds || [],
      mailCciTagIds: this.campaignForm.value.mailCciTagIds || [],
      status: 'DRAFT',
      scheduledAt: this.campaignForm.value.scheduledAt
        ? new Date(this.campaignForm.value.scheduledAt).toISOString()
        : undefined
    };

    this.campaignService.createCampaign(campaignData).subscribe({
      next: (createdCampaign) => {
        this.snackBar.open('Campaign created successfully', 'Close', { duration: 3000 });
        this.router.navigate(['/campaigns/list']);
      },
      error: (error) => {
        console.error('Error creating campaign:', error);
        this.snackBar.open('Error creating campaign', 'Close', { duration: 3000 });
        this.isSubmitting = false;
      }
    });
  }
}