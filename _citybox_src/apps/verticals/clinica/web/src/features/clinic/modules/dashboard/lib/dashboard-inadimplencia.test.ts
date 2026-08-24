import { describe, expect, it } from 'vitest';
import { MOCK_DASHBOARD_INADIMPLENCIA } from '../data/mock-dashboard-inadimplencia';
import {
  buildInadimplenciaReport,
  filterInadimplenciaDebts,
  formatInadimplenciaDialogTitle,
  formatInadimplenciaRate,
  getInadimplenciaYears,
  listUnpaidInadimplenciaDebts,
} from './dashboard-inadimplencia';

describe('dashboard-inadimplencia', () => {
  it('excludes patients no longer delinquent', () => {
    const filtered = filterInadimplenciaDebts(MOCK_DASHBOARD_INADIMPLENCIA, {
      mode: 'monthly',
      year: 2026,
      month: 7,
    });
    expect(filtered.some((d) => d.id === 'ina-008')).toBe(false);
    expect(filtered.map((d) => d.id).sort()).toEqual([
      'ina-001',
      'ina-002',
      'ina-003',
      'ina-004',
    ]);
  });

  it('filters by annual due date year', () => {
    const filtered = filterInadimplenciaDebts(MOCK_DASHBOARD_INADIMPLENCIA, {
      mode: 'annual',
      year: 2025,
      month: 7,
    });
    expect(filtered.map((d) => d.id).sort()).toEqual(['ina-007', 'ina-010']);
  });

  it('computes rate as unpaid / total debts × 100', () => {
    const filtered = filterInadimplenciaDebts(MOCK_DASHBOARD_INADIMPLENCIA, {
      mode: 'monthly',
      year: 2026,
      month: 7,
    });
    const report = buildInadimplenciaReport(filtered);
    // 150k + 80k + 220k + 45k = 495k total
    // unpaid: 150 + 40 + 220 + 0 = 410k → 82.8%
    expect(report.totalDebtsCents).toBe(495_000);
    expect(report.unpaidCents).toBe(410_000);
    expect(report.receivedCents).toBe(85_000);
    expect(report.ratePercent).toBe(82.8);
    expect(report.slices).toHaveLength(2);
    expect(report.slices[0]!.key).toBe('unpaid');
    expect(report.slices[1]!.key).toBe('received');
  });

  it('returns zero rate when there are no debts in period', () => {
    const report = buildInadimplenciaReport([]);
    expect(report.ratePercent).toBe(0);
    expect(report.totalDebtsCents).toBe(0);
    expect(report.slices.every((s) => s.valueCents === 0)).toBe(true);
  });

  it('lists years from due dates descending', () => {
    expect(getInadimplenciaYears(MOCK_DASHBOARD_INADIMPLENCIA)).toEqual([
      2026, 2025,
    ]);
  });

  it('formats rate for display', () => {
    expect(formatInadimplenciaRate(82.8)).toBe('82,8%');
    expect(formatInadimplenciaRate(50)).toBe('50%');
  });

  it('builds dialog title for monthly and annual modes', () => {
    expect(
      formatInadimplenciaDialogTitle({
        mode: 'monthly',
        year: 2026,
        month: 7,
      }),
    ).toBe('Inadimplentes de Julho de 2026');
    expect(
      formatInadimplenciaDialogTitle({
        mode: 'annual',
        year: 2026,
        month: 7,
      }),
    ).toBe('Inadimplentes de 2026');
  });

  it('lists only unpaid debts with days overdue', () => {
    const filtered = filterInadimplenciaDebts(MOCK_DASHBOARD_INADIMPLENCIA, {
      mode: 'monthly',
      year: 2026,
      month: 7,
    });
    const rows = listUnpaidInadimplenciaDebts(
      filtered,
      new Date(2026, 6, 20),
    );
    expect(rows.map((row) => row.id)).toEqual([
      'ina-001',
      'ina-002',
      'ina-003',
    ]);
    expect(rows[0]!.daysOverdue).toBe(15);
    expect(rows.every((row) => row.unpaidCents > 0)).toBe(true);
  });
});
