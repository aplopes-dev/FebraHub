import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { IntegracoesService } from './integracoes.service';

/**
 * Renovação proativa dos tokens OAuth.
 *
 * POR QUE ANTES DE EXPIRAR, E NÃO DEPOIS: os dois provedores só renovam
 * enquanto a credencial atual ainda vale. O Meta troca o token de longa
 * duração por outro com `fb_exchange_token` — expirado, não há o que trocar. O
 * Conta Azul rotaciona o refresh token a cada uso, e um refresh parado tempo
 * demais é invalidado do lado dele. Nos dois casos, "renovar depois que
 * quebrou" significa alguém no navegador de novo; renovar antes significa
 * nunca precisar. Foi o que aconteceu com o Meta em 31/07/2026: o token
 * expirou e a única saída passou a ser manual.
 *
 * Uma vez por dia basta: a janela é de 7 dias, então há seis oportunidades de
 * repetição antes de qualquer vencimento real.
 */
@Injectable()
export class RenovacaoOauthCron {
  private readonly logger = new Logger(RenovacaoOauthCron.name);

  constructor(private readonly integracoes: IntegracoesService) {}

  /**
   * 05:00 de Salvador, fuso fixo no decorator para não depender do TZ do
   * container. O horário evita os ETLs (03:15 e 06:00 UTC = 00:15 e 03:00
   * daqui): o sync do Conta Azul também renova o token, e as duas rotinas
   * rodando juntas rotacionariam o refresh uma por cima da outra.
   */
  @Cron('0 5 * * *', { name: 'oauth-renovacao', timeZone: 'America/Bahia' })
  async executar(): Promise<void> {
    this.logger.log('Renovação OAuth: verificando tokens que vencem em menos de 7 dias');
    try {
      const r = await this.integracoes.renovarVencendo();
      if (!r.length) {
        this.logger.log('Renovação OAuth: nada a renovar');
        return;
      }
      // Só contagem e motivo — nunca o token.
      const falhas = r.filter((x) => !x.ok);
      this.logger.log(`Renovação OAuth: ${r.length - falhas.length} ok, ${falhas.length} com falha`);
    } catch (e) {
      // A rotina nunca pode derrubar o processo: um throw não capturado num
      // job agendado vira unhandledRejection.
      this.logger.error(`Renovação OAuth falhou inteira: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}
