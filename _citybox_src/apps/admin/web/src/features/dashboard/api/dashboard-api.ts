import { adminFetch } from "@/lib/admin-api";

export interface DashboardSummaryDto {
  mrrCents: number;
  mrrCentsTrend: string;
  clientsCount: number;
  clientsCountTotal: number;
  clientsCountTrend: string;
  storesCount: number;
  storesCountTotal: number;
  storesCountTrend: string;
  subscribersCount: number;
  subscribersCountTrend: string;
  delinquentCount: number;
  delinquentCountTrend: string;
  teamActiveCount: number;
  pendingInvitesCount: number;
  pulseData: Array<{
    month: string;
    clientes: number;
    lojas: number;
    mrr: number;
  }>;
  plansDistribution: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
  clientStatusDistribution: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
  storeStatusDistribution: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
  verticalsDistribution: Array<{
    vertical: string;
    lojas: number;
    clientes: number;
  }>;
  subscriptionStatusDistribution: Array<{
    status: string;
    count: number;
    fill: string;
  }>;
  topClients: Array<{
    id: string;
    name: string;
    storesCount: number;
    plan: string;
    status: string;
  }>;
  recentActivity: Array<{
    id: string;
    time: string;
    title: string;
    description: string;
    module: string;
  }>;
}

export async function fetchDashboardSummary(params: {
  period?: string;
  startDate?: string;
  endDate?: string;
}) {
  const search = new URLSearchParams();
  if (params.period) search.set("period", params.period);
  if (params.startDate) search.set("startDate", params.startDate);
  if (params.endDate) search.set("endDate", params.endDate);

  const q = search.toString();
  return adminFetch(`/v1/dashboard/summary${q ? `?${q}` : ""}`) as Promise<DashboardSummaryDto>;
}
