import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { StubSubscriptionProvider } from '../../src/modules/providers/stub/stub-subscription.provider.js';

describe('StubSubscriptionProvider', () => {
  const provider = new StubSubscriptionProvider();

  it('createSubscription retorna id stub', async () => {
    const result = await provider.createSubscription({
      amount: 49.9,
      currency: 'BRL',
      externalReference: 'SUB-1',
      billingCycle: 'MONTHLY',
      paymentMethod: 'PIX',
      nextDueDate: '2026-07-11',
      customer: { name: 'Test', cpfCnpj: '12345678909' },
    });
    assert.ok(result.providerSubscriptionId.startsWith('stub_sub_'));
    assert.equal(result.status, 'ACTIVE');
  });

  it('pause/resume via updateSubscription', async () => {
    const paused = await provider.updateSubscription({
      providerSubscriptionId: 'stub_sub_1',
      status: 'INACTIVE',
    });
    assert.equal(paused.status, 'PAUSED');

    const resumed = await provider.updateSubscription({
      providerSubscriptionId: 'stub_sub_1',
      status: 'ACTIVE',
      nextDueDate: '2026-08-11',
    });
    assert.equal(resumed.status, 'ACTIVE');
    assert.equal(resumed.nextDueDate, '2026-08-11');
  });
});
