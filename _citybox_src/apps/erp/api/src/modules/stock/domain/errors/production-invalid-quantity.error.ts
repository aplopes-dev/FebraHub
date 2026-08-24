import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';

export class ProductionInvalidQuantityError extends ValidatorDomainError {
  constructor(raw: string) {
    super({
      internalMessage: `Invalid production quantity: ${raw}`,
      externalMessage: 'A quantidade deve ser maior que zero.',
      context: ProductionInvalidQuantityError.name,
    });
  }
}
