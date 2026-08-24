import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PurchaseNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Purchase ${id} not found in the current organization`,
      externalMessage: 'Compra não encontrada',
      context: PurchaseNotFoundError.name,
    });
  }
}
