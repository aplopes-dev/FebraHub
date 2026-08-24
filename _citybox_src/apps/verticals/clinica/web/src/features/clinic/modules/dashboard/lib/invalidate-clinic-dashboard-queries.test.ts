import { describe, expect, it, vi } from 'vitest';
import type { QueryClient } from '@tanstack/react-query';
import { invalidateClinicDashboardQueries } from './invalidate-clinic-dashboard-queries';

describe('invalidateClinicDashboardQueries', () => {
  it('invalidates clinic-dashboard* and clinic/reports query keys', () => {
    const invalidateQueries = vi.fn();
    const queryClient = { invalidateQueries } as unknown as QueryClient;

    invalidateClinicDashboardQueries(queryClient);

    expect(invalidateQueries).toHaveBeenCalledTimes(2);

    const dashboardPredicate = (
      invalidateQueries.mock.calls[0]![0] as {
        predicate: (query: { queryKey: unknown[] }) => boolean;
      }
    ).predicate;
    const reportsPredicate = (
      invalidateQueries.mock.calls[1]![0] as {
        predicate: (query: { queryKey: unknown[] }) => boolean;
      }
    ).predicate;

    expect(
      dashboardPredicate({ queryKey: ['clinic-dashboard-inadimplencia', 'c1'] }),
    ).toBe(true);
    expect(
      dashboardPredicate({
        queryKey: ['clinic-dashboard-expense-by-category', 'c1'],
      }),
    ).toBe(true);
    expect(dashboardPredicate({ queryKey: ['financial-entries', 'c1'] })).toBe(
      false,
    );
    expect(dashboardPredicate({ queryKey: ['clinic', 'reports', 'c1'] })).toBe(
      false,
    );

    expect(
      reportsPredicate({
        queryKey: ['clinic', 'reports', 'c1', 'excluded-revenues', {}],
      }),
    ).toBe(true);
    expect(reportsPredicate({ queryKey: ['clinic-dashboard-cashflow'] })).toBe(
      false,
    );
    expect(reportsPredicate({ queryKey: ['financial-entries', 'c1'] })).toBe(
      false,
    );
  });
});
