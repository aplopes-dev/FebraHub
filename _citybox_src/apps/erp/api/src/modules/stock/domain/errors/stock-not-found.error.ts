import { DomainError } from '../../../../shared/core/errors/domain.error';

export class StockNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Stock ${id} not found in the current organization`,
      externalMessage: 'Estoque não encontrado',
      context: StockNotFoundError.name,
    });
  }
}
