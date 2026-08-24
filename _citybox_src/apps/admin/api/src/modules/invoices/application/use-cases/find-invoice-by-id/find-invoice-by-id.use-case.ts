import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { InvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import { Invoice } from '../../../domain/entities/invoice.entity';
import { InvoiceNotFoundError } from '../../../domain/errors/invoice-not-found.error';

@Injectable()
export class FindInvoiceByIdUseCase implements IUseCase<string, Invoice> {
  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async execute(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) {
      throw new InvoiceNotFoundError(FindInvoiceByIdUseCase.name, id);
    }

    if (invoice.checkPastDue()) {
      await this.invoiceRepository.save(invoice);
    }

    return invoice;
  }
}
