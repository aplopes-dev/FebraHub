import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class FinancialAccountNotFoundError extends DomainError {
  constructor(context: string, accountId: string) {
    super({
      internalMessage: `Financial account not found: ${accountId}`,
      externalMessage: 'Conta financeira não encontrada',
      context,
    });
  }
}
