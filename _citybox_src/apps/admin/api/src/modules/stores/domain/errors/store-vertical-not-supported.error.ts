import { DomainError } from '../../../../shared/core/errors/domain.error';

/**
 * Operação disponível só para lojas da vertical Clínica (ex.: pacotes de assinatura).
 */
export class StoreVerticalNotSupportedError extends DomainError {
  constructor(context: string, vertical: string, feature: string) {
    super({
      internalMessage: `Vertical ${vertical} não suporta ${feature}`,
      externalMessage: `Esta operação (${feature}) só está disponível para lojas da vertical Clínica. A loja é da vertical ${vertical}.`,
      context,
    });
  }
}
