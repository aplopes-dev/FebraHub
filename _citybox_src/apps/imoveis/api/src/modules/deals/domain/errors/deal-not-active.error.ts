import { DomainError } from '../../../../shared/core/errors/domain.error';

export class DealNotActiveError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Deal is not active: id=${id}`,
      externalMessage: 'Somente negócios ativos podem ter a etapa alterada.',
      context: 'DealNotActiveError',
    });
  }
}
