export type GetCostCenterAnalysisInput = {
  organizationId: string;
  from: Date;
  to: Date;
  type: 'despesa' | 'receita';
};

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
  type: 'despesa' | 'receita';
  totalCents: number;
  items: CostCenterAnalysisItemDto[];
};
