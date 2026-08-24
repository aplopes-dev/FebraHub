const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const DATE = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const TIME = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function formatBRL(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return '';
  }
  return BRL.format(amount);
}

export function formatCentsBRL(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || Number.isNaN(cents)) {
    return '';
  }
  return formatBRL(cents / 100);
}

export function formatPtBrDate(value: Date | null | undefined): string {
  if (!value) return '';
  return DATE.format(value);
}

export function formatPtBrTime(value: Date | null | undefined): string {
  if (!value) return '';
  return TIME.format(value);
}

export function joinAddress(
  parts: readonly (string | null | undefined)[],
): string {
  return parts
    .map((part) => part?.trim() ?? '')
    .filter(Boolean)
    .join(', ');
}
