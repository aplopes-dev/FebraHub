import {
  cloneIntegrationSettings,
  DEFAULT_INTEGRATION_SETTINGS,
  INTEGRATION_KEYS,
  type StoreIntegration,
  type StoreIntegrationSettings,
} from '../entities/store-settings.entity';

function toIntegration(
  raw: unknown,
  fallback: StoreIntegration,
): StoreIntegration {
  if (!raw || typeof raw !== 'object') return { ...fallback };
  const record = raw as Record<string, unknown>;
  const accountLabel =
    typeof record.accountLabel === 'string' && record.accountLabel.trim()
      ? record.accountLabel.trim()
      : undefined;

  return {
    enabled:
      typeof record.enabled === 'boolean' ? record.enabled : fallback.enabled,
    connected:
      typeof record.connected === 'boolean'
        ? record.connected
        : fallback.connected,
    ...(accountLabel ? { accountLabel } : {}),
  };
}

/**
 * Coluna `integrations_json` é livre — chave desconhecida é descartada e chave
 * ausente cai no padrão, para o web nunca receber um mapa incompleto.
 */
export function parseIntegrationSettings(
  raw: unknown,
): StoreIntegrationSettings {
  if (!raw || typeof raw !== 'object') {
    return cloneIntegrationSettings(DEFAULT_INTEGRATION_SETTINGS);
  }
  const record = raw as Record<string, unknown>;
  const entries = INTEGRATION_KEYS.map((key) => [
    key,
    toIntegration(record[key], DEFAULT_INTEGRATION_SETTINGS[key]),
  ]);
  return Object.fromEntries(entries) as StoreIntegrationSettings;
}

/** Shape persistido no JSON — sem `undefined` para não sujar a coluna. */
export function serializeIntegrationSettings(
  integrations: StoreIntegrationSettings,
): Record<string, StoreIntegration> {
  const entries = INTEGRATION_KEYS.map((key) => {
    const integration = integrations[key];
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
  return Object.fromEntries(entries) as Record<string, StoreIntegration>;
}
