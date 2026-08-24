import { describe, it, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { AsaasPaymentProvider } from '../../src/modules/providers/asaas/asaas-payment.provider.js';

describe('AsaasPaymentProvider', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('createCharge Pix chama payments e pixQrCode', async () => {
    const calls: string[] = [];
    globalThis.fetch = mock.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      calls.push(`${init?.method ?? 'GET'} ${url}`);
      if (url.endsWith('/customers') && init?.method === 'POST') {
        return new Response(JSON.stringify({ id: 'cus_123' }), { status: 200 });
      }
      if (url.endsWith('/payments') && init?.method === 'POST') {
        return new Response(
          JSON.stringify({
            id: 'pay_123',
            status: 'PENDING',
            billingType: 'PIX',
            value: 100,
            invoiceUrl: 'https://sandbox.asaas.com/i/123',
          }),
          { status: 200 },
        );
      }
      if (url.includes('/pixQrCode')) {
        return new Response(
          JSON.stringify({ payload: '00020126', expirationDate: '2026-06-12T00:00:00Z' }),
          { status: 200 },
        );
      }
      return new Response('{}', { status: 404 });
    }) as typeof fetch;

    const provider = new AsaasPaymentProvider();
    const result = await provider.createCharge({
      amount: 100,
      currency: 'BRL',
      externalReference: 'REF-1',
      paymentMethods: ['PIX'],
      customer: { name: 'Test', cpfCnpj: '00000000000' },
      credentials: { apiKey: 'test-key', environment: 'SANDBOX' },
      providerCustomerId: 'cus_123',
    });

    assert.equal(result.providerChargeId, 'pay_123');
    assert.equal(result.status, 'WAITING_PAYMENT');
    assert.equal(result.pix?.copyPaste, '00020126');
    assert.ok(calls.some((c) => c.includes('/payments/') && c.includes('/pixQrCode')));
  });

  it('createCharge boleto retorna bankSlipUrl', async () => {
    globalThis.fetch = mock.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/payments') && init?.method === 'POST') {
        return new Response(
          JSON.stringify({
            id: 'pay_boleto',
            status: 'PENDING',
            billingType: 'BOLETO',
            value: 250,
            bankSlipUrl: 'https://sandbox.asaas.com/b/456',
            invoiceUrl: '23793.38128 60000.000003',
          }),
          { status: 200 },
        );
      }
      return new Response('{}', { status: 404 });
    }) as typeof fetch;

    const provider = new AsaasPaymentProvider();
    const result = await provider.createCharge({
      amount: 250,
      currency: 'BRL',
      externalReference: 'REF-BOLETO',
      paymentMethods: ['BOLETO'],
      customer: { name: 'Test', cpfCnpj: '00000000000' },
      credentials: { apiKey: 'test-key', environment: 'SANDBOX' },
      providerCustomerId: 'cus_123',
    });

    assert.equal(result.boleto?.bankSlipUrl, 'https://sandbox.asaas.com/b/456');
    assert.equal(result.status, 'WAITING_PAYMENT');
  });

  it('createCharge com splitRules envia split no payload Asaas', async () => {
    let paymentBody: Record<string, unknown> | undefined;
    globalThis.fetch = mock.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/payments') && init?.method === 'POST') {
        paymentBody = JSON.parse(String(init.body)) as Record<string, unknown>;
        return new Response(
          JSON.stringify({
            id: 'pay_split',
            status: 'PENDING',
            billingType: 'PIX',
            value: 100,
          }),
          { status: 200 },
        );
      }
      if (url.includes('/pixQrCode')) {
        return new Response(JSON.stringify({ payload: '00020126' }), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    }) as typeof fetch;

    const provider = new AsaasPaymentProvider();
    await provider.createCharge({
      amount: 100,
      currency: 'BRL',
      externalReference: 'REF-SPLIT',
      paymentMethods: ['PIX'],
      customer: { name: 'Test', cpfCnpj: '00000000000' },
      credentials: { apiKey: 'test-key', environment: 'SANDBOX' },
      providerCustomerId: 'cus_123',
      splitRules: [
        {
          recipientId: 'store',
          type: 'PERCENTAGE',
          percentage: 85,
          providerWalletId: 'wallet-store',
        },
        {
          recipientId: 'platform',
          type: 'PERCENTAGE',
          percentage: 15,
          providerWalletId: 'wallet-platform',
        },
      ],
    });

    assert.ok(Array.isArray(paymentBody?.split));
    assert.equal((paymentBody!.split as unknown[]).length, 2);
  });

  it('parseWebhook normaliza payload Asaas', async () => {
    const provider = new AsaasPaymentProvider();
    const normalized = await provider.parseWebhook({
      headers: {},
      rawBody: {
        event: 'PAYMENT_RECEIVED',
        payment: { id: 'pay_123', status: 'RECEIVED', value: 100, paymentDate: '2026-06-11' },
      },
    });
    assert.equal(normalized.eventType, 'PAYMENT_RECEIVED');
    assert.equal(normalized.providerChargeId, 'pay_123');
    assert.equal(normalized.status, 'RECEIVED');
  });

  it('parseWebhook normaliza evento SUBSCRIPTION_UPDATED', async () => {
    const provider = new AsaasPaymentProvider();
    const normalized = await provider.parseWebhook({
      headers: {},
      rawBody: {
        event: 'SUBSCRIPTION_UPDATED',
        subscription: { id: 'sub_123', status: 'ACTIVE', value: 99.9, nextDueDate: '2026-07-11' },
      },
    });
    assert.equal(normalized.subscriptionEvent, true);
    assert.equal(normalized.providerSubscriptionId, 'sub_123');
    assert.equal(normalized.status, 'ACTIVE');
  });
});
