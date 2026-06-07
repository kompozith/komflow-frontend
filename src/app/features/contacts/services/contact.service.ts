// src/app/features/contacts/services/contact.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Contact, ContactDetails, ContactPage, ContactFilters, ContactImportResult, CreateContactRequest, UpdateContactRequest } from '../models/contact';
import { signal, Signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/contacts`;

  // Legacy compatibility properties
  contactList = signal<any[]>([]);
  labels = signal<any[]>([]);
  filters = signal<any[]>([]);
  selectedFilter = signal<any | null>(null);
  selectedCategory = signal<any | null>(null);

  private selectedContactSubject = new BehaviorSubject<any>(null);
  selectedContact$ = this.selectedContactSubject.asObservable();

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  private getAuthHeaders(includeJsonContentType: boolean = true): HttpHeaders {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const headers: Record<string, string> = {
      ...(token && { 'Authorization': `Bearer ${token}` })
    };

    if (includeJsonContentType) {
      headers['Content-Type'] = 'application/json';
    }

    return new HttpHeaders(headers);
  }

  getContacts(filters: ContactFilters = {}): Observable<ContactPage> {
    return this.http.get<ContactPage>(this.apiUrl, {
      params: this.buildFilterParams(filters),
      headers: this.getAuthHeaders(),
    });
  }

  getContactById(id: string): Observable<ContactDetails> {
    return this.http.get<ContactDetails>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  createContact(contact: CreateContactRequest): Observable<Contact> {
    return this.http.post<Contact>(this.apiUrl, contact, { headers: this.getAuthHeaders() });
  }

  updateContact(id: string, contact: UpdateContactRequest): Observable<Contact> {
    return this.http.put<Contact>(`${this.apiUrl}/${id}`, contact, { headers: this.getAuthHeaders() });
  }

  deleteContact(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  exportContacts(format: 'csv' | 'xlsx', filters: ContactFilters = {}): Observable<Blob> {
    let params = this.buildFilterParams(filters);
    params = params.set('format', format);

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      headers: this.getAuthHeaders(false),
      responseType: 'blob',
    });
  }

  importContacts(file: File): Observable<ContactImportResult> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post<ContactImportResult>(`${this.apiUrl}/import`, formData, {
      headers: this.getAuthHeaders(false),
    });
  }
  // Add method to map Contact to ContactBox format for compatibility with legacy components
  mapContactToContactBox(contact: Contact): any {
    return {
      id: contact.id,
      firstname: contact.person.firstName,
      lastname: contact.person.lastName,
      email: contact.person.email,
      phone: contact.person.phoneNumber || '',
      image: '', // No image in new format
      department: '', // No department in new format
      company: '', // No company in new format
      address: '', // No address in new format
      notes: '', // No notes in new format
      frequentlycontacted: false, // No equivalent in new format
      starred: false, // No equivalent in new format
      deleted: false, // No equivalent in new format
      // Add original contact data for reference
      _originalContact: contact
    };
  }

  // Add method to get contacts in ContactBox format
  getContactsAsContactBox(filters: ContactFilters = {}): Observable<any[]> {
    return this.getContacts(filters).pipe(
      map((contactPage: ContactPage) => {
        return contactPage.content.map(contact => this.mapContactToContactBox(contact));
      })
    );
  }

  // Legacy compatibility methods
  legacySetSelectedContact(contact: any) {
    this.selectedContactSubject.next(contact);
  }

  legacyGetSelectedContact() {
    return this.selectedContactSubject.getValue();
  }

  legacySetContacts(contacts: any[]) {
    this.contactList.set(contacts);
  }

  legacyUpdateContact(updatedContact: any) {
    const updatedList = this.contactList().map((contact) =>
      contact.id === updatedContact.id ? updatedContact : contact
    );
    this.contactList.set(updatedList);
    if (this.selectedContactSubject.getValue()?.id === updatedContact.id) {
      this.legacySetSelectedContact(updatedContact);
    }
  }

  legacyApplyFilter(filter: any): void {
    this.selectedFilter.set(filter);
    this.filters.set(
      this.filters().map((f) => ({ ...f, active: f === filter }))
    );
    this.selectedCategory.set(null);
  }

  legacyApplyCategory(category: any): void {
    this.selectedCategory.set(category);
    this.labels().forEach((lab: any) => (lab.active = lab === category));
    this.selectedFilter.set(null);
  }

  legacyToggleStarred(contact: any, $event: any): void {
    contact.starred = !contact.starred;
    $event.stopPropagation();
    this.contactList.set([...this.contactList()]);
  }

  legacyDeleteContact(contactToDelete: any) {
    const updatedList = this.contactList().filter(
      (contact) => contact.id !== contactToDelete.id
    );
    this.contactList.set(updatedList);

    // Check if the deleted contact was the selected one
    const currentlySelectedContact = this.selectedContactSubject.getValue();
    if (currentlySelectedContact?.id === contactToDelete.id) {
      // Set the next contact as selected, or null if there are no more contacts
      const nextContact = updatedList.length > 0 ? updatedList[0] : null;
      this.legacySetSelectedContact(nextContact);
    }
  }

  legacyGetContactList() {
    return this.contactList();
  }

  private formatTagIds(tagIds: number[]): string {
    return `{${tagIds.join(',')}}`;
  }

  private buildFilterParams(filters: ContactFilters = {}): HttpParams {
    let params = new HttpParams();

    if (filters.page !== undefined) params = params.set('page', filters.page.toString());
    if (filters.size !== undefined) params = params.set('size', filters.size.toString());
    if (filters.search) params = params.set('search', filters.search);
    if (filters.enabled !== undefined) params = params.set('enabled', filters.enabled.toString());
    if (filters.createdAtFrom) params = params.set('createdAtFrom', filters.createdAtFrom);
    if (filters.createdAtTo) params = params.set('createdAtTo', filters.createdAtTo);
    if (filters.tagIds && filters.tagIds.length > 0) {
      params = params.set('tagIds', this.formatTagIds(filters.tagIds));
    }

    return params;
  }
}
