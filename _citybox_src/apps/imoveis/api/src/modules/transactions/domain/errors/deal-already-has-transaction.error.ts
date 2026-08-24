import { DomainError } from '../../../../shared/core/errors/domain.error';

export class DealAlreadyHasTransactionError extends DomainError {
  constructor(dealId: string) {
    super({
      internalMessage: `Deal already has a linked transaction: dealId=${dealId}`,
      externalMessage:
        'Este negócio já possui uma transação vinculada. Abra a transação existente ou conclua/cancele antes de criar outra.',
      context: 'DealAlreadyHasTransactionError',
    });
  }
}
