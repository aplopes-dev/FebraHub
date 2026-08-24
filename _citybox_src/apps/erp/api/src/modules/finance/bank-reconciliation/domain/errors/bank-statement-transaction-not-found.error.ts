import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class BankStatementTransactionNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Bank statement transaction ${id} not found in the current organization`,
      externalMessage: 'Transação do extrato não encontrada',
      context: BankStatementTransactionNotFoundError.name,
    });
  }
}
