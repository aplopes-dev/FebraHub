/**
 * Shapes do contrato da API do backend (`/v1/financial-groups`).
 */

export type FinancialGroupTypeDto = "receita" | "despesa";

export type FinancialGroupDto = {
  id: string;
  name: string;
  type: FinancialGroupTypeDto;
  isSystem: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FinancialGroupListMetaDto = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type FinancialGroupTabCountsDto = {
  active: number;
  deleted: number;
};

export type FinancialGroupListResponseDto = {
  data: FinancialGroupDto[];
  meta: FinancialGroupListMetaDto;
  tabCounts: FinancialGroupTabCountsDto;
};

export type FinancialGroupResponseDto = {
  data: FinancialGroupDto;
};

export type SaveFinancialGroupPayload = {
  name: string;
  type: FinancialGroupTypeDto;
};
