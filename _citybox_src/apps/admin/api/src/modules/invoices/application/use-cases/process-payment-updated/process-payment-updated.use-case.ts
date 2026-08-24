import { Injectable, Logger } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { InvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import { Invoice } from '../../../domain/entities/invoice.entity';

export interface ProcessPaymentUpdatedInput {
  payment: {
    id: string;
    value: number;
    dueDate: string;
    billingType: string;
    invoiceUrl?: string;
  };
}

@Injectable()
export class ProcessPaymentUpdatedUseCase implements IUseCase<
  ProcessPaymentUpdatedInput,
  Invoice | null
> {
  private readonly logger = new Logger(ProcessPaymentUpdatedUseCase.name);

  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async execute(input: ProcessPaymentUpdatedInput): Promise<Invoice | null> {
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

    const newAmountCents = Math.round(payment.value * 100);
    const paymentDueDateStr = payment.dueDate.split('T')[0];
    const newDueDate = new Date(`${paymentDueDateStr}T12:00:00-03:00`);

    // Check if anything actually changed
    const currentDueDateStr = invoice.dueDate.toISOString().split('T')[0];
    const newInvoiceUrl = payment.invoiceUrl;
    if (
      invoice.amountCents === newAmountCents &&
      currentDueDateStr === paymentDueDateStr &&
      invoice.method === payment.billingType &&
      (!newInvoiceUrl || invoice.invoiceUrl === newInvoiceUrl)
    ) {
      this.logger.log(`Invoice ${invoice.id} unchanged. Skipping update.`);
      return invoice;
    }

    this.logger.log(
      `Updating invoice ${invoice.id} (gateway: ${payment.id}). New amount: ${newAmountCents} cents, new due date: ${paymentDueDateStr}`,
    );

    // Update mutable properties
    invoice.props.amountCents = newAmountCents;
    invoice.props.dueDate = newDueDate;
    invoice.props.method = payment.billingType;
    if (newInvoiceUrl) {
      invoice.setInvoiceUrl(newInvoiceUrl);
    }
    invoice.touch();

    return this.invoiceRepository.save(invoice);
  }
}
