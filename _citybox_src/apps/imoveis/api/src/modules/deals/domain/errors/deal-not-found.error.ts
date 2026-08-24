import { DomainError } from '../../../../shared/core/errors/domain.error';

export class DealNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Deal not found: id=${id}`,
      externalMessage: 'Negócio não encontrado.',
      context: 'DealNotFoundError',
    });
  }
}
