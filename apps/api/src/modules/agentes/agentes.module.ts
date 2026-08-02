import { Module } from '@nestjs/common';
import { AgentesController, AgentesManifestoController } from './agentes.controller';
import { AgentesService } from './agentes.service';

@Module({
  controllers: [AgentesController, AgentesManifestoController],
  providers: [AgentesService],
})
export class AgentesModule {}
