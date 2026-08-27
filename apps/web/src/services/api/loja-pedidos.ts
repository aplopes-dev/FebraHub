import { api } from './client';
import type {
  AcompanharPedido, CardapioPublico, CheckoutInput, Comprovante, EditarItensInput, ImpressoraStatus, LojaAuditoria,
  LojaOperacao, LojaPedido, LojaPedidoPagamento, LojaPedidosDashboard, LojaPedidosIndicadores, PainelTv,
  RetiradaConsulta, VendaPdvInput,
} from '@/types/loja-pedidos';
import type { PdvProduto } from '@/types/pdv';

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
/** Cardápio SEM cobrança online: registra o pedido (fila + código/QR); paga-se no balcão. */
export const fazerPedidoBalcao = (id: string) =>
  api.post<LojaPedido>(`/loja-pedidos/publico/pedidos/${id}/fazer`, {});
export const acompanharPedido = (id: string) => api.get<AcompanharPedido>(`/loja-pedidos/publico/pedidos/${id}/acompanhar`);
/** O próprio cliente edita os itens do pedido pelo link do cardápio (só enquanto
 *  não pagou ou está na fila). Substitui a lista de itens por completo. */
export const editarItensPedidoPublico = (id: string, itens: { produtoId: string; quantidade: number; observacao?: string }[]) =>
  api.patch<LojaPedido>(`/loja-pedidos/publico/pedidos/${id}/itens`, { itens });
/** Comprovante do cliente (a "receita" com QR de retirada). Público. */
export const comprovantePedido = (id: string) => api.get<Comprovante>(`/loja-pedidos/publico/pedidos/${id}/comprovante`);
export const painelPublico = (operacaoId?: string) => api.get<PainelTv>('/loja-pedidos/publico/painel', { parametros: { operacaoId } });

// -------------------- produtos do balcão (autenticado, sem pdv.ver) --------------------
export const lojaProdutosBalcao = (busca?: string) =>
  api.get<PdvProduto[]>('/loja-pedidos/balcao/produtos', { parametros: { busca } });

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
export const moverPedidoStatus = (id: string, paraStatus: 'NA_FILA' | 'EM_PREPARACAO' | 'PRONTO', observacao?: string) =>
  api.post<LojaPedido>(`/loja-pedidos/pedidos/${id}/mover`, { paraStatus, observacao });

// -------------------- retirada por QR (vendedor escaneia o comprovante) --------------------
export const consultarRetirada = (token: string) => api.get<RetiradaConsulta>(`/loja-pedidos/retirada/${encodeURIComponent(token)}`);
export const resgatarRetirada = (token: string) => api.post<Comprovante>(`/loja-pedidos/retirada/${encodeURIComponent(token)}/confirmar`);

// -------------------- venda PDV (fila unificada + split) --------------------
export const vendaPdvFila = (d: VendaPdvInput) => api.post<LojaPedido>('/loja-pedidos/pdv/venda', d);

// -------------------- balcão: código de 3 dígitos + edição + impressão --------------------
/** Busca o pedido ativo pelo CÓDIGO SECRETO de 3 dígitos que o cliente digita. */
export const buscarPedidoPorCodigo = (codigo: string, operacaoId?: string) =>
  api.get<LojaPedido>(`/loja-pedidos/codigo/${encodeURIComponent(codigo)}`, { parametros: { operacaoId } });
/** Edita o carrinho do pedido (itens + desconto) — revalida preço/estoque no back. */
export const editarItensPedido = (id: string, d: EditarItensInput) =>
  api.patch<LojaPedido>(`/loja-pedidos/pedidos/${id}/itens`, d);
/** Imprime o cupom do pedido na impressora térmica do balcão. */
export const imprimirCupomPedido = (id: string) =>
  api.post<{ ok: boolean; bytes: number }>(`/loja-pedidos/pedidos/${id}/imprimir`);
/** Estado da impressora do balcão (para habilitar/desabilitar o botão). */
export const impressoraStatus = () => api.get<ImpressoraStatus>('/loja-pedidos/impressora/status');

// -------------------- auditoria --------------------
export const lojaAuditoria = (p: { entidade?: string; acao?: string; de?: string; ate?: string } = {}) =>
  api.get<LojaAuditoria[]>('/loja-pedidos/auditoria', { parametros: p });

// -------------------- gestão de operações --------------------
export const criarOperacao = (d: Partial<LojaOperacao>) => api.post<LojaOperacao>('/loja-pedidos/operacoes', d);
export const atualizarOperacao = (id: string, d: Partial<LojaOperacao>) => api.put<LojaOperacao>(`/loja-pedidos/operacoes/${id}`, d);

// -------------------- QR Code do cardápio (PRD §11) --------------------
export interface QrCardapio { slug: string; operacao: string; url: string; pngDataUrl: string; svg: string }
export const qrcodeCardapio = (slug: string) => api.get<QrCardapio>(`/loja-pedidos/operacoes/${slug}/qrcode`);
