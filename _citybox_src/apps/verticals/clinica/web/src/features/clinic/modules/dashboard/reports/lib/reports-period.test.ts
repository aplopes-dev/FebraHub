import { describe, expect, it } from 'vitest';
import { formatReportBirthdayPdfPeriodLabel } from './reports-period';

describe('formatReportBirthdayPdfPeriodLabel', () => {
  const today = new Date(2026, 7, 18);

  it('uses MM/yyyy for this month, not the filter label', () => {
    expect(formatReportBirthdayPdfPeriodLabel('this_month', today)).toBe(
      '08/2026',
    );
  });

  it('uses the calendar date for today', () => {
    expect(formatReportBirthdayPdfPeriodLabel('today', today)).toBe(
      '18/08/2026',
    );
  });

  it('uses MM/yyyy for last month', () => {
    expect(formatReportBirthdayPdfPeriodLabel('last_month', today)).toBe(
      '07/2026',
    );
  });

  it('uses a date range for rolling windows', () => {
    expect(formatReportBirthdayPdfPeriodLabel('last_30_days', today)).toBe(
      '19/07/2026 a 18/08/2026',
    );
  });
});
