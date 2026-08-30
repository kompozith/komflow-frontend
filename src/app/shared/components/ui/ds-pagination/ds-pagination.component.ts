import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TablerIconsModule } from 'angular-tabler-icons';

export type PaginationItem = number | 'ellipsis';

/**
 * Generic, reusable pagination control: first/last links always visible,
 * an ellipsis-collapsed run of page numbers around the current page, and a
 * page-size dropdown. Purely presentational — the owning page supplies the
 * current state and reacts to the two outputs; this component holds no
 * paging state of its own.
 */
@Component({
  selector: 'ds-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TablerIconsModule],
  templateUrl: './ds-pagination.component.html',
})
export class DsPaginationComponent {
  /** 0-based current page index, matching the Spring Page<> convention already used by the API. */
  currentPage = input.required<number>();
  totalPages = input.required<number>();
  totalElements = input.required<number>();
  pageSize = input.required<number>();
  pageSizeOptions = input<number[]>([10, 20, 50, 100]);
  /** How many page numbers to show on each side of the current page before collapsing into an ellipsis. */
  siblingCount = input(1);

  pageChange = output<number>();
  pageSizeChange = output<number>();

  startIndex = computed(() => (this.totalElements() === 0 ? 0 : this.currentPage() * this.pageSize() + 1));
  endIndex = computed(() => Math.min((this.currentPage() + 1) * this.pageSize(), this.totalElements()));

  /**
   * Builds the visible page list as 1-based numbers, e.g. for 20 pages,
   * current page 10 (0-based) and siblingCount 1: [1, 'ellipsis', 10, 11, 12, 'ellipsis', 20].
   */
  pages = computed<PaginationItem[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage() + 1; // 1-based for display math
    const siblings = this.siblingCount();

    if (total <= 0) {
      return [];
    }

    const firstPage = 1;
    const lastPage = total;
    const leftSibling = Math.max(current - siblings, firstPage);
    const rightSibling = Math.min(current + siblings, lastPage);

    const showLeftEllipsis = leftSibling > firstPage + 1;
    const showRightEllipsis = rightSibling < lastPage - 1;

    const items: PaginationItem[] = [];

    items.push(firstPage);

    if (showLeftEllipsis) {
      items.push('ellipsis');
    } else {
      for (let page = firstPage + 1; page < leftSibling; page++) {
        items.push(page);
      }
    }

    for (let page = Math.max(leftSibling, firstPage + 1); page <= Math.min(rightSibling, lastPage - 1); page++) {
      items.push(page);
    }

    if (showRightEllipsis) {
      items.push('ellipsis');
    } else {
      for (let page = rightSibling + 1; page < lastPage; page++) {
        items.push(page);
      }
    }

    if (lastPage > firstPage) {
      items.push(lastPage);
    }

    return items;
  });

  goToPage(page: number): void {
    const zeroBased = page - 1;
    if (zeroBased === this.currentPage()) {
      return;
    }
    this.pageChange.emit(zeroBased);
  }

  goToFirst(): void {
    this.goToPage(1);
  }

  goToLast(): void {
    this.goToPage(this.totalPages());
  }

  goToPrevious(): void {
    if (this.currentPage() > 0) {
      this.pageChange.emit(this.currentPage() - 1);
    }
  }

  goToNext(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.pageChange.emit(this.currentPage() + 1);
    }
  }

  onPageSizeChange(value: string): void {
    this.pageSizeChange.emit(Number(value));
  }
}
