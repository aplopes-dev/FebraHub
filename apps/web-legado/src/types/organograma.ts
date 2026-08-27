/* Tipos do Organograma — espelho do OrgMembro / OrgCargo da API. */

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

/** Cargo formal (entidade) resumido, como vem embutido em OrgMembro.cargo. */
export interface OrgCargoResumo {
  id: string;
  nome: string;
  setor: SetorOrganograma;
  nivel: number;
}

export interface OrgMembro {
  id: string;
  tipo: TipoMembro;
  nome: string;
  funcao: string;
  setor: SetorOrganograma;
  ordem: number;
  ativo: boolean;
  cargoId: string | null;
  cargo?: OrgCargoResumo | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CriarMembroInput {
  tipo: TipoMembro;
  nome: string;
  /** Texto da função (fallback quando não há cargo). */
  funcao?: string;
  /** Cargo formal escolhido; se presente, dita função e setor. */
  cargoId?: string | null;
  setor: SetorOrganograma;
  ordem?: number;
}

export type AtualizarMembroInput = Partial<CriarMembroInput> & { ativo?: boolean };

/* ---- Cargos ------------------------------------------------------------- */

export interface OrgCargo {
  id: string;
  nome: string;
  setor: SetorOrganograma;
  nivel: number;
  descricao: string | null;
  ativo: boolean;
  cargoPaiId: string | null;
  criadoEm: string;
  atualizadoEm: string;
  _count?: { membros: number; subordinados: number };
}

export interface CriarCargoInput {
  nome: string;
  setor: SetorOrganograma;
  nivel?: number;
  descricao?: string | null;
  cargoPaiId?: string | null;
}

export type AtualizarCargoInput = Partial<CriarCargoInput> & { ativo?: boolean };
