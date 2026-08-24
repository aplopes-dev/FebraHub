import { describe, expect, it } from 'vitest';
import { MOCK_DASHBOARD_PATIENT_METRICS } from '../data/mock-dashboard-patient-metrics';
import {
  filterDashboardPatientMetricItems,
  findDashboardPatientMetric,
} from './dashboard-patient-metrics';
import {
  DASHBOARD_PATIENT_METRIC_DEFINITIONS,
  resolveDashboardPatientMetricCount,
} from './dashboard-patient-metric-definitions';

describe('dashboard-patient-metrics', () => {
  it('resolves a metric by id', () => {
    expect(
      findDashboardPatientMetric(
        MOCK_DASHBOARD_PATIENT_METRICS,
        'overdue_debts',
      )?.label,
    ).toBe('Pacientes com débitos em atraso');
  });

  it('filters patients by normalized name', () => {
    const items = MOCK_DASHBOARD_PATIENT_METRICS[0]?.patients ?? [];
    expect(filterDashboardPatientMetricItems(items, 'ana')).toHaveLength(1);
    expect(filterDashboardPatientMetricItems(items, 'SILVA')[0]?.id).toBe(
      'pat-001',
    );
    expect(
      filterDashboardPatientMetricItems(items, '123.456.789-00')[0]?.id,
    ).toBe('pat-001');
  });

  it('exposes six static metric definitions', () => {
    expect(DASHBOARD_PATIENT_METRIC_DEFINITIONS).toHaveLength(6);
    expect(
      resolveDashboardPatientMetricCount(
        'overdue_debts',
        {
          totalRegisteredCount: 10,
          seenLast6MonthsCount: 4,
          overdueDebtsPatientsCount: 2,
          newSeenThisMonthCount: 1,
          openTreatmentWithoutAppointmentCount: 3,
        },
        7,
      ),
    ).toBe(2);
  });
});
