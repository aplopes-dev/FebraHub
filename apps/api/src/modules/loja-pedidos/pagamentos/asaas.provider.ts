import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import type {
  CobrancaCriada, CriarCobrancaEntrada, PaymentProvider, StatusPagamentoGateway,
} from './payment-provider';

/**
 * ASAAS — PIX e cartão. Único ponto que fala com o gateway; a chave nunca sai
 * do backend. Config por ambiente:
 *
 *   ASAAS_API_KEY   — chave de acesso (obrigatória p/ usar o provider real)
 *   ASAAS_BASE_URL  — sandbox: https://api-sandbox.asaas.com/v3 (padrão)
 *                     produção: https://api.asaas.com/v3
 *
 * Mapa de status ASAAS → nosso domínio:
 *   PENDING/AWAITING_RISK_ANALYSIS      → PENDENTE
 *   RECEIVED/CONFIRMED/RECEIVED_IN_CASH → CONFIRMADO
 *   OVERDUE                              → EXPIRADO
 *   REFUNDED / CHARGEBACK / REFUND...    → ESTORNADO
 *   demais                               → RECUSADO
 */

const TIMEOUT_MS = 20_000;

interface AsaasCobranca { id: string; status: string; invoiceUrl?: string }
interface AsaasPixQr { encodedImage?: string; payload?: string; expirationDate?: string }

@Injectable()
export class AsaasProvider implements PaymentProvider {
  readonly nome = 'asaas';
  private readonly logger = new Logger(AsaasProvider.name);
  private readonly base = (process.env.ASAAS_BASE_URL ?? 'https://api-sandbox.asaas.com/v3').replace(/\/$/, '');
  private readonly apiKey = process.env.ASAAS_API_KEY ?? '';

  get configurado(): boolean {
    return !!this.apiKey;
  }

  private async chamar<T>(caminho: string, init?: RequestInit): Promise<T> {
    if (!this.apiKey) throw new ServiceUnavailableException({ codigo: 'ASAAS_SEM_CHAVE', message: 'ASAAS não configurado (ASAAS_API_KEY ausente).' });
    const controlador = new AbortController();
    const relogio = setTimeout(() => controlador.abort(), TIMEOUT_MS);
    let resposta: Response;
    try {
      resposta = await fetch(`${this.base}${caminho}`, {
        ...init,
        signal: controlador.signal,
        headers: { 'Content-Type': 'application/json', access_token: this.apiKey, ...(init?.headers ?? {}) },
      });
    } catch (e) {
      this.logger.error(`ASAAS indisponível em ${caminho}: ${String(e).slice(0, 150)}`);
      throw new ServiceUnavailableException({ codigo: 'ASAAS_INDISPONIVEL', message: 'Gateway de pagamento indisponível. Tente novamente.' });
    } finally {
      clearTimeout(relogio);
    }
    if (!resposta.ok) {
      const corpo = await resposta.text().catch(() => '');
      this.logger.error(`ASAAS ${resposta.status} em ${caminho}: ${corpo.slice(0, 200)}`);
      throw new ServiceUnavailableException({ codigo: 'ASAAS_ERRO', message: `Falha no gateway (${resposta.status}).` });
    }
    return (await resposta.json()) as T;
  }

  /** Garante um cliente no ASAAS (por nome/telefone) e devolve o id. */
  private async garantirCliente(nome?: string | null, tel?: string | null): Promise<string | null> {
    try {
      const cli = await this.chamar<{ id: string }>('/customers', {
        method: 'POST',
        body: JSON.stringify({ name: (nome || 'Consumidor Loja').slice(0, 100), mobilePhone: tel || undefined, notificationDisabled: true }),
      });
      return cli.id;
    } catch (e) {
      this.logger.warn(`ASAAS: cliente não criado, seguindo sem: ${String(e).slice(0, 120)}`);
      return null;
    }
  }

