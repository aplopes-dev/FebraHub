/**
 * Shapes do contrato da API do backend (`/v1/cost-centers`).
 * O domínio do front (`types/cost-center.ts`) espelha o DTO 1:1 — o mapper
 * só garante imutabilidade e helpers de formulário.
 */

export type CostCenterDto = {
  id: string;
  name: string;
  isSystem: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CostCenterListMetaDto = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type CostCenterTabCountsDto = {
  active: number;
  deleted: number;
};

export type CostCenterListResponseDto = {
  data: CostCenterDto[];
  meta: CostCenterListMetaDto;
  tabCounts: CostCenterTabCountsDto;
};

export type CostCenterResponseDto = {
  data: CostCenterDto;
};

export type SaveCostCenterPayload = {
  name: string;
};
