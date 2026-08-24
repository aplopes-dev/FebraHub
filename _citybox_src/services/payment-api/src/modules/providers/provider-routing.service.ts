import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { ProviderType } from '../../generated/prisma/enums.js';
import { PaymentFeatureFlagsService } from '../../common/feature-flags/payment-feature-flags.service.js';
import { isInfiniteTapFlow } from './infinitepay/infinitepay.types.js';
import { isStonePosFlow } from './stone/stone.types.js';
import { ProviderAccountsService } from '../provider-accounts/provider-accounts.service.js';
import { PaymentProviderFactory } from './payment-provider.factory.js';

export type RoutingResolution = {
  provider: ProviderType;
  fallbackFrom?: ProviderType;
};

const BASE_FALLBACK_CHAIN: ProviderType[] = [
  'ASAAS',
  'PAGBANK',
  'INFINITE_PAY',
  'STONE',
  'STUB',
];

@Injectable()
export class ProviderRoutingService {
  constructor(
    @Inject(ProviderAccountsService) private readonly providerAccounts: ProviderAccountsService,
    @Inject(PaymentProviderFactory) private readonly providerFactory: PaymentProviderFactory,
    @Inject(PaymentFeatureFlagsService) private readonly featureFlags: PaymentFeatureFlagsService,
  ) {}

  async resolveForCharge(input: {
    tenantId: string;
    merchantId: string;
    requested: ProviderType | 'AUTO';
    paymentMethods: string[];
    routingStrategy?: string;
  }): Promise<RoutingResolution> {
    if (isInfiniteTapFlow(input.paymentMethods)) {
      const tapEnabled = await this.featureFlags.isInfiniteTapEnabled({
        tenantId: input.tenantId,
        merchantId: input.merchantId,
      });
      if (!tapEnabled) {
        throw new BadRequestException(
          'InfiniteTap indisponível — habilite payment-api.infinite-tap.enabled ou PAYMENTS_FEATURE_INFINITEPAY=true',
        );
      }
      await this.assertProviderReady(input.tenantId, input.merchantId, 'INFINITE_PAY');
      return { provider: 'INFINITE_PAY' };
    }

    if (isStonePosFlow(input.paymentMethods)) {
      const stoneEnabled = await this.featureFlags.isStoneEnabled({
        tenantId: input.tenantId,
        merchantId: input.merchantId,
      });
      if (!stoneEnabled) {
        throw new BadRequestException(
          'Stone POS/TEF indisponível — habilite payment-api.stone.enabled ou PAYMENTS_FEATURE_STONE=true',
        );
      }
      await this.assertProviderReady(input.tenantId, input.merchantId, 'STONE');
      return { provider: 'STONE' };
    }

    if (input.requested !== 'AUTO') {
      await this.assertProviderReady(input.tenantId, input.merchantId, input.requested);
      return { provider: input.requested };
    }

    const primary = await this.providerAccounts.getDefaultProvider(input.tenantId, input.merchantId);
    const chain = await this.buildFallbackChain(input.tenantId, input.merchantId);
    const candidates = [primary, ...chain.filter((provider) => provider !== primary)];

    for (const candidate of candidates) {
      if (await this.isProviderReady(input.tenantId, input.merchantId, candidate)) {
        return {
          provider: candidate,
          fallbackFrom: candidate !== primary ? primary : undefined,
        };
      }
    }

    return { provider: 'STUB', fallbackFrom: primary };
  }

  private async buildFallbackChain(tenantId: string, merchantId: string): Promise<ProviderType[]> {
    const [infinitePayRouting, stoneRouting] = await Promise.all([
      this.featureFlags.isInfinitePayRoutingEnabled({ tenantId, merchantId }),
      this.featureFlags.isStoneRoutingEnabled({ tenantId, merchantId }),
    ]);

    return BASE_FALLBACK_CHAIN.filter((provider) => {
      if (provider === 'INFINITE_PAY' && !infinitePayRouting) return false;
      if (provider === 'STONE' && !stoneRouting) return false;
      return true;
    });
  }

  private async assertProviderReady(
    tenantId: string,
    merchantId: string,
    provider: ProviderType,
  ): Promise<void> {
    if (!(await this.isProviderReady(tenantId, merchantId, provider))) {
      throw new BadRequestException(
        `Provider ${provider} indisponível — configure provider_account ou variáveis de ambiente`,
      );
    }
    this.providerFactory.getProvider(provider);
  }

  private async isProviderReady(
    tenantId: string,
    merchantId: string,
    provider: ProviderType,
  ): Promise<boolean> {
    if (provider === 'STUB') return true;
    if (provider === 'INFINITE_PAY') {
      const enabled = await this.featureFlags.isInfinitePayEnabled({ tenantId, merchantId });
      if (!enabled) return false;
    }
    if (provider === 'STONE') {
      const enabled = await this.featureFlags.isStoneEnabled({ tenantId, merchantId });
      if (!enabled) return false;
    }
    const account = await this.providerAccounts.getActiveAccount(tenantId, merchantId, provider);
    return Boolean(this.providerAccounts.resolveCredentials(provider, account));
  }
}
