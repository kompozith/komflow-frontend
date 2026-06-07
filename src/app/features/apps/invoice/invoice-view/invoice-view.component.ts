import { Component, signal, inject } from '@angular/core';
import { InvoiceService } from 'src/app/services/apps/invoice/invoice.service';
import { InvoiceList } from '../invoice';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
    selector: 'app-invoice-view',
    templateUrl: './invoice-view.component.html',
    imports: [
        MaterialModule,
        CommonModule,
        RouterLink,
        FormsModule,
        ReactiveFormsModule,
        TablerIconsModule,
    ]
})
export class AppInvoiceViewComponent {
  private activatedRouter = inject(ActivatedRoute);
  private invoiceService = inject(InvoiceService);

  id = signal<number>(0);
  invoiceDetail = signal<InvoiceList | null>(null);
  displayedColumns: string[] = ['itemName', 'unitPrice', 'unit', 'total'];

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngOnInit(): void {
    this.id.set(+this.activatedRouter.snapshot.paramMap.get('id')!);

    this.loadInvoiceDetail();
  }

  private loadInvoiceDetail(): void {
    const invoiceList = this.invoiceService.getInvoiceList(); // Get the list of invoices
    const invoiceId = this.id();
    const invoice = invoiceList.find((x) => x.id === invoiceId);
    this.invoiceDetail.set(invoice || null);
  }
}
