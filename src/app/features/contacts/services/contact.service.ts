// src/app/features/contacts/services/contact.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Contact, ContactDetails, ContactPage, ContactFilters, CreateContactRequest, UpdateContactRequest } from '../models/contact';
import { signal, Signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private apiUrl = `${environment.apiUrl}/contacts`;

  // Legacy compatibility properties
  contactList = signal<any[]>([]);
  labels = signal<any[]>([]);
  filters = signal<any[]>([]);
  selectedFilter = signal<any | null>(null);
  selectedCategory = signal<any | null>(null);

  private selectedContactSubject = new BehaviorSubject<any>(null);
  selectedContact$ = this.selectedContactSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  getContacts(filters: ContactFilters = {}): Observable<ContactPage> {
    let params = new HttpParams();

    if (filters.page !== undefined) params = params.set('page', filters.page.toString());
    if (filters.size !== undefined) params = params.set('size', filters.size.toString());
    if (filters.sort && filters.sort.length > 0) {
      filters.sort.forEach(sort => params = params.append('sort', sort));
    }
    if (filters.search) params = params.set('search', filters.search);
    if (filters.tagId) params = params.set('tagId', filters.tagId);

    const headers = this.getAuthHeaders();

    return this.http.get<ContactPage>(this.apiUrl, { params, headers });
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
}
