import { DomainError } from '../../../../../shared/core/errors/domain.error';

export class CardContractNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Card contract ${id} not found in the current organization`,
      externalMessage: 'Contrato de cartão não encontrado',
      context: CardContractNotFoundError.name,
    });
  }
}
