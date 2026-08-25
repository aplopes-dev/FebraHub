import { Module } from '@nestjs/common';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { LojaPedidosController } from './loja-pedidos.controller';
import { LojaPedidosCron } from './loja-pedidos.cron';
import { LojaPedidosEventos } from './loja-pedidos.eventos';
import { LojaPedidosService } from './loja-pedidos.service';

@Module({
  imports: [WhatsappModule],
  controllers: [LojaPedidosController],
  providers: [LojaPedidosService, LojaPedidosEventos, LojaPedidosCron],
})
export class LojaPedidosModule {}
