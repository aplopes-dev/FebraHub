import { DomainError } from '../../../../shared/core/errors/domain.error';

export class InvalidSplitError extends DomainError {
  constructor(message: string) {
    super({
      internalMessage: message,
      externalMessage: message,
      context: 'InvalidSplitError',
    });
  }
}
