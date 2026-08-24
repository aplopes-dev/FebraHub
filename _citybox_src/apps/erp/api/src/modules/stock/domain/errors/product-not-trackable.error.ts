import { DomainError } from '../../../../shared/core/errors/domain.error';

export class ProductNotTrackableError extends DomainError {
  constructor(productId: string) {
    super({
      internalMessage: `Product ${productId} does not track stock`,
      externalMessage:
        'Somente produtos com controle de estoque podem entrar na movimentação.',
      context: ProductNotTrackableError.name,
    });
  }
}
