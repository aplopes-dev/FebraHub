import { InvalidBrlCurrencyError } from '../../domain/errors/invalid-brl-currency.error';

export function parseBrlToCents(
  value: string,
  context = 'parseBrlToCents',
): number {
  const digits = value.replace(/\D/g, '');
  if (digits === '') {
    if (value.trim() === '') {
      return 0;
    }
    throw new InvalidBrlCurrencyError(context, value);
  }
  const cents = Number.parseInt(digits, 10);
  if (Number.isNaN(cents) || cents < 0) {
    throw new InvalidBrlCurrencyError(context, value);
  }
  return cents;
}
