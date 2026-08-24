import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PriceListNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Price list ${id} not found`,
      externalMessage: 'Lista de preços não encontrada',
      context: PriceListNotFoundError.name,
    });
  }
}
