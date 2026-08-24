import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';

export class CardRateTierInvalidError extends ValidatorDomainError {
  constructor(reason: string) {
    super({
      internalMessage: `Invalid card rate tier: ${reason}`,
      externalMessage: `Faixa de parcelas inválida: ${reason}`,
      context: CardRateTierInvalidError.name,
    });
  }
}
