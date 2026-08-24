import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class SalesOpportunityBudgetTerminalMoveError extends DomainError {
  constructor(context: string, id: string) {
    super({
      internalMessage: `Budget-linked opportunity cannot move to won/lost via CRM: ${id}`,
      externalMessage:
        'Oportunidades de orçamento só vão para Ganha ou Perdida ao aprovar ou reprovar o orçamento',
      context,
    });
  }
}
