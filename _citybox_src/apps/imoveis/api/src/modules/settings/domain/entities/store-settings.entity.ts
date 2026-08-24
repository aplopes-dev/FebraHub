import { Entity } from '../../../../shared/core/entity';
import { InvalidAccentColorError } from '../errors/invalid-accent-color.error';

/** Presets de cor de destaque suportados pelo web (`accent-presets.ts`). */
export const ACCENT_COLOR_IDS = [
  'orange',
  'amber',
  'rose',
  'blue',
  'teal',
  'violet',
  'green',
] as const;

export type AccentColorId = (typeof ACCENT_COLOR_IDS)[number];

export function isAccentColorId(value: string): value is AccentColorId {
  return (ACCENT_COLOR_IDS as readonly string[]).includes(value);
}

const CUSTOM_ACCENT_HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export function isCustomAccentHex(value: string): boolean {
  return CUSTOM_ACCENT_HEX_PATTERN.test(value);
}

/** Preset nomeado ou hex customizado (`#RRGGBB`). */
export function isValidAccentColor(value: string): boolean {
  return isAccentColorId(value) || isCustomAccentHex(value);
}

export function normalizeAccentColorId(value: string): string {
  const trimmed = value.trim();
  if (isAccentColorId(trimmed)) return trimmed;
  if (isCustomAccentHex(trimmed)) return trimmed.toUpperCase();
  return DEFAULT_SYSTEM_SETTINGS.accentColorId;
}

export type StoreSystemSettings = {
  companyName: string;
  timezone: string;
  currency: string;
  language: string;
  autoAssignLeads: boolean;
  requireTwoFactorForNewUsers: boolean;
  /** Catálogo público: botão de WhatsApp na página do imóvel. */
  whatsappCatalogEnabled: boolean;
  /** Catálogo público: formulário de captação na página do imóvel. */
  leadFormCatalogEnabled: boolean;
  accentColorId: string;
};

export type StoreNotificationSettings = {
  emailEnabled: boolean;
  pushEnabled: boolean;
  leadsAlerts: boolean;
  calendarAlerts: boolean;
  documentsAlerts: boolean;
};

/** Integrações oferecidas na aba Integrações do web (`IntegrationKey`). */
export const INTEGRATION_KEYS = [
  'whatsapp',
  'olx',
  'zap',
  'google-calendar',
  'meta-ads',
  'asaas',
] as const;

export type IntegrationKey = (typeof INTEGRATION_KEYS)[number];

export function isIntegrationKey(value: string): value is IntegrationKey {
  return (INTEGRATION_KEYS as readonly string[]).includes(value);
}

export type StoreIntegration = {
  enabled: boolean;
  connected: boolean;
  accountLabel?: string;
};

export type StoreIntegrationSettings = Record<IntegrationKey, StoreIntegration>;

export const BILLING_STATUSES = ['active', 'past_due', 'canceled'] as const;

export type BillingStatus = (typeof BILLING_STATUSES)[number];

export function isBillingStatus(value: string): value is BillingStatus {
  return (BILLING_STATUSES as readonly string[]).includes(value);
}

export type StoreBillingSettings = {
  planName: string;
  status: BillingStatus;
  renewsAt: Date | null;
  amountCents: number;
};

export type StoreSettingsProps = {
  storeId: string;
  system: StoreSystemSettings;
  notifications: StoreNotificationSettings;
  integrations: StoreIntegrationSettings;
  billing: StoreBillingSettings;
};

export const DEFAULT_SYSTEM_SETTINGS: StoreSystemSettings = {
  companyName: '',
  timezone: 'America/Sao_Paulo',
  currency: 'BRL',
  language: 'pt-BR',
  autoAssignLeads: false,
  requireTwoFactorForNewUsers: true,
  whatsappCatalogEnabled: true,
  leadFormCatalogEnabled: true,
  accentColorId: 'orange',
};

export const DEFAULT_NOTIFICATION_SETTINGS: StoreNotificationSettings = {
  emailEnabled: true,
  pushEnabled: true,
  leadsAlerts: true,
  calendarAlerts: true,
  documentsAlerts: false,
};

/**
 * Espelha os flags de `DEFAULT_INTEGRATIONS` do web
 * (`settings/data/mock-data.ts`). Os `accountLabel` do mock são dados de
 * exemplo (telefone/nome fictícios) e ficam vazios até uma conexão real —
 * mesma decisão do `companyName` vazio em `DEFAULT_SYSTEM_SETTINGS`.
 */
export const DEFAULT_INTEGRATION_SETTINGS: StoreIntegrationSettings = {
  whatsapp: { enabled: true, connected: true },
  olx: { enabled: false, connected: false },
  zap: { enabled: true, connected: true },
  'google-calendar': { enabled: true, connected: false },
  'meta-ads': { enabled: false, connected: false },
  asaas: { enabled: false, connected: false },
};

export const DEFAULT_BILLING_SETTINGS: StoreBillingSettings = {
  planName: 'Profissional',
  status: 'active',
  renewsAt: null,
  amountCents: 19900,
};

export function cloneIntegrationSettings(
  integrations: StoreIntegrationSettings,
): StoreIntegrationSettings {
  const entries = INTEGRATION_KEYS.map((key) => [
    key,
    { ...integrations[key] },
  ]);
  return Object.fromEntries(entries) as StoreIntegrationSettings;
}

export class StoreSettingsEntity extends Entity<StoreSettingsProps> {
  get storeId(): string {
    return this.props.storeId;
  }

  get system(): StoreSystemSettings {
    return this.props.system;
  }

  get notifications(): StoreNotificationSettings {
    return this.props.notifications;
  }

  get integrations(): StoreIntegrationSettings {
    return this.props.integrations;
  }

  get billing(): StoreBillingSettings {
    return this.props.billing;
  }

  protected validate(): void {
    if (!this.props.storeId) throw new Error('storeId is required');
    if (!isValidAccentColor(this.props.system.accentColorId)) {
      throw new InvalidAccentColorError(
        StoreSettingsEntity.name,
        this.props.system.accentColorId,
      );
    }
  }

  static create(props: StoreSettingsProps, id?: string): StoreSettingsEntity {
    const entity = new StoreSettingsEntity(
      {
        storeId: props.storeId,
        system: { ...props.system },
        notifications: { ...props.notifications },
        integrations: cloneIntegrationSettings(props.integrations),
        billing: { ...props.billing },
      },
      id,
    );
    entity.validate();
    return entity;
  }

  /** Configuração inicial da loja — o GET a persiste na primeira leitura. */
  static default(storeId: string): StoreSettingsEntity {
    return StoreSettingsEntity.create({
      storeId,
      system: { ...DEFAULT_SYSTEM_SETTINGS },
      notifications: { ...DEFAULT_NOTIFICATION_SETTINGS },
      integrations: cloneIntegrationSettings(DEFAULT_INTEGRATION_SETTINGS),
      billing: { ...DEFAULT_BILLING_SETTINGS },
    });
  }
}
