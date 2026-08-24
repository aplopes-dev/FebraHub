import { DomainError } from '../../../../shared/core/errors/domain.error';

export class TechnicalSheetInvalidValuesError extends DomainError {
  constructor(message = 'Valores da ficha técnica inválidos') {
    super({
      internalMessage: message,
      externalMessage: message,
      context: TechnicalSheetInvalidValuesError.name,
    });
  }
}
