import { DomainError } from '../../../../shared/core/errors/domain.error';

export class InvoiceNotPublishedError extends DomainError {
  constructor(context: string, invoiceId: string) {
    super({
      internalMessage: `Invoice "${invoiceId}" is not published to payment gateway`,
      externalMessage:
        'Esta fatura ainda não foi publicada no gateway de pagamento',
      context,
    });
  }
}
