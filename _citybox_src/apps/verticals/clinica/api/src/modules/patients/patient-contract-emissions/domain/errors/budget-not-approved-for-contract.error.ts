import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class BudgetNotApprovedForContractError extends DomainError {
  constructor(context: string, budgetId: string) {
    super({
      internalMessage: `Budget ${budgetId} is not approved for contract emission`,
      externalMessage: 'Contrato somente para orçamento aprovado',
      context,
    });
    this.name = 'BudgetNotApprovedForContractError';
  }
}
