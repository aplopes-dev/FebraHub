import type { FunctionalRole } from "@/features/users-permissions/types/user";

export type FunctionalRoleOption = {
  value: FunctionalRole;
  label: string;
  description: string;
  /** Perfil padrão sugerido (systemKey ou id fixo do mock). */
  defaultProfileKey: string;
  isSeller: boolean;
};

export const FUNCTIONAL_ROLE_OPTIONS: FunctionalRoleOption[] = [
  {
    value: "ADMIN",
    label: "Administrador",
    description: "Acesso total ao sistema e configurações.",
    defaultProfileKey: "administrador",
    isSeller: false,
  },
  {
    value: "MANAGER",
    label: "Gerente",
    description: "Supervisiona equipe e aprova operações do departamento.",
    defaultProfileKey: "gerente-vendas",
    isSeller: false,
  },
  {
    value: "SALES_CONSULTANT",
    label: "Consultor de vendas",
    description: "Negocia veículos novos e seminovos com clientes.",
    defaultProfileKey: "consultor-vendas",
    isSeller: true,
  },
  {
    value: "USED_CAR_APPRAISER",
    label: "Avaliador de seminovos",
    description: "Avalia veículos usados no pátio com laudo e fotos.",
    defaultProfileKey: "avaliador",
    isSeller: true,
  },
  {
    value: "FI_CONSULTANT",
    label: "Consultor F&I",
    description: "Financiamento, seguros e produtos agregados na venda.",
    defaultProfileKey: "consultor-fi",
    isSeller: true,
  },
  {
    value: "SERVICE_ADVISOR",
    label: "Consultor de serviços",
    description: "Atendimento de oficina, check-in e orçamentos.",
    defaultProfileKey: "consultor-servicos",
    isSeller: false,
  },
  {
    value: "TECHNICIAN",
    label: "Técnico de oficina",
    description: "Execução de serviços e apontamento de horas.",
    defaultProfileKey: "tecnico-oficina",
    isSeller: false,
  },
  {
    value: "PARTS_MANAGER",
    label: "Gerente de peças",
    description: "Estoque, balcão e pedidos de peças.",
    defaultProfileKey: "gerente-pecas",
    isSeller: false,
  },
  {
    value: "CASHIER",
    label: "Caixa",
    description: "Recebimentos e movimentação de caixa.",
    defaultProfileKey: "caixa",
    isSeller: false,
  },
  {
    value: "DOC_CLERK",
    label: "Despachante / documentação",
    description: "Processos veiculares, pendências e anexos.",
    defaultProfileKey: "despachante",
    isSeller: false,
  },
  {
    value: "ACCOUNTANT",
    label: "Contador",
    description: "Leitura financeira e relatórios, sem margem comercial.",
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
      ?.defaultProfileKey ?? "consultor-vendas"
  );
}
