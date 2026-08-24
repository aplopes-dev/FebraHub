import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ProductionOrderNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `ProductionOrder ${id} not found in the current organization`,
      externalMessage: 'Ordem de produção não encontrada',
      context: ProductionOrderNotFoundError.name,
    });
  }
}
