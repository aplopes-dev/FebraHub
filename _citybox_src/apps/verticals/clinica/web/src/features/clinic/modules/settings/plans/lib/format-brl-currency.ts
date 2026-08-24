export const EMPTY_BRL_CURRENCY = 'R$ 0,00';

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatBrlCurrencyFromCents(cents: number): string {
  return brlFormatter.format(cents / 100);
}

/** Aplica máscara monetária BRL a partir dos dígitos digitados (centavos à direita). */
export function formatBrlCurrencyInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');

  if (digits === '') {
    return EMPTY_BRL_CURRENCY;
  }

  const cents = Number.parseInt(digits, 10);
  if (Number.isNaN(cents)) {
    return EMPTY_BRL_CURRENCY;
  }

  return formatBrlCurrencyFromCents(cents);
}

/** Garante exibição com prefixo R$ mesmo para valores legados sem formatação. */
export function ensureBrlCurrencyDisplay(value: string): string {
  if (!value.trim()) {
    return EMPTY_BRL_CURRENCY;
  }

  if (value.includes('R$')) {
    return value;
  }

  return formatBrlCurrencyInput(value);
}
