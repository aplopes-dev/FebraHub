/**
 * Contrato HTTP de `/v1/movement-categories` — mapear para o domínio do front
 * em `movement-category.mapper.ts` (`branchIds` ↔ `unitIds`).
 */
export type MovementCategoryTypeDto = "entrada" | "saida";

export type MovementCategoryDto = {
  id: string;
  code: string;
  name: string;
  type: MovementCategoryTypeDto;
  systemKey: string | null;
  isSystem: boolean;
  branchIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type MovementCategoryListMetaDto = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type MovementCategoryListResponseDto = {
  data: MovementCategoryDto[];
  meta: MovementCategoryListMetaDto;
};

export type MovementCategoryResponseDto = {
  data: MovementCategoryDto;
};

export type SaveMovementCategoryPayload = {
  name: string;
  type: MovementCategoryTypeDto;
  branchIds: string[];
};
