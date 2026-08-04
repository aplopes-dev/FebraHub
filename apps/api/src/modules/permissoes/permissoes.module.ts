import { Module } from '@nestjs/common';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';
import { PermissoesController } from './permissoes.controller';
import { PermissoesService } from './permissoes.service';

/** O AuthService (para revogar sessões) chega pelo AuthModule, que é @Global. */
@Module({
  imports: [NotificacoesModule],
  controllers: [PermissoesController],
  providers: [PermissoesService],
})
export class PermissoesModule {}
