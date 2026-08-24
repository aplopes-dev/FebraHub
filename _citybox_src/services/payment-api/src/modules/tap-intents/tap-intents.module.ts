import { Module } from '@nestjs/common';
import { ChargesModule } from '../charges/charges.module.js';
import { TapIntentsController } from './tap-intents.controller.js';
import { TapIntentsService } from './tap-intents.service.js';

@Module({
  imports: [ChargesModule],
  controllers: [TapIntentsController],
  providers: [TapIntentsService],
})
export class TapIntentsModule {}
