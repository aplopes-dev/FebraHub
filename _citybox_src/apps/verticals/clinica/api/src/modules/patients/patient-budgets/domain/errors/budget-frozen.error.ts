import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class BudgetFrozenError extends DomainError {
  constructor(context: string, budgetId: string) {
    super({
      internalMessage: `Approved budget cannot be modified: ${budgetId}`,
      externalMessage: 'Orçamento aprovado não pode ser alterado',
      context,
    });
  }
}
