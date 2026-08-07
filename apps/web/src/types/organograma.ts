/* Tipos do Organograma — espelho do OrgMembro da API. */

export type TipoMembro = "funcionario" | "agente";

/** Setores do organograma = hubs do menu MENOS o CRM (lista canônica na API). */
export const SETORES_ORGANOGRAMA = [
  "comercial",
  "financeiro",
  "marketing",
  "pedagogico",
  "eventos",
  "loja",
  "estoque",
] as const;

export type SetorOrganograma = (typeof SETORES_ORGANOGRAMA)[number];

export interface OrgMembro {
  id: string;
  tipo: TipoMembro;
  nome: string;
  funcao: string;
  setor: SetorOrganograma;
  ordem: number;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CriarMembroInput {
  tipo: TipoMembro;
  nome: string;
  funcao: string;
  setor: SetorOrganograma;
  ordem?: number;
}

export type AtualizarMembroInput = Partial<CriarMembroInput> & { ativo?: boolean };
