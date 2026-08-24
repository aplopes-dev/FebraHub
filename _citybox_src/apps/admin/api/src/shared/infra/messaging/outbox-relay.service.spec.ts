import { OutboxRelayService } from './outbox-relay.service';
import type { PrismaService } from '../prisma/prisma.service';

type Row = {
  id: string;
  type: string;
  routing_key: string;
  payload: unknown;
  attempts: number;
};

function buildRow(overrides: Partial<Row> = {}): Row {
  return {
    id: 'outbox-1',
    type: 'citybox.store.created.v1',
    routing_key: 'citybox.store.created',
    payload: { id: 'evt-1', type: 'citybox.store.created.v1' },
    attempts: 0,
    ...overrides,
  };
}

function createHarness(claimed: Row[]) {
  const updates: Array<{
    where: { id: string };
    data: Record<string, unknown>;
  }> = [];
  const prisma = {
    $queryRaw: jest.fn(async () => claimed),
    outboxEvent: {
      update: jest.fn(async (args: (typeof updates)[number]) => {
        updates.push(args);
        return args;
      }),
    },
  } as unknown as PrismaService;

  const relay = new OutboxRelayService(prisma);
  const publish = jest.fn(async () => undefined);
  // Injeta o bus já conectado — onModuleInit falaria com o broker real.
  (relay as unknown as { bus: { publish: typeof publish } }).bus = { publish };

  return { relay, publish, updates, prisma };
}

describe('OutboxRelayService', () => {
  it('publica a linha reivindicada e a marca como PUBLISHED', async () => {
    const { relay, publish, updates } = createHarness([buildRow()]);

    const count = await relay.tick();

    expect(count).toBe(1);
    expect(publish).toHaveBeenCalledTimes(1);
    expect(publish).toHaveBeenCalledWith(
      'citybox.store.created',
      expect.any(Buffer),
    );
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({
      where: { id: 'outbox-1' },
      data: { status: 'PUBLISHED', lastError: null },
    });
  });

  it('publica FORA de transação — nunca segura lock durante I/O de rede', async () => {
    const { relay, prisma, publish } = createHarness([buildRow()]);
    // O relay só pode usar $queryRaw para o claim; $transaction envolvendo o publish
    // foi o defeito da 1ª versão (abortava depois de publicar e republicava em loop).
    const transaction = jest.fn();
    (prisma as unknown as { $transaction: unknown }).$transaction = transaction;

    await relay.tick();

    expect(publish).toHaveBeenCalledTimes(1);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('não republica no mesmo ciclo quando o claim volta vazio', async () => {
    const { relay, publish } = createHarness([]);

    expect(await relay.tick()).toBe(0);
    expect(publish).not.toHaveBeenCalled();
  });

  it('falha de publish agenda retry com backoff e mantém PENDING', async () => {
    const { relay, updates } = createHarness([buildRow({ attempts: 1 })]);
    (relay as unknown as { bus: { publish: jest.Mock } }).bus.publish = jest.fn(
      async () => {
        throw new Error('[rabbit] not connected');
      },
    );

    const before = Date.now();
    const count = await relay.tick();

    expect(count).toBe(0);
    expect(updates).toHaveLength(1);
    const data = updates[0].data as {
      attempts: number;
      status: string;
      lastError: string;
      availableAt: Date;
    };
    expect(data.attempts).toBe(2);
    expect(data.status).toBe('PENDING');
    expect(data.lastError).toContain('not connected');
    // backoff exponencial: 2ª tentativa ~10s à frente
    expect(data.availableAt.getTime()).toBeGreaterThan(before);
  });

  it('marca FAILED ao esgotar as tentativas, em vez de tentar para sempre', async () => {
    const { relay, updates } = createHarness([buildRow({ attempts: 9 })]);
    (relay as unknown as { bus: { publish: jest.Mock } }).bus.publish = jest.fn(
      async () => {
        throw new Error('broker indisponível');
      },
    );

    await relay.tick();

    expect((updates[0].data as { status: string }).status).toBe('FAILED');
  });

  it('conta como publicado mesmo se a marcação falhar (at-least-once explícito)', async () => {
    const { relay, prisma } = createHarness([buildRow()]);
    (prisma.outboxEvent as unknown as { update: jest.Mock }).update = jest.fn(
      async () => {
        throw new Error('conexão caiu');
      },
    );

    // Publicou de fato; a linha volta pelo lease e o consumidor deduplica por eventId.
    expect(await relay.tick()).toBe(1);
  });
});
