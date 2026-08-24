import { describe, expect, it } from 'vitest';
import { MOCK_DASHBOARD_COMMISSIONS } from '../data/mock-dashboard-commissions';
import {
  filterCommissionsByCardPeriod,
  filterCommissionsForProfessional,
  getCommissionYears,
  groupCommissionsByRule,
  rankProfessionalsByNet,
  summarizeByTrigger,
  summarizeByType,
  summarizeCommissionGrossTotal,
  summarizeCommissionNetTotal,
} from './dashboard-commissions';

describe('dashboard-commissions', () => {
  it('filters by card period', () => {
    const july = filterCommissionsByCardPeriod({
      rows: MOCK_DASHBOARD_COMMISSIONS,
      periodMode: 'monthly',
      year: 2026,
      month: 7,
    });
    expect(july.every((row) => row.paidAt.startsWith('2026-07-'))).toBe(true);
    expect(july.length).toBeGreaterThan(0);
  });

  it('summarizes net vs gross and breakdowns', () => {
    const july = filterCommissionsByCardPeriod({
      rows: MOCK_DASHBOARD_COMMISSIONS,
      periodMode: 'monthly',
      year: 2026,
      month: 7,
    });
    const net = summarizeCommissionNetTotal(july);
    const gross = summarizeCommissionGrossTotal(july);
    expect(gross).toBeGreaterThanOrEqual(net);

    const triggers = summarizeByTrigger(july);
    expect(triggers).toHaveLength(3);
    expect(triggers.reduce((sum, item) => sum + item.grossCents, 0)).toBe(gross);

    const types = summarizeByType(july);
    expect(types).toHaveLength(2);
    expect(types.reduce((sum, item) => sum + item.grossCents, 0)).toBe(gross);
  });

  it('ranks professionals by net descending', () => {
    const july = filterCommissionsByCardPeriod({
      rows: MOCK_DASHBOARD_COMMISSIONS,
      periodMode: 'monthly',
      year: 2026,
      month: 7,
    });
    const ranking = rankProfessionalsByNet(july);
    expect(ranking.length).toBeGreaterThan(0);
    for (let i = 1; i < ranking.length; i += 1) {
      expect(ranking[i - 1]!.netCents).toBeGreaterThanOrEqual(
        ranking[i]!.netCents,
      );
    }
  });

  it('filters by professional and lists years', () => {
    const marina = filterCommissionsForProfessional(
      MOCK_DASHBOARD_COMMISSIONS,
      'pro-marina',
    );
    expect(marina.every((row) => row.professionalId === 'pro-marina')).toBe(
      true,
    );
    expect(getCommissionYears(MOCK_DASHBOARD_COMMISSIONS)).toEqual([
      2026, 2025,
    ]);
  });

  it('groups by trigger, plan, specialty and treatment', () => {
    const groups = groupCommissionsByRule(MOCK_DASHBOARD_COMMISSIONS);
    expect(groups.length).toBeGreaterThan(0);
    for (const group of groups) {
      expect(group.triggerLabel.length).toBeGreaterThan(0);
      expect(group.planName.length).toBeGreaterThan(0);
      expect(group.specialtyName.length).toBeGreaterThan(0);
      expect(group.treatmentSummary.length).toBeGreaterThan(0);
      expect(group.totalNetCents).toBe(
        group.rows.reduce((sum, row) => sum + row.netCents, 0),
      );
      expect(
        group.rows.every(
          (row) =>
            row.trigger === group.trigger &&
            row.planName === group.planName &&
            row.specialtyName === group.specialtyName &&
            row.treatmentName === group.treatmentSummary,
        ),
      ).toBe(true);
    }
  });
});
