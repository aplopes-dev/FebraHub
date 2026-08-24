import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { SettlementsService } from '../../src/modules/settlements/settlements.service.js';

describe('SettlementsService.processDueSettlements', () => {
  it('publica payment.settled e marca splits como COMPLETED', async () => {
    const settlementUpdate = mock.fn(async () => ({
      id: 'set-1',
      netAmount: 95,
    }));
    const paymentUpdate = mock.fn(async () => ({}));
    const publishPaymentSettled = mock.fn(async () => undefined);
    const markCompleted = mock.fn(async () => 2);
    const listByCharge = mock.fn(async () => [
      {
        id: 'split-1',
        recipientId: 'store-1',
        amount: 80,
        status: 'COMPLETED',
      },
    ]);

    const prisma = {
      db: {
        settlement: {
          findMany: mock.fn(async () => [
            {
              id: 'set-1',
              tenantId: 'tenant-1',
              merchantId: 'merchant-1',
              paymentId: 'pay-1',
              provider: 'STUB',
              payment: {
                id: 'pay-1',
                charge: {
                  id: 'ch-1',
                  merchantId: 'merchant-1',
                  sourceSystem: 'core-api',
                  externalReference: 'ord-1:store-1',
                  metadataJson: { orderId: 'ord-1', storeId: 'store-1', verticalIntegration: 'multistore-checkout' },
                },
              },
            },
          ]),
        },
        $transaction: mock.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
          fn({
            settlement: { update: settlementUpdate },
            payment: { update: paymentUpdate },
          }),
        ),
      },
    };

    const deliver = mock.fn(async () => undefined);
    const buildPayload = mock.fn((input: unknown) => ({ ...(input as object), eventId: 'evt-1' }));

    const svc = new SettlementsService(
      prisma as never,
      { publishPaymentSettled } as never,
      {
        markCompletedForCharge: markCompleted,
        listByCharge,
      } as never,
      { deliver, buildPayload } as never,
    );

    const processed = await svc.processDueSettlements(new Date('2026-06-11T00:00:00Z'));

    assert.equal(processed.length, 1);
    assert.equal(markCompleted.mock.callCount(), 1);
    assert.equal(publishPaymentSettled.mock.callCount(), 1);
    const event = publishPaymentSettled.mock.calls[0]!.arguments[0] as {
      chargeId: string;
      settlementId: string;
      splits: unknown[];
    };
    assert.equal(event.chargeId, 'ch-1');
    assert.equal(event.settlementId, 'set-1');
    assert.equal(event.splits.length, 1);
    assert.equal(deliver.mock.callCount(), 1);
  });
});
