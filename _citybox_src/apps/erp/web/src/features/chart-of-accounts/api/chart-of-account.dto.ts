/**
 * Shapes do contrato da `erp-comercio-api` (`/v1/chart-of-accounts`).
 */

export type ChartOfAccountDto = {
  id: string;
  name: string;
  financialGroupId: string;
  financialGroupName: string;
  financialGroupType: "receita" | "despesa";
  availableForPdv: boolean;
  isSystem: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChartOfAccountListMetaDto = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type ChartOfAccountTabCountsDto = {
  active: number;
  deleted: number;
};

export type ChartOfAccountListResponseDto = {
  data: ChartOfAccountDto[];
  meta: ChartOfAccountListMetaDto;
  tabCounts: ChartOfAccountTabCountsDto;
};

export type ChartOfAccountResponseDto = {
  data: ChartOfAccountDto;
};

export type SaveChartOfAccountPayload = {
  name: string;
  financialGroupId: string;
  availableForPdv: boolean;
};
