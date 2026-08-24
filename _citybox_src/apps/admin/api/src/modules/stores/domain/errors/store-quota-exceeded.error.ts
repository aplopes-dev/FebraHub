import { DomainError } from '../../../../shared/core/errors/domain.error';

export class StoreQuotaExceededError extends DomainError {
  constructor(context: string, maxStores: number) {
    super({
      internalMessage: `Store quota exceeded. Max stores allowed: ${maxStores}`,
      externalMessage: `Limite de lojas contratado pelo plano excedido (${maxStores} lojas).`,
      context,
    });
  }
}
