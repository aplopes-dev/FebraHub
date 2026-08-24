import { DomainError } from '../../../../../shared/core/errors/domain.error';

/** FR-033 — lançamento já vinculado a uma conciliação ativa (outra transação). */
export class FinancialEntryAlreadyReconciledError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Financial entry ${id} already has an active bank statement match`,
      externalMessage: 'Lançamento já está conciliado com outra transação',
      context: FinancialEntryAlreadyReconciledError.name,
    });
  }
}
