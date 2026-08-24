import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { ReconciliationService } from '../../src/modules/reconciliation/reconciliation.service.js';

describe('ReconciliationService', () => {
  it('import faz match automático por externalReference e valor', async () => {
    const batchCreate = mock.fn(async (args: { data: unknown }) => ({
      id: 'batch-1',
      ...(args.data as object),
    }));
    const itemCreate = mock.fn(async (args: { data: { status: string } }) => ({
      id: 'item-1',
      ...(args.data as object),
    }));

    const prisma = {
      db: {
        reconciliationBatch: {
          create: batchCreate,
          update: mock.fn(async () => ({
            id: 'batch-1',
            provider: null,
            source: 'BANK_STATEMENT',
            status: 'COMPLETED',
            fileName: null,
            totalItems: 1,
            matchedCount: 1,
            divergentCount: 0,
            importedAt: new Date(),
            completedAt: new Date(),
          })),
        },
        reconciliationItem: { create: itemCreate },
        charge: {
          findFirst: mock.fn(async () => ({
            id: 'ch-1',
            tenantId: 'tenant-1',
            sourceSystem: 'core-api',
            externalReference: 'ORDER-1',
            provider: 'STUB',
            amount: 100,
          })),
        },
        payment: {
          findFirst: mock.fn(async () => ({
            id: 'pay-1',
            grossAmount: 100,
            paidAt: new Date('2026-06-11T12:00:00Z'),
          })),
        },
      },
    };

    const svc = new ReconciliationService(
      prisma as never,
      { log: mock.fn() } as never,
      { deliver: mock.fn(), buildPayload: (i: Record<string, unknown>) => i } as never,
      { increment: mock.fn() } as never,
    );

    const batch = await svc.import('tenant-1', 'core-api', {
      source: 'BANK_STATEMENT',
      rows: [{ externalReference: 'ORDER-1', amount: 100, transactionDate: '2026-06-11' }],
    });

    assert.equal(batch.status, 'COMPLETED');
    assert.equal(batch.matchedCount, 1);
    const createArgs = itemCreate.mock.calls[0]?.arguments[0] as { data: { status: string } };
    assert.equal(createArgs.data.status, 'MATCHED');
  });

  it('marca item como divergente', async () => {
    const prisma = {
      db: {
        reconciliationItem: {
          findFirst: mock.fn(async () => ({
            id: 'item-2',
            batchId: 'batch-1',
            tenantId: 'tenant-1',
            amount: 50,
            chargeId: null,
            status: 'PENDING',
          })),
          update: mock.fn(async (args: { data: { status: string } }) => ({
            id: 'item-2',
            batchId: 'batch-1',
            externalReference: null,
            providerReference: null,
            amount: 50,
            expectedAmount: null,
            differenceAmount: null,
            status: args.data.status,
            chargeId: null,
            paymentId: null,
            transactionDate: null,
            matchedAt: null,
            matchNotes: 'teste',
            createdAt: new Date(),
          })),
        },
        reconciliationBatch: { update: mock.fn() },
        charge: { findUnique: mock.fn(async () => null) },
      },
    };

    const svc = new ReconciliationService(
      prisma as never,
      { log: mock.fn() } as never,
      { deliver: mock.fn(), buildPayload: (i: Record<string, unknown>) => i } as never,
      { increment: mock.fn() } as never,
    );

    const item = await svc.markDivergent('tenant-1', 'item-2', 'admin', { reason: 'Sem charge' });
    assert.equal(item.status, 'DIVERGENT');
  });
});
