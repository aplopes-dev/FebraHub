import { Module } from '@nestjs/common';
import { InstagramController } from './instagram.controller';
import { InstagramService } from './instagram.service';

/**
 * Instagram por login direto (aiograpi-rest) — parte do hub Marketing, ao lado
 * do Zernio (SocialModule). Exporta o service para que agentes/outros módulos
 * possam usar o proxy `igApiRequest` sem tocar na sessão.
 */
@Module({
  controllers: [InstagramController],
  providers: [InstagramService],
  exports: [InstagramService],
})
export class InstagramModule {}
