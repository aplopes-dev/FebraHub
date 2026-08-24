import { DomainError } from '../../../../../shared/core/errors/domain.error';

/** FR-011 — conta de saída e conta de entrada precisam ser diferentes. */
export class BankTransferSameAccountError extends DomainError {
  constructor() {
    super({
      internalMessage: 'fromBankAccountId and toBankAccountId are the same',
      externalMessage:
        'A conta de saída deve ser diferente da conta de entrada',
      context: BankTransferSameAccountError.name,
    });
  }
}
