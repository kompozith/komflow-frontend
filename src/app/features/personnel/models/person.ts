export interface Person {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  language: string | null;
  phoneNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PersonDetails {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  language: string | null;
  phoneNumbers: PhoneNumber[];
  createdAt: string;
  updatedAt: string;
}

export interface PhoneNumber {
  id: number;
  number: string;
  isWhatsapp: string | boolean | null;
  personId: number | null;
  contactId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePersonRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  language?: string;
}

export interface UpdatePersonRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  language?: string;
}

export interface PersonPage {
  totalElements: number;
  totalPages: number;
  size: number;
  content: Person[];
  number: number;
  sort: any;
  numberOfElements: number;
  pageable: any;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface CreatePhoneNumberRequest {
  number: string;
  isWhatsapp?: boolean;
}
