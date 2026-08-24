/**
 * Contrato HTTP de `/v1/members` (erp-api). Não usar direto na UI —
 * traduzir via `member.mapper.ts`.
 */

export type MembershipRoleDto = "OWNER" | "ADMIN" | "MEMBER";

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
  branchIds?: string[];
  isSeller?: boolean;
};

export type UpdateMemberPayload = {
  role?: MembershipRoleDto;
  active?: boolean;
  permissionProfileId?: string;
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
