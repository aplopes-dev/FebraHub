import { Module } from '@nestjs/common';
import { StoneConciliacaoModule } from '../stone-conciliacao/stone-conciliacao.module';
import { CentralVendasController } from './central-vendas.controller';
import { CentralVendasCron } from './central-vendas.cron';
import { CentralVendasService } from './central-vendas.service';

@Module({
  imports: [StoneConciliacaoModule],
  controllers: [CentralVendasController],
  providers: [CentralVendasService, CentralVendasCron],
  exports: [CentralVendasService],
})
export class CentralVendasModule {}
