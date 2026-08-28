import type { FunctionalRole } from "@/features/users-permissions/types/user";

export type FunctionalRoleOption = {
  value: FunctionalRole;
  label: string;
  description: string;
  /** Perfil padrão sugerido (systemKey ou id fixo do mock). */
  defaultProfileKey: string;
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
    isSeller: false,
  },
  {
    value: "UNIT_MANAGER",
    label: "Gerente de unidade",
    description: "Responde pela unidade: equipe, metas e resultado.",
    defaultProfileKey: "gerente-unidade",
    isSeller: false,
  },
  {
    value: "COMMERCIAL_CONSULTANT",
    label: "Consultor comercial",
    description: "Negocia e fecha matrículas em cursos, imersões e mentorias.",
    defaultProfileKey: "consultor-comercial",
    isSeller: true,
  },
  {
    value: "SDR",
    label: "SDR / pré-vendas",
    description: "Qualifica leads e agenda reuniões para o comercial.",
    defaultProfileKey: "sdr",
    isSeller: true,
  },
  {
    value: "STUDENT_SUCCESS",
    label: "Sucesso do aluno",
    description: "Acompanha o aluno após a matrícula: presença e renovação.",
    defaultProfileKey: "sucesso-do-aluno",
    isSeller: false,
  },
  {
    value: "ACADEMIC_COORDINATOR",
    label: "Coordenador acadêmico",
    description: "Monta turmas, cronograma e conteúdo dos programas.",
    defaultProfileKey: "coordenador-academico",
    isSeller: false,
  },
  {
    value: "FACILITATOR",
    label: "Facilitador / instrutor",
    description: "Conduz as aulas e registra presença da turma.",
    defaultProfileKey: "facilitador",
    isSeller: false,
  },
  {
    value: "EVENT_PRODUCER",
    label: "Produção de eventos",
    description: "Imersões e eventos: inscrições, credenciamento e logística.",
    defaultProfileKey: "producao-eventos",
    isSeller: false,
  },
  {
    value: "SECRETARY",
    label: "Secretaria acadêmica",
    description: "Contratos, documentos, certificados e pendências do aluno.",
    defaultProfileKey: "secretaria",
    isSeller: false,
  },
  {
    value: "FINANCE",
    label: "Financeiro",
    description: "Recebimentos, inadimplência e conciliação.",
    defaultProfileKey: "financeiro",
    isSeller: false,
  },
  {
    value: "MARKETING",
    label: "Marketing",
    description: "Campanhas e geração de leads para as turmas.",
    defaultProfileKey: "marketing",
    isSeller: false,
  },
  {
    value: "ACCOUNTANT",
    label: "Contador",
    description: "Leitura financeira e relatórios, sem custo de turma.",
    defaultProfileKey: "contador",
    isSeller: false,
  },
  {
    value: "VIEWER",
    label: "Somente leitura",
    description: "Consulta operacional sem alterar registros.",
    defaultProfileKey: "somente-leitura",
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

export function defaultProfileKeyForRole(role: FunctionalRole): string {
  return (
    FUNCTIONAL_ROLE_OPTIONS.find((option) => option.value === role)
      ?.defaultProfileKey ?? "consultor-comercial"
  );
}
