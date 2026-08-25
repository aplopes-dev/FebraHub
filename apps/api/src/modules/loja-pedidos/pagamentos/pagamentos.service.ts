import { Injectable, Logger } from '@nestjs/common';
import { AsaasProvider } from './asaas.provider';
import { ManualProvider } from './manual.provider';
import { StoneProvider } from './stone.provider';
import type { PaymentProvider } from './payment-provider';

/**
 * Registro de provedores de pagamento. Escolhe o provider ativo por ambiente:
 *
 *  1. STONE_API_KEY presente → Stone / Pagar.me (PIX + cartão)
 *  2. ASAAS_API_KEY presente → Asaas (PIX + cartão)
 *  3. Nenhuma chave          → Manual (operador confirma, dev/homolog)
 *
 * Quando STONE_API_KEY e ASAAS_API_KEY estiverem ambas presentes, a Stone tem
 * prioridade (pode ser alterado aqui se necessário).
 */
@Injectable()
export class PagamentosService {
  private readonly logger = new Logger(PagamentosService.name);

  constructor(
    private readonly stone: StoneProvider,
    private readonly asaas: AsaasProvider,
    private readonly manual: ManualProvider,
  ) {}

  /** Provider "de verdade" ativo. Stone > Asaas > Manual. */
  provider(): PaymentProvider {
    if (this.stone.configurado) return this.stone;
    if (this.asaas.configurado) return this.asaas;
    return this.manual;
  }

  /** Provider por nome (usado pelo webhook para rotear ao provider correto). */
  porNome(nome: string): PaymentProvider {
    if (nome === 'stone') return this.stone;
    if (nome === 'asaas') return this.asaas;
    return this.manual;
  }

  /** True quando qualquer gateway externo está ativo — bloqueia confirmação pública manual. */
  get usaGatewayExterno(): boolean {
    return this.stone.configurado || this.asaas.configurado;
  }

  /** Nome do provider externo ativo (para roteamento de webhooks na rota genérica). */
  get nomeProviderAtivo(): string {
    return this.provider().nome;
  }
}
