import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class CommissionPaymentNotFoundError extends DomainError {
  constructor(context: string, memberOrPaymentId: string) {
    super({
      internalMessage: `Commission history not found for: ${memberOrPaymentId}`,
      externalMessage:
        'Nenhum pagamento de comissão encontrado para este profissional no período',
      context,
    });
    this.name = 'CommissionPaymentNotFoundError';
  }
}
