import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { InvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import {
  Invoice,
  type InvoiceStatus,
} from '../../../domain/entities/invoice.entity';

export interface ListInvoicesDto {
  page?: number;
  perPage?: number;
  storeId?: string;
  subscriptionId?: string;
  status?: string[];
  method?: string[];
  search?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export interface ListInvoicesResult {
  invoices: Invoice[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

const VALID_STATUS: InvoiceStatus[] = [
  'DRAFT',
  'OPEN',
  'PAID',
  'PAST_DUE',
  'VOID',
];

@Injectable()
export class ListInvoicesUseCase implements IUseCase<
  ListInvoicesDto,
  ListInvoicesResult
> {
  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async execute({
    page = 1,
    perPage = 20,
    storeId,
    subscriptionId,
    status,
    method,
    search,
    dueDateFrom,
    dueDateTo,
  }: ListInvoicesDto): Promise<ListInvoicesResult> {
    const skip = (page - 1) * perPage;

    const parsedStatus = this.normalizeStatus(status);
    const parsedDueDateFrom = dueDateFrom ? new Date(dueDateFrom) : undefined;
    const parsedDueDateTo = dueDateTo ? new Date(dueDateTo) : undefined;

    const criteria = {
      skip,
      take: perPage,
      storeId,
      subscriptionId,
      status: parsedStatus,
      method,
      search,
      dueDateFrom: parsedDueDateFrom,
      dueDateTo: parsedDueDateTo,
    };

    // First fetch items to check and lazily transition status if open and past due date
    const rawInvoices = await this.invoiceRepository.findAll(criteria);

    const invoices: Invoice[] = [];
    for (const invoice of rawInvoices) {
      if (invoice.checkPastDue()) {
        await this.invoiceRepository.save(invoice);
      }
      invoices.push(invoice);
    }

    const total = await this.invoiceRepository.count(criteria);

    return {
      invoices,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage) || 0,
    };
  }

  private normalizeStatus(status?: string[]): InvoiceStatus[] | undefined {
    if (!status?.length) return undefined;
    const valid = status
      .map((s) => s.toUpperCase())
      .filter((s): s is InvoiceStatus =>
        VALID_STATUS.includes(s as InvoiceStatus),
      );
    return valid.length ? valid : undefined;
  }
}
