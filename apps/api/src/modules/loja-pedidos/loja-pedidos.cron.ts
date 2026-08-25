import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { LojaPedidosService } from './loja-pedidos.service';

/**
 * Manutenção automática da fila da Loja. Dois jobs leves, in-process:
 *
 *  1) EXPIRAR RESERVAS — pedido que ficou AGUARDANDO_PAGAMENTO além da janela
 *     (LOJA_RESERVA_EXPIRA_MIN, padrão 30 min) tem a reserva de estoque
 *     devolvida e é cancelado. Sem isso, um carrinho abandonado prende saldo
 *     que o próximo cliente veria como indisponível (PRD §49).
 *
 *  2) LEMBRAR PRONTOS — pedido PRONTO não retirado após
 *     LOJA_LEMBRETE_PRONTO_MIN (padrão 5 min) recebe UM lembrete por WhatsApp
 *     (PRD §32). O controle de "uma vez só" vive no histórico do pedido.
 *
 * Cada job é best-effort: um throw nunca derruba o processo (vira
 * unhandledRejection num job agendado), então tudo passa pelo try/catch do
 * service e por este wrapper.
 */
@Injectable()
export class LojaPedidosCron {
  private readonly logger = new Logger(LojaPedidosCron.name);

  constructor(private readonly pedidos: LojaPedidosService) {}

  @Interval('loja-expirar-reservas', 2 * 60_000)
  async expirarReservas(): Promise<void> {
    try {
      const n = await this.pedidos.expirarReservas();
      if (n > 0) this.logger.log(`Reservas expiradas liberadas: ${n}`);
    } catch (e) {
      this.logger.error(`Job expirarReservas falhou: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  @Interval('loja-lembrar-prontos', 3 * 60_000)
  async lembrarProntos(): Promise<void> {
    try {
      const n = await this.pedidos.lembrarProntos();
      if (n > 0) this.logger.log(`Lembretes de retirada enviados: ${n}`);
    } catch (e) {
      this.logger.error(`Job lembrarProntos falhou: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}
