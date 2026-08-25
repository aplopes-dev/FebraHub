import { Injectable, Logger } from '@nestjs/common';
import { AsaasProvider } from './asaas.provider';
import { ManualProvider } from './manual.provider';
import type { PaymentProvider } from './payment-provider';

/**
 * Registro de provedores de pagamento. Escolhe o provider ativo por ambiente:
 * se `ASAAS_API_KEY` estiver setada, usa o ASAAS; senão, cai no MANUAL (o
 * operador confirma). Isola o serviço da Loja da implementação concreta.
 */
@Injectable()
export class PagamentosService {
  private readonly logger = new Logger(PagamentosService.name);

  constructor(
    private readonly asaas: AsaasProvider,
    private readonly manual: ManualProvider,
  ) {}

  /** Provider "de verdade" ativo (ASAAS se configurado, senão manual). */
  provider(): PaymentProvider {
    return this.asaas.configurado ? this.asaas : this.manual;
  }

  /** Provider por nome (usado pelo webhook: só o ASAAS interpreta webhooks). */
  porNome(nome: string): PaymentProvider {
    if (nome === 'asaas') return this.asaas;
    return this.manual;
  }

  /** True quando o provider externo (ASAAS) está ativo — decide se a rota
   *  pública de confirmação manual deve ser bloqueada. */
  get usaGatewayExterno(): boolean {
    return this.asaas.configurado;
  }
}
