import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { PaymentProviderFactory } from '../../src/modules/providers/payment-provider.factory.js';
import { AsaasPaymentProvider } from '../../src/modules/providers/asaas/asaas-payment.provider.js';
import { AsaasSubscriptionProvider } from '../../src/modules/providers/asaas/asaas-subscription.provider.js';
import { InfinitePayPaymentProvider } from '../../src/modules/providers/infinitepay/infinitepay-payment.provider.js';
import { PagBankPaymentProvider } from '../../src/modules/providers/pagbank/pagbank-payment.provider.js';
import { StonePaymentProvider } from '../../src/modules/providers/stone/stone-payment.provider.js';
import { StubPaymentProvider } from '../../src/modules/providers/stub/stub-payment.provider.js';
import { StubSubscriptionProvider } from '../../src/modules/providers/stub/stub-subscription.provider.js';

describe('PaymentProviderFactory', () => {
  const factory = new PaymentProviderFactory(
    new StubPaymentProvider(),
    new AsaasPaymentProvider(),
    new PagBankPaymentProvider(),
    new InfinitePayPaymentProvider(),
    new StonePaymentProvider(),
    new StubSubscriptionProvider(),
    new AsaasSubscriptionProvider(),
  );

  it('retorna StubPaymentProvider para STUB', () => {
    const provider = factory.getProvider('STUB');
    assert.equal(typeof provider.createCharge, 'function');
  });

  it('retorna AsaasPaymentProvider para ASAAS', () => {
    const provider = factory.getProvider('ASAAS');
    assert.equal(typeof provider.parseWebhook, 'function');
  });

  it('retorna PagBankPaymentProvider para PAGBANK', () => {
    const provider = factory.getProvider('PAGBANK');
    assert.equal(typeof provider.createCharge, 'function');
  });

  it('retorna InfinitePayPaymentProvider para INFINITE_PAY', () => {
    const provider = factory.getProvider('INFINITE_PAY');
    assert.equal(typeof provider.createCharge, 'function');
  });

  it('retorna StonePaymentProvider para STONE', () => {
    const provider = factory.getProvider('STONE');
    assert.equal(typeof provider.capturePayment, 'function');
  });

  it('retorna subscription provider ASAAS', () => {
    const provider = factory.getSubscriptionProvider('ASAAS');
    assert.equal(typeof provider.createSubscription, 'function');
  });

  it('resolve AUTO para fallback STUB', () => {
    assert.equal(factory.resolveProvider('AUTO'), 'STUB');
    assert.equal(factory.resolveProvider('STUB'), 'STUB');
  });

  it('rejeita provider desconhecido', () => {
    assert.throws(() => factory.getSubscriptionProvider('PAGBANK'));
  });
});

describe('StubPaymentProvider', () => {
  const stub = new StubPaymentProvider();

  it('createCharge retorna Pix quando paymentMethods inclui PIX', async () => {
    const result = await stub.createCharge({
      amount: 100,
      currency: 'BRL',
      externalReference: 'REF-1',
      paymentMethods: ['PIX'],
      customer: { name: 'Test', cpfCnpj: '00000000000' },
    });
    assert.equal(result.status, 'WAITING_PAYMENT');
    assert.ok(result.pix?.copyPaste);
    assert.ok(result.providerChargeId.startsWith('stub_pay_'));
  });
});
