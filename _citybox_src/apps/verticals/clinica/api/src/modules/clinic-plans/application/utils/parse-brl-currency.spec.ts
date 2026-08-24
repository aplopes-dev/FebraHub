import { parseBrlToCents } from './parse-brl-currency';
import { InvalidBrlCurrencyError } from '../../domain/errors/invalid-brl-currency.error';

describe('parseBrlToCents', () => {
  it('parses formatted BRL values', () => {
    expect(parseBrlToCents('R$ 150,00')).toBe(15000);
    expect(parseBrlToCents('R$ 0,00')).toBe(0);
  });

  it('throws for invalid values', () => {
    expect(() => parseBrlToCents('abc')).toThrow(InvalidBrlCurrencyError);
  });
});
