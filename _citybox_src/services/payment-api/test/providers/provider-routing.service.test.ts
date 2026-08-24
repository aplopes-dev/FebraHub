import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { ProviderRoutingService } from '../../src/modules/providers/provider-routing.service.js';
import { PaymentProviderFactory } from '../../src/modules/providers/payment-provider.factory.js';
import { StubPaymentProvider } from '../../src/modules/providers/stub/stub-payment.provider.js';
import { AsaasPaymentProvider } from '../../src/modules/providers/asaas/asaas-payment.provider.js';
import { PagBankPaymentProvider } from '../../src/modules/providers/pagbank/pagbank-payment.provider.js';
import { InfinitePayPaymentProvider } from '../../src/modules/providers/infinitepay/infinitepay-payment.provider.js';
import { StonePaymentProvider } from '../../src/modules/providers/stone/stone-payment.provider.js';
import { StubSubscriptionProvider } from '../../src/modules/providers/stub/stub-subscription.provider.js';
import { AsaasSubscriptionProvider } from '../../src/modules/providers/asaas/asaas-subscription.provider.js';

describe('ProviderRoutingService', () => {
  const factory = new PaymentProviderFactory(
    new StubPaymentProvider(),
    new AsaasPaymentProvider(),
    new PagBankPaymentProvider(),
    new InfinitePayPaymentProvider(),
    new StonePaymentProvider(),
    new StubSubscriptionProvider(),
    new AsaasSubscriptionProvider(),
  );

  const featureFlags = {
    isInfiniteTapEnabled: mock.fn(async () => true),
    isInfinitePayRoutingEnabled: mock.fn(async () => false),
    isInfinitePayEnabled: mock.fn(async () => true),
    isStoneEnabled: mock.fn(async () => true),
    isStoneRoutingEnabled: mock.fn(async () => false),
  };

  it('AUTO usa provider default quando credenciais existem', async () => {
    const accounts = {
      getDefaultProvider: mock.fn(async () => 'PAGBANK'),
      getActiveAccount: mock.fn(async () => null),
      resolveCredentials: mock.fn((provider: string) =>
        provider === 'PAGBANK' ? { apiKey: 'token', environment: 'SANDBOX' } : null,
      ),
    };
    const routing = new ProviderRoutingService(accounts as never, factory, featureFlags as never);
    const result = await routing.resolveForCharge({
      tenantId: 't1',
      merchantId: 'm1',
      requested: 'AUTO',
      paymentMethods: ['PIX'],
    });
    assert.equal(result.provider, 'PAGBANK');
    assert.equal(result.fallbackFrom, undefined);
  });

  it('AUTO faz fallback quando primário indisponível', async () => {
    const accounts = {
      getDefaultProvider: mock.fn(async () => 'PAGBANK'),
      getActiveAccount: mock.fn(async () => null),
      resolveCredentials: mock.fn((provider: string) =>
        provider === 'ASAAS' ? { apiKey: 'asaas', environment: 'SANDBOX' } : null,
      ),
    };
    const routing = new ProviderRoutingService(accounts as never, factory, featureFlags as never);
    const result = await routing.resolveForCharge({
      tenantId: 't1',
      merchantId: 'm1',
      requested: 'AUTO',
      paymentMethods: ['PIX'],
    });
    assert.equal(result.provider, 'ASAAS');
    assert.equal(result.fallbackFrom, 'PAGBANK');
  });

  it('provider explícito PAGBANK não usa fallback', async () => {
    const accounts = {
      getDefaultProvider: mock.fn(),
      getActiveAccount: mock.fn(async () => ({ credentialsEncrypted: 'x', environment: 'SANDBOX' })),
      resolveCredentials: mock.fn(() => ({ apiKey: 'pb', environment: 'SANDBOX' })),
    };
    const routing = new ProviderRoutingService(accounts as never, factory, featureFlags as never);
    const result = await routing.resolveForCharge({
      tenantId: 't1',
      merchantId: 'm1',
      requested: 'PAGBANK',
      paymentMethods: ['PIX'],
    });
    assert.equal(result.provider, 'PAGBANK');
  });

  it('INFINITE_TAP roteia para INFINITE_PAY quando flag habilitada', async () => {
    const accounts = {
      getDefaultProvider: mock.fn(async () => 'ASAAS'),
      getActiveAccount: mock.fn(async () => ({ credentialsEncrypted: 'x', environment: 'SANDBOX' })),
      resolveCredentials: mock.fn(() => ({ apiKey: 'handle', environment: 'SANDBOX' })),
    };
    const routing = new ProviderRoutingService(accounts as never, factory, featureFlags as never);
    const result = await routing.resolveForCharge({
      tenantId: 't1',
      merchantId: 'm1',
      requested: 'AUTO',
      paymentMethods: ['INFINITE_TAP'],
    });
    assert.equal(result.provider, 'INFINITE_PAY');
  });

  it('STONE_POS roteia para STONE quando flag habilitada', async () => {
    const accounts = {
      getDefaultProvider: mock.fn(async () => 'ASAAS'),
      getActiveAccount: mock.fn(async () => ({ credentialsEncrypted: 'x', environment: 'SANDBOX' })),
      resolveCredentials: mock.fn(() => ({ apiKey: 'stone', environment: 'SANDBOX' })),
    };
    const routing = new ProviderRoutingService(accounts as never, factory, featureFlags as never);
    const result = await routing.resolveForCharge({
      tenantId: 't1',
      merchantId: 'm1',
      requested: 'AUTO',
      paymentMethods: ['STONE_POS'],
    });
    assert.equal(result.provider, 'STONE');
  });
});
