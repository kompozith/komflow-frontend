// src/app/features/campaigns/models/campaign.ts

export interface CampaignRecipient {
  id: string;
  contactId: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  sentAt?: string;
  deliveredAt?: string;
  errorMessage?: string;
}

export interface CampaignMessageAttachment {
  id?: number;
  name: string;
  url: string;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  messageId: string;
  message?: {
    id: string;
    title: string;
    content: string;
    channel: string;
    createdAt: string;
    updatedAt: string;
    attachments?: CampaignMessageAttachment[];
    attachmentCount: number;
  };
  contactIds?: string[];
  tagIds: string[];
  mailCcContactIds?: string[];
  mailCciContactIds?: string[];
  mailCcTagIds?: string[];
  mailCciTagIds?: string[];
  status: CampaignStatus;
  scheduledAt?: string;
  sentAt?: string;
  completedAt?: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface CampaignPage {
  totalElements: number;
  totalPages: number;
  size: number;
  content: Campaign[];
  number: number;
  sort: any;
  numberOfElements: number;
  pageable: any;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface CampaignFilters {
  page?: number;
  size?: number;
  sort?: string[];
  status?: CampaignStatus;
  messageId?: string;
  tagId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  RUNNING = 'RUNNING',
  PARTIAL_SUCCESS = 'PARTIAL_SUCCESS',
  SUCCESS = 'SUCCESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED'
}

export type CampaignEventType = 'STARTED' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED' | 'COMPLETED';

export interface CampaignEvent {
  type: CampaignEventType;
  campaignId: number;
  timestamp: string;
  total?: number;
  processed?: number;
  successCount?: number;
  failureCount?: number;
  contactId?: number;
  recipient?: string;
  message?: string;
  status?: CampaignStatus;
}

export interface CampaignSubmissionLog {
  timestamp: string;
  type: string;
  message: string;
}

export interface CampaignSubmissionReport {
  total?: number;
  processed?: number;
  success?: number;
  failed?: number;
  logs?: CampaignSubmissionLog[];
  events?: CampaignSubmissionLog[];
}

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  messageId: string;
  contactIds?: string[];
  tagIds: string[];
  mailCcIds?: string[];
  mailCciIds?: string[];
  mailCcTagIds?: string[];
  mailCciTagIds?: string[];
  status?: string;
  scheduledAt?: string;
}

export interface UpdateCampaignRequest {
  name?: string;
  description?: string;
  messageId?: string;
  tagIds?: string[];
  scheduledAt?: string;
  status?: CampaignStatus;
  cc?: string[];
  bcc?: string[];
}

export interface CampaignSendRequest {
  campaignId: string;
}

export interface ScheduleCampaignRequest {
  campaignId: string;
  scheduledAt: string; // ISO 8601 datetime
}

export interface CampaignEditability {
  editable: boolean;
  status: CampaignStatus;
  reason?: string;
}

export interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalMessagesSent: number;
  totalMessagesDelivered: number;
  deliveryRate: number;
}

export interface Person {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  language: string | null;
  country: string | null;
  city: string | null;
  timezone: string | null;
  phoneNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: number;
  name: string;
  description: string;
  colorCode: string;
  contactCount: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: number;
  enabled: boolean;
  lastMessageReceivedAt: string;
  person: Person;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface CampaignDetails {
  id: number;
  name: string;
  description: string;
  message: {
    id: number;
    title: string;
    content: string;
    channel: string;
    event?: {
      id: number;
      title: string;
      description?: string | null;
      location?: string | null;
      startDate: string;
      startTime: string;
      endDate?: string | null;
      endTime?: string | null;
      startAt?: string;
      endAt?: string | null;
      timezone?: string | null;
    } | null;
    createdAt: string;
    updatedAt: string;
    attachments?: CampaignMessageAttachment[];
    attachmentCount: number;
  };
  contacts: Contact[];
  tags: Tag[];
  mailCcContacts: Contact[];
  mailCcTags: Tag[];
  mailCciContacts: Contact[];
  mailCciTags: Tag[];
  status: CampaignStatus;
  scheduledAt: string;
  createdAt: string;
  updatedAt: string;
  submissionReport?: CampaignSubmissionReport;
  deliveryReport?: CampaignSubmissionReport;
}

export interface CampaignContactResultDto {
  id: number;
  contactId: number;
  contactEmail: string;
  contactFirstName: string;
  contactLastName: string;
  /** EMAIL, SMS or WHATSAPP */
  channel: string;
  /** SUCCESS or FAILED */
  status: string;
  /** Timestamp of the send attempt */
  sentAt: string;
  /** Null when status = SUCCESS */
  errorMessage: string | null;
}

export interface CampaignResultsSummaryDto {
  successCount: number;
  failedCount: number;
  /** successCount + failedCount — contacts actually attempted */
  totalCount: number;
  /** Total unique contacts the campaign intended to reach */
  totalTargetCount: number;
}

export interface CampaignContactResultPage {
  totalElements: number;
  totalPages: number;
  size: number;
  content: CampaignContactResultDto[];
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
