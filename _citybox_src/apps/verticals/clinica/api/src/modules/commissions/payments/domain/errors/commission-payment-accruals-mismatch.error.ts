import { DomainError } from '../../../../../shared/core/errors/domain.error';

/** 409 — conjunto de accruals incompleto / mismatch no pagamento. */
export class CommissionPaymentAccrualsMismatchError extends DomainError {
  constructor(context: string) {
    super({
      internalMessage: 'Commission payment accrual IDs mismatch or incomplete',
      externalMessage:
        'Os lançamentos selecionados não estão disponíveis para pagamento',
      context,
    });
    this.name = 'CommissionPaymentAccrualsMismatchError';
  }
}
