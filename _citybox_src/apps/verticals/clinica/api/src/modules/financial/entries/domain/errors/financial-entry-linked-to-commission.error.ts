import { DomainError } from '../../../../../shared/core/errors/domain.error';

/** 409 — lançamento ligado a comissão (accrual origem ou despesa de pagamento). */
export class FinancialEntryLinkedToCommissionError extends DomainError {
  constructor(context: string, entryId: string) {
    super({
      internalMessage: `Financial entry ${entryId} is linked to a commission and cannot be changed`,
      externalMessage:
        'Este recebimento não pode ser alterado pois ele está relacionado a um pagamento de comissão',
      context,
    });
    this.name = 'FinancialEntryLinkedToCommissionError';
  }
}
