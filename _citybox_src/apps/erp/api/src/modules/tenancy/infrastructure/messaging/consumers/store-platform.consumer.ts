import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  RabbitBus,
  STORE_CREATED_EVENT,
  STORE_PLAN_CHANGED_EVENT,
  STORE_REACTIVATED_EVENT,
  STORE_SUSPENDED_EVENT,
  STORE_UPDATED_EVENT,
  type CloudEvent,
  type StorePlatformEventData,
  type StorePlatformVertical,
} from '@citybox/messaging';
import { runWithoutTenantScope } from '../../../../../shared/infra/tenancy/tenant-context';
import { SyncOrganizationFromStoreUseCase } from '../../../application/use-cases/sync-organization-from-store/sync-organization-from-store.use-case';
import { EventDedupeService } from '../event-dedupe.service';

/** Fila própria desta API. Cada vertical tem a sua: `food.store-setup`, `clinic.store-setup`. */
const QUEUE = 'erp-comercio.store-setup';
const ROUTING_KEY = 'citybox.store.#';

/**
 * Verticais que este ERP atende.
 *
 * Era `['Varejo', 'Serviços']`, com `'Food'` deixado de fora para não provisionar a
 * mesma loja duas vezes enquanto a `food-api` também consumia `citybox.store.#`.
 * Esse cuidado deixou de fazer sentido: o catálogo da plataforma passou a ter uma
 * vertical por sistema, e food + varejo viraram `'Comércio'` — que é este ERP. O
 * valor `'Food'` não existe mais no produtor, então a `food-api` não recebe mais
 * nada e não há duplicação possível.
 */
const HANDLED_VERTICALS: readonly StorePlatformVertical[] = ['Comércio'];

const KNOWN_EVENTS: readonly string[] = [
  STORE_CREATED_EVENT,
  STORE_UPDATED_EVENT,
  STORE_PLAN_CHANGED_EVENT,
  STORE_SUSPENDED_EVENT,
  STORE_REACTIVATED_EVENT,
];

/**
 * Liga o ERP Comércio ao ciclo de vida da loja no admin-api **depois** do
 * provisionamento HTTP sob demanda.
 *
 * | evento               | efeito local                                          |
 * |----------------------|-------------------------------------------------------|
 * | `store.created`      | ignorado (org nasce em `POST …/provision`)            |
 * | `store.updated`      | atualiza cadastro **se** a org já existir             |
 * | `store.plan_changed` | atualiza o snapshot de plano                           |
 * | `store.suspended`    | `Organization.status = SUSPENDED` + motivo             |
 * | `store.reactivated`  | volta para `ACTIVE` e limpa o motivo                   |
 */
@Injectable()
export class StorePlatformConsumer
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(StorePlatformConsumer.name);
  private bus: RabbitBus | null = null;

  constructor(
    private readonly syncOrganization: SyncOrganizationFromStoreUseCase,
    private readonly dedupe: EventDedupeService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (process.env.ERP_COMERCIO_WORKER_ENABLED === 'false') {
      this.logger.warn(
        'Consumidor store-setup desligado (ERP_COMERCIO_WORKER_ENABLED=false)',
      );
      return;
    }

    const url = process.env.RABBITMQ_URL?.trim();
    if (!url) {
      this.logger.error(
        'RABBITMQ_URL ausente — a API sobe sem consumir eventos; updates pós-provision não sincronizam.',
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

    const claimed = await this.dedupe.claim(event.id, event.type, data.storeId);
    if (!claimed) return;

    try {
      await runWithoutTenantScope(() => this.dispatch(event.type, data));
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
        const existing = await this.syncOrganization.findByPlatformStoreId(
          data.storeId,
        );
        if (!existing) {
          this.logger.log(
            `store.updated sem org local storeId=${data.storeId} — aguarda provision HTTP`,
          );
          return;
        }
        await this.syncOrganization.update(data);
        return;
      }

      case STORE_PLAN_CHANGED_EVENT:
        await this.syncOrganization.applyPlanChange(data);
        return;

      case STORE_SUSPENDED_EVENT:
        await this.syncOrganization.setSuspended(
          data.storeId,
          true,
          data.reason ?? null,
        );
        this.logger.warn(
          `Organização da loja ${data.storeId} suspensa (${data.reason ?? 'sem motivo'})`,
        );
        return;

      case STORE_REACTIVATED_EVENT:
        await this.syncOrganization.setSuspended(data.storeId, false);
        return;
    }
  }
}
