import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class FitInNotFoundError extends DomainError {
  constructor(context: string, fitInId: string) {
    super({
      internalMessage: `Fit-in not found: ${fitInId}`,
      externalMessage: 'Encaixe não encontrado',
      context,
    });
  }
}
