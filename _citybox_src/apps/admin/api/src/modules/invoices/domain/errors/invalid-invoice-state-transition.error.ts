import { DomainError } from '../../../../shared/core/errors/domain.error';

export class InvalidInvoiceStateTransitionError extends DomainError {
  constructor(context: string, from: string, to: string) {
    super({
      internalMessage: `Cannot transition invoice state from "${from}" to "${to}"`,
      externalMessage: `Transição de estado da fatura de "${from}" para "${to}" é inválida.`,
      context,
    });
  }
}
