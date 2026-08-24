import { DomainError } from '../../../../../shared/core/errors/domain.error';

/**
 * D16 — um lançamento `paid` só pode ser conciliado por vínculo (sem
 * `addPayment` novo) quando tem exatamente 1 `FinancialEntryPayment`; com
 * mais de um, não há como identificar automaticamente qual pagamento
 * vincular à transação do extrato. Caso não tratado nesta entrega — nenhum
 * fluxo atual produz um lançamento `paid` com múltiplos pagamentos.
 */
export class FinancialEntryPaymentAmbiguousError extends DomainError {
  constructor(id: string) {
    super({
      internalMessage: `Financial entry ${id} is paid with more than one payment — cannot pick which one to link`,
      externalMessage:
        'Não foi possível identificar qual pagamento vincular a este lançamento',
      context: FinancialEntryPaymentAmbiguousError.name,
    });
  }
}
