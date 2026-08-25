import { api } from './client';
import type {
  AcompanharPedido, CardapioPublico, CheckoutInput, LojaAuditoria, LojaOperacao, LojaPedido,
  LojaPedidoPagamento, LojaPedidosDashboard, LojaPedidosIndicadores, PainelTv, VendaPdvInput,
} from '@/types/loja-pedidos';

// -------------------- público (cardápio / cliente) --------------------
export const cardapioPublico = (slug: string) => api.get<CardapioPublico>(`/loja-pedidos/publico/cardapio/${slug}`);
export const checkout = (d: CheckoutInput) => api.post<LojaPedido>('/loja-pedidos/publico/checkout', d);
export interface DadosCartaoInput {
  numero: string; titular: string; validadeMes: string; validadeAno: string; cvv: string;
  cpfCnpj?: string; cep?: string; numeroEndereco?: string; telefone?: string; email?: string;
}
export const iniciarPagamento = (
  id: string,
  d: { forma: string; provider?: string; parcelas?: number; cartao?: DadosCartaoInput },
) => api.post<LojaPedidoPagamento>(`/loja-pedidos/publico/pedidos/${id}/pagamento`, d);
export const confirmarPagamentoPublico = (id: string, d: { pagamentoId?: string; gatewayId?: string } = {}) =>
  api.post<LojaPedido>(`/loja-pedidos/publico/pedidos/${id}/pagamento/confirmar`, d);
export const acompanharPedido = (id: string) => api.get<AcompanharPedido>(`/loja-pedidos/publico/pedidos/${id}/acompanhar`);
export const painelPublico = (operacaoId?: string) => api.get<PainelTv>('/loja-pedidos/publico/painel', { parametros: { operacaoId } });

// -------------------- consultas (autenticadas) --------------------
export const lojaPedidosIndicadores = (operacaoId?: string) => api.get<LojaPedidosIndicadores>('/loja-pedidos/indicadores', { parametros: { operacaoId } });
export const lojaPedidosDashboard = (operacaoId?: string) => api.get<LojaPedidosDashboard>('/loja-pedidos/dashboard', { parametros: { operacaoId } });
export const lojaOperacoes = () => api.get<LojaOperacao[]>('/loja-pedidos/operacoes');
export const lojaOperacaoAtiva = () => api.get<LojaOperacao | null>('/loja-pedidos/operacoes/ativa');
export const lojaPedidos = (operacaoId?: string, status?: string) => api.get<LojaPedido[]>('/loja-pedidos/pedidos', { parametros: { operacaoId, status } });
export const lojaPedido = (id: string) => api.get<LojaPedido>(`/loja-pedidos/pedidos/${id}`);

// -------------------- operação da fila --------------------
export const confirmarPagamento = (id: string, d: { pagamentoId?: string } = {}) => api.post<LojaPedido>(`/loja-pedidos/pedidos/${id}/pagamento/confirmar`, d);
export const marcarProximo = (id: string) => api.post<LojaPedido>(`/loja-pedidos/pedidos/${id}/proximo`);
export const iniciarPreparacao = (id: string) => api.post<LojaPedido>(`/loja-pedidos/pedidos/${id}/preparar`);
export const marcarPronto = (id: string) => api.post<LojaPedido>(`/loja-pedidos/pedidos/${id}/pronto`);
export const confirmarRetirada = (id: string) => api.post<LojaPedido>(`/loja-pedidos/pedidos/${id}/retirar`);
export const cancelarPedido = (id: string, motivo: string) => api.post<LojaPedido>(`/loja-pedidos/pedidos/${id}/cancelar`, { motivo });

// -------------------- venda PDV (fila unificada + split) --------------------
export const vendaPdvFila = (d: VendaPdvInput) => api.post<LojaPedido>('/loja-pedidos/pdv/venda', d);

// -------------------- auditoria --------------------
export const lojaAuditoria = (p: { entidade?: string; acao?: string; de?: string; ate?: string } = {}) =>
  api.get<LojaAuditoria[]>('/loja-pedidos/auditoria', { parametros: p });

// -------------------- gestão de operações --------------------
export const criarOperacao = (d: Partial<LojaOperacao>) => api.post<LojaOperacao>('/loja-pedidos/operacoes', d);
export const atualizarOperacao = (id: string, d: Partial<LojaOperacao>) => api.put<LojaOperacao>(`/loja-pedidos/operacoes/${id}`, d);

// -------------------- QR Code do cardápio (PRD §11) --------------------
export interface QrCardapio { slug: string; operacao: string; url: string; pngDataUrl: string; svg: string }
export const qrcodeCardapio = (slug: string) => api.get<QrCardapio>(`/loja-pedidos/operacoes/${slug}/qrcode`);
