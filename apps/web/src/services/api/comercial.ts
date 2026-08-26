import { api } from "./client";

// ============================================================
// TIPOS
// ============================================================

export interface ComEtapa {
  id: string;
  nome: string;
  tipo: string;
  cor: string;
  probabilidade: number;
  ordem: number;
  sistema: boolean;
}

export interface ComFunil {
  id: string;
  nome: string;
  cor: string;
  tipo: string;
  etapas: ComEtapa[];
}

export interface ComOportunidade {
  id: string;
  pessoaId: string;
  pessoaNome?: string | null;
  produtoId?: string | null;
  produtoNome?: string | null;
  funilId: string;
  funilNome?: string | null;
  etapaId: string;
  etapaNome?: string | null;
  etapaTipo?: string | null;
  etapaCor?: string | null;
  responsavelId?: string | null;
  responsavelNome?: string | null;
  valorEstimadoCentavos: number;
  probabilidade: number;
  origem?: string | null;
  canal?: string | null;
  campanha?: string | null;
  status: string;
  ultimaInteracaoEm?: string | null;
  proximaAcaoEm?: string | null;
  proximaAcaoDescricao?: string | null;
  turmaADefinir: boolean;
  criadoEm: string;
}

export interface ComVenda {
  id: string;
  numero: string;
  compradorId: string;
  compradorNome?: string | null;
  produtoNome: string;
  valorNegociadoCentavos: number;
  statusComercial: string;
  statusFinanceiro: string;
  turmaADefinir: boolean;
  criadoEm: string;
}

export interface ComDashboard {
  /** Leads criados no período */
  leadsNoPeriodo: number;
  /** Oportunidades abertas (count total do pipeline) */
  pipelineTotalOportunidades: number;
  pipelineTotalCentavos: number;
  /** Vendas fechadas no período */
  vendasFechadasTotal: number;
  valorVendidoCentavos: number;
  /** Conversão em % (0-100) */
  conversaoPercent: number;
  followUpsAtrasados: number;
  semProximaAcao: number;
  ticketMedioCentavos: number;
  oportunidadesAbertasPorEtapa: { etapaId: string; total: number; valorCentavos: number }[];
  periodo: { inicio: string; fim: string };
}

export interface MinhaOperacao {
  leadsNovos: number;
  hoje: number;
  atrasadas: number;
  semProximaAcao: number;
  negociacoes: number;
  vendas: number;
}

export interface ComNegociacao {
  id: string;
  oportunidadeId: string;
  valorBrutoCentavos: number;
  valorNegociadoCentavos: number;
  parcelas: number;
  formaPagamento: string;
  observacoes?: string | null;
  criadoEm: string;
}

export interface ComInteracao {
  id: string;
  tipo: string;
  descricao: string;
  criadoEm: string;
  usuarioNome?: string | null;
}

export interface ComAcao {
  id: string;
  descricao: string;
  prazoEm: string;
  status: string;
  resultado?: string | null;
  criadoEm: string;
}

export interface ComOportunidadeDetalhe extends ComOportunidade {
  historico: ComInteracao[];
  acoes: ComAcao[];
  negociacao?: ComNegociacao | null;
  venda?: ComVenda | null;
}

export interface ComKanbanColuna {
  etapa: ComEtapa;
  oportunidades: ComOportunidade[];
  totalCentavos: number;
  quantidade: number;
}

// ============================================================
// HELPERS
// ============================================================

const B = "/comercial";

