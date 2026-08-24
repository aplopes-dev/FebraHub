import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';

export class VariationInvalidError extends ValidatorDomainError {
  constructor(externalMessage: string, context = VariationInvalidError.name) {
    super({
      internalMessage: externalMessage,
      externalMessage,
      context,
    });
  }
}
