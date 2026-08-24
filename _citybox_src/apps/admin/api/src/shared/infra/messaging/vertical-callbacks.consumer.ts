import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  PLATFORM_CALLBACKS_QUEUE,
  PLATFORM_CALLBACKS_ROUTING_KEY,
  RabbitBus,
  STORE_PROVISIONED_EVENT,
  STORE_PROVISIONING_FAILED_EVENT,
  type CloudEvent,
  type StoreProvisionedEventData,
  type StoreProvisioningFailedEventData,
} from '@citybox/messaging';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Consome os callbacks de provisionamento das verticais e fecha o ciclo iniciado em
 * `store.created`: a loja sai de `PROVISIONING` para `ACTIVE` ou `FAILED`.
 *
 * Sem isto a loja fica presa em "provisionando" para sempre no admin, que é exatamente
 * o risco que o ADR aponta ao trocar transação única por saga entre serviços.
 *
 * A fila binda `citybox.provisioning.#`, e **não** `citybox.store.#`: as filas das
 * verticais usam esse segundo prefixo e receberiam de volta o próprio callback.
 */
@Injectable()
export class VerticalCallbacksConsumer
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(VerticalCallbacksConsumer.name);
  private bus: RabbitBus | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap(): Promise<void> {
    const url = process.env.RABBITMQ_URL?.trim();
    if (!url || process.env.PLATFORM_CALLBACKS_ENABLED === 'false') {
      this.logger.warn(
        'Consumidor de callbacks desligado — deploymentStatus não sai de PROVISIONING sozinho',
      );
      return;
    }

    this.bus = new RabbitBus({
      url,
      exchange: process.env.RABBITMQ_EXCHANGE ?? 'citybox.events',
      dlx: process.env.RABBITMQ_DLX ?? 'citybox.dlx',
    });

    try {
      await this.bus.connect();
      await this.bus.consume(
        PLATFORM_CALLBACKS_QUEUE,
        async (msg) => {
          const event = JSON.parse(msg.content.toString()) as CloudEvent<
            StoreProvisionedEventData | StoreProvisioningFailedEventData
          >;
          await this.handle(event);
        },
        { routingKey: PLATFORM_CALLBACKS_ROUTING_KEY },
      );
      this.logger.log(
        `Consumindo ${PLATFORM_CALLBACKS_QUEUE} (${PLATFORM_CALLBACKS_ROUTING_KEY})`,
      );
    } catch (err) {
      this.logger.error(
        `Falha ao consumir callbacks: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.bus?.close();
  }

  private async handle(
    event: CloudEvent<
      StoreProvisionedEventData | StoreProvisioningFailedEventData
    >,
  ): Promise<void> {
    const data = event.data;
    if (!data?.storeId) return;

    if (event.type === STORE_PROVISIONED_EVENT) {
      await this.prisma.store.update({
        where: { id: data.storeId },
        data: { deploymentStatus: 'ACTIVE' },
      });
      this.logger.log(
        `Store ${data.storeId} provisionada na vertical ${data.vertical}`,
      );
      return;
    }

    if (event.type === STORE_PROVISIONING_FAILED_EVENT) {
      const failed = data as StoreProvisioningFailedEventData;
      await this.prisma.store.update({
        where: { id: data.storeId },
        data: { deploymentStatus: 'FAILED' },
      });
      // O motivo vai para a auditoria da loja, que é o que o admin já exibe.
      await this.prisma.storeAuditEvent.create({
        data: {
          storeId: data.storeId,
          occurredAt: new Date(),
          severity: 'error',
          actor: `system:${data.vertical}`,
          module: 'Provisionamento',
          action: `Falha ao provisionar: ${failed.reason.slice(0, 500)}`,
        },
      });
      this.logger.error(
        `Store ${data.storeId} falhou ao provisionar: ${failed.reason}`,
      );
    }
  }
}
