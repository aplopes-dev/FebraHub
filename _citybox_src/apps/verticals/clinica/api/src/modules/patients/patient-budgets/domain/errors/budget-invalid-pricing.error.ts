import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class BudgetInvalidPricingError extends DomainError {
  constructor(context: string, reason: string) {
    super({
      internalMessage: `Invalid budget pricing: ${reason}`,
      externalMessage: 'Valores do orçamento são inválidos',
      context,
    });
  }
}
