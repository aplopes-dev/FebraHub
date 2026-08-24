const CURRENCY_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

const COMPACT_CURRENCY_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const COMPACT_NUMBER_FORMATTER = new Intl.NumberFormat('pt-BR', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const NUMBER_FORMATTER = new Intl.NumberFormat('pt-BR');

/** R$ 1.500.000 */
export function formatCurrency(value: number): string {
  return CURRENCY_FORMATTER.format(value);
}

/** Formata centavos como moeda BRL (divide por 100). */
export function formatCents(cents: number): string {
  return formatCurrency(cents / 100);
}

/** R$ 96,7 mi */
export function formatCompactCurrency(value: number): string {
  return COMPACT_CURRENCY_FORMATTER.format(value);
}

/** 2 mil */
export function formatCompactNumber(value: number): string {
  return COMPACT_NUMBER_FORMATTER.format(value);
}

/** 1.284 */
export function formatNumber(value: number): string {
  return NUMBER_FORMATTER.format(value);
}

/** +12% / -12% */
export function formatPercent(value: number): string {
  const signal = value > 0 ? '+' : '';
  return `${signal}${NUMBER_FORMATTER.format(value)}%`;
}
