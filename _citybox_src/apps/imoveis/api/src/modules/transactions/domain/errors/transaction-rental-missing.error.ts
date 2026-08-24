import { DomainError } from '../../../../shared/core/errors/domain.error';

export class TransactionRentalMissingError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Transaction has no rental config: id=${id}`,
      externalMessage: 'Negócio sem configuração de locação.',
      context: 'TransactionRentalMissingError',
    });
  }
}
