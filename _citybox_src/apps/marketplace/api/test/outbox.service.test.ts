import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { OutboxService } from '../src/outbox/outbox.service.js';

describe('OutboxService', () => {
  it('enqueue persiste evento PENDING com payload CloudEvent', async () => {
    const created = { id: 'evt-1', status: 'PENDING' };
    const create = mock.fn(async (args: { data: { type: string; status: string; payload: unknown } }) => {
      assert.equal(args.data.type, 'citybox.order.created.v1');
      assert.equal(args.data.status, 'PENDING');
      assert.equal((args.data.payload as { type: string }).type, 'citybox.order.created.v1');
      return created;
    });
    const client = { outboxEvent: { create } };
    const svc = new OutboxService();
    const row = await svc.enqueue(client as never, {
      type: 'citybox.order.created.v1',
      data: { orderId: 'o-1' },
      storeId: 's-1',
    });
    assert.equal(row, created);
    assert.equal(create.mock.callCount(), 1);
  });

  it('enqueue sem storeId opcional', async () => {
    const create = mock.fn(async () => ({ id: 'evt-2' }));
    const client = { outboxEvent: { create } };
    const svc = new OutboxService();
    await svc.enqueue(client as never, {
      type: 'citybox.store.updated.v1',
      data: { storeId: 's-1' },
    });
    const payload = create.mock.calls[0].arguments[0].data.payload as { storeid?: string };
    assert.equal(create.mock.callCount(), 1);
    assert.equal(payload.storeid, undefined);
  });
});
