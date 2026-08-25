import { Injectable } from '@nestjs/common';
import type {
  CobrancaCriada, CriarCobrancaEntrada, PaymentProvider, StatusPagamentoGateway,
} from './payment-provider';

/**
 * Provedor MANUAL — sem gateway externo. Usado quando o ASAAS não está
 * configurado (dev/homolog) e para pagamentos em DINHEIRO/cartão na maquininha
 * física, onde a confirmação vem do operador, não de um webhook.
 *
 * Gera um PIX copia-e-cola de PLACEHOLDER só para a UI ter o que mostrar; a
 * confirmação real é sempre feita pelo operador (rota autenticada) — nunca por
 * uma rota pública. Assim não há como "confirmar sozinho" um pagamento.
 */
@Injectable()
export class ManualProvider implements PaymentProvider {
  readonly nome = 'manual';

  async criarCobranca(dados: CriarCobrancaEntrada): Promise<CobrancaCriada> {
    if (dados.forma !== 'PIX') return { gatewayId: null };
    return {
      gatewayId: null,
      pixCopiaCola: `00020126FEBRACIS-LOJA-${dados.pedidoNumero}-${dados.valor.toFixed(2)}`,
      pixExpiracao: new Date(Date.now() + (dados.expiraMin ?? 30) * 60_000),
    };
  }

  async consultarStatus(): Promise<StatusPagamentoGateway> {
    return 'PENDENTE';
  }

  interpretarWebhook(): null {
    return null;
  }
}
