import { Injectable } from '@nestjs/common';
import { Observable, Subject, interval, map, merge } from 'rxjs';

/**
 * Tempo real do inbox do WhatsApp — o mesmo desenho (e os mesmos limites
 * assumidos) do stream de agentes: Subject in-process → SSE por assinante,
 * heartbeat de 25s para o Nginx não derrubar stream ocioso, e o cliente cai
 * para polling quando a conexão morre. Não sobrevive a restart nem escala
 * horizontal — igual à origem (crm-aplopes).
 */
export interface EventoWhatsapp {
  tipo: 'mensagem' | 'conversa' | 'conexao' | 'ping';
  conversaId?: string;
}

@Injectable()
export class WhatsappEventos {
  private readonly assunto = new Subject<EventoWhatsapp>();

  emitir(evento: EventoWhatsapp): void {
    this.assunto.next(evento);
  }

  stream(): Observable<{ data: EventoWhatsapp }> {
    return merge(
      this.assunto.asObservable(),
      interval(25_000).pipe(map((): EventoWhatsapp => ({ tipo: 'ping' }))),
    ).pipe(map((data) => ({ data })));
  }
}
