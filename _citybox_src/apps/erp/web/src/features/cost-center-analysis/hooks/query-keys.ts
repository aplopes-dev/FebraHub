import type { CostCenterAnalysisType } from "@/features/cost-center-analysis/types/cost-center-analysis";

export const costCenterAnalysisKeys = {
  all: (scope: string) => ["comercio", "cost-center-analysis", scope] as const,
  report: (
    scope: string,
    from: string,
    to: string,
    type: CostCenterAnalysisType,
  ) => [...costCenterAnalysisKeys.all(scope), "report", from, to, type] as const,
};
