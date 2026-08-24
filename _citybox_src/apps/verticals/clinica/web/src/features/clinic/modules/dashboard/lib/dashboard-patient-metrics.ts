import type {
  DashboardPatientMetric,
  DashboardPatientMetricId,
  DashboardPatientMetricItem,
} from '../types/clinic-dashboard';

export function findDashboardPatientMetric(
  metrics: DashboardPatientMetric[],
  metricId: DashboardPatientMetricId,
): DashboardPatientMetric | undefined {
  return metrics.find((metric) => metric.id === metricId);
}

export function filterDashboardPatientMetricItems(
  items: DashboardPatientMetricItem[],
  search: string,
): DashboardPatientMetricItem[] {
  const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR');
  if (!normalizedSearch) return items;
  return items.filter((item) =>
    [item.name, item.email, item.cpf]
      .filter((value): value is string => Boolean(value))
      .some((value) =>
        value.toLocaleLowerCase('pt-BR').includes(normalizedSearch),
      ),
  );
}
