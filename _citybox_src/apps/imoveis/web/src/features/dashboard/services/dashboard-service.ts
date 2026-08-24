/**
 * Porta de entrada de dados do dashboard — consome imoveis-api.
 */
import type { SessionUser } from '@/features/shared/session/types';
import {
  formatCompactCurrency,
  formatNumber,
} from '@/features/shared/utils/format';
import { imoveisFetch } from '@/lib/imoveis-api';
import type {
  ActiveListing,
  ContactLead,
  DashboardMetric,
  DashboardModules,
  DealsSummary,
  PerformancePeriod,
  PerformanceSeries,
  Reminder,
} from '../types';

type ApiMetric = {
  key: DashboardMetric['key'];
  label: string;
  valueCents?: number;
  valueCount?: number;
  trend: DashboardMetric['trend'];
};

type ApiOverview = {
  metrics: readonly ApiMetric[];
  performance: {
    period: PerformancePeriod;
    points: readonly {
      label: string;
      revenueAmountCents: number;
      visitsCount: number;
      revenuePct: number;
      visitsPct: number;
    }[];
    highlightedIndex: number;
    targetAmountCents: number;
  };
  deals: DealsSummary;
  listings: readonly ActiveListing[];
  leads: readonly ContactLead[];
  reminders: readonly Reminder[];
  modules?: Partial<DashboardModules>;
};

export type DashboardOverview = {
  metrics: readonly DashboardMetric[];
  performance: PerformanceSeries;
  deals: DealsSummary;
  listings: readonly ActiveListing[];
  leads: readonly ContactLead[];
  reminders: readonly Reminder[];
  modules: DashboardModules;
};

const ALL_MODULES: DashboardModules = {
  leads: true,
  properties: true,
  transactions: true,
  finance: true,
  calendar: true,
};

function buildQuery(user: SessionUser, period?: PerformancePeriod): string {
  const q = new URLSearchParams();
  q.set('organizationType', user.organization.type);
  if (period) q.set('period', period);
  return `?${q.toString()}`;
}

function mapMetric(metric: ApiMetric): DashboardMetric {
  if (metric.key === 'total-revenue') {
    return {
      key: metric.key,
      label: metric.label,
      value: formatCompactCurrency((metric.valueCents ?? 0) / 100),
      trend: metric.trend,
    };
  }
  return {
    key: metric.key,
    label: metric.label,
    value: formatNumber(metric.valueCount ?? 0),
    trend: metric.trend,
  };
}

function mapPerformance(
  performance: ApiOverview['performance'],
): PerformanceSeries {
  return {
    period: performance.period,
    highlightedIndex: performance.highlightedIndex,
    targetAmount: performance.targetAmountCents / 100,
    points: performance.points.map((point) => ({
      label: point.label,
      revenue: point.revenuePct,
      visits: point.visitsPct,
      revenueAmount: point.revenueAmountCents / 100,
    })),
  };
}

export async function getDashboardOverview(
  user: SessionUser,
  period: PerformancePeriod = 'monthly',
): Promise<DashboardOverview> {
  const res = await imoveisFetch<{ data: ApiOverview }>(
    `/v1/dashboard/overview${buildQuery(user, period)}`,
  );
  const data = res.data;
  return {
    metrics: data.metrics.map(mapMetric),
    performance: mapPerformance(data.performance),
    deals: data.deals,
    listings: data.listings,
    leads: data.leads,
    reminders: data.reminders,
    modules: { ...ALL_MODULES, ...data.modules },
  };
}
