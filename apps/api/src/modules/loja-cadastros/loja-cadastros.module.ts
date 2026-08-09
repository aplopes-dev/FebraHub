import { Module } from '@nestjs/common';
import { LojaCadastrosController } from './loja-cadastros.controller';
import { LojaCadastrosService } from './loja-cadastros.service';

@Module({
  controllers: [LojaCadastrosController],
  providers: [LojaCadastrosService],
})
export class LojaCadastrosModule {}
