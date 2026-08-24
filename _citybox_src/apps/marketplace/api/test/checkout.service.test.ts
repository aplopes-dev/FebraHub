import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import { CheckoutService } from '../src/payments/checkout.service.js';
import { DEV_MERCHANT_ID } from '../src/payments/payment-dev.constants.js';
import { PaymentApiClient } from '../src/payments/payment-api.client.js';
import { PaymentMerchantResolver } from '../src/payments/payment-merchant.resolver.js';

const ORIGINAL_ENV = { ...process.env };

describe('CheckoutService', () => {
  beforeEach(() => {
    process.env.PAYMENT_API_KEY = 'dev-core-api-key';
    process.env.PAYMENTS_DEFAULT_MERCHANT_ID = DEV_MERCHANT_ID;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    mock.restoreAll();
  });

  it('cria charge por subpedido com split e externalReference', async () => {
    const order = {
      id: 'order-1',
      total: { toNumber: () => 100 },
      items: [
        { sku: 'sku-1', name: 'Item A', quantity: 2, price: { toNumber: () => 50 } },
      ],
      subOrders: [{ id: 'sub-1', storeId: 'store-1' }],
    };

    const findUnique = mock.fn(async () => order);
    const tenants = {
      resolve: mock.fn(async () => ({
        client: { order: { findUnique } },
      })),
    };

    const createCharge = mock.fn(async (payload: Record<string, unknown>) => {
      assert.equal(payload.sourceSystem, 'core-api');
      assert.equal(payload.externalReference, 'order-1:store-1');
      assert.equal(payload.merchantId, DEV_MERCHANT_ID);
      assert.equal(payload.amount, 100);
      assert.ok(Array.isArray(payload.splitRules));
      return {
        id: 'chg-1',
        status: 'PENDING',
        sourceSystem: 'core-api',
        externalReference: 'order-1:store-1',
        merchantId: DEV_MERCHANT_ID,
        amount: 100,
      };
    });

    const paymentApi = new PaymentApiClient();
    mock.method(paymentApi, 'isConfigured', () => true);
    mock.method(paymentApi, 'createCharge', createCharge);

    const merchants = new PaymentMerchantResolver();
    const svc = new CheckoutService(
      tenants as never,
      paymentApi,
      merchants,
    );

    const result = await svc.createCheckout('order-1', {
      customer: { name: 'Cliente', cpfCnpj: '12345678901' },
      paymentMethods: ['PIX'],
      storeSharePercent: 95,
    });

    assert.equal(result.orderId, 'order-1');
    assert.equal(result.charges.length, 1);
    assert.equal(result.charges[0].externalReference, 'order-1:store-1');
    assert.equal(createCharge.mock.callCount(), 1);
    const options = createCharge.mock.calls[0].arguments[1] as { idempotencyKey: string };
    assert.equal(options.idempotencyKey, 'checkout:order-1:store-1');
  });

  it('reparte valor entre múltiplos subpedidos', async () => {
    const order = {
      id: 'order-2',
      total: { toNumber: () => 100 },
      items: [],
      subOrders: [
        { id: 'sub-1', storeId: 'store-a' },
        { id: 'sub-2', storeId: 'store-b' },
      ],
    };

    const tenants = {
      resolve: mock.fn(async () => ({
        client: { order: { findUnique: mock.fn(async () => order) } },
      })),
    };

    const amounts: number[] = [];
    const paymentApi = new PaymentApiClient();
    mock.method(paymentApi, 'isConfigured', () => true);
    mock.method(paymentApi, 'createCharge', async (payload: { amount: number }) => {
      amounts.push(payload.amount);
      return {
        id: `chg-${amounts.length}`,
        status: 'PENDING',
        sourceSystem: 'core-api',
        externalReference: 'x',
        merchantId: DEV_MERCHANT_ID,
        amount: payload.amount,
      };
    });

    const svc = new CheckoutService(
      tenants as never,
      paymentApi,
      new PaymentMerchantResolver(),
    );

    const result = await svc.createCheckout('order-2', {
      customer: { name: 'Cliente', cpfCnpj: '12345678901' },
      paymentMethods: ['PIX'],
    });

    assert.equal(result.charges.length, 2);
    assert.deepEqual(amounts, [50, 50]);
  });
});
