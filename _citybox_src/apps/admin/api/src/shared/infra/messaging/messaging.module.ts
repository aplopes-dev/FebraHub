import { Global, Module } from '@nestjs/common';
import { UnitOfWork } from '../../core/unit-of-work';
import { PrismaUnitOfWork } from '../prisma/prisma-unit-of-work';
import { OutboxRelayService } from './outbox-relay.service';
import { StoreEventsPublisher } from './store-events.publisher';
import { VerticalCallbacksConsumer } from './vertical-callbacks.consumer';

/**
 * Outbox transacional (PLAT-001 / Fase 1).
 *
 * `StoreEventsPublisher` grava em `platform.outbox_events` — na transação corrente, se
 * houver — e `OutboxRelayService` publica no RabbitMQ depois do commit. `UnitOfWork` é
 * exportado aqui porque é a peça que dá atomicidade a esse par.
 */
@Global()
@Module({
  providers: [
    StoreEventsPublisher,
    OutboxRelayService,
    VerticalCallbacksConsumer,
    { provide: UnitOfWork, useClass: PrismaUnitOfWork },
  ],
  exports: [StoreEventsPublisher, OutboxRelayService, UnitOfWork],
})
export class MessagingModule {}
