import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class CommissionAccrualNotFoundError extends DomainError {
  constructor(context: string, accrualId: string) {
    super({
      internalMessage: `Commission accrual not found: ${accrualId}`,
      externalMessage: 'Lançamento de comissão não encontrado',
      context,
    });
    this.name = 'CommissionAccrualNotFoundError';
  }
}
