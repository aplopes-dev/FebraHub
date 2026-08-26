/**
 * Client do módulo Sympla — integração com a API de eventos.
 * Todas as chamadas passam pelo client httpOnly (cookie fh_acesso).
 */
import { api } from './api';

/* ─── Tipos ─── */

export interface SymplaResumo {
  totalEventos: number;
  totalOrders: number;
  receitaTotal: number;
  liquidoTotal: number;
  comCrm: number;
  semCrm: number;
}

export interface SymplaEvento {
  id: number;
  nome: string;
  dataInicio: string | null;
  dataFim: string | null;
  localNome: string | null;
  cidade: string | null;
  estado: string | null;
  imagemUrl: string | null;
  urlSympla: string | null;
  publicado: boolean;
  cancelado: boolean;
  totalPedidos: number | null;
  totalReceita: number;
  totalLiquido: number;
  sincronizadoEm: string | null;
}

export interface SymplaOrder {
  id: string;
  eventoId: number;
  orderDate: string | null;
  approvedDate: string | null;
  status: string | null;
  transactionType: string | null;
  totalSalePrice: number;
  totalNetValue: number;
  buyerFirstName: string | null;
  buyerLastName: string | null;
  buyerEmail: string | null;
  buyerCpf: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  crmClienteId: string | null;
  crmNome: string | null;
  comOportunidadeId: string | null;
}

export interface SympláSyncLog {
  id: number;
  tipo: string;
  referenciaId: string | null;
  status: string;
  totalRegistros: number;
  novos: number;
  atualizados: number;
  erros: number;
  erroMensagem: string | null;
  iniciadoEm: string;
  concluidoEm: string | null;
  duracaoS: number;
}

export interface PaginadoSympla<T> {
  dados: T[];
  total: number;
  pagina: number;
  limite: number;
}

/* ─── Funções ─── */

export const sympla = {
  /** Resumo geral: totais de eventos, pedidos e receita */
  async resumo(): Promise<SymplaResumo> {
    return api.get('/sympla/resumo');
  },

  /** Lista eventos sincronizados */
  async listarEventos(pagina = 1, limite = 20): Promise<PaginadoSympla<SymplaEvento>> {
    return api.get('/sympla/eventos', { pagina, limite });
  },

  /** Detalhe de um evento */
  async obterEvento(id: number): Promise<SymplaEvento> {
    return api.get(`/sympla/eventos/${id}`);
  },

  /** Lista orders (vendas) de um evento */
  async listarOrders(
    eventoId: number,
    pagina = 1,
    limite = 50,
    status?: string,
  ): Promise<PaginadoSympla<SymplaOrder>> {
    return api.get(`/sympla/eventos/${eventoId}/orders`, {
      pagina,
      limite,
      ...(status ? { status } : {}),
    });
  },

  /** Histórico de sincronizações */
  async historicoSync(limite = 20): Promise<SympláSyncLog[]> {
    return api.get('/sympla/sync/historico', { limite });
  },

  /** Sincroniza lista de eventos (requer gerenciar) */
  async sincronizarEventos(): Promise<{ novos: number; atualizados: number; total: number }> {
    return api.post('/sympla/sync/eventos', {});
  },

  /** Sincroniza orders + participantes de um evento */
  async sincronizarEvento(id: number): Promise<{ orders: number; participantes: number }> {
    return api.post(`/sympla/sync/eventos/${id}`, {});
  },

  /** Sync completo de todos os eventos */
  async syncCompleto(): Promise<{ eventos: number; orders: number; participantes: number }> {
    return api.post('/sympla/sync/completo', {});
  },
};
