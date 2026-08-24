import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ProviderWebhookProcessor } from '../../src/modules/webhooks/provider-webhook.processor.js';
import { AsaasPaymentProvider } from '../../src/modules/providers/asaas/asaas-payment.provider.js';
import { PaymentProviderFactory } from '../../src/modules/providers/payment-provider.factory.js';
import { PagBankPaymentProvider } from '../../src/modules/providers/pagbank/pagbank-payment.provider.js';
import { StubPaymentProvider } from '../../src/modules/providers/stub/stub-payment.provider.js';

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const asaasWebhookFixture = JSON.parse(
  readFileSync(join(fixtureDir, '../fixtures/asaas-webhook-payment-received.json'), 'utf8'),
);

describe('ProviderWebhookProcessor', () => {
  it('processa PAYMENT_RECEIVED: atualiza charge, cria payment e entrega webhook interno', async () => {
    const eventId = 'evt-1';
    const chargeId = 'ch-1';
    const providerChargeId = asaasWebhookFixture.payment.id;

    const chargeUpdateCalls: unknown[] = [];
    const paymentCreateData: unknown[] = [];
    let deliveredEventType: string | undefined;
    let capturedEvent: unknown;

    const prisma = {
      db: {
        providerWebhookEvent: {
          findUnique: mock.fn(async () => ({
            id: eventId,
            provider: 'ASAAS',
            status: 'RECEIVED',
            rawPayload: asaasWebhookFixture,
            headersJson: {},
            eventId: providerChargeId,
          })),
          update: mock.fn(async () => ({})),
        },
        charge: {
          findFirst: mock.fn(async () => ({
            id: chargeId,
            tenantId: 'tenant-1',
            merchantId: 'merchant-1',
            sourceSystem: 'core-api',
            externalReference: 'ORDER-1',
            provider: 'ASAAS',
            providerChargeId,
            providerPaymentId: null,
            amount: 150.5,
            status: 'WAITING_PAYMENT',
          })),
          update: mock.fn(async (_args: unknown) => {
            chargeUpdateCalls.push(_args);
            return {
              id: chargeId,
              status: 'RECEIVED',
              amount: 150.5,
            };
          }),
        },
        payment: {
          findFirst: mock.fn(async () => null),
          create: mock.fn(async (args: { data: unknown }) => {
            paymentCreateData.push(args.data);
            return {
              id: 'payment-1',
              grossAmount: 150.5,
              netAmount: 150.5,
              paidAt: new Date('2026-06-11T12:00:00Z'),
            };
          }),
          update: mock.fn(),
        },
      },
    };

    const stub = new StubPaymentProvider();
    const asaas = new AsaasPaymentProvider();
    const factory = new PaymentProviderFactory(stub, asaas, new PagBankPaymentProvider());

    const internalWebhooks = {
      deliver: mock.fn(async (input: { eventType: string }) => {
        deliveredEventType = input.eventType;
      }),
      buildPayload: (input: Record<string, unknown>) => ({ ...input, eventId: 'internal-evt-1' }),
    };

    const events = {
      publishPaymentCaptured: mock.fn(async (data: unknown) => {
        capturedEvent = data;
      }),
      publishPaymentFailed: mock.fn(),
    };

    const paymentEntries = { recordCapture: mock.fn(async () => ({})) };
    const settlements = { createPendingForPayment: mock.fn(async () => ({})) };
    const subscriptionWebhooks = { handle: mock.fn(async () => true) };

    const audit = { log: mock.fn(async () => undefined) };
    const metrics = { increment: mock.fn() };
    const dlq = { publish: mock.fn(async () => undefined) };
    const logger = { error: mock.fn(), info: mock.fn(), warn: mock.fn() };

    const processor = new ProviderWebhookProcessor(
      prisma as never,
      factory,
      internalWebhooks as never,
      events as never,
      paymentEntries as never,
      settlements as never,
      subscriptionWebhooks as never,
      audit as never,
      metrics as never,
      dlq as never,
      logger as never,
    );

    await processor.process(eventId);

    assert.equal(chargeUpdateCalls.length, 1);
    assert.equal(paymentCreateData.length, 1);
    assert.equal(deliveredEventType, 'payment.payment.received');
    assert.ok(capturedEvent);
    assert.equal((capturedEvent as { chargeId: string }).chargeId, chargeId);
    assert.equal((capturedEvent as { paymentId: string }).paymentId, 'payment-1');
  });

  it('ignora webhook quando charge não existe', async () => {
    const prisma = {
      db: {
        providerWebhookEvent: {
          findUnique: mock.fn(async () => ({
            id: 'evt-missing',
            provider: 'ASAAS',
            status: 'RECEIVED',
            rawPayload: asaasWebhookFixture,
            headersJson: {},
          })),
          update: mock.fn(async (args: { data: { status: string; errorMessage?: string } }) => args),
        },
        charge: {
          findFirst: mock.fn(async () => null),
          update: mock.fn(),
        },
        payment: { findFirst: mock.fn(), create: mock.fn(), update: mock.fn() },
      },
    };

    const stub = new StubPaymentProvider();
    const factory = new PaymentProviderFactory(stub, new AsaasPaymentProvider(), new PagBankPaymentProvider());
    const processor = new ProviderWebhookProcessor(
      prisma as never,
      factory,
      { deliver: mock.fn(), buildPayload: (i: Record<string, unknown>) => i } as never,
      { publishPaymentCaptured: mock.fn(), publishPaymentFailed: mock.fn() } as never,
      { recordCapture: mock.fn() } as never,
      { createPendingForPayment: mock.fn() } as never,
      { handle: mock.fn() } as never,
      { log: mock.fn() } as never,
      { increment: mock.fn() } as never,
      { publish: mock.fn(async () => undefined) } as never,
      { error: mock.fn(), info: mock.fn(), warn: mock.fn() } as never,
    );

    await processor.process('evt-missing');

    const updates = (prisma.db.providerWebhookEvent.update as ReturnType<typeof mock.fn>).mock.calls;
    const lastUpdate = updates.at(-1)?.arguments[0] as { data: { status: string } };
    assert.equal(lastUpdate.data.status, 'IGNORED');
  });
});
