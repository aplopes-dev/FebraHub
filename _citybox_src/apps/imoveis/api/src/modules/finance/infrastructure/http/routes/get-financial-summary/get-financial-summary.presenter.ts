import type { FinancialSummary } from '../../../../application/use-cases/get-financial-summary/get-financial-summary.use-case';

export class GetFinancialSummaryPresenter {
  static toHttp(summary: FinancialSummary) {
    return { data: summary };
  }
}
