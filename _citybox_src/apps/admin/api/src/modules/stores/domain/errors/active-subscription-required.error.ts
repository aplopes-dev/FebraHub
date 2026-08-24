import { DomainError } from '../../../../shared/core/errors/domain.error';

/**
 * Vivia em `modules/clients` até a Fase 10. A assinatura passou a ser por loja
 * (ADR PLAT-001), então o erro mudou de dono junto com a chave.
 */
export class ActiveSubscriptionRequiredError extends DomainError {
  constructor(context: string, storeId: string) {
    super({
      internalMessage: `Active subscription required for store: ${storeId}`,
      externalMessage:
        'Esta loja não possui assinatura ativa na plataforma. Operação bloqueada.',
      context,
    });
  }
}
