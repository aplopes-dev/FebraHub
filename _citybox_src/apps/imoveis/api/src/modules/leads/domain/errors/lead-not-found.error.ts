import { DomainError } from '../../../../shared/core/errors/domain.error';

export class LeadNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Lead not found: id=${id}`,
      externalMessage: 'Lead não encontrado.',
      context: 'LeadNotFoundError',
    });
  }
}
