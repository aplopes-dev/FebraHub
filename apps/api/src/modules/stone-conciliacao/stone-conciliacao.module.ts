import { Module } from '@nestjs/common';
import { StoneConciliacaoClient } from './stone-conciliacao.client';
import { StoneConciliacaoController } from './stone-conciliacao.controller';
import { StoneConciliacaoCron } from './stone-conciliacao.cron';
import { StoneConciliacaoService } from './stone-conciliacao.service';

@Module({
  controllers: [StoneConciliacaoController],
  providers: [StoneConciliacaoClient, StoneConciliacaoService, StoneConciliacaoCron],
  exports: [StoneConciliacaoService],
})
export class StoneConciliacaoModule {}
