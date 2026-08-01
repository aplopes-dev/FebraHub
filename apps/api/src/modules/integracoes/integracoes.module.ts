import { Module } from '@nestjs/common';
import { IntegracoesController } from './integracoes.controller';
import { IntegracoesService } from './integracoes.service';
import { RenovacaoOauthCron } from './renovacao.cron';

/** Autorização e renovação das fontes que falam OAuth2 (Conta Azul, Meta). */
@Module({
  controllers: [IntegracoesController],
  providers: [IntegracoesService, RenovacaoOauthCron],
  exports: [IntegracoesService],
})
export class IntegracoesModule {}
