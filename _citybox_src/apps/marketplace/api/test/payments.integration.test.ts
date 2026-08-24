import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import {
  allocateSubOrderAmounts,
  buildMultistoreChargeMetadata,
  buildMultistoreExternalReference,
  buildMultistoreSplitRules,
} from '../src/payments/multistore-checkout.util.js';
import { DEV_MERCHANT_ID } from '../src/payments/payment-dev.constants.js';

const ORIGINAL_ENV = { ...process.env };

describe('multistore-checkout.util', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('buildMultistoreExternalReference usa orderId:storeId', () => {
    assert.equal(buildMultistoreExternalReference('ord-1', 'store-1'), 'ord-1:store-1');
  });

  it('buildMultistoreChargeMetadata inclui verticalIntegration', () => {
    assert.deepEqual(buildMultistoreChargeMetadata('ord-1', 'store-1'), {
      verticalIntegration: 'multistore-checkout',
      orderId: 'ord-1',
      storeId: 'store-1',
    });
  });

  it('buildMultistoreSplitRules divide percentual loja/plataforma', () => {
    const rules = buildMultistoreSplitRules({
      storeMerchantId: 'merchant-a',
      storeSharePercent: 95,
    });
    assert.equal(rules.length, 2);
    assert.equal(rules[0].recipientId, 'merchant-a');
    assert.equal(rules[0].value, 95);
    assert.equal(rules[1].value, 5);
  });

  it('buildMultistoreSplitRules usa PAYMENTS_PLATFORM_RECIPIENT_ID', () => {
    process.env.PAYMENTS_PLATFORM_RECIPIENT_ID = 'platform-custom';
    const rules = buildMultistoreSplitRules({
      storeMerchantId: 'merchant-a',
      storeSharePercent: 90,
    });
    assert.equal(rules[1].recipientId, 'platform-custom');
  });

  it('allocateSubOrderAmounts reparte centavos no último subpedido', () => {
    assert.deepEqual(allocateSubOrderAmounts(100, 3), [33.33, 33.33, 33.34]);
    assert.deepEqual(allocateSubOrderAmounts(50, 1), [50]);
  });
});

describe('PaymentApiClient', () => {
  beforeEach(() => {
    delete process.env.PAYMENT_API_KEY;
    delete process.env.PAYMENT_API_BASE_URL;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    mock.restoreAll();
  });

  it('isConfigured false sem PAYMENT_API_KEY', async () => {
    const { PaymentApiClient } = await import('../src/payments/payment-api.client.js');
    const client = new PaymentApiClient();
    assert.equal(client.isConfigured(), false);
  });

  it('createCharge envia headers e payload corretos', async () => {
    process.env.PAYMENT_API_KEY = 'dev-core-api-key';
    process.env.PAYMENT_API_BASE_URL = 'http://payments.test/api';

    const fetchMock = mock.fn(async (url: string, init?: RequestInit) => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          id: 'chg-1',
          status: 'PENDING',
          sourceSystem: 'core-api',
          externalReference: 'o-1:s-1',
          merchantId: 'm-1',
          amount: 42.5,
        }),
    }));

    mock.method(globalThis, 'fetch', fetchMock);

    const { PaymentApiClient } = await import('../src/payments/payment-api.client.js');
    const client = new PaymentApiClient();
    const result = await client.createCharge(
      {
        sourceSystem: 'core-api',
        externalReference: 'o-1:s-1',
        merchantId: 'm-1',
        amount: 42.5,
        paymentMethods: ['PIX'],
        customer: { name: 'Cliente', cpfCnpj: '12345678901' },
      },
      { idempotencyKey: 'idem-1', correlationId: 'corr-1' },
    );

    assert.equal(result.id, 'chg-1');
    assert.equal(fetchMock.mock.callCount(), 1);
    assert.equal(fetchMock.mock.calls[0].arguments[0], 'http://payments.test/api/charges');
    const init = fetchMock.mock.calls[0].arguments[1] as RequestInit;
    assert.equal(init.method, 'POST');
    const headers = init.headers as Record<string, string>;
    assert.equal(headers['X-Api-Key'], 'dev-core-api-key');
    assert.equal(headers['Idempotency-Key'], 'idem-1');
    assert.equal(headers['X-Correlation-Id'], 'corr-1');
  });
});

describe('PaymentMerchantResolver', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('resolveMerchantId via mapa JSON', async () => {
    process.env.PAYMENT_API_KEY = 'key';
    process.env.PAYMENTS_STORE_MERCHANT_MAP = JSON.stringify({ 'store-uuid': 'merchant-1' });
    const { PaymentMerchantResolver } = await import('../src/payments/payment-merchant.resolver.js');
    const resolver = new PaymentMerchantResolver();
    assert.equal(resolver.resolveMerchantId('store-uuid'), 'merchant-1');
  });

  it('resolveMerchantId usa fallback default', async () => {
    process.env.PAYMENT_API_KEY = 'key';
    process.env.PAYMENTS_DEFAULT_MERCHANT_ID = DEV_MERCHANT_ID;
    const { PaymentMerchantResolver } = await import('../src/payments/payment-merchant.resolver.js');
    const resolver = new PaymentMerchantResolver();
    assert.equal(resolver.resolveMerchantId('unknown-store'), DEV_MERCHANT_ID);
  });
});
