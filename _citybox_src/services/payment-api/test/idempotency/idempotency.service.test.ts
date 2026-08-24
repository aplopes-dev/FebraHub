import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { ConflictException } from '@nestjs/common';
import { IdempotencyService } from '../../src/common/idempotency/idempotency.service.js';

describe('IdempotencyService', () => {
  it('retorna replay quando registro COMPLETED existe', async () => {
    const prisma = {
      db: {
        idempotencyKey: {
          findUnique: mock.fn(async () => ({
            id: 'idem-1',
            status: 'COMPLETED',
            responseJson: { id: 'charge-1' },
          })),
          create: mock.fn(),
        },
      },
    };
    const svc = new IdempotencyService(prisma as never);
    const result = await svc.acquire({
      tenantId: 't1',
      sourceSystem: 'core-api',
      operation: 'create_charge',
      key: 'key-1',
      requestHash: 'hash',
    });
    assert.deepEqual(result, { kind: 'replay', body: { id: 'charge-1' } });
  });

  it('lança Conflict quando IN_PROGRESS', async () => {
    const prisma = {
      db: {
        idempotencyKey: {
          findUnique: mock.fn(async () => ({ id: 'idem-1', status: 'IN_PROGRESS' })),
        },
      },
    };
    const svc = new IdempotencyService(prisma as never);
    await assert.rejects(
      () =>
        svc.acquire({
          tenantId: 't1',
          sourceSystem: 'core-api',
          operation: 'create_charge',
          key: 'key-1',
          requestHash: 'hash',
        }),
      ConflictException,
    );
  });

  it('cria registro IN_PROGRESS quando não existe', async () => {
    const prisma = {
      db: {
        idempotencyKey: {
          findUnique: mock.fn(async () => null),
          create: mock.fn(async () => ({ id: 'new-idem' })),
        },
      },
    };
    const svc = new IdempotencyService(prisma as never);
    const result = await svc.acquire({
      tenantId: 't1',
      sourceSystem: 'core-api',
      operation: 'create_charge',
      key: 'key-1',
      requestHash: 'hash',
    });
    assert.deepEqual(result, { kind: 'new', recordId: 'new-idem' });
  });
});
