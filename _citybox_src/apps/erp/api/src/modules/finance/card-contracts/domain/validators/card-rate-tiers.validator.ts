import { CardRateTierInvalidError } from '../errors/card-rate-tier-invalid.error';
import { CardRateTiersOverlapError } from '../errors/card-rate-tiers-overlap.error';

export type CardRateTierShape = {
  minInstallments: number;
  maxInstallments: number;
  rate: number;
};

function describeTier(tier: CardRateTierShape): string {
  return `${tier.minInstallments}–${tier.maxInstallments}x`;
}

/**
 * Confere as faixas progressivas de taxa antes de gravar.
 *
 * Faixas sobrepostas são o defeito perigoso aqui: com `2–6x` e `4–12x` no mesmo
 * método, a taxa de uma venda em 5x depende da ordem em que as linhas voltarem
 * do banco — o mesmo pedido conciliaria com dois valores diferentes. Recusar na
 * gravação é a única forma de manter o cálculo determinístico.
 *
 * A checagem ordena por `minInstallments` e compara cada faixa com a anterior:
 * ordenado, sobreposição existe se, e só se, o início de uma faixa não passar
 * do fim da faixa anterior.
 */
export function assertCardRateTiersAreValid(
  tiers: readonly CardRateTierShape[],
): void {
  for (const tier of tiers) {
    if (!Number.isInteger(tier.minInstallments) || tier.minInstallments < 1) {
      throw new CardRateTierInvalidError(
        `parcela inicial deve ser um inteiro maior que zero (recebido ${tier.minInstallments})`,
      );
    }
    if (!Number.isInteger(tier.maxInstallments)) {
      throw new CardRateTierInvalidError(
        `parcela final deve ser um inteiro (recebido ${tier.maxInstallments})`,
      );
    }
    if (tier.minInstallments > tier.maxInstallments) {
      throw new CardRateTierInvalidError(
        `parcela inicial não pode ser maior que a final (${describeTier(tier)})`,
      );
    }
    if (tier.rate < 0) {
      throw new CardRateTierInvalidError(
        `taxa não pode ser negativa (${describeTier(tier)})`,
      );
    }
  }

  const sorted = [...tiers].sort(
    (a, b) => a.minInstallments - b.minInstallments,
  );

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (current.minInstallments <= previous.maxInstallments) {
      throw new CardRateTiersOverlapError(
        describeTier(previous),
        describeTier(current),
      );
    }
  }
}
