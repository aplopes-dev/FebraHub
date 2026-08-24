import { DomainError } from '../../../../shared/core/errors/domain.error';

export class PosSaleCancelForbiddenError extends DomainError {
  constructor(detail: string) {
    super({
      internalMessage: `PosSale cancel forbidden: ${detail}`,
      externalMessage:
        'Não é possível cancelar esta venda neste terminal. Verifique permissões e se a venda é deste PDV.',
      context: PosSaleCancelForbiddenError.name,
    });
  }
}
