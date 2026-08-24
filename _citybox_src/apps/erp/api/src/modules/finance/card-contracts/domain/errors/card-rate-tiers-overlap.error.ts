import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';

export class CardRateTiersOverlapError extends ValidatorDomainError {
  constructor(first: string, second: string) {
    super({
      internalMessage: `Card rate tiers overlap: ${first} and ${second}`,
      externalMessage: `As faixas de parcelas não podem se sobrepor (${first} e ${second})`,
      context: CardRateTiersOverlapError.name,
    });
  }
}
