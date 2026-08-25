import { Module } from '@nestjs/common';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { LojaPedidosController } from './loja-pedidos.controller';
import { LojaPedidosCron } from './loja-pedidos.cron';
import { LojaPedidosEventos } from './loja-pedidos.eventos';
import { LojaPedidosService } from './loja-pedidos.service';
import { AsaasProvider } from './pagamentos/asaas.provider';
import { ManualProvider } from './pagamentos/manual.provider';
import { StoneProvider } from './pagamentos/stone.provider';
import { PagamentosService } from './pagamentos/pagamentos.service';

@Module({
  imports: [WhatsappModule],
  controllers: [LojaPedidosController],
  providers: [
    LojaPedidosService, LojaPedidosEventos, LojaPedidosCron,
    PagamentosService, AsaasProvider, ManualProvider, StoneProvider,
  ],
})
export class LojaPedidosModule {}
