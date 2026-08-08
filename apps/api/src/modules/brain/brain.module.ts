import { Module } from '@nestjs/common';
import { ExecutivoModule } from '../executivo/executivo.module';
import { BrainAgenteService } from './brain-agente.service';
import { BrainController } from './brain.controller';
import { BrainDadosService } from './brain-dados.service';
import { BrainMidiaService } from './brain-midia.service';
import { BrainService } from './brain.service';
import { GbrainCliente } from './gbrain.cliente';
import { SinteseService } from './sintese.service';

@Module({
  imports: [ExecutivoModule],
  controllers: [BrainController],
  providers: [
    BrainService,
    BrainAgenteService,
    BrainDadosService,
    BrainMidiaService,
    GbrainCliente,
    SinteseService,
  ],
  exports: [BrainService],
})
export class BrainModule {}
