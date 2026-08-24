import { DomainError } from '../../../../shared/core/errors/domain.error';

export class StoreNotFoundError extends DomainError {
  constructor(context: string, storeId: string) {
    super({
      internalMessage: `Store "${storeId}" not found`,
      externalMessage: 'Loja não encontrada',
      context,
    });
  }
}
