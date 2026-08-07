import { Module } from '@nestjs/common';
import { DadosController } from './dados.controller';
import { DadosService } from './dados.service';

@Module({
  controllers: [DadosController],
  providers: [DadosService],
  exports: [DadosService],
})
export class DadosModule {}
