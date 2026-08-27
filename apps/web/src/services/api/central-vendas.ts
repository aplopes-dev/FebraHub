import { api } from "./client";

/**
 * Central de Vendas e Conciliação (LOJA) — FebraHub + Stone + Omie.
 * Endpoints em /loja/vendas. Consultas exigem loja.pedidos.ver; ações de
 * conciliação exigem loja.vendas.conciliar.
 */

export type Origem = "FEBRAHUB" | "STONE" | "OMIE";

export type StatusConciliacao =
  | "CONCILIADA"
  | "PARCIALMENTE_CONCILIADA"
  | "SOMENTE_STONE"
  | "SOMENTE_FEBRAHUB"
  | "SOMENTE_OMIE"
  | "FEBRAHUB_STONE"
  | "FEBRAHUB_OMIE"
  | "STONE_OMIE"
  | "DIVERGENCIA_VALOR"
  | "POSSIVEL_DUPLICIDADE"
  | "REQUER_REVISAO"
  | "CANCELADA"
  | "ESTORNADA";

export interface VendaOrigem {
  id: string;
  consolidadaId: string | null;
  origem: Origem;
  externalId: string;
  lojaPedidoId: string | null;
  valor: string;
  dataHora: string | null;
  nsu: string | null;
  tid: string | null;
  autorizacao: string | null;
  bandeira: string | null;
  formaPagamento: string | null;
  parcelas: number | null;
  terminal: string | null;
  unidade: string | null;
  clienteNome: string | null;
  status: string;
  vinculoModo: string | null;
  vinculoScore: number | null;
  payload?: Record<string, unknown> | null;
  consolidada?: { numero: number; statusConciliacao: StatusConciliacao } | null;
}

export interface VendaConsolidada {
  id: string;
  numero: number;
  unidade: string | null;
  eventoNome: string | null;
  clienteNome: string | null;
  clienteDoc: string | null;
  dataVenda: string;
  formaPagamento: string | null;
  valorTotal: string;
  valorRecebido: string;
  valorLiquido: string;
  valorEstornado: string;
  statusConciliacao: StatusConciliacao;
  inferido: boolean;
  observacao: string;
  temFebrahub: boolean;
  temStone: boolean;
  temOmie: boolean;
  origens: Array<{ origem: Origem; valor: string; status: string; formaPagamento: string | null }>;
}

export interface ListaResp<T> {
  modo: "consolidada" | "origem";
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
  itens: T[];
}

export interface ResumoCards {
  faturamentoConsolidado: number;
  recebido: number;
  estornado: number;
  totalVendas: number;
  porOrigem: Record<Origem, { count: number; valor: number }>;
  somenteStone: { count: number; valor: number };
  febrahubSemStone: { count: number; valor: number };
  divergencias: { count: number; valor: number };
  naoConciliado: number;
  porStatus: Record<string, { count: number; valor: number }>;
}

export interface DetalheConsolidada extends VendaConsolidada {
  origens: VendaOrigem[];
  itensFebrahub: Array<{ descricao: string; quantidade: string; precoUnit: string; total: string }>;
  auditoria: Array<{ id: string; acao: string; detalhe: string; usuarioNome: string | null; criadoEm: string }>;
}

export interface StatusIntegracao {
  stone: {
    conectado: boolean;
    ultimaSincronizacao: string | null;
    ultimoStatus: string | null;
    ultimaTransacao: string | null;
    registrosImportados: number;
    ultimoErro: string | null;
  };
}

export interface FiltrosCentral {
  origem?: "todas" | Origem;
  busca?: string;
  dataInicio?: string;
  dataFim?: string;
  unidade?: string;
  evento?: string;
  statusConciliacao?: string;
  formaPagamento?: string;
  terminal?: string;
  operador?: string;
  nsu?: string;
  tid?: string;
  autorizacao?: string;
  pagina?: number;
  porPagina?: number;
}

const params = (f: FiltrosCentral) => ({ ...f }) as Record<string, string | number | undefined>;

export const centralListar = (f: FiltrosCentral = {}) =>
  api.get<ListaResp<VendaConsolidada | VendaOrigem>>("/loja/vendas", { parametros: params(f) });

export const centralResumo = (f: FiltrosCentral = {}) =>
  api.get<ResumoCards>("/loja/vendas/resumo", { parametros: params(f) });

export const centralDetalhe = (id: string) => api.get<DetalheConsolidada>(`/loja/vendas/${id}`);

export const centralStatusIntegracao = () => api.get<StatusIntegracao>("/loja/vendas/integracao/status");

export const centralSincronizarStone = (d: { de?: string; ate?: string; forcar?: boolean }) =>
  api.post<{ importadas: { transacoes: number }; origens: { stone: number; febrahub: number; omie: number }; reconciliacao: { vinculadas: number; criadas: number; sugeridas: number } }>(
    "/loja/vendas/sincronizar-stone",
    d,
  );

export const centralRessincronizar = () =>
  api.post<{ origens: { stone: number; febrahub: number; omie: number }; reconciliacao: { vinculadas: number; criadas: number; sugeridas: number } }>(
    "/loja/vendas/ressincronizar",
    {},
  );

export const centralReconciliar = (d: { dataInicio?: string; dataFim?: string; limiar?: number }) =>
  api.post<{ vinculadas: number; criadas: number; sugeridas: number }>("/loja/vendas/reconciliar", d);

export const centralConciliar = (d: { origemIds: string[]; consolidadaId?: string }) =>
  api.post<DetalheConsolidada>("/loja/vendas/conciliar", d);

export const centralDesvincular = (d: { origemId: string; motivo?: string }) =>
  api.post<{ ok: boolean; novaConsolidadaId?: string }>("/loja/vendas/desvincular", d);

/** URL de exportação CSV (cookie httpOnly autentica no browser). */
export function centralExportarUrl(f: FiltrosCentral = {}): string {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "/api").replace(/\/$/, "");
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params(f))) if (v != null && v !== "") qs.append(k, String(v));
  const s = qs.toString();
  return `${base}/loja/vendas/exportar${s ? `?${s}` : ""}`;
}
