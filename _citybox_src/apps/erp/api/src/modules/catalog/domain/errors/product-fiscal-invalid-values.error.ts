import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ProductFiscalInvalidValuesError extends DomainError {
  constructor(message = 'Valores fiscais inválidos') {
    super({
      internalMessage: message,
      externalMessage: message,
      context: ProductFiscalInvalidValuesError.name,
    });
  }
}
