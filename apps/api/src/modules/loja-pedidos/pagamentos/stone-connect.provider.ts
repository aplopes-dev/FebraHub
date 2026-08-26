import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import type {
  CobrancaCriada, CriarCobrancaEntrada, PaymentProvider, StatusPagamentoGateway,
} from './payment-provider';

/**
 * Stone Connect — TEF PURO (maquininha física + PDV presencial).
 *
 * ⚠️ DIFERENTE dos providers de nuvem (Asaas/Pagar.me): o TEF é SÍNCRONO e
 * LOCAL. Um "Agente Connect" da Stone roda no CAIXA (mesmo micro/tablet do
 * balcão, ao lado da maquininha) e expõe uma API HTTP local. O nosso PDV manda
 * o valor → a maquininha acende → o cliente passa o cartão → o agente devolve o
 * resultado NA HORA (aprovado/negado + NSU + autorização + bandeira + parcelas).
 *
 * Consequências:
 *  - NÃO há webhook: a venda confirma de forma síncrona no `criarCobranca()`.
 *    `interpretarWebhook()` sempre devolve null.
 *  - NÃO há PIX QR gerado por nós (o PIX, se usado, é exibido pela própria
 *    maquininha). Este provider trata CARTÃO (crédito/débito) presencial.
 *  - `gatewayId` = identificador da transação TEF (NSU/ATK) para conciliação.
 *
 * TOPOLOGIA (IMPORTANTE): o Agente Connect é alcançável a partir de quem está
 * NA REDE DO CAIXA. Dois modelos suportados por `STONE_TEF_URL`:
 *   (a) Agente com IP/porta fixos na rede local (ex.: http://192.168.0.50:PORTA)
 *       → o BACKEND chama direto. É o que este provider faz.
 *   (b) Agente só em localhost do balcão → a chamada precisa partir do NAVEGADOR
 *       do Balcão. Nesse caso, o front chama o agente e envia o RESULTADO ao
 *       backend (ver método `confirmarTefExterno`, a fiar quando ligarmos a UI).
 *
 * ENVs:
 *   STONE_TEF_URL     — base do Agente Connect (ex.: http://192.168.0.50:8080).
 *                       Sem isso, o provider fica INATIVO (configurado=false).
 *   STONE_TEF_TOKEN   — token/chave do agente, se exigido (header Authorization).
 *   STONE_TEF_TIMEOUT_MS — timeout da operação (default 120000: a pessoa precisa
 *                       de tempo para inserir cartão e digitar senha).
 *
 * ❗ PENDÊNCIA (destrava com a doc de integração do Stone Connect):
 *   - CONTRATO EXATO do agente: caminho do POST de venda, corpo, e o JSON de
 *     retorno (nomes dos campos NSU/autorização/status). Marcado com TODO(STONE)
 *     abaixo. O esqueleto (auth, timeout, mapa de status, encaixe no
 *     PaymentProvider) já está pronto — só preencher o request/parse.
 */

const TIMEOUT_DEFAULT_MS = 120_000; // 2 min: tempo real de inserir cartão/senha

/** Retorno normalizado de uma operação TEF (o que precisamos gravar). */
export interface ResultadoTef {
  status: StatusPagamentoGateway;
  /** NSU / ATK — id da transação para conciliação. */
  nsu?: string | null;
  /** Código de autorização da adquirente. */
  autorizacao?: string | null;
  bandeira?: string | null;
  parcelas?: number | null;
  /** Resposta bruta do agente (auditoria). */
  bruto?: unknown;
}

@Injectable()
export class StoneConnectProvider implements PaymentProvider {
  readonly nome = 'stone-connect';
  private readonly logger = new Logger(StoneConnectProvider.name);
  private readonly base = (process.env.STONE_TEF_URL ?? '').replace(/\/$/, '');
  private readonly token = process.env.STONE_TEF_TOKEN ?? '';
  private readonly timeoutMs = Number(process.env.STONE_TEF_TIMEOUT_MS ?? TIMEOUT_DEFAULT_MS);

  /** Só ativo quando o Agente Connect tem endereço configurado E é alcançável
   *  pelo backend (modelo (a) da topologia). */
  get configurado(): boolean {
    return !!this.base;
  }

  // ------------------------------------------------------------------ HTTP local

  private async chamarAgente<T>(caminho: string, init?: RequestInit): Promise<T> {
    if (!this.base) {
      throw new ServiceUnavailableException({
        codigo: 'TEF_SEM_AGENTE',
        message: 'Agente Stone Connect (TEF) não configurado (STONE_TEF_URL ausente).',
      });
    }
    const controlador = new AbortController();
    const relogio = setTimeout(() => controlador.abort(), this.timeoutMs);
    let resposta: Response;
    try {
      resposta = await fetch(`${this.base}${caminho}`, {
        ...init,
        signal: controlador.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
          ...(init?.headers ?? {}),
        },
      });
    } catch (e) {
      this.logger.error(`Agente TEF indisponível em ${caminho}: ${String(e).slice(0, 150)}`);
      throw new ServiceUnavailableException({
        codigo: 'TEF_INDISPONIVEL',
        message: 'Maquininha/Agente TEF indisponível. Verifique se o Agente Stone Connect está aberto no caixa.',
      });
    } finally {
      clearTimeout(relogio);
    }

