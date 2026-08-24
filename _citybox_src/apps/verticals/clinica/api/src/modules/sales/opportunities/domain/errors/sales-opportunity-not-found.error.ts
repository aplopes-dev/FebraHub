import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class SalesOpportunityNotFoundError extends DomainError {
  constructor(context: string, id: string) {
    super({
      internalMessage: `Sales opportunity not found: ${id}`,
      externalMessage: 'Oportunidade não encontrada',
      context,
    });
  }
}
