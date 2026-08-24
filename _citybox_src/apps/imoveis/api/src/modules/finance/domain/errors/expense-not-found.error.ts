import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ExpenseNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Expense not found: id=${id}`,
      externalMessage: 'Despesa não encontrada.',
      context: 'ExpenseNotFoundError',
    });
  }
}
