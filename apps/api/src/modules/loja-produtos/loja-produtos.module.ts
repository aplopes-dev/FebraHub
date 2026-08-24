import { Module } from '@nestjs/common';
import { LojaProdutosController } from './loja-produtos.controller';
import { LojaProdutosService } from './loja-produtos.service';

@Module({ controllers: [LojaProdutosController], providers: [LojaProdutosService] })
export class LojaProdutosModule {}
