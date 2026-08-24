import { DomainError } from '../../../../shared/core/errors/domain.error';

/**
 * Pedido já gerou saída no estoque — cancelar exigiria estornar o ledger, o
 * que não é automático (mesma regra de imutabilidade de `Purchase`).
 */
export class SaleOrderMovementInUseError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `SaleOrder ${id} already has stockMovementId and cannot be cancelled`,
      externalMessage:
        'Este pedido já baixou o estoque e não pode ser cancelado. Ajuste o estoque manualmente se necessário.',
      context: SaleOrderMovementInUseError.name,
    });
  }
}
