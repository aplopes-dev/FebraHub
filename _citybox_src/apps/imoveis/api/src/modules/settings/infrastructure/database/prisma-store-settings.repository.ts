import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  DEFAULT_BILLING_SETTINGS,
  DEFAULT_SYSTEM_SETTINGS,
  normalizeAccentColorId,
  isBillingStatus,
  StoreSettingsEntity,
  type BillingStatus,
  type StoreBillingSettings,
} from '../../domain/entities/store-settings.entity';
import {
  parseIntegrationSettings,
  serializeIntegrationSettings,
} from '../../domain/mappers/integration-settings.mapper';
import {
  StoreSettingsRepository,
  type StoreSettingsUpsertPayload,
} from '../../domain/repositories/store-settings.repository.interface';

type StoreSettingsRow = Prisma.StoreSettingsGetPayload<object>;

/** Linha antiga com accent inválido não deve derrubar a leitura. */
function toAccentColorId(value: string): string {
  return normalizeAccentColorId(value);
}

function toBillingStatus(value: string): BillingStatus {
  return isBillingStatus(value) ? value : DEFAULT_BILLING_SETTINGS.status;
}

@Injectable()
export class PrismaStoreSettingsRepository extends StoreSettingsRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByStoreId(storeId: string): Promise<StoreSettingsEntity | null> {
    const row = await this.prisma.storeSettings.findUnique({
      where: { storeId },
    });
    return row ? this.toEntity(row) : null;
  }

  async upsert(
    storeId: string,
    payload: StoreSettingsUpsertPayload,
  ): Promise<StoreSettingsEntity> {
    const data = {
      companyName: payload.system.companyName,
      timezone: payload.system.timezone,
      currency: payload.system.currency,
      language: payload.system.language,
      autoAssignLeads: payload.system.autoAssignLeads,
      requireTwoFactorForNewUsers: payload.system.requireTwoFactorForNewUsers,
      whatsappCatalogEnabled: payload.system.whatsappCatalogEnabled,
      leadFormCatalogEnabled: payload.system.leadFormCatalogEnabled,
      accentColorId: payload.system.accentColorId,
      emailEnabled: payload.notifications.emailEnabled,
      pushEnabled: payload.notifications.pushEnabled,
      leadsAlerts: payload.notifications.leadsAlerts,
      calendarAlerts: payload.notifications.calendarAlerts,
      documentsAlerts: payload.notifications.documentsAlerts,
      integrationsJson: serializeIntegrationSettings(payload.integrations),
    };

    const row = await this.prisma.storeSettings.upsert({
      where: { storeId },
      create: { id: randomUUID(), storeId, ...data },
      update: data,
    });

    return this.toEntity(row);
  }

  async updateBilling(
    storeId: string,
    billing: StoreBillingSettings,
  ): Promise<StoreSettingsEntity> {
    const data = {
      billingPlanName: billing.planName,
      billingStatus: billing.status,
      billingRenewsAt: billing.renewsAt,
      billingAmountCents: billing.amountCents,
    };

    const row = await this.prisma.storeSettings.upsert({
      where: { storeId },
      create: { id: randomUUID(), storeId, ...data },
      update: data,
    });

    return this.toEntity(row);
  }

  private toEntity(row: StoreSettingsRow): StoreSettingsEntity {
    return StoreSettingsEntity.create(
      {
        storeId: row.storeId,
        system: {
          companyName: row.companyName,
          timezone: row.timezone,
          currency: row.currency,
          language: row.language,
          autoAssignLeads: row.autoAssignLeads,
          requireTwoFactorForNewUsers: row.requireTwoFactorForNewUsers,
          whatsappCatalogEnabled: row.whatsappCatalogEnabled,
          leadFormCatalogEnabled: row.leadFormCatalogEnabled,
          accentColorId: toAccentColorId(row.accentColorId),
        },
        notifications: {
          emailEnabled: row.emailEnabled,
          pushEnabled: row.pushEnabled,
          leadsAlerts: row.leadsAlerts,
          calendarAlerts: row.calendarAlerts,
          documentsAlerts: row.documentsAlerts,
        },
        integrations: parseIntegrationSettings(row.integrationsJson),
        billing: {
          planName: row.billingPlanName,
          status: toBillingStatus(row.billingStatus),
          renewsAt: row.billingRenewsAt,
          amountCents: row.billingAmountCents,
        },
      },
      row.id,
    );
  }
}
