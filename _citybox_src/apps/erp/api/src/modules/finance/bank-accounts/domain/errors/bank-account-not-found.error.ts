import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class BankAccountNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Bank account ${id} not found in the current organization`,
      externalMessage: 'Conta bancária não encontrada',
      context: BankAccountNotFoundError.name,
    });
  }
}
