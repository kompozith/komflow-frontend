// src/app/features/contacts/models/contact.ts

// Contact model for listing (simplified structure)
export interface Contact {
  id: number;
  enabled: boolean;
  lastMessageReceivedAt: string | null;
  person: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    language: string;
    phoneNumber: string | null;
    createdAt: string;
    updatedAt: string;
  };
  tagCount: number;
  createdAt: string;
  updatedAt: string;
}

// ContactDetails model for detailed view (full structure)
export interface ContactDetails {
  id: number;
  enabled: boolean;
  lastMessageReceivedAt: string | null;
  person: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    language: string;
    phoneNumber: string | null;
    createdAt: string;
    updatedAt: string;
  };
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
  sort?: string[];
  search?: string;
  tagId?: string;
}

export interface CreateContactRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  tagIds?: string[];
}

export interface UpdateContactRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  tagIds?: string[];
}
