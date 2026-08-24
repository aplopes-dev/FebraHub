import { DomainError } from '../../../../../shared/core/errors/domain.error';

/** 409 — accrual já está pago ou não está aberto. */
export class CommissionAccrualAlreadyPaidError extends DomainError {
  constructor(context: string, accrualId: string) {
    super({
      internalMessage: `Commission accrual already paid: ${accrualId}`,
      externalMessage: 'Um ou mais lançamentos de comissão já foram pagos',
      context,
    });
    this.name = 'CommissionAccrualAlreadyPaidError';
  }
}
