import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PriceListNameTakenError extends DomainError {
  constructor(name: string) {
    super({
      internalMessage: `Price list name ${name} already taken in this organization`,
      externalMessage: `Já existe uma lista de preços com o nome "${name}"`,
      context: PriceListNameTakenError.name,
    });
  }
}
