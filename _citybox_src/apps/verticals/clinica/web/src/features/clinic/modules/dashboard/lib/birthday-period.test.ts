import { describe, expect, it } from 'vitest';
import { MOCK_DASHBOARD_BIRTHDAY_PATIENTS } from '../data/mock-clinic-dashboard';
import {
  BIRTHDAY_PERIOD_OPTIONS,
  buildBirthdayRelativeLabel,
  filterBirthdayPatients,
  isBirthdayInDateRange,
  resolveBirthdayPeriodRange,
} from './birthday-period';
import { calculateLocalAge, daysUntilNextBirthday } from './dashboard-dates';

describe('dashboard-dates', () => {
  const referenceDate = new Date(2026, 6, 17);

  it('calculates age without UTC shift for yyyy-MM-dd', () => {
    expect(calculateLocalAge('1985-07-17', referenceDate)).toBe(41);
    expect(calculateLocalAge('1985-07-18', referenceDate)).toBe(40);
  });

  it('handles year wrap for next birthday', () => {
    expect(daysUntilNextBirthday('1990-01-05', referenceDate)).toBe(
      // from Jul 17 to Jan 5 next year
      daysUntilNextBirthday('1990-01-05', referenceDate),
    );
    expect(daysUntilNextBirthday('1990-01-05', referenceDate)).toBeGreaterThan(30);
    expect(daysUntilNextBirthday('1985-07-17', referenceDate)).toBe(0);
  });
});

describe('birthday-period', () => {
  const referenceDate = new Date(2026, 6, 17);

  it('resolves this_week as Monday through Saturday', () => {
    expect(resolveBirthdayPeriodRange('this_week', referenceDate)).toEqual({
      startDate: '2026-07-13',
      endDate: '2026-07-18',
    });
  });

  it('resolves next_30_days range from today', () => {
    expect(resolveBirthdayPeriodRange('next_30_days', referenceDate)).toEqual({
      startDate: '2026-07-17',
      endDate: '2026-08-16',
    });
  });

  it('detects birthday spanning year boundary', () => {
    expect(
      isBirthdayInDateRange('1990-01-02', {
        startDate: '2026-12-20',
        endDate: '2027-01-10',
      }),
    ).toBe(true);
  });

  it('keeps period options in the product order', () => {
    expect(BIRTHDAY_PERIOD_OPTIONS.map((option) => option.value)).toEqual([
      'today',
      'this_week',
      'this_month',
      'last_30_days',
      'next_30_days',
      'custom',
    ]);
  });

  it('filters active patients for next 30 days and sorts by daysUntil', () => {
    const items = filterBirthdayPatients({
      patients: MOCK_DASHBOARD_BIRTHDAY_PATIENTS,
      period: 'next_30_days',
      referenceDate,
    });

    expect(items.every((item) => item.status === 'active')).toBe(true);
    expect(items.map((item) => item.name)).toEqual([
      'Ana Carolina Silva',
      'Isabela Teixeira Dias',
      'Daniel Oliveira Costa',
      'Bruno Henrique Santos',
      'Henrique Barbosa Nunes',
    ]);
    expect(items[0]?.relativeLabel).toBe('Hoje (41 anos)');
    expect(items[1]?.relativeLabel).toBe('Falta 1 dia (30 anos)');
  });

  it('filters by patient name search', () => {
    const items = filterBirthdayPatients({
      patients: MOCK_DASHBOARD_BIRTHDAY_PATIENTS,
      period: 'next_30_days',
      referenceDate,
      search: 'ana',
    });

    expect(items.map((item) => item.name)).toEqual(['Ana Carolina Silva']);
  });

  it('builds relative label copy', () => {
    expect(buildBirthdayRelativeLabel(0, 55)).toBe('Hoje (55 anos)');
    expect(buildBirthdayRelativeLabel(1, 55)).toBe('Falta 1 dia (55 anos)');
    expect(buildBirthdayRelativeLabel(2, 55)).toBe('Faltam 2 dias (55 anos)');
  });
});
