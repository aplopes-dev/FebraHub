import {
  INTEGRATION_KEYS,
  type StoreSettingsEntity,
} from '../../../../domain/entities/store-settings.entity';

/** Shape HTTP da assinatura da loja (`GET/PUT /v1/settings/billing`). */
export function mapStoreBillingToHttp(settings: StoreSettingsEntity) {
  return {
    planName: settings.billing.planName,
    status: settings.billing.status,
    renewsAt: settings.billing.renewsAt
      ? settings.billing.renewsAt.toISOString()
      : null,
    amountCents: settings.billing.amountCents,
  };
}

/** Shape HTTP das integrações (`IntegrationSettings` no web). */
export function mapIntegrationsToHttp(settings: StoreSettingsEntity) {
  const entries = INTEGRATION_KEYS.map((key) => {
    const integration = settings.integrations[key];
    return [
      key,
      {
        enabled: integration.enabled,
        connected: integration.connected,
        ...(integration.accountLabel
          ? { accountLabel: integration.accountLabel }
          : {}),
      },
    ];
  });
  return Object.fromEntries(entries);
}

/** Shape HTTP das configurações da loja (`SystemSettings` + `NotificationSettings`). */
export function mapStoreSettingsToHttp(settings: StoreSettingsEntity) {
  return {
    system: {
      companyName: settings.system.companyName,
      timezone: settings.system.timezone,
      currency: settings.system.currency,
      language: settings.system.language,
      autoAssignLeads: settings.system.autoAssignLeads,
      requireTwoFactorForNewUsers: settings.system.requireTwoFactorForNewUsers,
      whatsappCatalogEnabled: settings.system.whatsappCatalogEnabled,
      leadFormCatalogEnabled: settings.system.leadFormCatalogEnabled,
      accentColorId: settings.system.accentColorId,
    },
    notifications: {
      emailEnabled: settings.notifications.emailEnabled,
      pushEnabled: settings.notifications.pushEnabled,
      leadsAlerts: settings.notifications.leadsAlerts,
      calendarAlerts: settings.notifications.calendarAlerts,
      documentsAlerts: settings.notifications.documentsAlerts,
    },
    integrations: mapIntegrationsToHttp(settings),
  };
}
