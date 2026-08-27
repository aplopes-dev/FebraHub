import { api } from './client';

/**
 * Status da integração Omie — somente leitura. As credenciais
 * (app_key/app_secret) vivem no ambiente da API (OMIE_APP_KEY/OMIE_APP_SECRET),
 * não há tela de configuração. `appKey`/`appSecret` vêm mascarados.
 */
export interface OmieConfig {
  appKey: string | null;
  appSecret: string | null;
  contaCorrente: string | null;
  codigoCategoria: string | null;
  idVendedor: number | null;
  ativo: boolean;
  configurado: boolean;
}

export interface OmieLancamento {
  status: 'pendente' | 'lancado' | 'erro' | 'cancelado';
  omieNumero: string | null;
  omiePedidoId: string | null;
  lancadoEm: string | null;
  erro: string | null;
}

export interface VendaLoja {
  id: string;
  numero: number;
  canal: string;
  status: string;
  clienteNome: string;
  clienteTel: string | null;
  operadorNome: string | null;
  total: string;
  criadoEm: string;
  confirmadoEm: string | null;
  operacao: { nome: string; slug: string | null } | null;
  pagamentos: Array<{ forma: string; valor: string; status: string }>;
  itens: Array<{
    descricao: string;
    quantidade: string;
    precoUnit: string;
    total: string;
    produto: { sku: string | null; skuOmie: string | null; nome: string };
  }>;
  omieLancamento: OmieLancamento | null;
}

export interface ListaVendasResp {
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
  itens: VendaLoja[];
}

export interface LancarResp {
  lancados: number;
  erros: number;
  resultados: Array<{ pedidoId: string; status: string; omieNumero?: string; motivo?: string; erro?: string }>;
}

/** Resultado do vínculo em lote dos produtos com o Omie (por codigo_produto_integracao). */
export interface VinculoOmieResp {
  total: number;
  vinculados: number;
  associados: number;
  criados: number;
  jaVinculados: number;
  erros: number;
  /** true = o Omie bloqueou o app_key por consumo (HTTP 425); rode de novo em ~30min. */
  bloqueado: boolean;
}

// ---- Configuração (somente leitura — credenciais no ambiente da API) ----
export const omieConfig = () => api.get<OmieConfig>('/loja/omie/config');
export const omieTestar = () => api.post<{ ok: boolean; empresa: unknown }>('/loja/omie/config/testar', {});

// ---- Vínculo de produtos (por codigo_produto_integracao) ----
/**
 * Vincula todos os produtos da Loja aos do Omie usando o codigo_produto_integracao
 * (chave imutável recomendada pela Omie). Idempotente. Usado na tela "Produtos da Loja".
 */
export const omieVincularProdutos = () => api.post<VinculoOmieResp>('/loja/omie/vincular-integracao', {});

// ---- Vendas ----
export interface FiltrosVendas {
  busca?: string;
  status?: string;
  statusOmie?: string;
  dataInicio?: string;
  dataFim?: string;
  pagina?: number;
  porPagina?: number;
}
export const omieVendas = (f: FiltrosVendas = {}) =>
  api.get<ListaVendasResp>('/loja/omie/vendas', { parametros: { ...f } as Record<string, string | number | undefined> });

// ---- Lançamentos ----
export const omieLancarUm = (id: string) => api.post<LancarResp>(`/loja/omie/vendas/${id}/lancar`, {});
export const omieLancarFiltrados = (d: { pedidoIds?: string[]; dataInicio?: string; dataFim?: string }) =>
  api.post<LancarResp>('/loja/omie/lancar', d);
