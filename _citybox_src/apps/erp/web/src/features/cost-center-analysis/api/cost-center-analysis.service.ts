import { comercioFetch } from "@/lib/api/comercio-client";
import { toCostCenterAnalysisReport } from "@/features/cost-center-analysis/api/cost-center-analysis.mapper";
import type { CostCenterAnalysisReportDto } from "@/features/cost-center-analysis/api/cost-center-analysis.dto";
import type {
  CostCenterAnalysisReport,
  CostCenterAnalysisType,
} from "@/features/cost-center-analysis/types/cost-center-analysis";

/** Análise por centro de custo — `/financas/analise-centro-de-custo`. */
export async function getCostCenterAnalysisApi(
  from: string,
  to: string,
  type: CostCenterAnalysisType,
): Promise<CostCenterAnalysisReport> {
  const query = new URLSearchParams({ from, to, type });
  const res = await comercioFetch<{ data: CostCenterAnalysisReportDto }>(
    `/v1/reports/cost-centers?${query}`,
  );
  return toCostCenterAnalysisReport(res.data);
}
