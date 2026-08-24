export type CostCenterAnalysisType = "despesa" | "receita";

export type CostCenterAnalysisItem = {
  costCenterId: string | null;
  costCenterName: string;
  value: number;
  share: number;
  entryCount: number;
};

export type CostCenterAnalysisReport = {
  from: string;
  to: string;
  type: CostCenterAnalysisType;
  total: number;
  items: CostCenterAnalysisItem[];
};