function qs(params?: Record<string, string | number | boolean | undefined | null>): string {
  if (!params) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

// ============================================================
// OPORTUNIDADES
// ============================================================

export function listarOportunidades(
  filtros?: Record<string, string | number | undefined>,
) {
  return api.get<{ itens: ComOportunidade[]; total: number; pagina: number }>(
    `${B}/oportunidades${qs(filtros)}`,
  );
}

export function kanbanOportunidades(
  funilId: string,
  filtros?: Record<string, string | undefined>,
) {
  return api.get<ComKanbanColuna[]>(
    `${B}/oportunidades/kanban${qs({ funilId, ...filtros })}`,
  );
}

export function obterOportunidade(id: string) {
  return api.get<ComOportunidadeDetalhe>(`${B}/oportunidades/${id}`);
}

export function criarOportunidade(dto: Record<string, unknown>) {
  return api.post<ComOportunidade>(`${B}/oportunidades`, dto);
}

export function atualizarOportunidade(id: string, dto: Record<string, unknown>) {
  return api.patch<ComOportunidade>(`${B}/oportunidades/${id}`, dto);
}

export function moverEtapa(id: string, dto: { etapaId: string; motivo?: string }) {
  return api.patch<ComOportunidade>(`${B}/oportunidades/${id}/etapa`, dto);
}

export function registrarInteracao(
  id: string,
  dto: { tipo: string; descricao: string },
) {
  return api.post<ComInteracao>(`${B}/oportunidades/${id}/interacoes`, dto);
}

export function criarProximaAcao(
  id: string,
  dto: { descricao: string; prazoEm: string },
) {
  return api.post<ComAcao>(`${B}/oportunidades/${id}/acoes`, dto);
}

export function concluirAcao(
  oportunidadeId: string,
  acaoId: string,
  resultado: string,
) {
  return api.patch<ComAcao>(
    `${B}/oportunidades/${oportunidadeId}/acoes/${acaoId}`,
    { resultado },
  );
}

export function transferirResponsavel(
  id: string,
  dto: { responsavelId: string },
) {
  return api.patch<ComOportunidade>(`${B}/oportunidades/${id}/responsavel`, dto);
}

// ============================================================
// LEADS
// ============================================================

export function criarLead(dto: {
  nome: string;
  whatsapp: string;
  email?: string;
  origem?: string;
  canal?: string;
  campanha?: string;
  produtoId?: string;
  responsavelId?: string;
}) {
  return api.post<{ oportunidade: ComOportunidade; deduplicado: boolean }>(
    `${B}/leads`,
    dto,
  );
}

// ============================================================
// NEGOCIAÇÃO
// ============================================================

export function obterNegociacao(oportunidadeId: string) {
  return api.get<ComNegociacao>(`${B}/oportunidades/${oportunidadeId}/negociacao`);
}

export function criarNegociacao(
  oportunidadeId: string,
  dto: Record<string, unknown>,
) {
  return api.post<ComNegociacao>(
    `${B}/oportunidades/${oportunidadeId}/negociacao`,
    dto,
  );
}

export function atualizarNegociacao(
  oportunidadeId: string,
  dto: Record<string, unknown>,
) {
  return api.patch<ComNegociacao>(
    `${B}/oportunidades/${oportunidadeId}/negociacao`,
    dto,
  );
}

// ============================================================
// VENDAS
// ============================================================

export function fecharVenda(oportunidadeId: string, dto: Record<string, unknown>) {
  return api.post<ComVenda>(`${B}/oportunidades/${oportunidadeId}/venda`, dto);
}

export function listarVendas(filtros?: Record<string, string | number | undefined>) {
  return api.get<{ itens: ComVenda[]; total: number; pagina: number }>(
    `${B}/vendas${qs(filtros)}`,
  );
}

export function obterVenda(id: string) {
  return api.get<ComVenda>(`${B}/vendas/${id}`);
}

export function aprovarVenda(id: string, dto?: { observacoes?: string }) {
  return api.post<ComVenda>(`${B}/vendas/${id}/aprovar`, dto ?? {});
}

export function cancelarVenda(id: string, dto: { motivo: string }) {
  return api.post<ComVenda>(`${B}/vendas/${id}/cancelar`, dto);
}

export function definirTurma(id: string, turmaId: string) {
  return api.patch<ComVenda>(`${B}/vendas/${id}/turma`, { turmaId });
}

// ============================================================
// CONFIGURAÇÃO / LISTAS
// ============================================================

export function minhaOperacao() {
  return api.get<MinhaOperacao>(`${B}/minha-operacao`);
}

export function dashboard(filtros?: Record<string, string | undefined>) {
  return api.get<ComDashboard>(`${B}/dashboard${qs(filtros)}`);
}

export function listarFunis() {
  return api.get<ComFunil[]>(`${B}/funis`);
}

export function listarProdutos() {
  return api.get<{ id: string; nome: string; preco?: number | null }[]>(
    `${B}/produtos`,
  );
}

export function listarMotivosPerdas() {
  return api.get<{ id: string; nome: string }[]>(`${B}/motivos-perda`);
}
