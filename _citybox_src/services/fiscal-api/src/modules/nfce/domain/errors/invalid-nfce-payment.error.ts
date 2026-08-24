import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';

/// Pagamento incoerente com a venda (FR-005): lista vazia, soma que não fecha
/// com o total, ou troco declarado em forma que não é dinheiro.
///
/// 422 — o pedido é corrigível pelo chamador.
///
/// ⚠️ Recusar aqui é o ponto todo. Um cupom com pagamento que não fecha é
/// aceito pela SEFAZ (o schema não confere a soma) e vira divergência
/// contábil descoberta no fechamento do mês, sem rastro de qual venda a
/// causou.
export class InvalidNfcePaymentError extends ValidatorDomainError {
  constructor(context: string, reason: string, externalReason: string) {
    super({
      internalMessage: `Invalid NFC-e payment: ${reason}`,
      externalMessage: externalReason,
      externalCode: 'INVALID_NFCE_PAYMENT',
      context,
    });
  }
}
