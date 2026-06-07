import { Component, OnInit, inject } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { PersonService } from '../../../personnel/services/person.service';
import { Person, PersonPage } from '../../../personnel/models/person';
import { PersonEditDialogComponent } from './person-edit-dialog/person-edit-dialog.component';
import { SkeletonTableComponent } from 'src/app/shared/components/skeleton-table/skeleton-table.component';

@Component({
  selector: 'app-person-list',
  templateUrl: './person-list.component.html',
  styleUrls: ['./person-list.component.scss'],
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TablerIconsModule,
    CommonModule,
    MatMenuModule,
    MatIconModule,
    SkeletonTableComponent,
  ],
})
export class PersonListComponent implements OnInit {
  private personService = inject(PersonService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  displayedColumns: string[] = [
    'rowNumber',
    'name',
    'email',
    'phone',
    'createdAt',
    'updatedAt',
    'actions',
  ];

  dataSource = new MatTableDataSource<Person>([]);
  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  pageSize = 10;
  isLoading = false;

  searchText = '';
  private searchSubject = new Subject<string>();

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngOnInit(): void {
    this.loadPersons();
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe((value) => {
      this.searchText = value;
      this.loadPersons(0);
    });
  }

  loadPersons(pageIndex: number = 0): void {
    if (this.isLoading) return;
    this.isLoading = true;

    this.personService.getPersons(pageIndex, this.pageSize, this.searchText || undefined)
      .subscribe({
        next: (response: PersonPage) => {
          this.dataSource.data = response.content;
          this.totalElements = response.totalElements;
          this.totalPages = response.totalPages;
          this.currentPage = response.number;
          this.pageSize = response.size;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.snackBar.open('Error loading users', 'Close', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  onPageChange(event: PageEvent): void {
    const pageIndex = event.pageIndex;
    const newPageSize = event.pageSize;
    if (pageIndex !== this.currentPage || newPageSize !== this.pageSize) {
      this.pageSize = newPageSize;
      this.loadPersons(pageIndex);
    }
  }

  getStartIndex(): number {
    return (this.currentPage * this.pageSize) + 1;
  }

  getEndIndex(): number {
    const endIndex = (this.currentPage + 1) * this.pageSize;
    return Math.min(endIndex, this.totalElements);
  }

  getPersonInitials(firstName: string, lastName: string): string {
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  getPersonBadgeClass(personId: string): string {
    const badgeClasses = [
      'bg-light-primary text-primary',
      'bg-light-success text-success',
      'bg-light-warning text-warning',
      'bg-light-error text-error',
      'bg-light text-info'
    ];

    let hash = 5381;
    for (let i = 0; i < personId.length; i++) {
      const char = personId.charCodeAt(i);
      hash = ((hash << 5) + hash) + char;
    }

    const index = Math.abs(hash) % badgeClasses.length;
    return badgeClasses[index];
  }

  editPerson(person: Person): void {
    const dialogRef = this.dialog.open(PersonEditDialogComponent, {
      width: '600px',
      data: { personId: person.id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.event === 'Update') {
        this.loadPersons(this.currentPage);
      }
    });
  }
}
