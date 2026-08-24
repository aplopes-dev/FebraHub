import type { IncomeStatementReportDto } from '../../../../application/dtos/income-statement-report.dto';
import type { CostCenterAnalysisReportDto } from '../../../../application/dtos/cost-center-analysis-report.dto';

/**
 * Sem transformação de valor — os DTOs de aplicação já saem no formato de
 * fio (centavos, frações). O presenter só aplica o envelope `{ data }`,
 * padrão do módulo `finance`.
 */
export class FinanceReportPresenter {
  static toIncomeStatementHttp(dto: IncomeStatementReportDto) {
    return { data: dto };
  }

  static toCostCenterAnalysisHttp(dto: CostCenterAnalysisReportDto) {
    return { data: dto };
  }
}
