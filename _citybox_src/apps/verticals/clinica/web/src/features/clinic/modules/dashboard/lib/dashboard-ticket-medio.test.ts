import { describe, expect, it } from 'vitest';
import { MOCK_DASHBOARD_TICKET_MEDIO } from '../data/mock-dashboard-ticket-medio';
import {
  buildTicketMedioTimeline,
  formatTicketMedioYTick,
  maxSeriesCents,
  resolveTicketMedioLegendLabels,
  resolveTicketMedioYAxis,
} from './dashboard-ticket-medio';

describe('dashboard-ticket-medio', () => {
  it('builds monthly timeline with day labels and previous month series', () => {
    const report = buildTicketMedioTimeline({
      metrics: MOCK_DASHBOARD_TICKET_MEDIO,
      periodMode: 'monthly',
      year: 2026,
      month: 7,
    });

    expect(report.rendimento.points.length).toBe(31);
    expect(report.lucratividade.points[0]?.label).toBe('1');
    expect(report.rendimento.points[0]?.previousCents).toBeGreaterThanOrEqual(0);
    expect(report.rendimento.currentAverageCents).toBeGreaterThan(0);
    expect(report.lucratividade.currentAverageCents).toBeGreaterThan(0);
  });

  it('builds annual timeline with 12 months comparing year vs previous', () => {
    const report = buildTicketMedioTimeline({
      metrics: MOCK_DASHBOARD_TICKET_MEDIO,
      periodMode: 'annual',
      year: 2026,
    });

    expect(report.rendimento.points).toHaveLength(12);
    expect(report.rendimento.points.map((p) => p.label)).toEqual([
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ]);
    expect(report.lucratividade.points[6]?.currentCents).toBeGreaterThan(0);
  });

  it('defines Y axis ticks in 50 mil steps for large values', () => {
    const axis = resolveTicketMedioYAxis(9_500_000);
    expect(axis.ticks[0]).toBe(0);
    expect(axis.ticks.length).toBeGreaterThanOrEqual(3);
    expect(axis.domain[1]).toBeGreaterThanOrEqual(9_500_000);
    expect(formatTicketMedioYTick(5_000_000)).toBe('50 mil');
    expect(formatTicketMedioYTick(10_000_000)).toBe('100 mil');
    expect(formatTicketMedioYTick(150_000_000)).toBe('1,5 mi');
    expect(formatTicketMedioYTick(500_000_000)).toBe('5 mi');
  });

  it('uses enough ticks for small ticket values (not only 0 and top)', () => {
    const axis = resolveTicketMedioYAxis(137_062);
    expect(axis.ticks.length).toBeGreaterThanOrEqual(3);
    expect(axis.ticks[0]).toBe(0);
    expect(axis.domain[1]).toBeGreaterThanOrEqual(137_062);
  });

  it('uses a smaller step when max is low', () => {
    const axis = resolveTicketMedioYAxis(1_200_000);
    expect(axis.ticks[0]).toBe(0);
    expect(axis.ticks.length).toBeGreaterThanOrEqual(3);
    expect(axis.domain[1]).toBeGreaterThanOrEqual(1_200_000);
  });

  it('resolves legend labels by period mode', () => {
    expect(resolveTicketMedioLegendLabels('monthly')).toEqual({
      current: 'Mês corrente',
      previous: 'Mês anterior',
    });
    expect(resolveTicketMedioLegendLabels('annual')).toEqual({
      current: 'Ano corrente',
      previous: 'Ano anterior',
    });
  });

  it('computes max across both series on a point', () => {
    const report = buildTicketMedioTimeline({
      metrics: MOCK_DASHBOARD_TICKET_MEDIO,
      periodMode: 'monthly',
      year: 2026,
      month: 7,
    });
    expect(maxSeriesCents(report.lucratividade)).toBeGreaterThan(0);
  });
});
