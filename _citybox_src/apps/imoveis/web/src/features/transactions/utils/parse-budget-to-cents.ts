/**
 * Converte orçamento livre (`budgetRange`) em centavos quando o texto
 * tem um valor parseável (ex.: "R$ 550 mil", "1,6 mi", "R$ 7.000").
 * Em faixas, usa o primeiro número.
 */
export function parseBudgetRangeToCents(raw: string): number | undefined {
  const text = raw.trim().toLowerCase();
  if (!text) return undefined;

  const match = text.match(
    /(\d{1,3}(?:[.\s]\d{3})+|\d+(?:[.,]\d+)?)\s*(milh[oõ]es|mil|mi)?/,
  );
  if (!match) return undefined;

  const amountToken = match[1]!.replace(/\s/g, '');
  const unit = match[2];
  const normalized = amountToken.includes(',')
    ? amountToken.replace(/\./g, '').replace(',', '.')
    : amountToken.includes('.') && /^\d{1,3}(\.\d{3})+$/.test(amountToken)
      ? amountToken.replace(/\./g, '')
      : amountToken;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return undefined;

  let reais = amount;
  if (unit === 'mil') reais = amount * 1_000;
  if (unit === 'mi' || unit === 'milhões' || unit === 'milhoes') {
    reais = amount * 1_000_000;
  }

  return Math.round(reais * 100);
}

export function propertyCostToCents(cost: number): number | undefined {
  if (!Number.isFinite(cost) || cost <= 0) return undefined;
  return Math.round(cost * 100);
}
