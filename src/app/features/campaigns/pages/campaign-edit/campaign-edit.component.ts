import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CampaignService } from '../../services/campaign.service';
import { MessageService } from 'src/app/features/messages/services/message.service';
import { TagService } from 'src/app/features/tags/services/tag.service';
import { ContactService } from 'src/app/features/contacts/services/contact.service';
import { Message, MessagePage, MessageChannel } from 'src/app/features/messages/models/message';
import { Tag, TagPage } from 'src/app/features/tags/models/tag';
import { Contact, ContactPage } from 'src/app/features/contacts/models/contact';
import { Campaign, CampaignStatus, CreateCampaignRequest } from '../../models/campaign';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-campaign-edit',
  templateUrl: './campaign-edit.component.html',
  styleUrls: [],
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
]
})
export class CampaignEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private campaignService = inject(CampaignService);
  private messageService = inject(MessageService);
  private tagService = inject(TagService);
  private contactService = inject(ContactService);

  campaignForm: FormGroup;
  isSubmitting = false;
  isLoading = true;
  campaignId = '';
  currentStatus: CampaignStatus | null = null;

  messages: Message[] = [];
  tags: Tag[] = [];
  contacts: Contact[] = [];

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
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
    this.campaignId = this.route.snapshot.params['id'];
    if (!this.campaignId) {
      this.snackBar.open('Campaign id is missing', 'Close', { duration: 3000 });
      this.router.navigate(['/campaigns']);
      return;
    }

    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.isLoading = true;
    forkJoin({
      editability: this.campaignService.getCampaignEditability(this.campaignId),
      campaign: this.campaignService.getCampaignById(this.campaignId),
      messages: this.messageService.getMessages(),
      tags: this.tagService.getTags(),
      contacts: this.contactService.getContacts()
    }).subscribe({
      next: ({ editability, campaign, messages, tags, contacts }) => {
        this.currentStatus = campaign.status;
        if (!editability.editable) {
          this.snackBar.open(editability.reason || 'This campaign is not editable', 'Close', { duration: 5000 });
          this.router.navigate(['/campaigns/details', this.campaignId]);
          return;
        }

        this.messages = messages.content;
        this.tags = tags.content;
        this.contacts = contacts.content;
        this.populateForm(campaign);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading campaign edit data:', error);
        this.snackBar.open('Error loading campaign', 'Close', { duration: 3000 });
        this.router.navigate(['/campaigns']);
      }
    });
  }

  private populateForm(campaign: Campaign): void {
    this.campaignForm.patchValue({
      name: campaign.name ?? '',
      description: campaign.description ?? '',
      messageId: campaign.message?.id ?? campaign.messageId ?? '',
      contactIds: campaign.contactIds ?? [],
      tagIds: campaign.tagIds ?? [],
      mailCcContactIds: campaign.mailCcContactIds ?? [],
      mailCciContactIds: campaign.mailCciContactIds ?? [],
      mailCcTagIds: campaign.mailCcTagIds ?? [],
      mailCciTagIds: campaign.mailCciTagIds ?? [],
      scheduledAt: campaign.scheduledAt ? new Date(campaign.scheduledAt) : null
    });
  }

  getSelectedMessageChannel(): MessageChannel | null {
    const messageId = this.campaignForm.get('messageId')?.value;
    if (!messageId) return null;
    const selectedMessage = this.messages.find(msg => msg.id === messageId);
    return selectedMessage?.channel || null;
  }


  onSubmit(): void {
    if (this.campaignForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    this.campaignService.getCampaignEditability(this.campaignId).subscribe({
      next: (editability) => {
        if (!editability.editable) {
          this.snackBar.open(editability.reason || 'This campaign is not editable', 'Close', { duration: 5000 });
          this.isSubmitting = false;
          return;
        }

        const payload: CreateCampaignRequest = {
          name: this.campaignForm.value.name,
          description: this.campaignForm.value.description,
          messageId: this.campaignForm.value.messageId,
          contactIds: this.campaignForm.value.contactIds || [],
          tagIds: this.campaignForm.value.tagIds || [],
          mailCcIds: this.campaignForm.value.mailCcContactIds || [],
          mailCciIds: this.campaignForm.value.mailCciContactIds || [],
          mailCcTagIds: this.campaignForm.value.mailCcTagIds || [],
          mailCciTagIds: this.campaignForm.value.mailCciTagIds || [],
          status: this.currentStatus || CampaignStatus.DRAFT,
          scheduledAt: this.campaignForm.value.scheduledAt
            ? new Date(this.campaignForm.value.scheduledAt).toISOString()
            : undefined
        };

        this.campaignService.updateCampaign(this.campaignId, payload).subscribe({
          next: () => {
            this.snackBar.open('Campaign updated successfully', 'Close', { duration: 3000 });
            this.router.navigate(['/campaigns/details', this.campaignId]);
          },
          error: (error) => {
            console.error('Error updating campaign:', error);
            const message = error?.error?.message || 'Error updating campaign';
            this.snackBar.open(message, 'Close', { duration: 5000 });
            this.isSubmitting = false;
          }
        });
      },
      error: (error) => {
        console.error('Error checking campaign editability:', error);
        this.snackBar.open('Unable to validate campaign status for edit', 'Close', { duration: 5000 });
        this.isSubmitting = false;
      }
    });
  }
}
