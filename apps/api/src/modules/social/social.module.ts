import { Module } from '@nestjs/common';
import { SocialConfigService } from './social-config.service';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { ZernioCliente } from './zernio.cliente';

@Module({
  controllers: [SocialController],
  providers: [SocialService, SocialConfigService, ZernioCliente],
  exports: [SocialService],
})
export class SocialModule {}
