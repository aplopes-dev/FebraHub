import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { PaymentsService } from '../../src/modules/payments/payments.service.js';
import { PaymentProviderFactory } from '../../src/modules/providers/payment-provider.factory.js';
import { StubPaymentProvider } from '../../src/modules/providers/stub/stub-payment.provider.js';
import { AsaasPaymentProvider } from '../../src/modules/providers/asaas/asaas-payment.provider.js';

describe('PaymentsService.refund', () => {
  it('registra estorno total via STUB e dispara webhook interno', async () => {
    const refundCreateData: unknown[] = [];
    let webhookEvent: string | undefined;

    const prisma = {
      db: {
        payment: {
          findFirst: mock.fn(async () => ({
            id: 'pay-1',
            chargeId: 'ch-1',
            provider: 'STUB',
            providerPaymentId: 'stub_pay_abc',
            grossAmount: 200,
            feeAmount: 0,
            netAmount: 200,
            status: 'PAID',
            paymentMethod: 'PIX',
            createdAt: new Date('2026-06-11T10:00:00Z'),
            updatedAt: new Date('2026-06-11T10:00:00Z'),
            charge: {
              id: 'ch-1',
              tenantId: 'tenant-1',
              merchantId: 'merchant-1',
              sourceSystem: 'core-api',
              externalReference: 'ORDER-99',
              providerAccountId: null,
            },
          })),
          update: mock.fn(async () => ({})),
        },
        charge: {
          update: mock.fn(async () => ({})),
        },
        refund: {
          create: mock.fn(async (args: { data: unknown }) => {
            refundCreateData.push(args.data);
            return { id: 'ref-1', ...args.data as object };
          }),
        },
        providerAccount: {
          findUnique: mock.fn(),
        },
      },
    };

    const providerAccounts = {
      getActiveAccount: mock.fn(async () => null),
      resolveCredentials: mock.fn(() => null),
    };

    const stub = new StubPaymentProvider();
    const factory = new PaymentProviderFactory(stub, new AsaasPaymentProvider());

    const webhooks = {
      deliver: mock.fn(async (input: { eventType: string }) => {
        webhookEvent = input.eventType;
      }),
      buildPayload: (input: Record<string, unknown>) => ({ ...input, eventId: 'wh-1' }),
    };

    const svc = new PaymentsService(
      prisma as never,
      factory,
      providerAccounts as never,
      { log: mock.fn() } as never,
      { log: mock.fn() } as never,
      webhooks as never,
      { increment: mock.fn() } as never,
    );

    const result = await svc.refund('tenant-1', 'pay-1', 'core-api', { reason: 'Cliente desistiu' });

    assert.equal(refundCreateData.length, 1);
    const refundData = refundCreateData[0] as { amount: number; status: string; providerRefundId: string };
    assert.equal(refundData.amount, 200);
    assert.equal(refundData.status, 'COMPLETED');
    assert.ok(refundData.providerRefundId.startsWith('stub_ref_'));
    assert.equal(webhookEvent, 'payment.payment.refunded');
    assert.equal(result.payment.status, 'REFUNDED');
  });

  it('aceita estorno parcial com amount informado', async () => {
    let refundAmount: number | undefined;

    const prisma = {
      db: {
        payment: {
          findFirst: mock.fn(async () => ({
            id: 'pay-2',
            chargeId: 'ch-2',
            provider: 'STUB',
            providerPaymentId: 'stub_pay_xyz',
            grossAmount: 500,
            feeAmount: 0,
            netAmount: 500,
            status: 'PAID',
            paymentMethod: 'PIX',
            createdAt: new Date('2026-06-11T10:00:00Z'),
            updatedAt: new Date('2026-06-11T10:00:00Z'),
            charge: {
              id: 'ch-2',
              tenantId: 'tenant-1',
              merchantId: 'merchant-1',
              sourceSystem: 'core-api',
              externalReference: 'ORDER-100',
              providerAccountId: null,
            },
          })),
          update: mock.fn(async () => ({})),
        },
        charge: { update: mock.fn(async () => ({})) },
        refund: {
          create: mock.fn(async (args: { data: { amount: number } }) => {
            refundAmount = args.data.amount;
            return { id: 'ref-2', ...args.data };
          }),
        },
        providerAccount: { findUnique: mock.fn() },
      },
    };

    const factory = new PaymentProviderFactory(new StubPaymentProvider(), new AsaasPaymentProvider());
    const svc = new PaymentsService(
      prisma as never,
      factory,
      { getActiveAccount: mock.fn(), resolveCredentials: mock.fn(() => null) } as never,
      { log: mock.fn() } as never,
      { log: mock.fn() } as never,
      { deliver: mock.fn(), buildPayload: (i: Record<string, unknown>) => i } as never,
      { increment: mock.fn() } as never,
    );

    await svc.refund('tenant-1', 'pay-2', 'admin', { amount: 75.25, reason: 'Parcial' });
    assert.equal(refundAmount, 75.25);
  });
});
