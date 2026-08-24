import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class SalesOpportunityFrozenError extends DomainError {
  constructor(context: string, id: string) {
    super({
      internalMessage: `Sales opportunity is frozen (won/lost): ${id}`,
      externalMessage: 'Oportunidade em etapa final não pode ser editada',
      context,
    });
  }
}
