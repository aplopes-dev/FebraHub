import { Module } from '@nestjs/common';
import { ExecutivoController } from './executivo.controller';
import { ExecutivoService } from './executivo.service';
import { MetasService } from './metas.service';

@Module({
  controllers: [ExecutivoController],
  providers: [ExecutivoService, MetasService],
  // O módulo brain publica os indicadores na memória institucional
  // (BrainDadosService) e lê daqui, em vez de reimplementar o cálculo.
  exports: [ExecutivoService],
})
export class ExecutivoModule {}
