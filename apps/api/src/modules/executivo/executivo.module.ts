import { Module } from '@nestjs/common';
import { ExecutivoController } from './executivo.controller';
import { ExecutivoService } from './executivo.service';
import { MetasService } from './metas.service';

@Module({
  controllers: [ExecutivoController],
  providers: [ExecutivoService, MetasService],
})
export class ExecutivoModule {}
