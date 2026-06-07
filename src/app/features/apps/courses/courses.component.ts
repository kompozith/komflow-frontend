import { Component, signal, inject } from '@angular/core';
import { CourseService } from 'src/app/services/apps/course/course.service';
import { course } from './course';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-courses',
    templateUrl: './courses.component.html',
    imports: [
        MatCardModule,
        TablerIconsModule,
        MatFormFieldModule,
        MatSelectModule,
        FormsModule,
        ReactiveFormsModule,
        MatDividerModule,
        RouterModule,
        MatIconModule,
        MatInputModule,
        MatButtonModule,
    ]
})
export class AppCoursesComponent {
  private courseService = inject(CourseService);

  courseList = signal<course[]>([]);
  selectedCategory = signal<string>('All');

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    this.courseList.set(this.courseService.getCourse());
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.courseList.set(this.filter(filterValue));
  }

  filter(v: string): course[] {
    return this.courseService
      .getCourse()
      .filter(
        (x) => x.courseName.toLowerCase().indexOf(v.toLowerCase()) !== -1
      );
  }

  ddlChange(ob: any): void {
    const filterValue = ob.value;
    if (filterValue === 'All') {
      this.courseList.set(this.courseService.getCourse());
    } else {
      this.courseList.set(
        this.courseService
          .getCourse()
          // tslint:disable-next-line: no-shadowed-variable
          .filter((course) => course.courseFramework === filterValue)
      );
    }
  }
}
