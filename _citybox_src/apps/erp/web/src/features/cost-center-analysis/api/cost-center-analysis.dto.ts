import type { CostCenterAnalysisType } from "@/features/cost-center-analysis/types/cost-center-analysis";

export type CostCenterAnalysisItemDto = {
  costCenterId: string | null;
  costCenterName: string;
  valueCents: number;
  share: number;
  entryCount: number;
};

export type CostCenterAnalysisReportDto = {
  from: string;
  to: string;
  type: CostCenterAnalysisType;
  totalCents: number;
  items: CostCenterAnalysisItemDto[];
};
