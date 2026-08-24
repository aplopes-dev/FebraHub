import { describe, expect, it } from 'vitest';
import { MOCK_DASHBOARD_APPOINTMENTS } from '../data/mock-dashboard-appointments';
import {
  ALL_APPOINTMENT_CATEGORIES,
  buildAppointmentsTimeline,
  filterAppointments,
  getAppointmentGroup,
  getDashboardAppointmentYears,
  isMissedOrCancelled,
  summarizeAppointments,
} from './dashboard-appointments';

describe('dashboard-appointments', () => {
  it('classifies outcomes into realized vs missed/cancelled', () => {
    expect(getAppointmentGroup('finished')).toBe('realized');
    expect(getAppointmentGroup('missed')).toBe('missed_cancelled');
    expect(isMissedOrCancelled('cancelled_patient')).toBe(true);
    expect(isMissedOrCancelled('finished')).toBe(false);
  });

  it('filters by period, category and group', () => {
    const julyAll = filterAppointments({
      appointments: MOCK_DASHBOARD_APPOINTMENTS,
      categoryId: ALL_APPOINTMENT_CATEGORIES,
      periodMode: 'monthly',
      year: 2026,
      month: 7,
    });
    expect(julyAll.every((row) => row.date.startsWith('2026-07-'))).toBe(true);

    const avaliacao = filterAppointments({
      appointments: MOCK_DASHBOARD_APPOINTMENTS,
      categoryId: 'cat-avaliacao',
      periodMode: 'annual',
      year: 2026,
    });
    expect(avaliacao.every((row) => row.categoryId === 'cat-avaliacao')).toBe(
      true,
    );

    const realized = filterAppointments({
      appointments: MOCK_DASHBOARD_APPOINTMENTS,
      categoryId: ALL_APPOINTMENT_CATEGORIES,
      periodMode: 'monthly',
      year: 2026,
      month: 7,
      group: 'realized',
    });
    expect(realized.every((row) => row.status === 'finished')).toBe(true);
  });

  it('summarizes attendance rate', () => {
    const filtered = filterAppointments({
      appointments: MOCK_DASHBOARD_APPOINTMENTS,
      categoryId: ALL_APPOINTMENT_CATEGORIES,
      periodMode: 'monthly',
      year: 2026,
      month: 7,
    });
    const summary = summarizeAppointments(filtered);
    expect(summary.totalCount).toBe(
      summary.realizedCount + summary.missedCancelledCount,
    );
    expect(summary.attendanceRate).toBeCloseTo(
      (summary.realizedCount / summary.totalCount) * 100,
    );
  });

  it('builds annual and monthly timelines', () => {
    const annual = buildAppointmentsTimeline({
      appointments: filterAppointments({
        appointments: MOCK_DASHBOARD_APPOINTMENTS,
        categoryId: ALL_APPOINTMENT_CATEGORIES,
        periodMode: 'annual',
        year: 2026,
      }),
      periodMode: 'annual',
      year: 2026,
    });
    expect(annual).toHaveLength(12);
    expect(annual[0]?.label).toBe('Jan');
    expect(annual[6]?.realized).toBeGreaterThan(0);

    const monthly = buildAppointmentsTimeline({
      appointments: filterAppointments({
        appointments: MOCK_DASHBOARD_APPOINTMENTS,
        categoryId: ALL_APPOINTMENT_CATEGORIES,
        periodMode: 'monthly',
        year: 2026,
        month: 7,
      }),
      periodMode: 'monthly',
      year: 2026,
      month: 7,
    });
    expect(monthly).toHaveLength(31);
    expect(monthly.some((point) => point.realized > 0)).toBe(true);
  });

  it('lists years descending from appointments', () => {
    expect(getDashboardAppointmentYears(MOCK_DASHBOARD_APPOINTMENTS)).toEqual([
      2026, 2025,
    ]);
  });
});
