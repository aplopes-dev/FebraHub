import { describe, expect, it } from 'vitest';
import { MOCK_DASHBOARD_ACQUISITION_PATIENTS } from '../data/mock-dashboard-patient-acquisition';
import {
  aggregateByReferralSource,
  filterPatientsByRegistrationPeriod,
  patientsForReferralSource,
  wrapAcquisitionYAxisLabel,
} from './patient-acquisition';

describe('patient-acquisition', () => {
  it('wraps long Y-axis labels into at most two lines', () => {
    expect(wrapAcquisitionYAxisLabel('Facebook')).toEqual(['Facebook']);
    expect(
      wrapAcquisitionYAxisLabel('Indicado por outro profissional externo'),
    ).toEqual(['Indicado por outro', 'profissional externo']);
    expect(
      wrapAcquisitionYAxisLabel(
        'Indicado por outro profissional da equipe',
      ),
    ).toEqual(['Indicado por outro', 'profissional da equipe']);
  });

  it('filters by annual registration year', () => {
    const filtered = filterPatientsByRegistrationPeriod(
      MOCK_DASHBOARD_ACQUISITION_PATIENTS,
      { mode: 'annual', year: 2026, month: 7 },
    );
    expect(filtered.every((p) => p.registeredAt.startsWith('2026'))).toBe(true);
    expect(filtered.some((p) => p.registeredAt.startsWith('2025'))).toBe(false);
  });

  it('filters by monthly registration', () => {
    const filtered = filterPatientsByRegistrationPeriod(
      MOCK_DASHBOARD_ACQUISITION_PATIENTS,
      { mode: 'monthly', year: 2026, month: 7 },
    );
    expect(filtered.length).toBeGreaterThan(0);
    expect(
      filtered.every((p) => p.registeredAt.startsWith('2026-07')),
    ).toBe(true);
  });

  it('aggregates referral sources with percent', () => {
    const july = filterPatientsByRegistrationPeriod(
      MOCK_DASHBOARD_ACQUISITION_PATIENTS,
      { mode: 'monthly', year: 2026, month: 7 },
    );
    const aggregates = aggregateByReferralSource(july);
    const total = aggregates.reduce((sum, row) => sum + row.count, 0);
    expect(total).toBe(july.length);
    expect(aggregates.find((row) => row.source === 'facebook')?.count).toBe(3);
  });

  it('lists patients for a source', () => {
    const july = filterPatientsByRegistrationPeriod(
      MOCK_DASHBOARD_ACQUISITION_PATIENTS,
      { mode: 'monthly', year: 2026, month: 7 },
    );
    const facebook = patientsForReferralSource(july, 'facebook');
    expect(facebook.every((p) => p.referralSource === 'facebook')).toBe(true);
  });
});
