import { Injectable, Logger } from '@nestjs/common';

export type FeatureFlagContext = {
  tenantId?: string;
  merchantId?: string;
  userId?: string;
};

export const PAYMENT_FEATURE_FLAGS = {
  INFINITEPAY_ENABLED: 'payment-api.infinitepay.enabled',
  INFINITEPAY_ROUTING: 'payment-api.infinitepay.routing',
  INFINITETAP_ENABLED: 'payment-api.infinite-tap.enabled',
  STONE_ENABLED: 'payment-api.stone.enabled',
  STONE_ROUTING: 'payment-api.stone.routing',
} as const;

type FlagName = (typeof PAYMENT_FEATURE_FLAGS)[keyof typeof PAYMENT_FEATURE_FLAGS];

const DEFAULT_FLAGS: Record<FlagName, boolean> = {
  'payment-api.infinitepay.enabled': false,
  'payment-api.infinitepay.routing': false,
  'payment-api.infinite-tap.enabled': false,
  'payment-api.stone.enabled': false,
  'payment-api.stone.routing': false,
};

const CACHE_TTL_MS = 30_000;

@Injectable()
export class PaymentFeatureFlagsService {
  private readonly logger = new Logger(PaymentFeatureFlagsService.name);
  private readonly cache = new Map<string, { value: boolean; expiresAt: number }>();

  async isEnabled(flag: FlagName, context: FeatureFlagContext = {}): Promise<boolean> {
    const envOverride = this.readEnvOverride(flag);
    if (envOverride !== undefined) return envOverride;

    const cacheKey = this.cacheKey(flag, context);
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const value = await this.resolveFromUnleash(flag, context);
    this.cache.set(cacheKey, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  }

  async isInfinitePayEnabled(context?: FeatureFlagContext): Promise<boolean> {
    return this.isEnabled(PAYMENT_FEATURE_FLAGS.INFINITEPAY_ENABLED, context);
  }

  async isInfinitePayRoutingEnabled(context?: FeatureFlagContext): Promise<boolean> {
    const master = await this.isInfinitePayEnabled(context);
    if (!master) return false;
    return this.isEnabled(PAYMENT_FEATURE_FLAGS.INFINITEPAY_ROUTING, context);
  }

  async isInfiniteTapEnabled(context?: FeatureFlagContext): Promise<boolean> {
    const master = await this.isInfinitePayEnabled(context);
    if (!master) return false;
    return this.isEnabled(PAYMENT_FEATURE_FLAGS.INFINITETAP_ENABLED, context);
  }

  async isStoneEnabled(context?: FeatureFlagContext): Promise<boolean> {
    return this.isEnabled(PAYMENT_FEATURE_FLAGS.STONE_ENABLED, context);
  }

  async isStoneRoutingEnabled(context?: FeatureFlagContext): Promise<boolean> {
    const master = await this.isStoneEnabled(context);
    if (!master) return false;
    return this.isEnabled(PAYMENT_FEATURE_FLAGS.STONE_ROUTING, context);
  }

  private readEnvOverride(flag: FlagName): boolean | undefined {
    if (flag.includes('infinitepay') || flag.includes('infinite-tap')) {
      const global = process.env.PAYMENTS_FEATURE_INFINITEPAY?.trim().toLowerCase();
      if (global === 'true' || global === '1') return true;
      if (global === 'false' || global === '0') return false;
    }
    if (flag.includes('stone')) {
      const global = process.env.PAYMENTS_FEATURE_STONE?.trim().toLowerCase();
      if (global === 'true' || global === '1') return true;
      if (global === 'false' || global === '0') return false;
    }

    const key = flag.replace(/\./g, '_').replace(/-/g, '_').toUpperCase();
    const raw = process.env[`PAYMENTS_FEATURE_${key}`]?.trim().toLowerCase();
    if (raw === 'true' || raw === '1') return true;
    if (raw === 'false' || raw === '0') return false;
    return undefined;
  }

  private cacheKey(flag: FlagName, context: FeatureFlagContext): string {
    return [flag, context.tenantId ?? '', context.merchantId ?? ''].join(':');
  }

  private async resolveFromUnleash(
    flag: FlagName,
    context: FeatureFlagContext,
  ): Promise<boolean> {
    const url = process.env.UNLEASH_URL?.trim();
    const token = process.env.UNLEASH_API_TOKEN?.trim();
    if (!url || !token) {
      return DEFAULT_FLAGS[flag] ?? false;
    }

    try {
      const appName = process.env.UNLEASH_APP_NAME?.trim() ?? 'payment-api';
      const params = new URLSearchParams({ appName });
      const response = await fetch(`${url.replace(/\/$/, '')}/api/client/features?${params}`, {
        headers: {
          Authorization: token,
          'UNLEASH-APPNAME': appName,
          'UNLEASH-INSTANCEID': process.env.UNLEASH_INSTANCE_ID?.trim() ?? 'payment-api',
        },
      });
      if (!response.ok) {
        this.logger.warn(`Unleash respondeu ${response.status} para ${flag}`);
        return DEFAULT_FLAGS[flag] ?? false;
      }

      const payload = (await response.json()) as {
        features?: Array<{ name: string; enabled: boolean; strategies?: unknown[] }>;
      };
      const feature = payload.features?.find((item) => item.name === flag);
      if (!feature) return DEFAULT_FLAGS[flag] ?? false;
      if (!feature.enabled) return false;
      return this.evaluateStrategies(feature.strategies, context);
    } catch (error) {
      this.logger.warn(
        `Falha ao consultar Unleash (${flag}): ${error instanceof Error ? error.message : error}`,
      );
      return DEFAULT_FLAGS[flag] ?? false;
    }
  }

  private evaluateStrategies(
    strategies: unknown[] | undefined,
    context: FeatureFlagContext,
  ): boolean {
    if (!strategies?.length) return true;
    for (const strategy of strategies) {
      if (!strategy || typeof strategy !== 'object') continue;
      const record = strategy as {
        name?: string;
        parameters?: Record<string, string>;
        constraints?: Array<{ contextName?: string; values?: string[] }>;
      };
      if (record.constraints?.length) {
        const matches = record.constraints.every((constraint) => {
          const values = constraint.values ?? [];
          if (constraint.contextName === 'tenantId' && context.tenantId) {
            return values.includes(context.tenantId);
          }
          if (constraint.contextName === 'merchantId' && context.merchantId) {
            return values.includes(context.merchantId);
          }
          return true;
        });
        if (!matches) continue;
      }
      return true;
    }
    return false;
  }
}
