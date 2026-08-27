/**
 * Contrato HTTP de `/v1/members` (API). Não usar direto na UI —
 * traduzir via `member.mapper.ts`.
 */

export type MembershipRoleDto = "OWNER" | "ADMIN" | "MEMBER";

export type GeographicScopeLevelDto = "group" | "matrix" | "branch";

export type FunctionalRoleDto =
  | "ADMIN"
  | "MANAGER"
  | "SALES_CONSULTANT"
  | "USED_CAR_APPRAISER"
  | "FI_CONSULTANT"
  | "SERVICE_ADVISOR"
  | "TECHNICIAN"
  | "PARTS_MANAGER"
  | "CASHIER"
  | "DOC_CLERK"
  | "ACCOUNTANT"
  | "VIEWER";

export type MemberPermissionProfileDto = {
  id: string;
  name: string;
  systemKey: string | null;
};

export type MemberDto = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: MembershipRoleDto;
  active: boolean;
  scopeLevel: GeographicScopeLevelDto;
  matrixId: string | null;
  matrixName: string | null;
  functionalRole: FunctionalRoleDto;
  /** Usuário vendedor — listas ERP/PDV. */
  isSeller: boolean;
  /** Código curto digitado no PDV (caixa). Null = sem acesso ao caixa. */
  pdvCode: string | null;
  hasPdvPin: boolean;
  pdvLocked: boolean;
  pdvLockedUntil: string | null;
  pdvPinUpdatedAt: string | null;
  permissionProfile: MemberPermissionProfileDto | null;
  branchIds: string[];
  branchNames: string[];
  accessesAllBranches: boolean;
  createdAt: string;
};

export type MemberListMetaDto = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type MemberListResponseDto = {
  data: MemberDto[];
  meta: MemberListMetaDto;
};

export type MemberResponseDto = {
  data: MemberDto;
};

export type CreateMemberResponseDto = {
  data: MemberDto;
  meta: {
    provisionalPassword: string;
    linkedExistingAccount: boolean;
  };
};

export type ResetMemberPasswordResponseDto = {
  data: {
    email: string;
    provisionalPassword: string;
  };
};

export type CreateMemberPayload = {
  email: string;
  firstName: string;
  lastName: string;
  permissionProfileId: string;
  role?: MembershipRoleDto;
  scopeLevel?: GeographicScopeLevelDto;
  matrixId?: string | null;
  functionalRole?: FunctionalRoleDto;
  branchIds?: string[];
  isSeller?: boolean;
};

export type UpdateMemberPayload = {
  role?: MembershipRoleDto;
  active?: boolean;
  permissionProfileId?: string;
  scopeLevel?: GeographicScopeLevelDto;
  matrixId?: string | null;
  functionalRole?: FunctionalRoleDto;
  branchIds?: string[];
  /** Código PDV; `null` remove o código. */
  pdvCode?: string | null;
  isSeller?: boolean;
};

/** Body de `PUT /v1/members/:id/pdv-pin`. */
export type SetMemberPdvPinPayload = {
  pin: string;
  /** Opcional — a API atual exige `pdvCode` já gravado no membro. */
  pdvCode?: string | null;
};
