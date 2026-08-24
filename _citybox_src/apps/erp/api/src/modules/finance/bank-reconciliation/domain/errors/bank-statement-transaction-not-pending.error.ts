import { DomainError } from '../../../../../shared/core/errors/domain.error';

/** Usado por reconcile-transaction, create-entry-from-transaction e discard-transaction. */
export class BankStatementTransactionNotPendingError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Bank statement transaction ${id} is not pending`,
      externalMessage: 'Esta transação já foi tratada',
      context: BankStatementTransactionNotPendingError.name,
    });
  }
}
