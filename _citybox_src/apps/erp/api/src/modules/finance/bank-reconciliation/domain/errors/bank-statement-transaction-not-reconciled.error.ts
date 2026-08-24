import { DomainError } from '../../../../../shared/core/errors/domain.error';

/** Usado por undo-reconciliation quando a transação não está `reconciled`. */
export class BankStatementTransactionNotReconciledError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Bank statement transaction ${id} is not reconciled`,
      externalMessage: 'Esta transação não está conciliada',
      context: BankStatementTransactionNotReconciledError.name,
    });
  }
}
