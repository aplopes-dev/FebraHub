import type { DashboardOverview } from '../../../../application/use-cases/get-dashboard-overview/get-dashboard-overview.use-case';
import { mapLeadToHttp } from '../../../../../leads/infrastructure/http/routes/shared/lead-response.mapper';
import { mapPropertyToHttp } from '../../../../../properties/infrastructure/http/routes/shared/property-response.mapper';

export class GetDashboardOverviewPresenter {
  static toHttp(overview: DashboardOverview) {
    return {
      data: {
        metrics: overview.metrics,
        performance: overview.performance,
        deals: overview.deals,
        listings: overview.listings.map(mapPropertyToHttp),
        leads: overview.leads.map(mapLeadToHttp),
        reminders: overview.reminders,
        modules: overview.modules,
      },
    };
  }
}
