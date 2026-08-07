import { Module } from '@nestjs/common';
import { NotificacoesController } from './notificacoes.controller';
import { NotificacoesService } from './notificacoes.service';

/** O service é exportado porque outros módulos avisam gente: a troca de
 *  perfil de acesso, por exemplo, notifica quem foi afetado. */
@Module({
  controllers: [NotificacoesController],
  providers: [NotificacoesService],
  exports: [NotificacoesService],
})
export class NotificacoesModule {}
