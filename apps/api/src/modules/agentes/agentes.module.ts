import { Module } from '@nestjs/common';
import { AgentesController, AgentesManifestoController } from './agentes.controller';
import { AgentesEventos } from './agentes.eventos';
import { AgentesService } from './agentes.service';

@Module({
  controllers: [AgentesController, AgentesManifestoController],
  providers: [AgentesService, AgentesEventos],
})
export class AgentesModule {}
