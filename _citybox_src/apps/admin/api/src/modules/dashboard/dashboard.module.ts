import { Module } from '@nestjs/common';
import { GetDashboardSummaryRoute } from './infrastructure/http/routes/get-dashboard-summary/get-dashboard-summary.route';
import { GetDashboardSummaryUseCase } from './application/use-cases/get-dashboard-summary/get-dashboard-summary.use-case';
import { ListGlobalAuditRoute } from './infrastructure/http/routes/list-global-audit/list-global-audit.route';
import { ListGlobalAuditUseCase } from './application/use-cases/list-global-audit/list-global-audit.use-case';

@Module({
  controllers: [GetDashboardSummaryRoute, ListGlobalAuditRoute],
  providers: [GetDashboardSummaryUseCase, ListGlobalAuditUseCase],
})
export class DashboardModule {}
