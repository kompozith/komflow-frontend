// src/app/features/contacts/models/contact.ts

export interface PersonSummary {
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

// Contact model for listing (backend: ContactWithTagCountDto)
export interface Contact {
  id: number;
  enabled: boolean;
  lastMessageReceivedAt: string | null;
  civility: string | null;
  profession: string | null;
  ageRange: string | null;
  objectives: string | null;
  websiteUrl: string | null;
  person: PersonSummary;
  tagCount: number;
  createdAt: string;
  updatedAt: string;
}

// ContactDetails model for detailed view (backend: ContactDetailsDto)
export interface ContactDetails {
  id: number;
  enabled: boolean;
  lastMessageReceivedAt: string | null;
  civility: string | null;
  profession: string | null;
  ageRange: string | null;
  objectives: string | null;
  websiteUrl: string | null;
  person: PersonSummary;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: number;
  name: string;
  description: string;
  colorCode: string;
  contactCount: number | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContactPage {
  totalElements: number;
  totalPages: number;
  size: number;
  content: Contact[];
  number: number;
  sort: any;
  numberOfElements: number;
  pageable: any;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ContactFilters {
  page?: number;
  size?: number;
  search?: string;
  enabled?: boolean;
  createdAtFrom?: string;
  createdAtTo?: string;
  tagIds?: number[];
}

export interface CreateContactRequest {
  enabled: boolean;
  lastMessageReceivedAt?: string | null;
  civility?: string | null;
  profession?: string | null;
  ageRange?: string | null;
  objectives?: string | null;
  websiteUrl?: string | null;
  personId?: number;
  person?: {
    email: string;
    firstName?: string;
    lastName?: string;
    language?: 'fr' | 'en';
    country?: string;
    city?: string;
    timezone?: string;
  };
  phoneNumbers?: {
    number: string;
    isWhatsapp?: boolean;
  }[];
  tagIds?: number[];
}

export interface UpdateContactRequest {
  enabled: boolean;
  lastMessageReceivedAt?: string | null;
  civility?: string | null;
  profession?: string | null;
  ageRange?: string | null;
  objectives?: string | null;
  websiteUrl?: string | null;
  personId?: number;
  tagIds?: number[];
}

export interface ContactImportResult {
  importedCount: number;
  updatedCount?: number;
  skippedCount?: number;
  failedCount: number;
  errors: string[];
}
