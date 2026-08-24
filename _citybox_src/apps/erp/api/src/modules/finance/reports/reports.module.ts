import { Module } from '@nestjs/common';

import { FinancialGroupsModule } from '../financial-groups/financial-groups.module';
import { ChartOfAccountsModule } from '../chart-of-accounts/chart-of-accounts.module';
import { CostCentersModule } from '../cost-centers/cost-centers.module';

import { FinanceReportRepository } from './domain/repositories/finance-report.repository.interface';
import { PrismaFinanceReportRepository } from './infrastructure/database/prisma-finance-report.repository';

import { GetIncomeStatementUseCase } from './application/use-cases/get-income-statement/get-income-statement.use-case';
import { GetCostCenterAnalysisUseCase } from './application/use-cases/get-cost-center-analysis/get-cost-center-analysis.use-case';

import { GetIncomeStatementRoute } from './infrastructure/http/routes/get-income-statement/get-income-statement.route';
import { GetCostCenterAnalysisRoute } from './infrastructure/http/routes/get-cost-center-analysis/get-cost-center-analysis.route';

/**
 * Relatórios financeiros — só leitura, sem entidade de domínio própria (é
 * leitura pura sobre agregados que `financial-entries`/`financial-groups`/
 * `chart-of-accounts`/`cost-centers` já possuem). Ver `research.md` D1.
 */
@Module({
  imports: [FinancialGroupsModule, ChartOfAccountsModule, CostCentersModule],
  controllers: [GetIncomeStatementRoute, GetCostCenterAnalysisRoute],
  providers: [
    {
      provide: FinanceReportRepository,
      useClass: PrismaFinanceReportRepository,
    },
    GetIncomeStatementUseCase,
    GetCostCenterAnalysisUseCase,
  ],
})
export class ReportsModule {}
