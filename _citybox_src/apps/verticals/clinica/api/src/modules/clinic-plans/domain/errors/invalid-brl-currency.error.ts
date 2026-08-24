import { DomainError } from '../../../../shared/core/errors/domain.error';

export class InvalidBrlCurrencyError extends DomainError {
  constructor(context: string, value: string) {
    super({
      internalMessage: `Invalid BRL currency value: "${value}"`,
      externalMessage: 'Valor monetário inválido',
      context,
    });
  }
}
