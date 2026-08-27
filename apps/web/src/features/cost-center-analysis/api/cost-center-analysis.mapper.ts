import type { CostCenterAnalysisReportDto } from "@/features/cost-center-analysis/api/cost-center-analysis.dto";
import type { CostCenterAnalysisReport } from "@/features/cost-center-analysis/types/cost-center-analysis";

export function toCostCenterAnalysisReport(
  dto: CostCenterAnalysisReportDto,
): CostCenterAnalysisReport {
  return {
    from: dto.from,
    to: dto.to,
    type: dto.type,
    total: dto.totalCents / 100,
    items: dto.items.map((item) => ({
      costCenterId: item.costCenterId,
      costCenterName: item.costCenterName,
      value: item.valueCents / 100,
      share: item.share,
      entryCount: item.entryCount,
    })),
  };
}
