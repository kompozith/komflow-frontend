import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton-table.component.html',
})
export class SkeletonTableComponent {
  @Input() columns = 6;
  @Input() rows = 6;
  @Input() chipColumns: number[] = [];
  @Input() showPagination = true;

  get normalizedColumns(): number {
    return Math.min(8, Math.max(5, this.columns || 5));
  }

  get normalizedRows(): number {
    return Math.max(1, this.rows || 1);
  }

  get colsClass(): string {
    return `cols-${this.normalizedColumns}`;
  }

  get columnIndexes(): number[] {
    return Array.from({ length: this.normalizedColumns }, (_, index) => index);
  }

  get rowIndexes(): number[] {
    return Array.from({ length: this.normalizedRows }, (_, index) => index);
  }

  isChipColumn(index: number): boolean {
    return this.chipColumns.includes(index);
  }
}
