import { describe, it, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { StonePaymentProvider } from '../../src/modules/providers/stone/stone-payment.provider.js';

describe('StonePaymentProvider', () => {
  const originalFetch = globalThis.fetch;
  const credentials = { apiKey: 'stone-token', environment: 'SANDBOX' as const };

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('createCharge STONE_POS retorna stonePos deepLink', async () => {
    const provider = new StonePaymentProvider();
    const result = await provider.createCharge({
      amount: 120,
      currency: 'BRL',
      externalReference: 'POS-REF-1',
      paymentMethods: ['STONE_POS'],
      customer: { name: 'Cliente', cpfCnpj: '00000000000' },
      credentials,
    });

    assert.equal(result.status, 'WAITING_PAYMENT');
    assert.ok(result.stonePos?.deepLink?.includes('POS-REF-1'));
    assert.equal(result.stonePos?.amountCents, 12000);
  });

  it('createCharge cartão chama POST /charges', async () => {
    let body: Record<string, unknown> | undefined;
    globalThis.fetch = mock.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(
        JSON.stringify({ id: 'ch_stone_1', status: 'authorized', reference_id: 'ORD-1' }),
        { status: 200 },
      );
    }) as typeof fetch;

    const provider = new StonePaymentProvider();
    const result = await provider.createCharge({
      amount: 30.11,
      currency: 'BRL',
      externalReference: 'ORD-1',
      paymentMethods: ['CREDIT_CARD'],
      customer: { name: 'Cliente', cpfCnpj: '00000000000' },
      credentials,
      metadata: {
        stoneCard: {
          token: '6033401111633077000',
          expirationDate: '5012',
          operationType: 'auth_only',
        },
      },
    });

    assert.equal(result.status, 'AUTHORIZED');
    assert.equal(result.providerChargeId, 'ch_stone_1');
    assert.equal((body?.card_transaction as { operation_type?: string })?.operation_type, 'auth_only');
  });

  it('capturePayment chama POST /charges/:id/capture', async () => {
    globalThis.fetch = mock.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      assert.ok(url.includes('/capture'));
      assert.equal(init?.method, 'POST');
      return new Response(JSON.stringify({ id: 'ch_stone_1', status: 'paid' }), { status: 200 });
    }) as typeof fetch;

    const provider = new StonePaymentProvider();
    const result = await provider.capturePayment!({
      providerChargeId: 'ch_stone_1',
      amount: 50,
      credentials,
    });

    assert.equal(result.status, 'CAPTURED');
  });

  it('parseWebhook normaliza evento Stone', async () => {
    const provider = new StonePaymentProvider();
    const normalized = await provider.parseWebhook({
      headers: {},
      rawBody: {
        id: 'evt-1',
        charge_id: 'ch_stone_1',
        event: 'charge.captured',
        status: 'paid',
        amount: 5000,
        reference_id: 'ORD-1',
      },
    });
    assert.equal(normalized.providerChargeId, 'ch_stone_1');
    assert.equal(normalized.status, 'CAPTURED');
    assert.equal(normalized.amount, 50);
  });
});