  async criarCobranca(dados: CriarCobrancaEntrada): Promise<CobrancaCriada> {
    const clienteId = await this.garantirCliente(dados.clienteNome, dados.clienteTel);
    const ehCartao = dados.forma === 'CARTAO_CREDITO' || dados.forma === 'CARTAO_DEBITO';
    const billingType = dados.forma === 'PIX' ? 'PIX' : dados.forma === 'CARTAO_DEBITO' ? 'DEBIT_CARD' : 'CREDIT_CARD';
    const vencimento = new Date().toISOString().slice(0, 10);

    // Corpo base; para cartão, anexa os dados tokenizados (creditCard +
    // creditCardHolderInfo). A cobrança de cartão já retorna CONFIRMED/RECEIVED
    // quando aprovada — não depende de webhook para o "caminho feliz".
    const corpo: Record<string, unknown> = {
      customer: clienteId ?? undefined,
      billingType,
      value: dados.valor,
      dueDate: vencimento,
      description: `Pedido Loja FEBRACIS #${dados.pedidoNumero}`,
      externalReference: dados.pagamentoId,
    };

    if (ehCartao && dados.cartao) {
      const c = dados.cartao;
      if (dados.forma === 'CARTAO_CREDITO' && dados.parcelas && dados.parcelas > 1) {
        corpo.installmentCount = dados.parcelas;
        corpo.installmentValue = +(dados.valor / dados.parcelas).toFixed(2);
      }
      corpo.creditCard = {
        holderName: c.titular,
        number: c.numero.replace(/\s+/g, ''),
        expiryMonth: c.validadeMes,
        expiryYear: c.validadeAno,
        ccv: c.cvv,
      };
      corpo.creditCardHolderInfo = {
        name: c.titular,
        email: c.email || 'loja@febracis.com',
        cpfCnpj: (c.cpfCnpj ?? '').replace(/\D/g, ''),
        postalCode: (c.cep ?? '').replace(/\D/g, ''),
        addressNumber: c.numeroEndereco || '0',
        phone: (c.telefone ?? dados.clienteTel ?? '').replace(/\D/g, '') || undefined,
      };
    }

    const cobranca = await this.chamar<AsaasCobranca>('/payments', {
      method: 'POST',
      body: JSON.stringify(corpo),
    });

    const resultado: CobrancaCriada = { gatewayId: cobranca.id, payload: cobranca };

    if (dados.forma === 'PIX') {
      // Para PIX, busca o QR Code copia-e-cola.
      try {
        const qr = await this.chamar<AsaasPixQr>(`/payments/${cobranca.id}/pixQrCode`, { method: 'GET' });
        resultado.pixQrcode = qr.encodedImage ? `data:image/png;base64,${qr.encodedImage}` : null;
        resultado.pixCopiaCola = qr.payload ?? null;
        resultado.pixExpiracao = qr.expirationDate ? new Date(qr.expirationDate) : (dados.expiraMin ? new Date(Date.now() + dados.expiraMin * 60_000) : null);
      } catch (e) {
        this.logger.warn(`ASAAS: QR PIX não obtido para ${cobranca.id}: ${String(e).slice(0, 120)}`);
      }
    } else if (ehCartao) {
      // Cartão confirma na hora: traduz o status retornado para o domínio.
      resultado.statusImediato = this.traduzirStatus(cobranca.status);
    }
    return resultado;
  }

  async consultarStatus(gatewayId: string): Promise<StatusPagamentoGateway> {
    const c = await this.chamar<AsaasCobranca>(`/payments/${gatewayId}`, { method: 'GET' });
    return this.traduzirStatus(c.status);
  }

  interpretarWebhook(payload: unknown): { gatewayId: string; status: StatusPagamentoGateway } | null {
    const p = payload as { event?: string; payment?: { id?: string; status?: string } };
    const pgto = p?.payment;
    if (!pgto?.id || !pgto.status) return null;
    return { gatewayId: pgto.id, status: this.traduzirStatus(pgto.status) };
  }

  private traduzirStatus(status: string): StatusPagamentoGateway {
    const s = (status ?? '').toUpperCase();
    if (['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(s)) return 'CONFIRMADO';
    if (['PENDING', 'AWAITING_RISK_ANALYSIS'].includes(s)) return 'PENDENTE';
    if (s === 'OVERDUE') return 'EXPIRADO';
    if (s.startsWith('REFUND') || s.startsWith('CHARGEBACK')) return 'ESTORNADO';
    return 'RECUSADO';
  }
}
