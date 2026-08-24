import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ProductionOrderInvalidTransitionError extends DomainError {
  constructor(fromStatus: string, toStatus: string) {
    super({
      internalMessage: `ProductionOrder cannot transition from ${fromStatus} to ${toStatus}`,
      externalMessage:
        'Não é possível alterar a situação da ordem de produção neste estado.',
      context: ProductionOrderInvalidTransitionError.name,
    });
  }
}
