import { describe, expect, it } from 'vitest';
import { formatPdfPeriodLabel } from './format-pdf-period-label';

describe('formatPdfPeriodLabel', () => {
  it('formats a single day (Hoje)', () => {
    expect(formatPdfPeriodLabel('2026-08-19', '2026-08-19')).toBe('19/08/2026');
  });

  it('formats a full calendar month (Desse mês / Do mês passado)', () => {
    expect(formatPdfPeriodLabel('2026-08-01', '2026-08-31')).toBe('08/2026');
    expect(formatPdfPeriodLabel('2026-07-01', '2026-07-31')).toBe('07/2026');
  });

  it('formats a partial range (Dessa semana, últimos 30 dias)', () => {
    expect(formatPdfPeriodLabel('2026-08-17', '2026-08-22')).toBe(
      '17/08/2026 a 22/08/2026',
    );
    expect(formatPdfPeriodLabel('2026-07-19', '2026-08-18')).toBe(
      '19/07/2026 a 18/08/2026',
    );
  });

  it('falls back to raw ISO strings when dates are invalid', () => {
    expect(formatPdfPeriodLabel('invalid', '2026-08-19')).toBe(
      'invalid a 2026-08-19',
    );
  });
});
