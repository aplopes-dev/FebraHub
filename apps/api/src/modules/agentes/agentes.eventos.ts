import { Injectable } from '@nestjs/common';
import { Observable, Subject, interval, map, merge } from 'rxjs';

/**
 * Ponte de tempo real das conversas de agentes — o mesmo desenho da origem
 * (crm-aplopes): um Subject em memória vira um stream SSE por assinante.
 *
 * Limites assumidos, iguais aos da origem: a ponte é IN-PROCESS — não
 * sobrevive a restart da API nem escala entre réplicas. O cliente cobre o
 * buraco com polling de fallback quando o stream cai.
 *
 * O heartbeat de 25s não é enfeite: o Nginx derruba stream ocioso
 * (proxy_read_timeout 60s) e o browser veria ERR_INCOMPLETE_CHUNKED_ENCODING.
 */
export interface EventoAgentes {
  tipo: 'mensagem' | 'conversa' | 'ping';
  conversaId?: string;
}

@Injectable()
export class AgentesEventos {
  private readonly assunto = new Subject<EventoAgentes>();

  emitir(evento: EventoAgentes): void {
    this.assunto.next(evento);
  }

  /** Stream para o @Sse do controller: eventos reais + heartbeat. */
  stream(): Observable<{ data: EventoAgentes }> {
    return merge(
      this.assunto.asObservable(),
      interval(25_000).pipe(map((): EventoAgentes => ({ tipo: 'ping' }))),
    ).pipe(map((data) => ({ data })));
  }
}
