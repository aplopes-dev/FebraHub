import { describe, expect, it } from 'vitest';
import {
  buildMonthlySalesSeries,
  calcDailyGoalPercent,
  calcGoalProgressPercent,
  calcNeededPerBusinessDay,
  calcPaceVariance,
  countBusinessDaysInMonth,
  countRemainingBusinessDays,
  sumDailySalesCents,
  sumDailySalesInMonth,
  sumDailySalesOnDate,
} from './sales-goals';

const NO_HOLIDAYS: { date: string; name: string }[] = [];

describe('sales-goals aggregates', () => {
  const dailySales = [
    { date: '2026-07-10', valueCents: 100_000 },
    { date: '2026-07-20', valueCents: 50_000 },
  ];

  it('sums daily sales', () => {
    expect(sumDailySalesCents(dailySales)).toBe(150_000);
  });

  it('sums sales on a given date', () => {
    expect(sumDailySalesOnDate(dailySales, '2026-07-20')).toBe(50_000);
    expect(sumDailySalesOnDate(dailySales, new Date(2026, 6, 10))).toBe(
      100_000,
    );
    expect(sumDailySalesOnDate(dailySales, '2026-07-11')).toBe(0);
  });

  it('sums sales of a civil month only', () => {
    const withOtherMonths = [
      ...dailySales,
      { date: '2026-06-30', valueCents: 30_000 },
      { date: '2026-08-01', valueCents: 70_000 },
    ];
    expect(sumDailySalesInMonth(withOtherMonths, { year: 2026, month: 7 })).toBe(
      150_000,
    );
    expect(sumDailySalesInMonth(withOtherMonths, { year: 2026, month: 8 })).toBe(
      70_000,
    );
    expect(sumDailySalesInMonth(withOtherMonths, { year: 2026, month: 9 })).toBe(
      0,
    );
  });
});

describe('business days helpers', () => {
  it('counts business days in month excluding weekends and holidays', () => {
    // Julho/2026: 23 dias úteis sem feriados.
    expect(
      countBusinessDaysInMonth({ year: 2026, month: 7, holidays: NO_HOLIDAYS }),
    ).toBe(23);
    expect(
      countBusinessDaysInMonth({
        year: 2026,
        month: 7,
        holidays: [{ date: '2026-07-09', name: 'Feriado teste' }],
      }),
    ).toBe(22);
  });

  it('counts remaining business days from tomorrow within the month', () => {
    // Hoje 20/07/2026 (segunda): restam 21..31 → 9 dias úteis.
    expect(
      countRemainingBusinessDays({
        year: 2026,
        month: 7,
        today: new Date(2026, 6, 20),
        holidays: NO_HOLIDAYS,
      }),
    ).toBe(9);
  });

  it('returns 0 for past months and full month for future months', () => {
    expect(
      countRemainingBusinessDays({
        year: 2026,
        month: 6,
        today: new Date(2026, 6, 20),
        holidays: NO_HOLIDAYS,
      }),
    ).toBe(0);
    expect(
      countRemainingBusinessDays({
        year: 2026,
        month: 8,
        today: new Date(2026, 6, 20),
        holidays: NO_HOLIDAYS,
      }),
    ).toBe(21);
  });
});

