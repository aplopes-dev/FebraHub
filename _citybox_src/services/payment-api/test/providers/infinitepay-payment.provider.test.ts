import { describe, it, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { InfinitePayPaymentProvider } from '../../src/modules/providers/infinitepay/infinitepay-payment.provider.js';

describe('InfinitePayPaymentProvider', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('createCharge checkout chama POST /links', async () => {
    globalThis.fetch = mock.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/links') && init?.method === 'POST') {
        return new Response(JSON.stringify({ url: 'https://checkout.infinitepay.com.br/abc123' }), {
          status: 200,
        });
      }
      return new Response('{}', { status: 404 });
    }) as typeof fetch;

    const provider = new InfinitePayPaymentProvider();
    const result = await provider.createCharge({
      amount: 50,
      currency: 'BRL',
      externalReference: 'ORD-1',
      paymentMethods: ['PIX', 'CREDIT_CARD'],
      customer: { name: 'Cliente', cpfCnpj: '00000000000', email: 'a@b.com' },
      credentials: { apiKey: 'loja-handle', environment: 'SANDBOX' },
    });

    assert.equal(result.status, 'WAITING_PAYMENT');
    assert.ok(result.checkout?.url?.includes('checkout.infinitepay'));
  });

  it('createCharge INFINITE_TAP retorna deepLink', async () => {
    const provider = new InfinitePayPaymentProvider();
    const result = await provider.createCharge({
      amount: 25,
      currency: 'BRL',
      externalReference: 'TAP-1',
      paymentMethods: ['INFINITE_TAP'],
      customer: { name: 'Cliente', cpfCnpj: '00000000000' },
      credentials: { apiKey: 'loja-handle', environment: 'SANDBOX' },
    });

    assert.equal(result.status, 'WAITING_PAYMENT');
    assert.ok(result.infiniteTap?.deepLink.includes('TAP-1'));
    assert.equal(result.infiniteTap?.amountCents, 2500);
  });

  it('parseWebhook normaliza pagamento aprovado', async () => {
    const provider = new InfinitePayPaymentProvider();
    const normalized = await provider.parseWebhook({
      headers: {},
      rawBody: {
        invoice_slug: 'abc123',
        order_nsu: 'ORD-1',
        transaction_nsu: 'tx-99',
        paid_amount: 5000,
        capture_method: 'pix',
      },
    });
    assert.equal(normalized.eventType, 'PAYMENT_RECEIVED');
    assert.equal(normalized.providerOrderId, 'ORD-1');
    assert.equal(normalized.status, 'PAID');
    assert.equal(normalized.amount, 50);
  });
});
