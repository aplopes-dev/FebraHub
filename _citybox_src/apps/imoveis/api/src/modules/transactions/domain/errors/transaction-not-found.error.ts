import { DomainError } from '../../../../shared/core/errors/domain.error';

export class TransactionNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Transaction not found: id=${id}`,
      externalMessage: 'Negócio não encontrado.',
      context: 'TransactionNotFoundError',
    });
  }
}