describe('buildMonthlySalesSeries', () => {
  it('shows every day of the month with the goal ramping per business day', () => {
    const series = buildMonthlySalesSeries({
      dailySales: [
        { date: '2026-07-21', valueCents: 100_000 },
        { date: '2026-07-22', valueCents: 50_000 },
      ],
      startDate: '2026-07-21',
      year: 2026,
      month: 7,
      goalCents: 1_000_000,
      holidays: NO_HOLIDAYS,
    });

    expect(series).toHaveLength(31);
    expect(series[0]).toMatchObject({
      day: 1,
      date: '2026-07-01',
      realizedCumulativeCents: 0,
      // 1º dia útil de 23 → round(1/23 * 1_000_000)
      expectedCumulativeCents: Math.round((1 / 23) * 1_000_000),
    });
    expect(series[19]?.realizedCumulativeCents).toBe(0);
    expect(series[20]).toMatchObject({
      date: '2026-07-21',
      realizedCumulativeCents: 100_000,
    });
    expect(series[21]).toMatchObject({
      date: '2026-07-22',
      realizedCumulativeCents: 150_000,
    });
    // Dias futuros carregam o acumulado atual.
    expect(series[30]?.realizedCumulativeCents).toBe(150_000);
    // A rampa fecha exatamente na meta no último dia do mês.
    expect(series[30]?.expectedCumulativeCents).toBe(1_000_000);
  });

  it('resets the accumulation on month change (prior months do not carry over)', () => {
    const series = buildMonthlySalesSeries({
      dailySales: [
        { date: '2026-06-29', valueCents: 40_000 },
        { date: '2026-07-02', valueCents: 60_000 },
      ],
      startDate: '2026-06-28',
      year: 2026,
      month: 7,
      goalCents: 500_000,
      holidays: NO_HOLIDAYS,
    });

    expect(series).toHaveLength(31);
    // Venda de junho não entra na visão de julho.
    expect(series[0]).toMatchObject({
      date: '2026-07-01',
      realizedCumulativeCents: 0,
    });
    expect(series[1]).toMatchObject({
      date: '2026-07-02',
      realizedCumulativeCents: 60_000,
    });
    expect(series[30]?.realizedCumulativeCents).toBe(60_000);

    // Agosto sem vendas: série zerada do início ao fim.
    const nextMonth = buildMonthlySalesSeries({
      dailySales: [
        { date: '2026-06-29', valueCents: 40_000 },
        { date: '2026-07-02', valueCents: 60_000 },
      ],
      startDate: '2026-06-28',
      year: 2026,
      month: 8,
      goalCents: 500_000,
      holidays: NO_HOLIDAYS,
    });
    expect(nextMonth.every((p) => p.realizedCumulativeCents === 0)).toBe(true);
  });

  it('ignores sales before startDate', () => {
    const series = buildMonthlySalesSeries({
      dailySales: [
        { date: '2026-07-01', valueCents: 999_999 },
        { date: '2026-07-21', valueCents: 100_000 },
      ],
      startDate: '2026-07-21',
      year: 2026,
      month: 7,
      goalCents: 1_000_000,
      holidays: NO_HOLIDAYS,
    });

    expect(series[0]?.realizedCumulativeCents).toBe(0);
    expect(series[20]?.realizedCumulativeCents).toBe(100_000);
  });

  it('returns empty series without startDate', () => {
    expect(
      buildMonthlySalesSeries({
        dailySales: [],
        startDate: '',
        year: 2026,
        month: 7,
        goalCents: 100,
        holidays: NO_HOLIDAYS,
      }),
    ).toEqual([]);
  });
});

describe('sales-goals progress helpers', () => {
  it('calculates progress percent with one decimal', () => {
    expect(calcGoalProgressPercent(412_500, 5_500_000)).toBe(7.5);
    expect(calcGoalProgressPercent(0, 0)).toBe(0);
  });

  it('does not cap progress above 100% (meta superada)', () => {
    expect(calcGoalProgressPercent(150_000, 100_000)).toBe(150);
    expect(calcGoalProgressPercent(101_000, 100_000)).toBe(101);
  });

  it('calculates needed per business day rounding up', () => {
    expect(calcNeededPerBusinessDay(2_410_000, 8)).toBe(301_250);
    expect(calcNeededPerBusinessDay(100, 0)).toBe(0);
  });

  it('calculates daily goal percent capped at 100', () => {
    expect(calcDailyGoalPercent(150_000, 300_000)).toBe(50);
    expect(calcDailyGoalPercent(400_000, 300_000)).toBe(100);
    expect(calcDailyGoalPercent(100, 0)).toBe(0);
    expect(calcDailyGoalPercent(100, 200, false)).toBe(0);
  });

  it('calcPaceVariance reports above/below expected', () => {
    expect(
      calcPaceVariance({ realizedCents: 80_000, expectedCents: 100_000 }),
    ).toEqual({
      diffCents: -20_000,
      absDiffCents: 20_000,
      direction: 'below',
      percent: 20,
    });
    expect(
      calcPaceVariance({ realizedCents: 120_000, expectedCents: 100_000 }),
    ).toMatchObject({ direction: 'above', percent: 20 });
  });
});
