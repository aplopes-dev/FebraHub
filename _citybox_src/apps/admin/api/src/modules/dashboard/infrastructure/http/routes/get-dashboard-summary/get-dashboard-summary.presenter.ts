import { DashboardSummaryResult } from '../../../../application/use-cases/get-dashboard-summary/get-dashboard-summary.use-case';

export class GetDashboardSummaryPresenter {
  static toHttp(data: DashboardSummaryResult) {
    return {
      mrrCents: data.mrrCents,
      mrrCentsTrend: data.mrrCentsTrend,
      clientsCount: data.clientsCount,
      clientsCountTotal: data.clientsCountTotal,
      clientsCountTrend: data.clientsCountTrend,
      storesCount: data.storesCount,
      storesCountTotal: data.storesCountTotal,
      storesCountTrend: data.storesCountTrend,
      subscribersCount: data.subscribersCount,
      subscribersCountTrend: data.subscribersCountTrend,
      delinquentCount: data.delinquentCount,
      delinquentCountTrend: data.delinquentCountTrend,
      teamActiveCount: data.teamActiveCount,
      pendingInvitesCount: data.pendingInvitesCount,
      pulseData: data.pulseData,
      plansDistribution: data.plansDistribution,
      clientStatusDistribution: data.clientStatusDistribution,
      storeStatusDistribution: data.storeStatusDistribution,
      verticalsDistribution: data.verticalsDistribution,
      subscriptionStatusDistribution: data.subscriptionStatusDistribution,
      topClients: data.topClients,
      recentActivity: data.recentActivity,
    };
  }
}
