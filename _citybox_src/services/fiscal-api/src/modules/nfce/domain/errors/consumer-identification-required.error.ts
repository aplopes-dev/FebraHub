import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';

/// FR-004 — venda acima do limite estadual sem consumidor identificado.
///
/// 422 (via `ValidatorDomainError`), não 424: diferente do CSC ausente, aqui
/// **o pedido é corrigível** — informar o CPF/CNPJ do consumidor resolve, sem
/// passo administrativo junto ao órgão.
///
/// A mensagem diz o limite e o caminho de saída. "Valor acima do permitido"
/// sozinho deixaria o operador de caixa sem saber se pede o CPF, divide a
/// venda ou emite NF-e — com o cliente esperando no balcão.
export class ConsumerIdentificationRequiredError extends ValidatorDomainError {
  constructor(
    context: string,
    public readonly totalAmount: number,
    public readonly limit: number,
    uf: string,
  ) {
    super({
      internalMessage: `NFC-e total ${totalAmount} exceeds the ${uf} limit of ${limit} for unidentified consumers`,
      externalMessage:
        `Venda de R$ ${totalAmount.toFixed(2)} excede o limite de R$ ${limit.toFixed(2)} ` +
        `para cupom sem identificação do consumidor em ${uf.toUpperCase()}. ` +
        `Informe o CPF ou CNPJ do consumidor, ou emita uma NF-e.`,
      externalCode: 'CONSUMER_IDENTIFICATION_REQUIRED',
      context,
    });
  }
}
