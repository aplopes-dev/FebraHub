import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ProviderType } from '../../generated/prisma/enums.js';
import type { PaymentProvider, ProviderCredentials } from './payment-provider.interface.js';
import { AsaasPaymentProvider } from './asaas/asaas-payment.provider.js';
import { InfinitePayPaymentProvider } from './infinitepay/infinitepay-payment.provider.js';
import { PagBankPaymentProvider } from './pagbank/pagbank-payment.provider.js';
import { StonePaymentProvider } from './stone/stone-payment.provider.js';
import { StubPaymentProvider } from './stub/stub-payment.provider.js';
import type { SubscriptionProvider } from './subscription-provider.interface.js';
import { AsaasSubscriptionProvider } from './asaas/asaas-subscription.provider.js';
import { StubSubscriptionProvider } from './stub/stub-subscription.provider.js';

@Injectable()
export class PaymentProviderFactory {
  constructor(
    @Inject(StubPaymentProvider) private readonly stub: StubPaymentProvider,
    @Inject(AsaasPaymentProvider) private readonly asaas: AsaasPaymentProvider,
    @Inject(PagBankPaymentProvider) private readonly pagbank: PagBankPaymentProvider,
    @Inject(InfinitePayPaymentProvider) private readonly infinitepay: InfinitePayPaymentProvider,
    @Inject(StonePaymentProvider) private readonly stone: StonePaymentProvider,
    @Inject(StubSubscriptionProvider) private readonly stubSubscription: StubSubscriptionProvider,
    @Inject(AsaasSubscriptionProvider) private readonly asaasSubscription: AsaasSubscriptionProvider,
  ) {}

  getProvider(provider: ProviderType): PaymentProvider {
    if (provider === 'STUB') return this.stub;
    if (provider === 'ASAAS') return this.asaas;
    if (provider === 'PAGBANK') return this.pagbank;
    if (provider === 'INFINITE_PAY') return this.infinitepay;
    if (provider === 'STONE') return this.stone;
    throw new NotFoundException(`Provider ${provider} não implementado nesta fase`);
  }

  resolveProvider(requested: ProviderType | 'AUTO', fallback: ProviderType = 'STUB'): ProviderType {
    if (requested === 'AUTO') return fallback;
    return requested;
  }

  getSubscriptionProvider(provider: ProviderType): SubscriptionProvider {
    if (provider === 'STUB') return this.stubSubscription;
    if (provider === 'ASAAS') return this.asaasSubscription;
    throw new NotFoundException(`Assinaturas não suportadas para provider ${provider}`);
  }
}

export function credentialsFromEnv(provider: ProviderType): ProviderCredentials | null {
  if (provider === 'ASAAS') {
    const apiKey = process.env.ASAAS_API_KEY?.trim();
    if (!apiKey) return null;
    const env = process.env.ASAAS_ENV?.trim().toLowerCase();
    return {
      apiKey,
      environment: env === 'production' ? 'PRODUCTION' : 'SANDBOX',
    };
  }

  if (provider === 'PAGBANK') {
    const apiKey = process.env.PAGBANK_TOKEN?.trim();
    if (!apiKey) return null;
    const env = process.env.PAGBANK_ENV?.trim().toLowerCase();
    return {
      apiKey,
      environment: env === 'production' ? 'PRODUCTION' : 'SANDBOX',
    };
  }

  if (provider === 'INFINITE_PAY') {
    const handle = process.env.INFINITEPAY_HANDLE?.trim();
    if (!handle) return null;
    const env = process.env.INFINITEPAY_ENV?.trim().toLowerCase();
    return {
      apiKey: handle.replace(/^\$/, ''),
      environment: env === 'production' ? 'PRODUCTION' : 'SANDBOX',
    };
  }

  if (provider === 'STONE') {
    const apiKey = process.env.STONE_API_KEY?.trim();
    if (!apiKey) return null;
    const env = process.env.STONE_ENV?.trim().toLowerCase();
    return {
      apiKey,
      environment: env === 'production' ? 'PRODUCTION' : 'SANDBOX',
    };
  }

  return null;
}
