import { describe, expect, it } from 'vitest';
import { getTodayIsoDateOnly, parseIsoDateString, toIsoDateOnly } from './patient-document-date';

describe('patient-document-date', () => {
  it('formats today in local timezone', () => {
    expect(getTodayIsoDateOnly(new Date(2026, 6, 1, 23, 30))).toBe('2026-07-01');
  });

  it('round-trips date picker values in local timezone', () => {
    const date = parseIsoDateString('2026-07-01');
    expect(toIsoDateOnly(date)).toBe('2026-07-01');
  });
});
