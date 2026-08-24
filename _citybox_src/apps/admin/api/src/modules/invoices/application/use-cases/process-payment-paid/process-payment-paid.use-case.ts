import { Injectable, Logger } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { InvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import { Invoice } from '../../../domain/entities/invoice.entity';

export interface ProcessPaymentPaidInput {
  payment: {
    id: string;
    billingType: string;
  };
}

@Injectable()
export class ProcessPaymentPaidUseCase implements IUseCase<
  ProcessPaymentPaidInput,
  Invoice | null
> {
  private readonly logger = new Logger(ProcessPaymentPaidUseCase.name);

  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async execute(input: ProcessPaymentPaidInput): Promise<Invoice | null> {
    const { payment } = input;

    const invoice = await this.invoiceRepository.findByGatewayPaymentId(
      payment.id,
    );
    if (!invoice) {
      this.logger.error(
        `Invoice not found for gateway payment ID: ${payment.id}`,
      );
      return null;
    }

    if (invoice.status === 'PAID') {
      this.logger.log(`Invoice ${invoice.id} is already paid. Skipping.`);
      return invoice;
    }

    this.logger.log(`Marking invoice ${invoice.id} as PAID.`);
    invoice.markPaid(payment.billingType);

    return this.invoiceRepository.save(invoice);
  }
}
