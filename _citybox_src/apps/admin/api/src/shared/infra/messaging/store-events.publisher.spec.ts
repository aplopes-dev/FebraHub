import { StoreEventsPublisher } from './store-events.publisher';
import { transactionStorage } from '../prisma/transaction.context';
import type { PrismaService } from '../prisma/prisma.service';
import type { StorePlatformEventData } from './store-platform-event.mapper';

function buildEventData(): StorePlatformEventData {
  return {
    storeId: '11111111-1111-4111-8111-111111111111',
    vertical: 'Clínica',
    tradeName: 'Clínica Teste',
    slug: 'clinica-teste',
    usesClientDocument: false,
    timezone: 'America/Sao_Paulo',
    updatedAt: new Date().toISOString(),
  };
}

/** Fake mínimo: só o que o publisher toca (`db.outboxEvent.create`). */
function createPrismaFake() {
  const created: Array<Record<string, unknown>> = [];
  const client = {
    outboxEvent: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        created.push(data);
        return data;
      }),
    },
  };
  // txClient(prisma) devolve o próprio prisma fora de transação, então o fake é o client.
  const prisma = client as unknown as PrismaService;
  return { prisma, client, created };
}

describe('StoreEventsPublisher (outbox)', () => {
  it('grava o evento no outbox em vez de publicar no broker', async () => {
    const { prisma, created } = createPrismaFake();
    const publisher = new StoreEventsPublisher(prisma);

    await publisher.publishStoreCreated(buildEventData());

    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      type: 'citybox.store.created.v1',
      routingKey: 'citybox.store.created',
      aggregateType: 'store',
      aggregateId: '11111111-1111-4111-8111-111111111111',
    });
    // eventId é o id do CloudEvent — chave de idempotência do consumidor.
    expect(created[0].eventId).toEqual(expect.any(String));
  });

  it.each([
    [
      'publishStoreUpdated',
      'citybox.store.updated.v1',
      'citybox.store.updated',
    ],
    [
      'publishStorePlanChanged',
      'citybox.store.plan_changed.v1',
      'citybox.store.plan_changed',
    ],
    [
      'publishStoreSuspended',
      'citybox.store.suspended.v1',
      'citybox.store.suspended',
    ],
    [
      'publishStoreReactivated',
      'citybox.store.reactivated.v1',
      'citybox.store.reactivated',
    ],
  ])('%s enfileira %s', async (method, type, routingKey) => {
    const { prisma, created } = createPrismaFake();
    const publisher = new StoreEventsPublisher(prisma);

    await publisher[method as keyof StoreEventsPublisher].call(
      publisher,
      buildEventData(),
    );

    expect(created[0]).toMatchObject({ type, routingKey });
  });

  it('escreve no client TRANSACIONAL quando dentro de UnitOfWork.run', async () => {
    const { prisma, created } = createPrismaFake();
    const txCreated: Array<Record<string, unknown>> = [];
    const tx = {
      outboxEvent: {
        create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
          txCreated.push(data);
          return data;
        }),
      },
    };
    const publisher = new StoreEventsPublisher(prisma);

    await transactionStorage.run(tx as never, async () => {
      await publisher.publishStoreCreated(buildEventData());
    });

    // É isto que garante atomicidade: a linha do outbox tem de ir na transação,
    // não no client normal.
    expect(txCreated).toHaveLength(1);
    expect(created).toHaveLength(0);
  });

  it('avisa quando enfileirado fora de transação (perde atomicidade)', async () => {
    const { prisma } = createPrismaFake();
    const publisher = new StoreEventsPublisher(prisma);
    const warn = jest
      .spyOn(publisher['logger'], 'warn')
      .mockImplementation(() => undefined);

    await publisher.publishStoreCreated(buildEventData());

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('FORA de UnitOfWork.run()'),
    );
  });
});
