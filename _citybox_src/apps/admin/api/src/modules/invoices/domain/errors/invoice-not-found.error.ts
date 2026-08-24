import { DomainError } from '../../../../shared/core/errors/domain.error';

export class InvoiceNotFoundError extends DomainError {
  constructor(context: string, invoiceId: string) {
    super({
      internalMessage: `Invoice "${invoiceId}" not found`,
      externalMessage: 'Fatura não encontrada',
      context,
    });
  }
}
