import { DomainError } from '../../../../../shared/core/errors/domain.error';

/** FR-017 — soma dos lançamentos selecionados não fecha com o valor da transação. */
export class ReconciliationSumMismatchError extends DomainError {
  constructor(expectedCents: number, actualCents: number) {
    super({
      internalMessage: `Reconciliation sum mismatch: expected ${expectedCents}, got ${actualCents}`,
      externalMessage:
        'A soma dos lançamentos selecionados não fecha com o valor da transação',
      context: ReconciliationSumMismatchError.name,
    });
  }
}
