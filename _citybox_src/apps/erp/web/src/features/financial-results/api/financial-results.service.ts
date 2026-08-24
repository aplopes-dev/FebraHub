import { comercioFetch } from "@/lib/api/comercio-client";
import { toFinancialResultReport } from "@/features/financial-results/api/financial-result.mapper";
import type { IncomeStatementReportDto } from "@/features/financial-results/api/financial-result.dto";
import type { FinancialResultReport } from "@/features/financial-results/types/financial-result";

/** DRE — `/financas/relatorios-de-resultados`. */
export async function getIncomeStatementApi(
  from: string,
  to: string,
): Promise<FinancialResultReport> {
  const query = new URLSearchParams({ from, to });
  const res = await comercioFetch<{ data: IncomeStatementReportDto }>(
    `/v1/reports/income-statement?${query}`,
  );
  return toFinancialResultReport(res.data);
}
