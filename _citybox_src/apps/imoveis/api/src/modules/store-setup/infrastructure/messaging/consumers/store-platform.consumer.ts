import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  createCloudEvent,
  RabbitBus,
  routingKeyFor,
  STORE_CREATED_EVENT,
  STORE_PLAN_CHANGED_EVENT,
  STORE_PROVISIONED_EVENT,
  STORE_PROVISIONING_FAILED_EVENT,
  STORE_REACTIVATED_EVENT,
  STORE_SUSPENDED_EVENT,
  STORE_UPDATED_EVENT,
  type CloudEvent,
  type StorePlatformEventData,
  type StorePlatformVertical,
} from '@citybox/messaging';
import { EnsurePlatformStoreOwnerUseCase } from '../../../application/use-cases/ensure-platform-store-owner/ensure-platform-store-owner.use-case';
import { EventDedupeService } from '../event-dedupe.service';

const QUEUE = 'imoveis.store-setup';
const ROUTING_KEY = 'citybox.store.#';

const HANDLED_VERTICALS: readonly StorePlatformVertical[] = ['Imóveis'];

const KNOWN_EVENTS: readonly string[] = [
  STORE_CREATED_EVENT,
  STORE_UPDATED_EVENT,
  STORE_PLAN_CHANGED_EVENT,
  STORE_SUSPENDED_EVENT,
  STORE_REACTIVATED_EVENT,
];

/**
 * Liga a imoveis-api ao ciclo de vida da loja no admin-api.
 *
 * | evento               | efeito local                                      |
 * |----------------------|---------------------------------------------------|
 * | `store.created`      | TeamMember admin + Keycloak → callback             |
 * | `store.updated`      | re-provision idempotente + callback                |
 * | `store.plan_changed` | no-op (log)                                        |
 * | `store.suspended`    | no-op (log)                                        |
 * | `store.reactivated`  | no-op (log)                                        |
 */
@Injectable()
export class StorePlatformConsumer
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(StorePlatformConsumer.name);
  private bus: RabbitBus | null = null;

  constructor(
    private readonly ensureOwner: EnsurePlatformStoreOwnerUseCase,
    private readonly dedupe: EventDedupeService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (process.env.IMOVEIS_WORKER_ENABLED === 'false') {
      this.logger.warn(
        'Consumidor store-setup desligado (IMOVEIS_WORKER_ENABLED=false)',
      );
      return;
    }

    const url = process.env.RABBITMQ_URL?.trim();
    if (!url) {
      this.logger.error(
        'RABBITMQ_URL ausente — a API sobe sem consumir eventos; lojas Imóveis criadas no admin não serão provisionadas.',
      );
      return;
    }

    this.bus = new RabbitBus({
      url,
      exchange: process.env.RABBITMQ_EXCHANGE ?? 'citybox.events',
      dlx: process.env.RABBITMQ_DLX ?? 'citybox.dlx',
    });
    await this.bus.connect();

    await this.bus.consume(
      QUEUE,
      async (msg) => {
        const event = JSON.parse(
          msg.content.toString(),
        ) as CloudEvent<StorePlatformEventData>;
        await this.handle(event);
      },
      { routingKey: ROUTING_KEY },
    );
    this.logger.log(`Consumindo ${QUEUE} (${ROUTING_KEY})`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.bus?.close();
  }

  private async handle(
    event: CloudEvent<StorePlatformEventData>,
  ): Promise<void> {
    const data = event.data;
    if (!data?.storeId) return;

    if (!HANDLED_VERTICALS.includes(data.vertical)) return;
    if (!KNOWN_EVENTS.includes(event.type)) return;

    this.logger.log(
      `store-setup type=${event.type} storeId=${data.storeId} vertical=${data.vertical}`,
    );

    if (!event.id) {
      this.logger.warn(
        `Evento sem id (type=${event.type} storeId=${data.storeId}) — ignorando`,
      );
      return;
    }

    const claimed = await this.dedupe.claim(event.id, event.type, data.storeId);
    if (!claimed) return;

    try {
      await this.dispatch(event.type, data);
    } catch (err) {
      await this.dedupe.release(event.id);
      throw err;
    }
  }

  private async dispatch(
    type: string,
    data: StorePlatformEventData,
  ): Promise<void> {
    switch (type) {
      case STORE_CREATED_EVENT:
        this.logger.log(
          `store.created ignorado storeId=${data.storeId} (provision on demand)`,
        );
        return;

      case STORE_UPDATED_EVENT: {
        // Não cria OWNER via evento — só reprocessa se já houver TeamMember admin.
        // EnsurePlatformStoreOwner é idempotente, mas sem org prévia o admin
        // espera o botão Provisionar; evitar provision silencioso no update.
        this.logger.log(
          `store.updated ignorado para provision storeId=${data.storeId} (provision on demand)`,
        );
        return;
      }

      case STORE_PLAN_CHANGED_EVENT:
        this.logger.log(
          `plan_changed ignorado storeId=${data.storeId} (sem settings de plano locais)`,
        );
        return;

      case STORE_SUSPENDED_EVENT:
        this.logger.warn(
          `suspended ignorado storeId=${data.storeId} (${data.reason ?? 'sem motivo'})`,
        );
        return;

      case STORE_REACTIVATED_EVENT:
        this.logger.log(`reactivated ignorado storeId=${data.storeId}`);
        return;
    }
  }

  /**
   * Provisionamento completo. Emite o callback em **qualquer** desfecho —
   * sem ele a loja fica presa em `deploymentStatus=PROVISIONING` no admin.
   */
  private async provision(data: StorePlatformEventData): Promise<void> {
    try {
      await this.ensureOwner.execute({
        storeId: data.storeId,
        tradeName: data.tradeName,
        responsibleName: data.owner?.responsibleName,
        billingEmail: data.owner?.billingEmail,
      });
      await this.publishCallback(STORE_PROVISIONED_EVENT, {
        storeId: data.storeId,
        vertical: data.vertical,
        organizationId: data.storeId,
        provisionedAt: new Date().toISOString(),
      });
    } catch (err) {
      const reason = describe(err);
      this.logger.error(
        `Provisionamento da loja ${data.storeId} falhou: ${reason}`,
      );
      await this.publishCallback(STORE_PROVISIONING_FAILED_EVENT, {
        storeId: data.storeId,
        vertical: data.vertical,
        reason,
        failedAt: new Date().toISOString(),
      });
      throw err;
    }
  }

  private async publishCallback(
    type: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (!this.bus) return;
    try {
      const event = createCloudEvent({
        type,
        source: 'citybox://imoveis-api',
        data: payload,
        storeId: String(payload.storeId),
      });
      await this.bus.publish(
        routingKeyFor(type),
        Buffer.from(JSON.stringify(event)),
      );
    } catch (err) {
      this.logger.error(`Falha ao publicar callback ${type}: ${describe(err)}`);
    }
  }
}

function describe(err: unknown): string {
  if (err && typeof err === 'object' && 'externalMessage' in err) {
    const external = (err as { externalMessage?: unknown }).externalMessage;
    if (typeof external === 'string' && external) return external;
  }
  return err instanceof Error ? err.message : String(err);
}
