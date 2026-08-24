import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class BudgetNotFoundError extends DomainError {
  constructor(context: string, budgetId: string) {
    super({
      internalMessage: `Budget not found: ${budgetId}`,
      externalMessage: 'Orçamento não encontrado',
      context,
    });
  }
}
