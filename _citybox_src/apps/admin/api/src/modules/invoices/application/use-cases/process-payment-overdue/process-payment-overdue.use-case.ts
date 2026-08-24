import { Injectable, Logger } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { InvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import { Invoice } from '../../../domain/entities/invoice.entity';

export interface ProcessPaymentOverdueInput {
  payment: {
    id: string;
  };
}

@Injectable()
export class ProcessPaymentOverdueUseCase implements IUseCase<
  ProcessPaymentOverdueInput,
  Invoice | null
> {
  private readonly logger = new Logger(ProcessPaymentOverdueUseCase.name);

  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async execute(input: ProcessPaymentOverdueInput): Promise<Invoice | null> {
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

    if (invoice.status === 'PAST_DUE') {
      this.logger.log(
        `Invoice ${invoice.id} is already marked as past due. Skipping.`,
      );
      return invoice;
    }

    this.logger.log(`Marking invoice ${invoice.id} as PAST_DUE.`);
    invoice.markPastDue();

    return this.invoiceRepository.save(invoice);
  }
}
