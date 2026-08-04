import { Module } from '@nestjs/common';
import { ExecutivoModule } from '../executivo/executivo.module';
import { BrainController } from './brain.controller';
import { BrainDadosService } from './brain-dados.service';
import { BrainService } from './brain.service';
import { GbrainCliente } from './gbrain.cliente';
import { SinteseService } from './sintese.service';

@Module({
  imports: [ExecutivoModule],
  controllers: [BrainController],
  providers: [BrainService, BrainDadosService, GbrainCliente, SinteseService],
  exports: [BrainService],
})
export class BrainModule {}
