export type UserGeneralSettings = {
  receiveFinancialEmails: boolean;
  receivePlanContractEmails: boolean;
  showInPosOpenList: boolean;
  /** Senha usada no atendimento de mesas (fluxo food service). Vazio = não configurada. */
  tableServicePassword: string;
  /** PIN que o usuário informa para autorizar o suporte a acessar a conta. */
  supportPin: string;
};

export function createDefaultUserGeneralSettings(): UserGeneralSettings {
  return {
    receiveFinancialEmails: false,
    receivePlanContractEmails: false,
    showInPosOpenList: true,
    tableServicePassword: "",
    supportPin: "",
  };
}

export type MembershipRole = "OWNER" | "ADMIN" | "MEMBER";

export type PlatformUser = {
  /** membershipId na erp-api */
  id: string;
  userId: string;
  name: string;
  email: string;
  profileId: string;
  role: MembershipRole;
  branchIds: string[];
  accessesAllBranches: boolean;
  active: boolean;
  /** Aparece nas listas de vendedor (ERP e PDV). */
  isSeller: boolean;
  /** Código curto digitado no PDV. Null = sem acesso ao caixa. */
  pdvCode: string | null;
  hasPdvPin: boolean;
  pdvLocked: boolean;
  pdvLockedUntil: string | null;
  pdvPinUpdatedAt: string | null;
  /**
   * Settings de e-mails / PDV legados — ainda não existem na API.
   * Mantidos no tipo para o form; não são persistidos.
   */
  settings: UserGeneralSettings;
  /** Usuário autenticado nesta sessão — não pode excluir a própria conta. */
  isCurrentUser: boolean;
  /** Derivado de `!active` (soft-deactivate). */
  deletedAt: string | null;
  createdAt: string;
};

export type UserFormValues = {
  profileId: string;
  name: string;
  email: string;
  branchIds: string[];
  /** Código PDV (caixa). Vazio = sem código. */
  pdvCode: string;
  /** Usuário vendedor — listas ERP/PDV. Default true no create. */
  isSeller: boolean;
  settings: UserGeneralSettings;
};

/** Espelha `POS_OPERATOR_PIN_LENGTH` da erp-api (PIN de caixa do membro). */
export const MEMBER_PDV_PIN_LENGTH = 4;

export function createEmptyUserFormValues(): UserFormValues {
  return {
    profileId: "",
    name: "",
    email: "",
    branchIds: [],
    pdvCode: "",
    isSeller: true,
    settings: createDefaultUserGeneralSettings(),
  };
}

export function userToFormValues(user: PlatformUser): UserFormValues {
  return {
    profileId: user.profileId,
    name: user.name,
    email: user.email,
    branchIds: [...user.branchIds],
    pdvCode: user.pdvCode ?? "",
    isSeller: user.isSeller,
    settings: { ...user.settings },
  };
}

export type UserListTab = "active" | "deleted";

export type UserTabCounts = {
  active: number;
  deleted: number;
};

export type MemberListParams = {
  tab: UserListTab;
  search: string;
  /** `"all"` = sem filtro de perfil. */
  profileId: string;
  page: number;
  perPage: number;
};

/** @deprecated Use MemberListParams — alias para compatibilidade. */
export type UserListParams = MemberListParams;

export type UserListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type MemberListResult = {
  data: PlatformUser[];
  meta: UserListMeta;
  tabCounts: UserTabCounts;
};

/** @deprecated Use MemberListResult. */
export type UserListResult = MemberListResult;

export type CreateMemberResult = {
  member: PlatformUser;
  provisionalPassword: string;
  linkedExistingAccount: boolean;
};

export type ResetPasswordResult = {
  email: string;
  provisionalPassword: string;
};

/** Sessão ativa — sem backend nesta fatia (drawer "Em breve"). */
export type ActiveSession = {
  id: string;
  userId: string;
  userName: string;
  createdAt: string;
  expiresAt: string;
};
