/**
 * Contrato HTTP de `/v1/members` (API). Não usar direto na UI —
 * traduzir via `member.mapper.ts`.
 */

export type MembershipRoleDto = "OWNER" | "ADMIN" | "MANAGER" | "MEMBER";

/** Setores do cadastro — espelha `SETORES_CADASTRO` do `apps/api`. */
export type SectorDto =
  | "geral"
  | "comercial"
  | "financeiro"
  | "marketing"
  | "pedagogico"
  | "eventos"
  | "loja"
  | "estoque"
  | "crm";


export type FunctionalRoleDto =
  | "ADMIN"
  | "UNIT_MANAGER"
  | "COMMERCIAL_CONSULTANT"
  | "SDR"
  | "STUDENT_SUCCESS"
  | "ACADEMIC_COORDINATOR"
  | "FACILITATOR"
  | "EVENT_PRODUCER"
  | "SECRETARY"
  | "FINANCE"
  | "MARKETING"
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
  functionalRole: FunctionalRoleDto;
  /** Setor principal do membro. */
  sector: SectorDto;
  /** Setores adicionais, sem repetir o principal. */
  extraSectors: SectorDto[];
  /** Usuário que vende matrícula — listas comerciais. */
  isSeller: boolean;
  /** Código curto digitado no PDV (caixa). Null = sem acesso ao caixa. */
  pdvCode: string | null;
  hasPdvPin: boolean;
  pdvLocked: boolean;
  pdvLockedUntil: string | null;
  pdvPinUpdatedAt: string | null;
  permissionProfile: MemberPermissionProfileDto | null;
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
  functionalRole?: FunctionalRoleDto;
  sector: SectorDto;
  extraSectors?: SectorDto[];
  isSeller?: boolean;
};

export type UpdateMemberPayload = {
  role?: MembershipRoleDto;
  active?: boolean;
  permissionProfileId?: string;
  functionalRole?: FunctionalRoleDto;
  sector?: SectorDto;
  extraSectors?: SectorDto[];
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
