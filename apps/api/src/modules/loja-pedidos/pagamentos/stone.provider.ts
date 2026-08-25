import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import type {
  CobrancaCriada, CriarCobrancaEntrada, PaymentProvider, StatusPagamentoGateway,
} from './payment-provider';

/**
 * Stone / Pagar.me — PIX e cartão de crédito/débito.
 * API v5 (https://api.pagar.me/core/v5).
 *
 * Autenticação: HTTP Basic — user = STONE_API_KEY, password vazio.
 * Valor monetário: a API do Pagar.me recebe em **centavos** (integer).
 *
 * Envs:
 *   STONE_API_KEY      — chave secreta (sk_live_... ou sk_test_...)
 *   STONE_BASE_URL     — opcional; default https://api.pagar.me/core/v5
 *   STONE_WEBHOOK_SECRET — token para validar webhooks no header x-hub-signature
 *
 * Mapa de status charge Pagar.me → nosso domínio:
 *   paid / captured                          → CONFIRMADO
 *   authorized_pending_capture / pending     → PENDENTE
 *   waiting_capture / waiting_payment        → PENDENTE
 *   not_authorized / with_error / failed     → RECUSADO
 *   voided / canceled                        → EXPIRADO (expirou ou foi cancelado)
 *   refunded / partial_refunded / chargedback → ESTORNADO
 *
 * Fluxo PIX:
 *   POST /orders → charges[0].last_transaction → qr_code (copia-cola) + qr_code_url (imagem)
 *   Webhook: charge.paid → status = 'paid'
 *
 * Fluxo cartão de crédito:
 *   POST /orders com credit_card → confirmação imediata (status paid/captured ou not_authorized)
 *   Webhook: charge.paid ou charge.payment_failed
 */

const TIMEOUT_MS = 25_000;
const BASE_DEFAULT = 'https://api.pagar.me/core/v5';

// ----- Tipos internos -----

interface PagarmeCharge {
  id: string;
  status: string;
  last_transaction?: {
    transaction_type?: string;
    status?: string;
    qr_code?: string;         // PIX copia-cola
    qr_code_url?: string;     // PIX imagem (png URL)
    expires_at?: string;
  };
}

interface PagarmeOrder {
  id: string;
  status: string;
  charges?: PagarmeCharge[];
}

/** Payload do webhook Pagar.me (evento charge.*) */
interface PagarmeWebhookPayload {
  type?: string;            // e.g. "charge.paid"
  data?: {
    id?: string;            // charge id
    status?: string;
    order?: { id?: string };
    last_transaction?: { qr_code?: string; qr_code_url?: string; expires_at?: string };
  };
}

@Injectable()
export class StoneProvider implements PaymentProvider {
  readonly nome = 'stone';
  private readonly logger = new Logger(StoneProvider.name);
  private readonly base = (process.env.STONE_BASE_URL ?? BASE_DEFAULT).replace(/\/$/, '');
  private readonly apiKey = process.env.STONE_API_KEY ?? '';

  get configurado(): boolean {
    return !!this.apiKey;
  }

  // ------------------------------------------------------------------ helpers

  /** Header Authorization para autenticação Basic do Pagar.me. */
  private get authHeader(): string {
    // Basic base64(apiKey + ':')
    const encoded = Buffer.from(`${this.apiKey}:`).toString('base64');
    return `Basic ${encoded}`;
  }

