import type { Sector } from "@/features/users-permissions/types/user";

export type SectorOption = {
  value: Sector;
  label: string;
  description: string;
};

/**
 * Setores do cadastro — o eixo "sobre QUAIS DADOS" do acesso.
 *
 * O perfil de acesso responde o QUE a pessoa pode fazer (as telas, as ações);
 * o setor responde sobre quais dados ela faz. Um gestor do financeiro e um
 * gestor do comercial usam o MESMO perfil e enxergam números diferentes.
 *
 * A lista espelha `SETORES_CADASTRO` do `apps/api`
 * (`modules/permissoes/permissoes.dto.ts`): os módulos do ERP mais `geral`,
 * que é a diretoria — quem não pertence a um setor específico.
 */
export const SECTOR_OPTIONS: SectorOption[] = [
  {
    value: "geral",
    label: "Geral (diretoria)",
    description: "Direção e áreas transversais, sem recorte de setor.",
  },
  {
    value: "comercial",
    label: "Comercial",
    description: "Matrículas, funil de vendas e metas da equipe.",
  },
  {
    value: "financeiro",
    label: "Financeiro",
    description: "Recebimentos, inadimplência e conciliação.",
  },
  {
    value: "marketing",
    label: "Marketing",
    description: "Campanhas, origem de leads e conteúdo.",
  },
  {
    value: "pedagogico",
    label: "Pedagógico",
    description: "Turmas, presença e jornada do aluno.",
  },
  {
    value: "eventos",
    label: "Eventos",
    description: "Imersões e eventos: ingressos e credenciamento.",
  },
  {
    value: "loja",
    label: "Loja",
    description: "Balcão, pedidos e fechamento do caixa.",
  },
  {
    value: "estoque",
    label: "Estoque e suprimentos",
    description: "Saldos, movimentações e compras.",
  },
  {
    value: "crm",
    label: "CRM",
    description: "Clientes, negócios e tarefas do relacionamento.",
  },
];

export function sectorLabel(sector: string): string {
  return (
    SECTOR_OPTIONS.find((option) => option.value === sector)?.label ?? sector
  );
}

/** `true` se o valor veio da API e ainda é um setor conhecido. */
export function isSector(value: unknown): value is Sector {
  return SECTOR_OPTIONS.some((option) => option.value === value);
}
