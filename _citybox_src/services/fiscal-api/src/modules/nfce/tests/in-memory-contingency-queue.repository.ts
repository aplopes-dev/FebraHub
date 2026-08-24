import { randomUUID } from 'crypto';
import {
  ContingencyQueueRepository,
  type ContingencyEntry,
  type EnqueueContingencyInput,
} from '../domain/contingency/contingency-queue.repository';

/// ⚠️ **Este dublê NÃO prova que a fila é durável.**
///
/// Ele existe para os testes de *ordenação* e de *desfecho* do dreno, que são
/// lógica pura. A propriedade que mais importa — a fila sobreviver a um
/// restart — é indistinguível daqui: um `Map` em memória passa exatamente
/// igual a uma tabela. Por isso `tests/integration/contingency-queue.integration.spec.ts`
/// roda contra Postgres real, e não é opcional.
///
/// Esta base já pagou por essa lição: um vazamento de tenant sobreviveu à
/// suíte porque o dublê repetia o defeito do real.
export class InMemoryContingencyQueueRepository extends ContingencyQueueRepository {
  private readonly entries = new Map<string, ContingencyEntry>();
  private nextSequence = new Map<string, bigint>();

  enqueue(input: EnqueueContingencyInput): Promise<ContingencyEntry> {
    const current = this.nextSequence.get(input.companyId) ?? 0n;
    const sequence = current + 1n;
    this.nextSequence.set(input.companyId, sequence);

    const entry: ContingencyEntry = {
      id: randomUUID(),
      fiscalDocumentId: input.fiscalDocumentId,
      companyId: input.companyId,
      sequence,
      emittedAt: input.emittedAt,
      status: 'PENDING',
      attempts: 0,
      lastError: null,
      transmittedAt: null,
    };
    this.entries.set(entry.id, entry);
    return Promise.resolve(entry);
  }

  findPending(companyId: string, limit: number): Promise<ContingencyEntry[]> {
    const pending = [...this.entries.values()]
      .filter((e) => e.companyId === companyId && e.status === 'PENDING')
      .sort((a, b) => (a.sequence < b.sequence ? -1 : 1))
      .slice(0, limit);
    return Promise.resolve(pending);
  }

  markTransmitted(id: string, at: Date): Promise<void> {
    this.patch(id, { status: 'TRANSMITTED', transmittedAt: at });
    return Promise.resolve();
  }

  markRejected(id: string, error: string): Promise<void> {
    const entry = this.entries.get(id);
    this.patch(id, {
      status: 'REJECTED',
      lastError: error,
      attempts: (entry?.attempts ?? 0) + 1,
    });
    return Promise.resolve();
  }

  registerAttempt(id: string, error: string): Promise<void> {
    const entry = this.entries.get(id);
    this.patch(id, { lastError: error, attempts: (entry?.attempts ?? 0) + 1 });
    return Promise.resolve();
  }

  findOverdue(threshold: Date, limit: number): Promise<ContingencyEntry[]> {
    const overdue = [...this.entries.values()]
      .filter((e) => e.status === 'PENDING' && e.emittedAt < threshold)
      .sort((a, b) => a.emittedAt.getTime() - b.emittedAt.getTime())
      .slice(0, limit);
    return Promise.resolve(overdue);
  }

  /// Só para asserção em teste.
  all(): ContingencyEntry[] {
    return [...this.entries.values()].sort((a, b) =>
      a.sequence < b.sequence ? -1 : 1,
    );
  }

  private patch(id: string, changes: Partial<ContingencyEntry>): void {
    const entry = this.entries.get(id);
    if (!entry) return;
    // Imutável: substitui a entrada em vez de mutar a existente.
    this.entries.set(id, { ...entry, ...changes });
  }
}
