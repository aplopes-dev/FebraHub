import { Inject, Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { InvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import {
  PAYMENT_GATEWAY,
  PaymentGateway,
} from '../../../../payment-gateway/domain/providers/payment-gateway.interface';
import { GatewayInvoice } from '../../../../payment-gateway/domain/entities/gateway-invoice.entity';
import { InvoiceNotFoundError } from '../../../domain/errors/invoice-not-found.error';
import { InvoiceNotPublishedError } from '../../../domain/errors/invoice-not-published.error';

@Injectable()
export class GetInvoicePaymentDetailsUseCase implements IUseCase<
  string,
  GatewayInvoice
> {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: PaymentGateway,
  ) {}

  async execute(invoiceId: string): Promise<GatewayInvoice> {
    const invoice = await this.invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new InvoiceNotFoundError(
        GetInvoicePaymentDetailsUseCase.name,
        invoiceId,
      );
    }

    if (!invoice.gatewayPaymentId) {
      throw new InvoiceNotPublishedError(
        GetInvoicePaymentDetailsUseCase.name,
        invoiceId,
      );
    }

    return this.paymentGateway.getInvoice(invoice.gatewayPaymentId);
  }
}
