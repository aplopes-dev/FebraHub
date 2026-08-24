import { formatBrlCurrencyFromCents } from '@/features/clinic/modules/settings/plans/lib/format-brl-currency';

export function formatDashboardCurrencyFromCents(cents: number): string {
  return formatBrlCurrencyFromCents(cents);
}

const amountFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Valor monetário sem o prefixo R$ (para destacar o número ao lado de R$ menor). */
export function formatDashboardAmountFromCents(cents: number): string {
  return amountFormatter.format(cents / 100);
}
