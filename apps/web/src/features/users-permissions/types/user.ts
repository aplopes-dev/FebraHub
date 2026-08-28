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

/**
 * Papel na plataforma — o peso da conta, independente do que a pessoa faz.
 *
 * `ADMIN` atravessa o catálogo inteiro de permissões; `MANAGER` (gestor)
 * responde pelo próprio setor, podendo definir metas e indicadores dele;
 * `MEMBER` fica no que o perfil de acesso liberar. `OWNER` é o dono da conta —
 * existe no cadastro, mas não se atribui pela tela.
 */
export type MembershipRole = "OWNER" | "ADMIN" | "MANAGER" | "MEMBER";

/**
 * Setor do cadastro — o eixo "sobre quais dados". Ver `lib/sectors.ts`,
 * que espelha `SETORES_CADASTRO` do `apps/api`.
 */
export type Sector =
  | "geral"
  | "comercial"
  | "financeiro"
  | "marketing"
  | "pedagogico"
  | "eventos"
  | "loja"
  | "estoque"
  | "crm";

/**
 * Papel funcional na escola — o que a pessoa faz.
 *
 * O conjunto cobre a operação de uma escola de negócios: quem vende matrícula
 * (comercial e pré-vendas), quem entrega o treinamento (coordenação,
 * facilitação, eventos), quem cuida do aluno depois da venda (sucesso do
 * aluno, secretaria) e as áreas de apoio.
 */
export type FunctionalRole =
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

export type PlatformUser = {
  /** membershipId na API */
  id: string;
  userId: string;
  name: string;
  email: string;
  profileId: string;
  role: MembershipRole;
  functionalRole: FunctionalRole;
  /** Setor principal — o recorte de dados que a pessoa enxerga por padrão. */
  sector: Sector;
  /** Setores adicionais, somados ao principal. Não repete o principal. */
  extraSectors: Sector[];
  active: boolean;
  /** Derivado do papel funcional — listas de quem vende matrícula. */
  isSeller: boolean;
  /** Código curto digitado no PDV. Null = sem acesso ao caixa. */
  pdvCode: string | null;
  hasPdvPin: boolean;
  pdvLocked: boolean;
  pdvLockedUntil: string | null;
  pdvPinUpdatedAt: string | null;
  /**
   * Settings de e-mails legados — ainda não existem na API.
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
  functionalRole: FunctionalRole;
  /** Papel na plataforma (admin / gestor / membro). */
  role: MembershipRole;
  sector: Sector;
  extraSectors: Sector[];
  settings: UserGeneralSettings;
};

/** Espelha `POS_OPERATOR_PIN_LENGTH` da API (PIN de caixa do membro). */
export const MEMBER_PDV_PIN_LENGTH = 4;

export function createEmptyUserFormValues(): UserFormValues {
  return {
    profileId: "",
    name: "",
    email: "",
    functionalRole: "COMMERCIAL_CONSULTANT",
    role: "MEMBER",
    sector: "comercial",
    extraSectors: [],
    settings: createDefaultUserGeneralSettings(),
  };
}

export function userToFormValues(user: PlatformUser): UserFormValues {
  return {
    profileId: user.profileId,
    name: user.name,
    email: user.email,
    functionalRole: user.functionalRole,
    role: user.role,
    sector: user.sector,
    extraSectors: [...user.extraSectors],
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
  /** `"all"` = sem filtro de papel funcional. */
  functionalRole: string;
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
