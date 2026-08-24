import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PosSaleNotFoundError extends DomainError {
  constructor(saleId: string) {
    super({
      internalMessage: `PosSale ${saleId} not found`,
      externalMessage: 'Venda não encontrada.',
      context: PosSaleNotFoundError.name,
    });
  }
}
