import { describe, it, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { PagBankPaymentProvider } from '../../src/modules/providers/pagbank/pagbank-payment.provider.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const pagbankWebhookFixture = JSON.parse(
  readFileSync(join(fixtureDir, '../fixtures/pagbank-webhook-order-paid.json'), 'utf8'),
);

describe('PagBankPaymentProvider', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('createCharge Pix cria order com qr_codes', async () => {
    globalThis.fetch = mock.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/orders') && init?.method === 'POST') {
        return new Response(
          JSON.stringify({
            id: 'ORDE_123',
            status: 'WAITING',
            qr_codes: [
              {
                text: '00020126pagbank',
                expiration_date: '2026-06-12T00:00:00Z',
                links: [{ rel: 'QRCODE.BASE64', href: 'https://sandbox.api.pagseguro.com/qrcode/base64' }],
              },
            ],
            links: [{ rel: 'PAY', href: 'https://sandbox.api.pagseguro.com/pay/123' }],
          }),
          { status: 201 },
        );
      }
      return new Response('{}', { status: 404 });
    }) as typeof fetch;

    const provider = new PagBankPaymentProvider();
    const result = await provider.createCharge({
      amount: 150.5,
      currency: 'BRL',
      externalReference: 'REF-PB-1',
      paymentMethods: ['PIX'],
      customer: { name: 'Test', cpfCnpj: '12345678909', email: 'test@example.com' },
      credentials: { apiKey: 'pb-token', environment: 'SANDBOX' },
    });

    assert.equal(result.providerOrderId, 'ORDE_123');
    assert.equal(result.status, 'WAITING_PAYMENT');
    assert.equal(result.pix?.copyPaste, '00020126pagbank');
  });

  it('createCharge multi-método usa checkout', async () => {
    globalThis.fetch = mock.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/checkouts') && init?.method === 'POST') {
        return new Response(
          JSON.stringify({
            id: 'CHEC_456',
            status: 'ACTIVE',
            links: [{ rel: 'PAY', href: 'https://pagamento.pagseguro.uol.com.br/checkout/CHEC_456' }],
          }),
          { status: 201 },
        );
      }
      return new Response('{}', { status: 404 });
    }) as typeof fetch;

    const provider = new PagBankPaymentProvider();
    const result = await provider.createCharge({
      amount: 99,
      currency: 'BRL',
      externalReference: 'REF-PB-2',
      paymentMethods: ['PIX', 'BOLETO', 'CREDIT_CARD'],
      customer: { name: 'Test', cpfCnpj: '12345678909' },
      credentials: { apiKey: 'pb-token', environment: 'SANDBOX' },
    });

    assert.equal(result.providerChargeId, 'CHEC_456');
    assert.ok(result.checkout?.url?.includes('checkout'));
  });

  it('parseWebhook normaliza payload PagBank', async () => {
    const provider = new PagBankPaymentProvider();
    const normalized = await provider.parseWebhook({
      headers: {},
      rawBody: pagbankWebhookFixture,
    });
    assert.equal(normalized.providerOrderId, 'ORDE_fixture_anon_001');
    assert.equal(normalized.providerChargeId, 'CHAR_fixture_anon_001');
    assert.equal(normalized.status, 'PAID');
    assert.equal(normalized.amount, 150.5);
  });
});
