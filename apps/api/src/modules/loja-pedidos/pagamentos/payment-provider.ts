/**
 * Contrato de um provedor de pagamento da Loja. A decisão do PRD é ASAAS
 * (PIX + cartão), mas a arquitetura fica preparada para outros: o serviço fala
 * SÓ com esta interface, e o registro escolhe a implementação por ambiente.
 */

export type FormaPagamento = 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'DINHEIRO';

/** Dados do cartão para cobrança tokenizada no gateway. O backend NUNCA
 *  persiste isto (nem CVV, nem número) — repassa direto ao provider e descarta.
 *  Ver PRD §18: nada sensível é gravado no nosso banco. */
export interface DadosCartao {
  numero: string;
  titular: string;
  validadeMes: string;
  validadeAno: string;
  cvv: string;
  /** Dados do portador exigidos pelo ASAAS na cobrança de cartão. */
  cpfCnpj?: string;
  cep?: string;
  numeroEndereco?: string;
  telefone?: string;
  email?: string;
}

export interface CriarCobrancaEntrada {
  /** Nosso id do pagamento (idempotência / referência externa). */
  pagamentoId: string;
  pedidoNumero: number;
  forma: FormaPagamento;
  valor: number;
  clienteNome?: string | null;
  clienteTel?: string | null;
  /** Minutos até o PIX expirar. */
  expiraMin?: number;
  /** Parcelas para cartão de crédito (1 = à vista). */
  parcelas?: number;
  /** Dados do cartão — presente só nas formas CARTAO_*. Nunca persistido. */
  cartao?: DadosCartao;
}

export interface CobrancaCriada {
  /** Id da cobrança no gateway (guardado em gateway_id). */
  gatewayId: string | null;
  /** QR Code PIX (imagem base64 ou URL). */
  pixQrcode?: string | null;
  /** Código PIX copia-e-cola. */
  pixCopiaCola?: string | null;
  pixExpiracao?: Date | null;
  /** Status já resolvido pelo gateway na criação (cartão confirma na hora;
   *  PIX fica PENDENTE até o webhook). Quando presente e CONFIRMADO, o serviço
   *  confirma o pedido sem esperar webhook. */
  statusImediato?: StatusPagamentoGateway | null;
  /** Resposta bruta do gateway (auditoria). */
  payload?: unknown;
}

export type StatusPagamentoGateway = 'PENDENTE' | 'CONFIRMADO' | 'RECUSADO' | 'EXPIRADO' | 'ESTORNADO';

export interface PaymentProvider {
  readonly nome: string;
  /** Cria a cobrança e devolve os dados do PIX/gateway. */
  criarCobranca(dados: CriarCobrancaEntrada): Promise<CobrancaCriada>;
  /** Consulta o status atual de uma cobrança pelo id do gateway. */
  consultarStatus(gatewayId: string): Promise<StatusPagamentoGateway>;
  /** Traduz o payload de um webhook do gateway para o nosso domínio.
   *  Devolve null quando o evento não é de mudança de status relevante. */
  interpretarWebhook(payload: unknown): { gatewayId: string; status: StatusPagamentoGateway } | null;
}
