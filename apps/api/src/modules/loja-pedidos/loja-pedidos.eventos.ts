import { Injectable } from '@nestjs/common';
import { Observable, Subject, interval, map, merge } from 'rxjs';

/**
 * Ponte de tempo real dos pedidos da Loja — mesmo desenho de agentes/whatsapp:
 * um Subject em memória vira stream SSE por assinante. Alimenta a fila
 * operacional, a página de acompanhamento do cliente e o painel/TV.
 *
 * Limites (iguais aos das outras pontes): IN-PROCESS — não sobrevive a restart
 * da API nem escala entre réplicas. O cliente cobre o buraco com polling.
 *
 * O heartbeat de 25s evita que o Nginx (proxy_read_timeout 60s) derrube um
 * stream ocioso.
 */
export interface EventoLojaPedido {
  tipo: 'pedido' | 'fila' | 'ping';
  /** Escopo do evento (opcional): filtra por operação e/ou pedido no cliente. */
  operacaoId?: string;
  pedidoId?: string;
}

@Injectable()
export class LojaPedidosEventos {
  private readonly assunto = new Subject<EventoLojaPedido>();

  emitir(evento: EventoLojaPedido): void {
    this.assunto.next(evento);
  }

  /** Stream para o @Sse do controller: eventos reais + heartbeat. */
  stream(): Observable<{ data: EventoLojaPedido }> {
    return merge(
      this.assunto.asObservable(),
      interval(25_000).pipe(map((): EventoLojaPedido => ({ tipo: 'ping' }))),
    ).pipe(map((data) => ({ data })));
  }
}
