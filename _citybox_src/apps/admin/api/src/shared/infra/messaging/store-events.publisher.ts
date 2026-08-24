import { Injectable, Logger } from '@nestjs/common';
import {
  createCloudEvent,
  routingKeyFor,
  STORE_CREATED_EVENT,
  STORE_UPDATED_EVENT,
  STORE_PLAN_CHANGED_EVENT,
  STORE_SUSPENDED_EVENT,
  STORE_REACTIVATED_EVENT,
} from '@citybox/messaging';
import { PrismaService } from '../prisma/prisma.service';
import { currentTransaction, txClient } from '../prisma/transaction.context';
import type { StorePlatformEventData } from './store-platform-event.mapper';

// Constantes vêm de @citybox/messaging (contrato compartilhado com as verticais);
// reexportadas para não quebrar imports existentes deste app.
export {
  STORE_CREATED_EVENT,
  STORE_UPDATED_EVENT,
  STORE_PLAN_CHANGED_EVENT,
  STORE_SUSPENDED_EVENT,
  STORE_REACTIVATED_EVENT,
};

export const STORE_AGGREGATE = 'store';

/**
 * Enfileira eventos de loja no **outbox transacional** (tabela `platform.outbox_events`).
 *
 * Não fala com o RabbitMQ — quem publica é o `OutboxRelayService`, depois do commit.
 * Isso é o que garante que a escrita de domínio e o evento sejam atômicos: chamado
 * dentro de `UnitOfWork.run()`, a linha do outbox entra na mesma transação, então
 * é impossível ter loja criada sem evento (ou evento sem loja).
 *
 * Antes da Fase 1 este publisher publicava direto no broker, **depois** do save e fora
 * de transação — e retornava em silêncio quando `RABBITMQ_URL` não estava configurada.
 * Um crash ou broker fora do ar entre save e publish perdia o evento para sempre, o que
 * no desenho alvo significa loja paga sem organização provisionada na vertical.
 *
 * A API pública foi mantida de propósito para os use cases não mudarem de forma.
 */
@Injectable()
export class StoreEventsPublisher {
  private readonly logger = new Logger(StoreEventsPublisher.name);

  constructor(private readonly prisma: PrismaService) {}

  async publishStoreCreated(data: StorePlatformEventData): Promise<void> {
    await this.enqueue(STORE_CREATED_EVENT, data);
  }

  async publishStoreUpdated(data: StorePlatformEventData): Promise<void> {
    await this.enqueue(STORE_UPDATED_EVENT, data);
  }

  async publishStorePlanChanged(data: StorePlatformEventData): Promise<void> {
    await this.enqueue(STORE_PLAN_CHANGED_EVENT, data);
  }

  async publishStoreSuspended(data: StorePlatformEventData): Promise<void> {
    await this.enqueue(STORE_SUSPENDED_EVENT, data);
  }

  async publishStoreReactivated(data: StorePlatformEventData): Promise<void> {
    await this.enqueue(STORE_REACTIVATED_EVENT, data);
  }

  private async enqueue(
    type: string,
    data: StorePlatformEventData,
  ): Promise<void> {
    const event = createCloudEvent({
      type,
      source: 'citybox://admin-api',
      data,
      storeId: data.storeId,
    });
    const routingKey = routingKeyFor(type);

    if (!currentTransaction()) {
      // Não é erro fatal — o evento ainda é persistido e será publicado —, mas perde a
      // atomicidade com a escrita de domínio, que é o motivo do outbox existir.
      this.logger.warn(
        `${type} enfileirado FORA de UnitOfWork.run() — sem atomicidade com a escrita de domínio (store ${data.storeId})`,
      );
    }

    await txClient(this.prisma).outboxEvent.create({
      data: {
        eventId: event.id,
        type,
        routingKey,
        aggregateType: STORE_AGGREGATE,
        aggregateId: data.storeId,
        payload: event,
        occurredAt: new Date(event.time),
      },
    });
  }
}
