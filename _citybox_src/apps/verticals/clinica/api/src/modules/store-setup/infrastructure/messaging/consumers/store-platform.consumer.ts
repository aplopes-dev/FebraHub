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
} from '@citybox/messaging';
import { SetupInitialStoreUseCase } from '../../../application/use-cases/setup-initial-store/setup-initial-store.use-case';
import { UpsertClinicStoreUseCase } from '../../../application/use-cases/upsert-clinic-store/upsert-clinic-store.use-case';
import { SyncOrganizationFromEventUseCase } from '../../../../tenancy/application/use-cases/sync-organization-from-event.use-case';
import { EventDedupeService } from '../event-dedupe.service';

const CLINIC_VERTICAL = 'Clínica';

/**
 * Consome o ciclo de vida da loja vindo do platform-api e mantém a tenancy da clínica em
 * dia — sem nenhuma chamada síncrona de volta.
 *
 * | evento                | efeito local                                          |
 * |-----------------------|-------------------------------------------------------|
 * | `store.created`       | Organization + Clinic raiz + seed → emite callback     |
 * | `store.updated`       | atualiza espelho cadastral e a organização             |
 * | `store.plan_changed`  | atualiza `planSnapshot`; marca `overQuota` se estourou |
 * | `store.suspended`     | `Organization.status = suspended`                      |
 * | `store.reactivated`   | `Organization.status = active`                         |
 *
 * **Idempotência é obrigatória, não opcional:** desde a Fase 1 o platform publica por
 * outbox com entrega at-least-once. Todo evento passa pelo `EventDedupeService` antes de
 * ser processado, e o registro é liberado se o handler falhar — assim uma falha
 * transitória volta pela fila em vez de ficar marcada como concluída.
 */
@Injectable()
export class StorePlatformConsumer
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(StorePlatformConsumer.name);
  private bus: RabbitBus | null = null;

  constructor(
    private readonly setupInitialStore: SetupInitialStoreUseCase,
    private readonly upsertClinicStore: UpsertClinicStoreUseCase,
    private readonly syncOrganization: SyncOrganizationFromEventUseCase,
    private readonly dedupe: EventDedupeService,
  ) {}

  async onApplicationBootstrap() {
    const url = process.env.RABBITMQ_URL?.trim();
    if (process.env.CLINIC_WORKER_ENABLED === 'false') {
      this.logger.warn(
        'Clinic store-setup worker disabled (CLINIC_WORKER_ENABLED=false)',
      );
      return;
    }
    if (!url) {
      this.logger.error(
        'RABBITMQ_URL ausente — worker sobe sem consumir; seeds de clínica não rodam.',
      );
      return;
    }

    const cfg = {
      url,
      exchange: process.env.RABBITMQ_EXCHANGE ?? 'citybox.events',
      dlx: process.env.RABBITMQ_DLX ?? 'citybox.dlx',
    };

    this.bus = new RabbitBus(cfg);
    await this.bus.connect();

    await this.bus.consume(
      'clinic.store-setup',
      async (msg) => {
        const event = JSON.parse(
          msg.content.toString(),
        ) as CloudEvent<StorePlatformEventData>;
        this.logger.log(
          `store-setup event type=${event.type} storeId=${event.data?.storeId ?? '?'}`,
        );
        await this.handle(event);
      },
      { routingKey: 'citybox.store.#' },
    );
    this.logger.log('Consumindo clinic.store-setup (citybox.store.#)');
  }

  async onModuleDestroy() {
    await this.bus?.close();
  }

  private async handle(
    event: CloudEvent<StorePlatformEventData>,
  ): Promise<void> {
    const data = event.data;
    if (!data?.storeId) return;

    // A fila binda `citybox.store.#` e recebe evento de loja de qualquer vertical.
    // Filtrar aqui evita criar organização de clínica para uma loja de food.
    if (data.vertical !== CLINIC_VERTICAL) return;

    const known: string[] = [
      STORE_CREATED_EVENT,
      STORE_UPDATED_EVENT,
      STORE_PLAN_CHANGED_EVENT,
      STORE_SUSPENDED_EVENT,
      STORE_REACTIVATED_EVENT,
    ];
    if (!known.includes(event.type)) return;

    const claimed = await this.dedupe.claim(event.id, event.type, data.storeId);
    if (!claimed) return;

    try {
      await this.dispatch(event.type, data);
    } catch (err) {
      // Libera o dedupe para a reentrega poder tentar de novo, e deixa o erro subir
      // (o RabbitBus faz nack → DLQ; o operador reprocessa pelo endpoint de retry).
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
        const existing = await this.syncOrganization.findByStoreId(
          data.storeId,
        );
        if (!existing) {
          this.logger.log(
            `store.updated sem org local storeId=${data.storeId} — aguarda provision HTTP`,
          );
          return;
        }
        await this.upsertClinicStore.execute(data);
        await this.syncOrganization.execute(data);
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
          `Organização do store ${data.storeId} suspensa (${data.reason ?? 'sem motivo'})`,
        );
        return;

      case STORE_REACTIVATED_EVENT:
        await this.syncOrganization.setSuspended(data.storeId, false);
        return;
    }
  }

  /**
   * Provisionamento completo. Emite o callback em **qualquer** desfecho — sem ele a loja
   * fica presa em `deploymentStatus=PROVISIONING` para sempre no admin.
   */
  private async provision(data: StorePlatformEventData): Promise<void> {
    try {
      await this.upsertClinicStore.execute(data);
      const organization = await this.syncOrganization.execute(data);
      await this.setupInitialStore.execute({ event: data, runSeed: true });
      await this.publishCallback(STORE_PROVISIONED_EVENT, {
        storeId: data.storeId,
        vertical: data.vertical,
        organizationId: organization.id,
        provisionedAt: new Date().toISOString(),
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Provisionamento do store ${data.storeId} falhou: ${reason}`,
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
        source: 'citybox://clinica-api',
        data: payload,
        storeId: String(payload.storeId),
      });
      await this.bus.publish(
        routingKeyFor(type),
        Buffer.from(JSON.stringify(event)),
      );
    } catch (err) {
      // Não relança: o callback é observabilidade do provisionamento e não pode
      // transformar um provisionamento bem-sucedido em falha.
      this.logger.error(
        `Falha ao publicar callback ${type}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
