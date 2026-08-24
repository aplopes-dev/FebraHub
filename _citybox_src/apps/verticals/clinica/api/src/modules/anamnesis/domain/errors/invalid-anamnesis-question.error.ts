import { DomainError } from '../../../../shared/core/errors/domain.error';

export class InvalidAnamnesisQuestionError extends DomainError {
  constructor(context: string, message: string) {
    super({
      internalMessage: message,
      externalMessage: message,
      context,
    });
  }
}
