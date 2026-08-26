export type LojaPedidoStatus =
  | "AGUARDANDO_PAGAMENTO" | "PAGAMENTO_CONFIRMADO" | "NA_FILA"
  | "PROXIMO" | "EM_PREPARACAO" | "PRONTO" | "RETIRADO" | "CANCELADO";

export interface LojaOperacao {
  id: string;
  nome: string;
  descricao: string;
  modo: "RETIRADA_BALCAO" | "SERVICO_MESA";
  status: "ativa" | "encerrada" | "suspensa";
  slug?: string | null;
  /** Cartaz/pôster do evento exibido na 1ª coluna do Painel TV. */
  cartazUrl?: string | null;
  inicio?: string | null;
  fim?: string | null;
  criadoEm: string;
  _count?: { pedidos: number };
}

export interface LojaPedidoItem {
  id: string;
  produtoId: string;
  descricao: string;
  quantidade: string;
  precoUnit: string;
  total: string;
  observacao: string;
}

export interface LojaPedidoPagamento {
  id: string;
  provider: string;
  forma: string;
  status: "PENDENTE" | "CONFIRMADO" | "RECUSADO" | "EXPIRADO" | "ESTORNADO";
  valor: string;
  gatewayId?: string | null;
  pixQrcode?: string | null;
  pixCopiaCola?: string | null;
  pixExpiracao?: string | null;
  criadoEm: string;
}

export interface LojaPedido {
  id: string;
  numero: number;
  operacaoId?: string | null;
  canal: "CARDAPIO_DIGITAL" | "PDV";
  status: LojaPedidoStatus;
  clienteNome: string;
  clienteTel?: string | null;
  subtotal: string;
  desconto: string;
  total: string;
  posicaoFila?: number | null;
  precisaPreparacao: boolean;
  confirmadoEm?: string | null;
  prontoEm?: string | null;
  criadoEm: string;
  itens: LojaPedidoItem[];
  pagamentos?: LojaPedidoPagamento[];
}

export interface CardapioProduto {
  produtoId: string;
  nome: string;
  descricao: string;
  preco: number;
  imagemUrl?: string | null;
  categoria?: string | null;
  categoriaCor?: string | null;
  precisaPreparacao: boolean;
  disponivel: number | null;
  esgotado: boolean;
}

export interface CardapioPublico {
  operacao: { id: string; nome: string; modo: string; slug?: string | null };
  produtos: CardapioProduto[];
}

export interface AcompanharPedido {
  id: string;
  numero: number;
  /** Senha da fila (2 dígitos na UI). Null se o pedido não entrou na fila. */
  senha: number | null;
  status: LojaPedidoStatus;
  posicao: number | null;
}

export interface ComprovanteItem {
  id: string;
  descricao: string;
  quantidade: string;
  precoUnit: string;
  total: string;
}

/** Comprovante do cliente (a "receita" com QR) e o payload de verificação do
 *  vendedor — os dois compartilham o mesmo formato base. */
export interface Comprovante {
  id: string;
  numero: number;
  status: LojaPedidoStatus;
  operacao: string;
  clienteNome: string;
  subtotal: string;
  desconto: string;
  total: string;
  formaPagamento: string | null;
  criadoEm: string;
  confirmadoEm: string | null;
  prontoEm: string | null;
  retiradoEm: string | null;
  observacoes: string;
  itens: ComprovanteItem[];
  pago: boolean;
  retirado: boolean;
  cancelado: boolean;
  // Só no comprovante do cliente (endpoint público):
  token?: string | null;
  urlRetirada?: string | null;
  qrPngDataUrl?: string | null;
  qrSvg?: string | null;
}

/** Veredito da consulta de retirada pelo QR (tela do vendedor). */
export interface RetiradaConsulta extends Comprovante {
  podeRetirar: boolean;
  posicaoFila: number | null;
  bloqueio: string | null;
  retiradoPorNome: string | null;
}

/** Um pedido na coluna EM PREPARAÇÃO da TV: senha + posição dinâmica. */
export interface PainelTvPreparando {
  senha: number | null;
  numero: number;
  posicao: number;
  estado: "NA_FILA" | "PROXIMO" | "EM_PREPARACAO";
}
/** Um pedido na coluna PRONTO PARA RETIRADA: só a senha importa. */
export interface PainelTvPronto {
  senha: number | null;
  numero: number;
}
export interface PainelTv {
  operacao: { nome: string; cartazUrl: string | null } | null;
  preparando: PainelTvPreparando[];
  prontos: PainelTvPronto[];
  // Compat retro (formato antigo por número de pedido):
  naFila: number[];
  proximo: number[];
  emPreparacao: number[];
  prontosNumeros: number[];
}

export interface LojaPedidosIndicadores {
  pedidos: number;
  faturamento: number;
  ticketMedio: number;
  pedidosHoje: number;
  faturamentoHoje: number;
  aguardandoFila: number;
  emPreparacao: number;
  prontos: number;
}

export interface LojaPedidosDashboard {
  maisVendidos: { descricao: string; quantidade: number; total: number }[];
  formas: { forma: string; valor: number; transacoes: number }[];
  canais: { canal: string; valor: number; pedidos: number }[];
  tempoMedioPreparacaoMin: number;
  tempoMedioEsperaMin: number;
}

export interface CheckoutInput {
  operacaoId?: string;
  canal?: "CARDAPIO_DIGITAL" | "PDV";
  clienteNome?: string;
  clienteTel?: string;
  observacoes?: string;
  itens: { produtoId: string; quantidade: number; observacao?: string }[];
}

export type FormaPagamento = "PIX" | "CARTAO_CREDITO" | "CARTAO_DEBITO" | "DINHEIRO";

export interface VendaPdvInput {
  operacaoId?: string;
  clienteNome?: string;
  clienteTel?: string;
  observacoes?: string;
  desconto?: number;
  modo: "ENTREGAR_AGORA" | "ENVIAR_PREPARACAO";
  itens: { produtoId: string; quantidade: number; observacao?: string }[];
  pagamentos: { forma: FormaPagamento; valor: number; bandeira?: string; parcelas?: number }[];
}

export interface LojaAuditoria {
  id: string;
  entidade: string;
  entidadeId?: string | null;
  acao: string;
  origem: string;
  usuarioNome?: string | null;
  antes?: unknown;
  depois?: unknown;
  observacao: string;
  criadoEm: string;
}
