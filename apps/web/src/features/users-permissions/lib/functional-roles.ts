import type {
  FunctionalRole,
  MembershipRole,
  Sector,
} from "@/features/users-permissions/types/user";

export type FunctionalRoleOption = {
  value: FunctionalRole;
  label: string;
  description: string;
  /** Perfil padrão sugerido (systemKey ou id fixo do mock). */
  defaultProfileKey: string;
  /** Setor sugerido ao escolher o papel — continua editável. */
  defaultSector: Sector;
  /** Papel na plataforma sugerido: só quem administra ou gere sobe de peso. */
  defaultPlatformRole: MembershipRole;
  isSeller: boolean;
};

/**
 * Papéis da operação de uma escola de negócios, na ordem em que aparecem no
 * seletor: primeiro quem administra, depois a ponta comercial, a entrega do
 * treinamento e as áreas de apoio.
 *
 * `isSeller` marca quem entra nas listas de vendedor (matrícula com dono).
 * `defaultProfileKey` é só a sugestão de perfil ao escolher o papel — o perfil
 * continua sendo escolha à parte.
 */
export const FUNCTIONAL_ROLE_OPTIONS: FunctionalRoleOption[] = [
  {
    value: "ADMIN",
    label: "Administrador",
    description: "Acesso total ao sistema e configurações.",
    defaultProfileKey: "administrador",
    defaultSector: "geral",
    defaultPlatformRole: "ADMIN",
    isSeller: false,
  },
  {
    value: "UNIT_MANAGER",
    label: "Gerente de unidade",
    description: "Responde pela unidade: equipe, metas e resultado.",
    defaultProfileKey: "gerente-unidade",
    defaultSector: "geral",
    defaultPlatformRole: "MANAGER",
    isSeller: false,
  },
  {
    value: "COMMERCIAL_CONSULTANT",
    label: "Consultor comercial",
    description: "Negocia e fecha matrículas em cursos, imersões e mentorias.",
    defaultProfileKey: "consultor-comercial",
    defaultSector: "comercial",
    defaultPlatformRole: "MEMBER",
    isSeller: true,
  },
  {
    value: "SDR",
    label: "SDR / pré-vendas",
    description: "Qualifica leads e agenda reuniões para o comercial.",
    defaultProfileKey: "sdr",
    defaultSector: "comercial",
    defaultPlatformRole: "MEMBER",
    isSeller: true,
  },
  {
    value: "STUDENT_SUCCESS",
    label: "Sucesso do aluno",
    description: "Acompanha o aluno após a matrícula: presença e renovação.",
    defaultProfileKey: "sucesso-do-aluno",
    defaultSector: "pedagogico",
    defaultPlatformRole: "MEMBER",
    isSeller: false,
  },
  {
    value: "ACADEMIC_COORDINATOR",
    label: "Coordenador acadêmico",
    description: "Monta turmas, cronograma e conteúdo dos programas.",
    defaultProfileKey: "coordenador-academico",
    defaultSector: "pedagogico",
    defaultPlatformRole: "MANAGER",
    isSeller: false,
  },
  {
    value: "FACILITATOR",
    label: "Facilitador / instrutor",
    description: "Conduz as aulas e registra presença da turma.",
    defaultProfileKey: "facilitador",
    defaultSector: "pedagogico",
    defaultPlatformRole: "MEMBER",
    isSeller: false,
  },
  {
    value: "EVENT_PRODUCER",
    label: "Produção de eventos",
    description: "Imersões e eventos: inscrições, credenciamento e logística.",
    defaultProfileKey: "producao-eventos",
    defaultSector: "eventos",
    defaultPlatformRole: "MEMBER",
    isSeller: false,
  },
  {
    value: "SECRETARY",
    label: "Secretaria acadêmica",
    description: "Contratos, documentos, certificados e pendências do aluno.",
    defaultProfileKey: "secretaria",
    defaultSector: "pedagogico",
    defaultPlatformRole: "MEMBER",
    isSeller: false,
  },
  {
    value: "FINANCE",
    label: "Financeiro",
    description: "Recebimentos, inadimplência e conciliação.",
    defaultProfileKey: "financeiro",
    defaultSector: "financeiro",
    defaultPlatformRole: "MEMBER",
    isSeller: false,
  },
  {
    value: "MARKETING",
    label: "Marketing",
    description: "Campanhas e geração de leads para as turmas.",
    defaultProfileKey: "marketing",
    defaultSector: "marketing",
    defaultPlatformRole: "MEMBER",
    isSeller: false,
  },
  {
    value: "ACCOUNTANT",
    label: "Contador",
    description: "Leitura financeira e relatórios, sem custo de turma.",
    defaultProfileKey: "contador",
    defaultSector: "financeiro",
    defaultPlatformRole: "MEMBER",
    isSeller: false,
  },
  {
    value: "VIEWER",
    label: "Somente leitura",
    description: "Consulta operacional sem alterar registros.",
    defaultProfileKey: "somente-leitura",
    defaultSector: "geral",
    defaultPlatformRole: "MEMBER",
    isSeller: false,
  },
];

export function functionalRoleLabel(role: FunctionalRole): string {
  return (
    FUNCTIONAL_ROLE_OPTIONS.find((option) => option.value === role)?.label ??
    role
  );
}

export function functionalRoleIsSeller(role: FunctionalRole): boolean {
  return (
    FUNCTIONAL_ROLE_OPTIONS.find((option) => option.value === role)
      ?.isSeller ?? false
  );
}

export function defaultSectorForRole(role: FunctionalRole): Sector {
  return (
    FUNCTIONAL_ROLE_OPTIONS.find((option) => option.value === role)
      ?.defaultSector ?? "geral"
  );
}

export function defaultPlatformRoleForRole(role: FunctionalRole): MembershipRole {
  return (
    FUNCTIONAL_ROLE_OPTIONS.find((option) => option.value === role)
      ?.defaultPlatformRole ?? "MEMBER"
  );
}

export function defaultProfileKeyForRole(role: FunctionalRole): string {
  return (
    FUNCTIONAL_ROLE_OPTIONS.find((option) => option.value === role)
      ?.defaultProfileKey ?? "consultor-comercial"
  );
}