    const corpo = await resposta.text().catch(() => '');
    if (!resposta.ok) {
      this.logger.error(`Agente TEF ${resposta.status} em ${caminho}: ${corpo.slice(0, 200)}`);
      throw new ServiceUnavailableException({
        codigo: 'TEF_ERRO',
        message: `Falha na maquininha (${resposta.status}).`,
      });
    }
    try {
      return JSON.parse(corpo) as T;
    } catch {
      return corpo as unknown as T;
    }
  }

  // ------------------------------------------------------------------ interface

  async criarCobranca(dados: CriarCobrancaEntrada): Promise<CobrancaCriada> {
    // TEF trata cartão presencial. PIX/DINHEIRO não passam por aqui.
    const ehCartao = dados.forma === 'CARTAO_CREDITO' || dados.forma === 'CARTAO_DEBITO';
    if (!ehCartao) return { gatewayId: null };

    const resultado = await this.venderTef({
      pagamentoId: dados.pagamentoId,
      pedidoNumero: dados.pedidoNumero,
      valor: dados.valor,
      credito: dados.forma === 'CARTAO_CREDITO',
      parcelas: dados.parcelas ?? 1,
    });

    return {
      gatewayId: resultado.nsu ?? null,
      statusImediato: resultado.status, // TEF confirma na hora
      payload: resultado.bruto,
    };
  }

  /**
   * Dispara a venda no Agente Connect e devolve o resultado normalizado.
   * Exposto separadamente para o service gravar NSU/autorização/bandeira.
   *
   * TODO(STONE): preencher `caminho`, `corpo` e o `parse` com o contrato REAL
   * do Agente Stone Connect (vem na doc de integração do Connect / Postman).
   * O restante (auth, timeout, mapa de status) já está pronto.
   */
  async venderTef(entrada: {
    pagamentoId: string;
    pedidoNumero: number;
    valor: number;
    credito: boolean;
    parcelas: number;
  }): Promise<ResultadoTef> {
    // ---- TODO(STONE): AJUSTAR AO CONTRATO REAL DO AGENTE ----
    const caminho = '/sale'; // <- confirmar na doc do Connect
    const corpo = {
      // valores em centavos por convenção TEF; confirmar unidade na doc
      amount: Math.round(entrada.valor * 100),
      installments: entrada.credito ? Math.max(1, entrada.parcelas) : 1,
      paymentType: entrada.credito ? 'credit' : 'debit',
      // referência p/ conciliar com nosso pagamento
      orderId: entrada.pagamentoId,
      reference: `PED-${entrada.pedidoNumero}`,
    };
    // ---------------------------------------------------------

    const bruto = await this.chamarAgente<Record<string, unknown>>(caminho, {
      method: 'POST',
      body: JSON.stringify(corpo),
    });

    return this.normalizar(bruto);
  }

  /**
   * Traduz o retorno bruto do agente para `ResultadoTef`.
   * TODO(STONE): mapear os NOMES REAIS dos campos do JSON de retorno do agente.
   */
  private normalizar(bruto: Record<string, unknown>): ResultadoTef {
    const b = bruto ?? {};
    const statusBruto = String(
      (b.status ?? b.result ?? b.transactionStatus ?? '') as string,
    );
    return {
      status: this.traduzirStatus(statusBruto),
      nsu: (b.nsu ?? b.atk ?? b.acquirerTransactionKey ?? null) as string | null,
      autorizacao: (b.authorizationCode ?? b.authorization ?? null) as string | null,
      bandeira: (b.brand ?? b.cardBrand ?? null) as string | null,
      parcelas: (b.installments as number) ?? null,
      bruto: b,
    };
  }

  /**
   * Ponto de entrada para o modelo (b) da topologia: quando o Agente só é
   * alcançável pelo NAVEGADOR do caixa, o front chama o agente e nos manda o
   * resultado bruto — aqui a gente normaliza e devolve para o service gravar.
   * (Wire da rota/UI fica para quando ligarmos o Balcão.)
   */
  confirmarTefExterno(brutoDoAgente: Record<string, unknown>): ResultadoTef {
    return this.normalizar(brutoDoAgente);
  }

  async consultarStatus(_gatewayId: string): Promise<StatusPagamentoGateway> {
    // TEF é síncrono: o status já veio na venda. Sem consulta remota por padrão.
    // TODO(STONE): se o agente expõe consulta por NSU, implementar aqui.
    return 'CONFIRMADO';
  }

  /** TEF não usa webhook — confirma síncrono. */
  interpretarWebhook(): null {
    return null;
  }

  // ------------------------------------------------------------------ status

  private traduzirStatus(status: string): StatusPagamentoGateway {
    const s = (status ?? '').toLowerCase();
    if (['approved', 'aprovado', 'success', 'ok', 'confirmed', 'paid', '0', '00'].includes(s)) return 'CONFIRMADO';
    if (['pending', 'pendente', 'processing'].includes(s)) return 'PENDENTE';
    if (['canceled', 'cancelled', 'cancelado', 'aborted', 'timeout'].includes(s)) return 'EXPIRADO';
    if (['refunded', 'estornado', 'reversed'].includes(s)) return 'ESTORNADO';
    // denied/negado/declined/erro e desconhecidos → recusado
    return 'RECUSADO';
  }
}