  private async chamar<T>(caminho: string, init?: RequestInit): Promise<T> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException({
        codigo: 'STONE_SEM_CHAVE',
        message: 'Stone/Pagar.me não configurado (STONE_API_KEY ausente).',
      });
    }

    const controlador = new AbortController();
    const relogio = setTimeout(() => controlador.abort(), TIMEOUT_MS);
    let resposta: Response;

    try {
      resposta = await fetch(`${this.base}${caminho}`, {
        ...init,
        signal: controlador.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.authHeader,
          ...(init?.headers ?? {}),
        },
      });
    } catch (e) {
      this.logger.error(`Stone indisponível em ${caminho}: ${String(e).slice(0, 150)}`);
      throw new ServiceUnavailableException({
        codigo: 'STONE_INDISPONIVEL',
        message: 'Gateway Stone indisponível. Tente novamente.',
      });
    } finally {
      clearTimeout(relogio);
    }

    const corpo = await resposta.text().catch(() => '');

    if (!resposta.ok) {
      this.logger.error(`Stone ${resposta.status} em ${caminho}: ${corpo.slice(0, 300)}`);
      throw new ServiceUnavailableException({
        codigo: 'STONE_ERRO',
        message: `Falha no gateway Stone (${resposta.status}).`,
      });
    }

    try {
      return JSON.parse(corpo) as T;
    } catch {
      this.logger.error(`Stone: JSON inválido em ${caminho}: ${corpo.slice(0, 200)}`);
      throw new ServiceUnavailableException({ codigo: 'STONE_RESPOSTA_INVALIDA', message: 'Resposta inesperada do gateway Stone.' });
    }
  }

  // ------------------------------------------------------------------ parsers

  /** Converte valor decimal (ex: 99.90) → centavos inteiros para o Pagar.me. */
  private centavos(valor: number): number {
    return Math.round(valor * 100);
  }

  /** Extrai o telefone como { country_code, area_code, number } — Pagar.me exige separado. */
  private parseTelefone(tel?: string | null): { country_code: string; area_code: string; number: string } | null {
    if (!tel) return null;
    const digits = tel.replace(/\D/g, '');
    if (digits.length < 10) return null;
    // Trata +55DDNNNNNNNNN
    let rest = digits;
    if (rest.startsWith('55') && rest.length >= 12) rest = rest.slice(2);
    const area = rest.slice(0, 2);
    const numero = rest.slice(2);
    if (!area || !numero) return null;
    return { country_code: '55', area_code: area, number: numero };
  }

  /** Monta o objeto customer mínimo aceito pelo Pagar.me. */
  private montarCliente(dados: CriarCobrancaEntrada) {
    const fone = this.parseTelefone(dados.clienteTel);
    return {
      name: (dados.clienteNome || 'Cliente Loja FEBRACIS').slice(0, 64),
      email: `loja+${dados.pagamentoId.slice(0, 8)}@febracis.com`,
      type: 'individual',
      ...(fone ? {
        phones: {
          mobile_phone: fone,
        },
      } : {}),
    };
  }

  // ------------------------------------------------------------------ interface

  async criarCobranca(dados: CriarCobrancaEntrada): Promise<CobrancaCriada> {
    const ehCartao = dados.forma === 'CARTAO_CREDITO' || dados.forma === 'CARTAO_DEBITO';
    const ehPix    = dados.forma === 'PIX';

    // Monta o objeto payment conforme o meio
    let payment: Record<string, unknown>;

    if (ehPix) {
      // Expiração em minutos → segundos para expires_in (Pagar.me aceita expires_in em segundos)
      const expiresIn = (dados.expiraMin ?? 30) * 60;
      payment = {
        payment_method: 'pix',
        pix: {
          expires_in: expiresIn,
        },
      };
    } else if (dados.forma === 'CARTAO_CREDITO' && dados.cartao) {
      const c = dados.cartao;
      const parcelas = dados.parcelas && dados.parcelas > 1 ? dados.parcelas : 1;
      payment = {
        payment_method: 'credit_card',
        credit_card: {
          recurrence: false,
          installments: parcelas,
          statement_descriptor: 'FEBRACIS LOJA',
          operation_type: 'auth_and_capture',
          card: {
            number: c.numero.replace(/\s+/g, ''),
            holder_name: c.titular.slice(0, 64),
            holder_document: (c.cpfCnpj ?? '').replace(/\D/g, '') || undefined,
            exp_month: parseInt(c.validadeMes, 10),
            exp_year: parseInt(c.validadeAno, 10),
            cvv: c.cvv,
            billing_address: c.cep ? {
              zip_code: c.cep.replace(/\D/g, ''),
              country: 'BR',
              state: 'BA',
              city: 'Salvador',
              line_1: `${c.numeroEndereco ?? 'S/N'}, Rua, Centro`,
            } : undefined,
          },
        },
      };
    } else if (dados.forma === 'CARTAO_DEBITO' && dados.cartao) {
      const c = dados.cartao;
      payment = {
        payment_method: 'debit_card',
        debit_card: {
          statement_descriptor: 'FEBRACIS LOJA',
          card: {
            number: c.numero.replace(/\s+/g, ''),
            holder_name: c.titular.slice(0, 64),
            holder_document: (c.cpfCnpj ?? '').replace(/\D/g, '') || undefined,
            exp_month: parseInt(c.validadeMes, 10),
            exp_year: parseInt(c.validadeAno, 10),
            cvv: c.cvv,
          },
        },
      };
    } else {
      // DINHEIRO ou forma sem gateway — não passa pelo Stone
      return { gatewayId: null };
    }

    // Corpo do pedido
    const corpo = {
      code: dados.pagamentoId.slice(0, 52),
      customer: this.montarCliente(dados),
      items: [
        {
          amount: this.centavos(dados.valor),
          description: `Pedido FEBRACIS #${dados.pedidoNumero}`.slice(0, 256),
          quantity: 1,
          code: `PED-${dados.pedidoNumero}`,
        },
      ],
      payments: [payment],
    };

    const pedido = await this.chamar<PagarmeOrder>('/orders', {
      method: 'POST',
      body: JSON.stringify(corpo),
    });

    const charge = pedido.charges?.[0];
    if (!charge) {
      this.logger.error(`Stone: pedido ${pedido.id} sem charges. Status: ${pedido.status}`);
      throw new ServiceUnavailableException({ codigo: 'STONE_SEM_CHARGE', message: 'Gateway Stone não gerou cobrança.' });
    }

    const tx = charge.last_transaction;
    const resultado: CobrancaCriada = {
      gatewayId: charge.id,
      payload: pedido,
    };

    if (ehPix) {
      resultado.pixCopiaCola = tx?.qr_code ?? null;
      resultado.pixQrcode = tx?.qr_code_url ?? null; // URL pública da imagem PNG
      resultado.pixExpiracao = tx?.expires_at
        ? new Date(tx.expires_at)
        : new Date(Date.now() + (dados.expiraMin ?? 30) * 60_000);
    } else if (ehCartao) {
      resultado.statusImediato = this.traduzirStatus(charge.status);
    }

    return resultado;
  }

  async consultarStatus(gatewayId: string): Promise<StatusPagamentoGateway> {
    const charge = await this.chamar<PagarmeCharge>(`/charges/${gatewayId}`, { method: 'GET' });
    return this.traduzirStatus(charge.status);
  }

  interpretarWebhook(payload: unknown): { gatewayId: string; status: StatusPagamentoGateway } | null {
    const p = payload as PagarmeWebhookPayload;
    const tipo = p?.type ?? '';
    const data = p?.data;

    // Eventos relevantes: charge.paid, charge.payment_failed, charge.refunded, charge.chargedback
    const eventosRelevantes = [
      'charge.paid',
      'charge.payment_failed',
      'charge.refunded',
      'charge.chargedback',
      'charge.voided',
      'charge.updated',
    ];

    if (!eventosRelevantes.some(e => tipo.startsWith(e.split('.')[0] + '.') && tipo.includes(e.split('.')[1]))) {
      // Não é evento de charge relevante
      if (!tipo.startsWith('charge.')) return null;
    }

    const chargeId = data?.id;
    const chargeStatus = data?.status;

    if (!chargeId || !chargeStatus) return null;

    return { gatewayId: chargeId, status: this.traduzirStatus(chargeStatus) };
  }

  // ------------------------------------------------------------------ status

  private traduzirStatus(status: string): StatusPagamentoGateway {
    const s = (status ?? '').toLowerCase();
    // Confirmado
    if (['paid', 'captured', 'partial_capture'].includes(s)) return 'CONFIRMADO';
    // Pendente
    if (['pending', 'authorized_pending_capture', 'waiting_capture', 'waiting_payment',
         'processing', 'authorized', 'waiting_cancellation'].includes(s)) return 'PENDENTE';
    // Expirado / cancelado sem ser estorno
    if (['voided', 'canceled', 'partial_void'].includes(s)) return 'EXPIRADO';
    // Estornado
    if (['refunded', 'partial_refunded', 'chargedback'].includes(s)) return 'ESTORNADO';
    // Recusado / erro
    return 'RECUSADO';
  }
}
