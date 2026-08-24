import { DomainError } from '../../../../shared/core/errors/domain.error';

/**
 * Recebíveis da venda têm conciliação bancária ativa — cancelar apagaria
 * lançamentos já conciliados. Sufixo `InUse` → HTTP 409.
 */
export class PosSaleReceivablesInUseError extends DomainError {
  constructor(saleId: string) {
    super({
      internalMessage: `PosSale ${saleId} has reconciled financial entries`,
      externalMessage:
        'Esta venda tem recebíveis conciliados no extrato e não pode ser cancelada. Desfaça a conciliação no ERP primeiro.',
      context: PosSaleReceivablesInUseError.name,
    });
  }
}
