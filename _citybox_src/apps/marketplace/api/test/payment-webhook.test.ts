import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import { PaymentWebhookSignatureService } from '../src/payments/payment-webhook-signature.service.js';

const ORIGINAL_ENV = { ...process.env };

describe('PaymentWebhookSignatureService', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('rejeita assinatura inválida', () => {
    process.env.PAYMENTS_WEBHOOK_SECRET = 'secret';
    const svc = new PaymentWebhookSignatureService();
    assert.throws(
      () => svc.verify('{"a":1}', 'bad-signature'),
      /Assinatura inválida/,
    );
  });
});

describe('OrderPaymentSyncService', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    mock.restoreAll();
  });

  it('retorna received quando externalReference presente', async () => {
    const { OrderPaymentSyncService } = await import('../src/payments/order-payment-sync.service.js');
    const svc = new OrderPaymentSyncService();
    const result = svc.handleInternalWebhook('payment.payment.received', {
      event: 'payment.payment.received',
      eventId: 'evt-1',
      sourceSystem: 'core-api',
      externalReference: 'order-id:store-id',
      provider: 'STUB',
      status: 'PAID',
    });
    assert.deepEqual(result, { status: 'received', eventType: 'payment.payment.received', eventId: 'evt-1' });
  });

  it('lança BadRequestException quando externalReference ausente', async () => {
    const { OrderPaymentSyncService } = await import('../src/payments/order-payment-sync.service.js');
    const svc = new OrderPaymentSyncService();
    assert.throws(
      () => svc.handleInternalWebhook('payment.payment.received', {
        event: 'payment.payment.received',
        eventId: 'evt-2',
        sourceSystem: 'core-api',
        externalReference: '',
        provider: 'STUB',
        status: 'PAID',
      }),
      /externalReference ausente/,
    );
  });
});
