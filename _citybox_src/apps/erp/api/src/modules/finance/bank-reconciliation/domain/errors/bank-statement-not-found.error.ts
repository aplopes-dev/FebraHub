import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class BankStatementNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Bank statement ${id} not found in the current organization`,
      externalMessage: 'Extrato bancário não encontrado',
      context: BankStatementNotFoundError.name,
    });
  }
}
