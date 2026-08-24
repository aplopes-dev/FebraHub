import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';

/**
 * Nenhuma taxa pôde ser resolvida para o número de parcelas informado — nem
 * faixa progressiva correspondente, nem taxa base configurada no método
 * (research.md D7). Sinal para o chamador (`resolve-card-settlement`) tratar
 * como "sem correspondência" e cair no fallback bruto (FR-005) — nunca deve
 * escapar até o fechamento da venda.
 */
export class CardSettlementRateUnresolvedError extends ValidatorDomainError {
  constructor(installments: number) {
    super({
      internalMessage: `No rate resolvable for ${installments} installment(s): no matching progressive tier and no base rate configured`,
      externalMessage:
        'Não foi possível calcular a taxa para o número de parcelas informado.',
      context: CardSettlementRateUnresolvedError.name,
    });
  }
}
